// Runs the background removal off the main thread, so that the page stays
// responsive: model download and cache, onnxruntime-web, pixel work.
import type * as Ort from "onnxruntime-web";
import { colorMask, outputToMask, toTensor } from "./mask";
import {
  CACHE_NAME,
  MODELS,
  fileUrl,
  inputSize,
  pickFile,
  type Device,
  type ModelFile,
  type ModelId,
} from "./models";
import type { ErrorCode, FromWorker, ToWorker } from "./protocol";

// onnxruntime-web is only loaded for the AI models: the plain background
// method does not need it.
let runtime: Promise<typeof Ort> | null = null;
const loadOrt = () =>
  (runtime ??= import("onnxruntime-web").then((ort) => {
    // GitHub Pages cannot send the headers that multithreading needs.
    ort.env.wasm.numThreads = 1;
    ort.env.logLevel = "error";
    return ort;
  }));

const post = (message: FromWorker, transfer: Transferable[] = []) =>
  self.postMessage(message, { transfer });

class Failure extends Error {
  constructor(
    readonly code: ErrorCode,
    detail: string,
  ) {
    super(detail);
  }
}

let image: { bitmap: ImageBitmap; rgba: Uint8ClampedArray } | null = null;
let session: { key: string; value: Ort.InferenceSession } | null = null;

function canvas(width: number, height: number) {
  const surface = new OffscreenCanvas(width, height);
  const context = surface.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Failure("unsupported", "No 2D context");
  return { surface, context };
}

/** Model bytes from the browser cache, or downloaded with progress. */
async function modelBytes(file: ModelFile, job: number): Promise<Uint8Array> {
  const url = fileUrl(file);
  const cache = await caches.open(CACHE_NAME).catch(() => null);
  const hit = await cache?.match(url);
  if (hit) return new Uint8Array(await hit.arrayBuffer());

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Failure("download", String(error));
  }
  if (!response.ok || !response.body)
    throw new Failure("download", `HTTP ${response.status}`);
  const total =
    Number(response.headers.get("content-length")) || file.megabytes * 1e6;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  let last = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    const now = performance.now();
    if (now - last > 120) {
      last = now;
      post({ type: "download", job, loaded, total });
    }
  }
  post({ type: "download", job, loaded, total: loaded });
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  try {
    await cache?.put(
      url,
      new Response(bytes, {
        headers: {
          "content-type": "application/octet-stream",
          "x-bytes": String(loaded),
        },
      }),
    );
  } catch {
    // Storage full or blocked: the model works, it will download again.
  }
  return bytes;
}

async function openSession(
  model: ModelId,
  device: Device,
  file: ModelFile,
  job: number,
) {
  const key = `${model}:${device}`;
  if (session?.key === key) return session.value;
  const bytes = await modelBytes(file, job);
  post({ type: "loading", job, device });
  if (session) {
    await session.value.release().catch(() => {});
    session = null;
  }
  const ort = await loadOrt();
  const value = await ort.InferenceSession.create(bytes, {
    executionProviders: [device],
    graphOptimizationLevel: "all",
  });
  session = { key, value };
  return value;
}

// Half floats, in case a model hands back float16 values.
function halfToFloat(bits: number) {
  const sign = bits & 0x8000 ? -1 : 1;
  const exponent = (bits >> 10) & 0x1f;
  const fraction = bits & 0x3ff;
  if (exponent === 0) return sign * 2 ** -14 * (fraction / 1024);
  if (exponent === 31) return fraction ? NaN : sign * Infinity;
  return sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
}

async function outputValues(tensor: Ort.Tensor): Promise<Float32Array> {
  const data = await tensor.getData();
  if (data instanceof Float32Array) return data;
  if (tensor.type === "float16" && data instanceof Uint16Array)
    return Float32Array.from(data, halfToFloat);
  return Float32Array.from(data as ArrayLike<number>, Number);
}

