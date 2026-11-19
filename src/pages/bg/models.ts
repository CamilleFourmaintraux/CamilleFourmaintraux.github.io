// Background removal methods. The AI models run in the visitor's browser with
// onnxruntime-web. Their files are downloaded from Hugging Face on first use,
// at pinned revisions, and kept in the browser cache.

export type Device = "webgpu" | "wasm";

/** One ONNX file of a model, for one execution provider. */
export type ModelFile = {
  repo: string;
  /** Commit hash, so that the file never changes under the page. */
  revision: string;
  path: string;
  /** Approximate size in megabytes, shown before downloading. */
  megabytes: number;
};

export type ModelId = "isnet" | "birefnet" | "ormbg" | "modnet";
export type MethodId = ModelId | "color";

export type ModelSpec = {
  id: ModelId;
  license: "Apache-2.0" | "MIT";
  /** Page of the model, for credits. */
  source: string;
  /** Files by execution provider. A missing one means not supported there. */
  files: Partial<Record<Device, ModelFile>>;
  input:
    | { kind: "square"; size: number }
    /** Shortest side at this size, both sides rounded to a multiple. */
    | { kind: "shortest"; size: number; multiple: number };
  /** Per-channel normalization after scaling pixels to 0..1. */
  mean: [number, number, number];
  std: [number, number, number];
  /** Spreads the output over 0..1, as the reference code of the model does. */
  minMax: boolean;
};

const IMAGENET_MEAN: [number, number, number] = [0.485, 0.456, 0.406];
const IMAGENET_STD: [number, number, number] = [0.229, 0.224, 0.225];

export const MODELS: Record<ModelId, ModelSpec> = {
  // ISNet "general use" from the DIS project: people, objects and logos.
  isnet: {
    id: "isnet",
    license: "Apache-2.0",
    source: "https://huggingface.co/Ko033/isnet-general-use-onnx",
    files: {
      // Its pooling layers are not supported by the WebGPU backend yet.
      wasm: {
        repo: "Ko033/isnet-general-use-onnx",
        revision: "5349b617911fd60c619b52f32e2b593517b78df3",
        path: "onnx/model_quantized.onnx",
        megabytes: 44,
      },
    },
    input: { kind: "square", size: 1024 },
    mean: [0.5, 0.5, 0.5],
    std: [1, 1, 1],
    minMax: true,
  },
  // BiRefNet lite, rebuilt to run on the WebGPU backend of onnxruntime-web.
  birefnet: {
    id: "birefnet",
    license: "MIT",
    source: "https://huggingface.co/runes/birefnet-lite-webgpu",
    files: {
      webgpu: {
        repo: "runes/birefnet-lite-webgpu",
        revision: "d553b221039609f1ab170e3c2e651b59f363c98a",
        path: "birefnet_lite_webgpu_fp16.onnx",
        megabytes: 123,
      },
    },
    input: { kind: "square", size: 1024 },
    mean: IMAGENET_MEAN,
    std: IMAGENET_STD,
    minMax: false,
  },
  // Open Remove Background Model, an ISNet trained on people.
  ormbg: {
    id: "ormbg",
    license: "Apache-2.0",
    source: "https://huggingface.co/onnx-community/ormbg-ONNX",
    files: {
      wasm: {
        repo: "onnx-community/ormbg-ONNX",
        revision: "034e2d884afbab897e10e78fc5bb566b29533fd6",
        path: "onnx/model_quantized.onnx",
        megabytes: 44,
      },
    },
    input: { kind: "square", size: 1024 },
    mean: [0, 0, 0],
    std: [1, 1, 1],
    minMax: true,
  },
  // MODNet, a small portrait matting model.
  modnet: {
    id: "modnet",
    license: "Apache-2.0",
    source: "https://huggingface.co/Xenova/modnet",
    files: {
      webgpu: {
        repo: "Xenova/modnet",
        revision: "fa2fa546052fba4c08921230a26cc69a333fca12",
        path: "onnx/model.onnx",
        megabytes: 26,
      },
      wasm: {
        repo: "Xenova/modnet",
        revision: "fa2fa546052fba4c08921230a26cc69a333fca12",
        path: "onnx/model_quantized.onnx",
        megabytes: 7,
      },
    },
    input: { kind: "shortest", size: 512, multiple: 32 },
    mean: [0.5, 0.5, 0.5],
    std: [0.5, 0.5, 0.5],
    minMax: false,
  },
};

/** Order of the methods in the form. */
export const METHODS: MethodId[] = [
  "isnet",
  "birefnet",
  "ormbg",
  "modnet",
  "color",
];

export const fileUrl = (file: ModelFile) =>
  `https://huggingface.co/${file.repo}/resolve/${file.revision}/${file.path}`;

/** The file to use: WebGPU when the browser has it and the model supports it. */
export function pickFile(
  model: ModelSpec,
  webgpu: boolean,
): { device: Device; file: ModelFile } | null {
  if (webgpu && model.files.webgpu)
    return { device: "webgpu", file: model.files.webgpu };
  if (model.files.wasm) return { device: "wasm", file: model.files.wasm };
  return null;
}

/** Size of the network input for an image of this size. */
export function inputSize(
  model: ModelSpec,
  width: number,
  height: number,
): { width: number; height: number } {
  if (model.input.kind === "square")
    return { width: model.input.size, height: model.input.size };
  const { size, multiple } = model.input;
  const scale = size / Math.min(width, height);
  const round = (value: number) =>
    Math.max(multiple, Math.round((value * scale) / multiple) * multiple);
  return { width: round(width), height: round(height) };
}

export const CACHE_NAME = "background-remover-models-v1";
