// Photos never leave the browser: they are resized and cropped with a canvas.
import type { Photo } from "./model";

const MAX_SOURCE = 1200;
const OUTPUT = 600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unreadable picture"));
    image.src = src;
  });
}

function toJpeg(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/jpeg", 0.88);
}

/** Reads a picture (file or address) into a JPEG data URL of at most 1200 px. */
export async function readPicture(input: File | string): Promise<string> {
  const url = typeof input === "string" ? input : URL.createObjectURL(input);
  try {
    const image = await loadImage(url);
    const scale = Math.min(
      1,
      MAX_SOURCE / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    // JPEG has no transparency: transparent pixels become white.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return toJpeg(canvas);
  } finally {
    if (typeof input !== "string") URL.revokeObjectURL(url);
  }
}

/** The square part of the photo shown on the CV, as a 600 px JPEG data URL. */
export async function cropPhoto(photo: Photo): Promise<string> {
  const image = await loadImage(photo.source);
  const side = Math.min(image.naturalWidth, image.naturalHeight) / photo.zoom;
  const sx = (image.naturalWidth - side) * photo.x;
  const sy = (image.naturalHeight - side) * photo.y;
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT;
  canvas.height = OUTPUT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.drawImage(image, sx, sy, side, side, 0, 0, OUTPUT, OUTPUT);
  return toJpeg(canvas);
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
