// Messages between the page and its worker.
import type { ColorOptions } from "./mask";
import type { Device, ModelId } from "./models";

export type ToWorker =
  | { type: "image"; bitmap: ImageBitmap }
  | { type: "color"; job: number; options: ColorOptions }
  | { type: "ai"; job: number; model: ModelId; webgpu: boolean };

export type ErrorCode =
  | "download"
  | "storage"
  | "webgpu"
  | "unsupported"
  | "run"
  | "no-image";

export type FromWorker =
  | { type: "download"; job: number; loaded: number; total: number }
  | { type: "loading"; job: number; device: Device }
  | { type: "running"; job: number; device: Device }
  /** WebGPU failed: the model is retried on the processor. */
  | { type: "fallback"; job: number }
  | {
      type: "mask";
      job: number;
      mask: Uint8ClampedArray;
      width: number;
      height: number;
      device?: Device;
      milliseconds: number;
    }
  | { type: "error"; job: number; code: ErrorCode; detail: string };