async function infer(
  model: ModelId,
  device: Device,
  file: ModelFile,
  job: number,
) {
  if (!image) throw new Failure("no-image", "No image");
  const spec = MODELS[model];
  const run = await openSession(model, device, file, job);
  post({ type: "running", job, device });

  const { width: sourceWidth, height: sourceHeight } = image.bitmap;
  const size = inputSize(spec, sourceWidth, sourceHeight);
  const input = canvas(size.width, size.height);
  input.context.imageSmoothingQuality = "high";
  input.context.drawImage(image.bitmap, 0, 0, size.width, size.height);
  const pixels = input.context.getImageData(0, 0, size.width, size.height).data;
  const ort = await loadOrt();
  const tensor = new ort.Tensor(
    "float32",
    toTensor(pixels, size.width, size.height, spec.mean, spec.std),
    [1, 3, size.height, size.width],
  );

  const started = performance.now();
  let output: Ort.Tensor;
  try {
    const results = await run.run({ [run.inputNames[0]]: tensor });
    output = results[run.outputNames[0]];
  } catch (error) {
    throw new Failure("run", String(error));
  }
  const milliseconds = performance.now() - started;
  const dims = output.dims;
  const outHeight = dims[dims.length - 2];
  const outWidth = dims[dims.length - 1];
  const small = outputToMask(await outputValues(output), spec.minMax);
  output.dispose();

  // Back to the size of the picture, with smooth edges.
  const gray = canvas(outWidth, outHeight);
  const rgba = new Uint8ClampedArray(outWidth * outHeight * 4);
  for (let i = 0; i < small.length; i++) {
    rgba[i * 4] = small[i];
    rgba[i * 4 + 3] = 255;
  }
  gray.context.putImageData(new ImageData(rgba, outWidth, outHeight), 0, 0);
  const full = canvas(sourceWidth, sourceHeight);
  full.context.imageSmoothingQuality = "high";
  full.context.drawImage(gray.surface, 0, 0, sourceWidth, sourceHeight);
  const scaled = full.context.getImageData(
    0,
    0,
    sourceWidth,
    sourceHeight,
  ).data;
  const mask = new Uint8ClampedArray(sourceWidth * sourceHeight);
  for (let i = 0; i < mask.length; i++) mask[i] = scaled[i * 4];
  post(
    {
      type: "mask",
      job,
      mask,
      width: sourceWidth,
      height: sourceHeight,
      device,
      milliseconds,
    },
    [mask.buffer],
  );
}

async function runModel(job: number, model: ModelId, webgpu: boolean) {
  const spec = MODELS[model];
  const choice = pickFile(spec, webgpu);
  if (!choice) throw new Failure("webgpu", "This model needs WebGPU");
  try {
    await infer(model, choice.device, choice.file, job);
  } catch (error) {
    const code = error instanceof Failure ? error.code : "run";
    // A WebGPU problem: try the processor when the model has a file for it.
    if (
      choice.device === "webgpu" &&
      spec.files.wasm &&
      code !== "download" &&
      code !== "no-image"
    ) {
      post({ type: "fallback", job });
      session = null;
      await infer(model, "wasm", spec.files.wasm, job);
      return;
    }
    if (choice.device === "webgpu" && code === "run")
      throw new Failure("webgpu", String(error));
    throw error;
  }
}

self.onmessage = async (event: MessageEvent<ToWorker>) => {
  const message = event.data;
  if (message.type === "image") {
    image?.bitmap.close();
    const { width, height } = message.bitmap;
    const surface = canvas(width, height);
    surface.context.drawImage(message.bitmap, 0, 0);
    image = {
      bitmap: message.bitmap,
      rgba: surface.context.getImageData(0, 0, width, height).data,
    };
    return;
  }
  const job = message.job;
  try {
    if (!image) throw new Failure("no-image", "No image");
    if (message.type === "color") {
      const started = performance.now();
      const { width, height } = image.bitmap;
      const mask = colorMask(image.rgba, width, height, message.options);
      post(
        {
          type: "mask",
          job,
          mask,
          width,
          height,
          milliseconds: performance.now() - started,
        },
        [mask.buffer],
      );
      return;
    }
    await runModel(job, message.model, message.webgpu);
  } catch (error) {
    const code: ErrorCode = error instanceof Failure ? error.code : "run";
    post({ type: "error", job, code, detail: String(error) });
  }
};
