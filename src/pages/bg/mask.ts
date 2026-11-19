// Pixel work shared by the page and its worker. A mask holds one byte per
// pixel: 255 keeps the pixel, 0 removes it.

/** RGBA pixels to a 1x3xHxW float tensor, scaled to 0..1 then normalized. */
export function toTensor(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  mean: [number, number, number],
  std: [number, number, number],
): Float32Array {
  const size = width * height;
  const out = new Float32Array(3 * size);
  for (let i = 0; i < size; i++) {
    for (let c = 0; c < 3; c++) {
      out[c * size + i] = (rgba[i * 4 + c] / 255 - mean[c]) / std[c];
    }
  }
  return out;
}

/** Network output to a mask. Logits get a sigmoid, then values may be spread. */
export function outputToMask(
  output: Float32Array,
  minMax: boolean,
): Uint8ClampedArray {
  let min = Infinity;
  let max = -Infinity;
  for (const value of output) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const logits = min < -0.01 || max > 1.01;
  const values = logits ? output.map((v) => 1 / (1 + Math.exp(-v))) : output;
  if (logits) {
    min = 1 / (1 + Math.exp(-min));
    max = 1 / (1 + Math.exp(-max));
  }
  const spread = minMax && max - min > 1e-6;
  const mask = new Uint8ClampedArray(values.length);
  for (let i = 0; i < values.length; i++) {
    const value = spread ? (values[i] - min) / (max - min) : values[i];
    mask[i] = Math.round(value * 255);
  }
  return mask;
}

/* ---------- Plain background, without AI ---------- */

export type Rgb = [number, number, number];

export const hexToRgb = (hex: string): Rgb => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

export const rgbToHex = ([r, g, b]: Rgb) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

/** Most frequent color along the border, roughly: the likely background. */
export function borderColor(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): Rgb {
  const counts = new Map<number, { n: number; sum: Rgb }>();
  const visit = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    if (rgba[i + 3] < 128) return;
    const key =
      ((rgba[i] >> 4) << 8) | ((rgba[i + 1] >> 4) << 4) | (rgba[i + 2] >> 4);
    const entry = counts.get(key) ?? { n: 0, sum: [0, 0, 0] };
    entry.n++;
    entry.sum[0] += rgba[i];
    entry.sum[1] += rgba[i + 1];
    entry.sum[2] += rgba[i + 2];
    counts.set(key, entry);
  };
  for (let x = 0; x < width; x++) {
    visit(x, 0);
    visit(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    visit(0, y);
    visit(width - 1, y);
  }
  let best: { n: number; sum: Rgb } | null = null;
  for (const entry of counts.values())
    if (!best || entry.n > best.n) best = entry;
  if (!best) return [255, 255, 255];
  return best.sum.map((v) => Math.round(v / best.n)) as Rgb;
}

export type ColorOptions = {
  color: Rgb;
  /** Distance up to which a pixel is background, 0..100. */
  tolerance: number;
  /** Width of the soft edge after it, 0..100. */
  softness: number;
  /** Only removes the background that touches the border of the image. */
  connected: boolean;
};

// Largest distance between two RGB colors.
const MAX_DISTANCE = Math.sqrt(3 * 255 * 255);

/** Mask of the pixels that differ from a background color. */
export function colorMask(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  { color, tolerance, softness, connected }: ColorOptions,
): Uint8ClampedArray {
  const size = width * height;
  const low = (tolerance / 100) * MAX_DISTANCE * 0.5;
  const band = Math.max(1, (softness / 100) * MAX_DISTANCE * 0.25);
  const high = low + band;
  // Background share of each pixel: 1 inside the tolerance, 0 past the edge.
  const share = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    const p = i * 4;
    const d = Math.hypot(
      rgba[p] - color[0],
      rgba[p + 1] - color[1],
      rgba[p + 2] - color[2],
    );
    share[i] = d <= low ? 1 : d >= high ? 0 : 1 - (d - low) / band;
  }
  const mask = new Uint8ClampedArray(size).fill(255);
  if (!connected) {
    for (let i = 0; i < size; i++) mask[i] = Math.round((1 - share[i]) * 255);
    return mask;
  }
  // Flood fill from the border through background-like pixels.
  const seen = new Uint8Array(size);
  const stack = new Int32Array(size);
  let top = 0;
  const push = (i: number) => {
    if (!seen[i] && share[i] > 0) {
      seen[i] = 1;
      stack[top++] = i;
    }
  };
  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }
  while (top > 0) {
    const i = stack[--top];
    mask[i] = Math.round((1 - share[i]) * 255);
    // Soft pixels are the edge: the fill does not go through them.
    if (share[i] < 1) continue;
    const x = i % width;
    if (x > 0) push(i - 1);
    if (x < width - 1) push(i + 1);
    if (i >= width) push(i - width);
    if (i < size - width) push(i + width);
  }
  return mask;
}

/* ---------- Adjustments and output ---------- */

/**
 * Lookup table for the mask. "cleanup" removes faint leftovers of background,
 * "hardness" turns soft edges into sharp ones. Both go from 0 to 100.
 */
export function levels(cleanup: number, hardness: number): Uint8ClampedArray {
  const low = (cleanup / 100) * 230;
  const high = Math.max(low + 1, 255 - (hardness / 100) * (255 - low) * 0.97);
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    lut[v] =
      v <= low
        ? 0
        : v >= high
          ? 255
          : Math.round(((v - low) / (high - low)) * 255);
  }
  return lut;
}

/**
 * The picture without its background: the mask goes through the lookup table
 * and joins the alpha the picture already had. With a color, the result is
 * flat on that color instead of transparent.
 */
export function compose(
  rgba: Uint8ClampedArray,
  mask: Uint8ClampedArray,
  lut: Uint8ClampedArray,
  background: Rgb | null,
  out: Uint8ClampedArray,
): void {
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    const alpha = (lut[mask[i]] * rgba[p + 3]) / 255;
    if (background) {
      const a = alpha / 255;
      out[p] = rgba[p] * a + background[0] * (1 - a);
      out[p + 1] = rgba[p + 1] * a + background[1] * (1 - a);
      out[p + 2] = rgba[p + 2] * a + background[2] * (1 - a);
      out[p + 3] = 255;
    } else {
      out[p] = rgba[p];
      out[p + 1] = rgba[p + 1];
      out[p + 2] = rgba[p + 2];
      out[p + 3] = alpha;
    }
  }
}

export type Box = { x: number; y: number; width: number; height: number };

/** Smallest box around the kept pixels, with a margin in percent of its size. */
export function subjectBox(
  mask: Uint8ClampedArray,
  lut: Uint8ClampedArray,
  alpha: Uint8ClampedArray | null,
  width: number,
  height: number,
  marginPercent: number,
): Box | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const kept = (lut[mask[i]] * (alpha ? alpha[i] : 255)) / 255;
      if (kept > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const margin = Math.round(
    (Math.max(maxX - minX + 1, maxY - minY + 1) * marginPercent) / 100,
  );
  const x = Math.max(0, minX - margin);
  const y = Math.max(0, minY - margin);
  return {
    x,
    y,
    width: Math.min(width, maxX + 1 + margin) - x,
    height: Math.min(height, maxY + 1 + margin) - y,
  };
}
