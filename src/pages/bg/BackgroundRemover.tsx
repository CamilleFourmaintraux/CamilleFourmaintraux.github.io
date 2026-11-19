import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  faCopy,
  faDownload,
  faEraser,
  faImage,
  faQrcode,
  faTrashCan,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import Icon from "@/ui/Icon";
import Page from "@/ui/Page";
import { Choice, ColorField } from "../cv/controls";
import { download } from "../cv/files";
import {
  borderColor,
  compose,
  hexToRgb,
  levels,
  rgbToHex,
  subjectBox,
  type Box,
} from "./mask";
import {
  CACHE_NAME,
  METHODS,
  MODELS,
  fileUrl,
  pickFile,
  type Device,
  type MethodId,
  type ModelId,
} from "./models";
import type { ErrorCode, FromWorker, ToWorker } from "./protocol";
import "../cv/form.css";
import "./bg.css";

const STORAGE_KEY = "background-remover";
const QR_STORAGE_KEY = "qr-generator";
// Larger pictures are reduced, to keep memory use reasonable.
const MAX_SIDE = 4096;
const QR_LOGO_SIDE = 512;
const COLOR_DELAY = 120;
const SAMPLE = "/img/header/me_green.jpg";

type Settings = {
  method: MethodId;
  cleanup: number;
  hardness: number;
  color: string;
  tolerance: number;
  softness: number;
  connected: boolean;
  fill: "transparent" | "color";
  fillColor: string;
  crop: boolean;
  margin: number;
  preview: "checker" | "white" | "black";
};

const DEFAULTS: Settings = {
  method: "isnet",
  cleanup: 0,
  hardness: 0,
  color: "#ffffff",
  tolerance: 12,
  softness: 10,
  connected: true,
  fill: "transparent",
  fillColor: "#ffffff",
  crop: false,
  margin: 4,
  preview: "checker",
};

function loadSettings(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    const merged = { ...DEFAULTS, ...(saved ?? {}) } as Settings;
    if (!METHODS.includes(merged.method)) merged.method = DEFAULTS.method;
    return merged;
  } catch {
    return DEFAULTS;
  }
}

type Source = {
  bitmap: ImageBitmap;
  rgba: Uint8ClampedArray;
  /** Alpha of the picture itself, or null when fully opaque. */
  alpha: Uint8ClampedArray | null;
  width: number;
  height: number;
  name: string;
  /** Original size, when the picture was reduced. */
  reducedFrom: [number, number] | null;
};

type Result = {
  mask: Uint8ClampedArray;
  method: MethodId;
  device?: Device;
  milliseconds: number;
};

type Task =
  | { kind: "idle" }
  | { kind: "download"; loaded: number; total: number }
  | { kind: "loading"; device: Device }
  | { kind: "running"; device: Device }
  | { kind: "error"; code: ErrorCode | "file" };

const baseName = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-|-$/g, "") || "image";

const canCopy = () =>
  typeof window !== "undefined" &&
  "ClipboardItem" in window &&
  typeof navigator.clipboard?.write === "function";

async function detectWebgpu(): Promise<boolean> {
  const gpu = (
    navigator as Navigator & {
      gpu?: { requestAdapter(): Promise<unknown | null> };
    }
  ).gpu;
  if (!gpu) return false;
  try {
    return (await gpu.requestAdapter()) !== null;
  } catch {
    return false;
  }
}

/** Sizes of the model files in the browser cache, by address. */
async function cachedModels(): Promise<Map<string, number>> {
  const sizes = new Map<string, number>();
  try {
    const cache = await caches.open(CACHE_NAME);
    for (const request of await cache.keys()) {
      const response = await cache.match(request);
      sizes.set(request.url, Number(response?.headers.get("x-bytes")) || 0);
    }
  } catch {
    // No cache storage: nothing is kept between visits.
  }
  return sizes;
}

function drawTo(canvas: HTMLCanvasElement | null, data: ImageData) {
  if (!canvas) return;
  canvas.width = data.width;
  canvas.height = data.height;
  canvas.getContext("2d")?.putImageData(data, 0, 0);
}

function Range({
  id,
  label,
  value,
  min = 0,
  max = 100,
  hint,
  suffix = "",
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  hint?: string;
  suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} <span className="bgr-value">{`${value}${suffix}`}</span>
      </label>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        value={value}
        aria-valuetext={`${value}${suffix}`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint && (
        <p className="cvgen-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}

function Check({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="cvgen-check" htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

export default function BackgroundRemover() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(loadSettings);
  const [source, setSource] = useState<Source | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [task, setTask] = useState<Task>({ kind: "idle" });
  const [fellBack, setFellBack] = useState(false);
  const [webgpu, setWebgpu] = useState<boolean | null>(null);
  const [cached, setCached] = useState<Map<string, number>>(new Map());
  const [compare, setCompare] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");

  const workerRef = useRef<Worker | null>(null);
  const jobRef = useRef(0);
  const sourceRef = useRef<Source | null>(null);
  const beforeRef = useRef<HTMLCanvasElement>(null);
  const afterRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // Method of the job in progress, to label its result.
  const methodRef = useRef<MethodId>(settings.method);

  const patch = (next: Partial<Settings>) =>
    setSettings((current) => ({ ...current, ...next }));
  const number = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 1,
  });
  const megabytes = (bytes: number) => number.format(bytes / 1e6);

  useEffect(() => {
    detectWebgpu().then(setWebgpu);
    cachedModels().then(setCached);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Storage blocked: the settings simply reset next time.
    }
  }, [settings]);

  /* ---------- Worker ---------- */

  const onWorkerMessage = useCallback(
    (event: MessageEvent<FromWorker>) => {
      const data = event.data;
      if (data.job !== jobRef.current) return;
      switch (data.type) {
        case "download":
          setTask({ kind: "download", loaded: data.loaded, total: data.total });
          return;
        case "loading":
          setTask({ kind: "loading", device: data.device });
          cachedModels().then(setCached);
          return;
        case "running":
          setTask({ kind: "running", device: data.device });
          return;
        case "fallback":
          setFellBack(true);
          return;
        case "error":
          setTask({ kind: "error", code: data.code });
          return;
        case "mask": {
          const current = sourceRef.current;
          if (!current || data.width !== current.width) return;
          setResult({
            mask: data.mask,
            method: data.device ? methodRef.current : "color",
            device: data.device,
            milliseconds: data.milliseconds,
          });
          setTask({ kind: "idle" });
          if (data.device) setMessage(t("bgr.status.done"));
        }
      }
    },
    [t],
  );

  const worker = useCallback(async (): Promise<Worker> => {
    if (workerRef.current) return workerRef.current;
    const created = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    created.onmessage = onWorkerMessage;
    workerRef.current = created;
    const current = sourceRef.current;
    if (current) {
      const bitmap = await createImageBitmap(current.bitmap);
      created.postMessage({ type: "image", bitmap } satisfies ToWorker, [
        bitmap,
      ]);
    }
    return created;
  }, [onWorkerMessage]);

  useEffect(
    () => () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    },
    [],
  );

  const stop = () => {
    jobRef.current++;
    workerRef.current?.terminate();
    workerRef.current = null;
    setTask({ kind: "idle" });
    setMessage(t("bgr.status.cancelled"));
  };

  /* ---------- Picture ---------- */

  const loadFile = useCallback(
    async (file: Blob, name: string) => {
      let bitmap: ImageBitmap;
      let reducedFrom: [number, number] | null = null;
      try {
        bitmap = await createImageBitmap(file);
        const side = Math.max(bitmap.width, bitmap.height);
        if (side > MAX_SIDE) {
          reducedFrom = [bitmap.width, bitmap.height];
          const scale = MAX_SIDE / side;
          const resized = await createImageBitmap(file, {
            resizeWidth: Math.round(bitmap.width * scale),
            resizeHeight: Math.round(bitmap.height * scale),
            resizeQuality: "high",
          });
          bitmap.close();
          bitmap = resized;
        }
      } catch {
        setTask({ kind: "error", code: "file" });
        return;
      }
      const { width, height } = bitmap;
      const surface = document.createElement("canvas");
      surface.width = width;
      surface.height = height;
      const context = surface.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(bitmap, 0, 0);
      const rgba = context.getImageData(0, 0, width, height).data;
      let opaque = true;
      const alpha = new Uint8ClampedArray(width * height);
      for (let i = 0; i < alpha.length; i++) {
        alpha[i] = rgba[i * 4 + 3];
        if (alpha[i] !== 255) opaque = false;
      }
      sourceRef.current?.bitmap.close();
      const next: Source = {
        bitmap,
        rgba,
        alpha: opaque ? null : alpha,
        width,
        height,
        name,
        reducedFrom,
      };
      jobRef.current++;
      sourceRef.current = next;
      setSource(next);
      setResult(null);
      setTask({ kind: "idle" });
      setFellBack(false);
      setCompare(50);
      // The likely background color, for the plain background method.
      setSettings((current) => ({
        ...current,
        color: rgbToHex(borderColor(rgba, width, height)),
      }));
      setMessage(t("bgr.status.loaded", { width, height }));
      const target = workerRef.current;
      if (target) {
        const copy = await createImageBitmap(bitmap);
        target.postMessage({ type: "image", bitmap: copy } satisfies ToWorker, [
          copy,
        ]);
      }
    },
    [t],
  );

  // Pasting a picture anywhere on the page loads it.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = [...(event.clipboardData?.files ?? [])].find((item) =>
        item.type.startsWith("image/"),
      );
      if (file) {
        event.preventDefault();
        loadFile(file, file.name || "image");
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [loadFile]);

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) loadFile(file, file.name);
  };

  const loadSample = async () => {
    const response = await fetch(SAMPLE);
    loadFile(await response.blob(), "portrait");
  };

  useEffect(() => {
    if (!source || !beforeRef.current) return;
    const canvas = beforeRef.current;
    canvas.width = source.width;
    canvas.height = source.height;
    canvas.getContext("2d")?.drawImage(source.bitmap, 0, 0);
  }, [source]);

  /* ---------- Processing ---------- */

  const isColor = settings.method === "color";
  const model = isColor ? null : MODELS[settings.method as ModelId];
  const choice = model && webgpu !== null ? pickFile(model, webgpu) : null;
  const modelCached = choice ? cached.has(fileUrl(choice.file)) : false;
  const busy = task.kind !== "idle" && task.kind !== "error";

  // The plain background method is instant: it follows every change.
  useEffect(() => {
    if (!source || settings.method !== "color") return;
    const timer = setTimeout(async () => {
      const job = ++jobRef.current;
      methodRef.current = "color";
      (await worker()).postMessage({
        type: "color",
        job,
        options: {
          color: hexToRgb(settings.color),
          tolerance: settings.tolerance,
          softness: settings.softness,
          connected: settings.connected,
        },
      } satisfies ToWorker);
    }, COLOR_DELAY);
    return () => clearTimeout(timer);
  }, [
    source,
    settings.method,
    settings.color,
    settings.tolerance,
    settings.softness,
    settings.connected,
    worker,
  ]);

  const removeBackground = async () => {
    if (!source || !model || webgpu === null) return;
    const job = ++jobRef.current;
    methodRef.current = model.id;
    setFellBack(false);
    setTask(
      modelCached
        ? { kind: "loading", device: choice?.device ?? "wasm" }
        : {
            kind: "download",
            loaded: 0,
            total: (choice?.file.megabytes ?? 0) * 1e6,
          },
    );
    setMessage(t("bgr.status.started"));
    (await worker()).postMessage({
      type: "ai",
      job,
      model: model.id,
      webgpu,
    } satisfies ToWorker);
  };

  /* ---------- Result ---------- */

  const lut = levels(settings.cleanup, settings.hardness);
  const fill = settings.fill === "color" ? hexToRgb(settings.fillColor) : null;
  const box: Box | null =
    source && result && settings.crop
      ? subjectBox(
          result.mask,
          lut,
          source.alpha,
          source.width,
          source.height,
          settings.margin,
        )
      : null;

  // Draws the result after each change, once per frame at most.
  useEffect(() => {
    if (!source || !result) return;
    const frame = requestAnimationFrame(() => {
      const out = new ImageData(source.width, source.height);
      compose(source.rgba, result.mask, lut, fill, out.data);
      drawTo(afterRef.current, out);
    });
    return () => cancelAnimationFrame(frame);
    // lut and fill follow the settings listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    source,
    result,
    settings.cleanup,
    settings.hardness,
    settings.fill,
    settings.fillColor,
  ]);

  /** The final picture, cropped when asked, at most maxSide pixels wide. */
  const output = (maxSide = Infinity): HTMLCanvasElement | null => {
    const after = afterRef.current;
    if (!source || !result || !after) return null;
    const area = box ?? {
      x: 0,
      y: 0,
      width: source.width,
      height: source.height,
    };
    const scale = Math.min(1, maxSide / Math.max(area.width, area.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(area.width * scale));
    canvas.height = Math.max(1, Math.round(area.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.imageSmoothingQuality = "high";
    context.drawImage(
      after,
      area.x,
      area.y,
      area.width,
      area.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    return canvas;
  };

  const png = (canvas: HTMLCanvasElement) =>
    new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("PNG failed"))),
        "image/png",
      ),
    );

  const downloadPng = async () => {
    const canvas = output();
    if (!canvas || !source) return;
    download(
      await png(canvas),
      `${baseName(source.name)}-${t("bgr.export.suffix")}.png`,
      "image/png",
    );
    setMessage(t("bgr.export.downloaded"));
  };

  const copy = async () => {
    const canvas = output();
    if (!canvas) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": png(canvas) }),
      ]);
      setMessage(t("bgr.export.copied"));
    } catch {
      setMessage(t("bgr.export.copyFailed"));
    }
  };

  // Hands the picture to the QR code generator, through its saved draft.
  const toQrCode = () => {
    const canvas = output(QR_LOGO_SIDE);
    if (!canvas) return;
    try {
      const draft = JSON.parse(localStorage.getItem(QR_STORAGE_KEY) ?? "null");
      const next = draft?.version === 1 ? draft : { version: 1 };
      next.logo = {
        ...(next.logo ?? {}),
        kind: "image",
        image: canvas.toDataURL("image/png"),
      };
      localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(next));
      navigate("/qr-code-generator");
    } catch {
      setMessage(t("bgr.export.qrFailed"));
    }
  };

  const clearModels = async () => {
    try {
      await caches.delete(CACHE_NAME);
    } catch {
      // Nothing to delete.
    }
    setCached(await cachedModels());
    setMessage(t("bgr.models.cleared"));
  };

  const pickColor = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isColor || !source) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(
      ((event.clientX - rect.left) / rect.width) * source.width,
    );
    const y = Math.floor(
      ((event.clientY - rect.top) / rect.height) * source.height,
    );
    if (x < 0 || y < 0 || x >= source.width || y >= source.height) return;
    const i = (y * source.width + x) * 4;
    const color = rgbToHex([
      source.rgba[i],
      source.rgba[i + 1],
      source.rgba[i + 2],
    ]);
    patch({ color });
    setMessage(t("bgr.color.picked", { color }));
  };

  /* ---------- View ---------- */

  const cachedBytes = [...cached.values()].reduce(
    (sum, bytes) => sum + bytes,
    0,
  );
  const deviceName = (device: Device) => t(`bgr.devices.${device}`);

  const progress = () => {
    switch (task.kind) {
      case "download":
        return (
          <>
            <progress
              max={task.total || 1}
              value={task.loaded}
              aria-labelledby="bgr-progress-label"
            />
            <span id="bgr-progress-label">
              {t("bgr.status.download", {
                loaded: megabytes(task.loaded),
                total: megabytes(task.total),
              })}
            </span>
          </>
        );
      case "loading":
        return (
          <>
            <progress aria-labelledby="bgr-progress-label" />
            <span id="bgr-progress-label">
              {t("bgr.status.loading", { device: deviceName(task.device) })}
            </span>
          </>
        );
      case "running":
        return (
          <>
            <progress aria-labelledby="bgr-progress-label" />
            <span id="bgr-progress-label">
              {t("bgr.status.running", { device: deviceName(task.device) })}
            </span>
          </>
        );
      default:
        return null;
    }
  };

  const methodNote = (id: MethodId) => {
    if (id === "color") return t("bgr.methods.color.size");
    const spec = MODELS[id];
    const pick = webgpu === null ? null : pickFile(spec, webgpu);
    if (webgpu !== null && !pick) return t("bgr.methods.needsWebgpu");
    const file = pick?.file ?? spec.files.wasm ?? spec.files.webgpu;
    if (!file) return "";
    const size = t("bgr.methods.size", {
      size: number.format(file.megabytes),
      license: spec.license,
    });
    return cached.has(fileUrl(file))
      ? `${size} ${t("bgr.methods.cached")}`
      : size;
  };

  return (
    <Page
      title={t("bgr.title")}
      icon={faEraser}
      lead={
        <>
          <p>{t("bgr.lead")}</p>
          <p className="note">{t("bgr.privacy")}</p>
        </>
      }
    >
      <p className="sr-only" role="status">
        {message}
      </p>

      <div className="cvgen bgr">
        <form
          className="cvgen-form"
          onSubmit={(event) => event.preventDefault()}
        >
          <fieldset className="cvgen-group">
            <legend>{t("bgr.image.title")}</legend>
            <div
              className={`bgr-drop${dragging ? " is-dragging" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <Icon icon={faImage} />
              <p>{t("bgr.image.drop")}</p>
              <div className="cvgen-actions">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => fileRef.current?.click()}
                >
                  {t("bgr.image.choose")}
                </button>
                <button type="button" className="button" onClick={loadSample}>
                  {t("bgr.image.sample")}
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                id="bgr-file"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) loadFile(file, file.name);
                  event.target.value = "";
                }}
              />
            </div>
            {source && (
              <p className="cvgen-hint">
                {source.reducedFrom
                  ? t("bgr.image.reduced", {
                      width: source.width,
                      height: source.height,
                      fromWidth: source.reducedFrom[0],
                      fromHeight: source.reducedFrom[1],
                    })
                  : t("bgr.image.size", {
                      width: source.width,
                      height: source.height,
                    })}
              </p>
            )}
            {task.kind === "error" && task.code === "file" && (
              <p className="cvgen-warning" role="alert">
                <Icon icon={faTriangleExclamation} />
                {t("bgr.errors.file")}
              </p>
            )}
          </fieldset>

          <fieldset className="cvgen-group">
            <legend>{t("bgr.methods.title")}</legend>
            <div className="bgr-methods">
              {METHODS.map((id) => {
                const disabled =
                  id !== "color" &&
                  webgpu === false &&
                  !MODELS[id as ModelId].files.wasm;
                return (
                  <label
                    key={id}
                    className={`bgr-method${disabled ? " is-disabled" : ""}`}
                    htmlFor={`bgr-method-${id}`}
                  >
                    <input
                      type="radio"
                      name="bgr-method"
                      id={`bgr-method-${id}`}
                      value={id}
                      checked={settings.method === id}
                      disabled={disabled || busy}
                      aria-describedby={`bgr-method-${id}-text`}
                      onChange={() => patch({ method: id })}
                    />
                    <span className="bgr-method-body">
                      <span className="bgr-method-name">
                        {t(`bgr.methods.${id}.name`)}
                        <span className="bgr-badge">
                          {t(`bgr.methods.${id}.badge`)}
                        </span>
                      </span>
                      <span id={`bgr-method-${id}-text`}>
                        <span className="bgr-method-text">
                          {t(`bgr.methods.${id}.text`)}
                        </span>
                        <span className="bgr-method-note">
                          {methodNote(id)}
                        </span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="cvgen-hint">
              {webgpu === null
                ? t("bgr.methods.detecting")
                : webgpu
                  ? t("bgr.methods.webgpuYes")
                  : t("bgr.methods.webgpuNo")}
            </p>

            {!isColor && (
              <div className="bgr-run">
                {busy ? (
                  <>
                    <div className="bgr-progress">{progress()}</div>
                    <button type="button" className="button" onClick={stop}>
                      <Icon icon={faXmark} /> {t("bgr.actions.cancel")}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="button button-primary"
                    disabled={!source || !choice}
                    onClick={removeBackground}
                  >
                    <Icon icon={faEraser} />{" "}
                    {modelCached || !choice
                      ? t("bgr.actions.run")
                      : t("bgr.actions.download", {
                          size: number.format(choice.file.megabytes),
                        })}
                  </button>
                )}
                {!source && (
                  <p className="cvgen-hint">{t("bgr.actions.noImage")}</p>
                )}
              </div>
            )}
            {fellBack && (
              <p className="cvgen-hint">{t("bgr.status.fallback")}</p>
            )}
            {task.kind === "error" && task.code !== "file" && (
              <p className="cvgen-warning" role="alert">
                <Icon icon={faTriangleExclamation} />
                {t(`bgr.errors.${task.code}`)}
              </p>
            )}

            {cachedBytes > 0 && (
              <div className="bgr-cache">
                <p className="cvgen-hint">
                  {t("bgr.models.stored", { size: megabytes(cachedBytes) })}
                </p>
                <button
                  type="button"
                  className="button button-small"
                  onClick={clearModels}
                  disabled={busy}
                >
                  <Icon icon={faTrashCan} /> {t("bgr.models.clear")}
                </button>
              </div>
            )}
          </fieldset>

          <fieldset className="cvgen-group">
            <legend>{t("bgr.adjust.title")}</legend>
            {isColor ? (
              <>
                <div className="bgr-color-row">
                  <ColorField
                    id="bgr-color"
                    label={t("bgr.color.color")}
                    hexLabel={t("bgr.color.hex")}
                    value={settings.color}
                    onChange={(color) => patch({ color })}
                  />
                  <button
                    type="button"
                    className="button button-small"
                    disabled={!source}
                    onClick={() =>
                      source &&
                      patch({
                        color: rgbToHex(
                          borderColor(source.rgba, source.width, source.height),
                        ),
                      })
                    }
                  >
                    {t("bgr.color.detect")}
                  </button>
                </div>
                <p className="cvgen-hint">{t("bgr.color.pickHint")}</p>
                <Range
                  id="bgr-tolerance"
                  label={t("bgr.color.tolerance")}
                  hint={t("bgr.color.toleranceHint")}
                  value={settings.tolerance}
                  onChange={(tolerance) => patch({ tolerance })}
                />
                <Range
                  id="bgr-softness"
                  label={t("bgr.color.softness")}
                  value={settings.softness}
                  onChange={(softness) => patch({ softness })}
                />
                <Check
                  id="bgr-connected"
                  label={t("bgr.color.connected")}
                  checked={settings.connected}
                  onChange={(connected) => patch({ connected })}
                />
              </>
            ) : (
              <>
                <Range
                  id="bgr-cleanup"
                  label={t("bgr.adjust.cleanup")}
                  hint={t("bgr.adjust.cleanupHint")}
                  value={settings.cleanup}
                  onChange={(cleanup) => patch({ cleanup })}
                />
                <Range
                  id="bgr-hardness"
                  label={t("bgr.adjust.hardness")}
                  hint={t("bgr.adjust.hardnessHint")}
                  value={settings.hardness}
                  onChange={(hardness) => patch({ hardness })}
                />
              </>
            )}
          </fieldset>

          <fieldset className="cvgen-group">
            <legend>{t("bgr.output.title")}</legend>
            <Choice
              legend={t("bgr.output.fill")}
              name="bgr-fill"
              value={settings.fill}
              options={(["transparent", "color"] as const).map((value) => ({
                value,
                label: t(`bgr.output.fills.${value}`),
              }))}
              onChange={(value) => patch({ fill: value })}
            />
            {settings.fill === "color" && (
              <ColorField
                id="bgr-fill-color"
                label={t("bgr.output.fillColor")}
                hexLabel={t("bgr.output.fillHex")}
                value={settings.fillColor}
                onChange={(fillColor) => patch({ fillColor })}
              />
            )}
            <Check
              id="bgr-crop"
              label={t("bgr.output.crop")}
              checked={settings.crop}
              onChange={(crop) => patch({ crop })}
            />
            {settings.crop && (
              <Range
                id="bgr-margin"
                label={t("bgr.output.margin")}
                value={settings.margin}
                max={20}
                suffix=" %"
                onChange={(margin) => patch({ margin })}
              />
            )}
          </fieldset>
        </form>

        <section
          className="cvgen-preview bgr-preview"
          aria-labelledby="bgr-preview-title"
        >
          <div className="cvgen-preview-head">
            <h2 id="bgr-preview-title">{t("bgr.preview.title")}</h2>
          </div>

          {source ? (
            <>
              <div
                className={`bgr-viewer is-${settings.preview}${isColor ? " is-picking" : ""}`}
                style={
                  {
                    "--ratio": source.width / source.height,
                  } as React.CSSProperties
                }
                onClick={pickColor}
              >
                <canvas
                  ref={beforeRef}
                  className="bgr-before"
                  role="img"
                  aria-label={t("bgr.preview.before")}
                />
                {result && (
                  <>
                    <div
                      className="bgr-after"
                      style={{ clipPath: `inset(0 0 0 ${compare}%)` }}
                    >
                      <canvas
                        ref={afterRef}
                        role="img"
                        aria-label={t("bgr.preview.after")}
                      />
                    </div>
                    <div
                      className="bgr-divider"
                      style={{ left: `${compare}%` }}
                      aria-hidden="true"
                    />
                  </>
                )}
              </div>
              {result && (
                <>
                  <div className="field">
                    <label htmlFor="bgr-compare">
                      {t("bgr.preview.compare")}
                    </label>
                    <input
                      type="range"
                      id="bgr-compare"
                      min={0}
                      max={100}
                      value={compare}
                      aria-valuetext={t("bgr.preview.compareValue", {
                        value: compare,
                      })}
                      onChange={(event) =>
                        setCompare(Number(event.target.value))
                      }
                    />
                  </div>
                  <p className="cvgen-hint">
                    {result.device
                      ? t("bgr.preview.doneAi", {
                          model: t(`bgr.methods.${result.method}.name`),
                          seconds: number.format(result.milliseconds / 1000),
                          device: deviceName(result.device),
                        })
                      : t("bgr.preview.doneColor")}
                    {box &&
                      ` ${t("bgr.preview.cropped", {
                        width: box.width,
                        height: box.height,
                      })}`}
                  </p>
                </>
              )}
              <Choice
                legend={t("bgr.preview.background")}
                name="bgr-preview-bg"
                value={settings.preview}
                options={(["checker", "white", "black"] as const).map(
                  (value) => ({
                    value,
                    label: t(`bgr.preview.backgrounds.${value}`),
                  }),
                )}
                onChange={(preview) => patch({ preview })}
              />
              {result && (
                <div className="cvgen-actions bgr-export">
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={downloadPng}
                  >
                    <Icon icon={faDownload} /> {t("bgr.export.png")}
                  </button>
                  {canCopy() && (
                    <button type="button" className="button" onClick={copy}>
                      <Icon icon={faCopy} /> {t("bgr.export.copy")}
                    </button>
                  )}
                  <button type="button" className="button" onClick={toQrCode}>
                    <Icon icon={faQrcode} /> {t("bgr.export.qr")}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="bgr-empty">{t("bgr.preview.empty")}</p>
          )}
        </section>
      </div>
    </Page>
  );
}
