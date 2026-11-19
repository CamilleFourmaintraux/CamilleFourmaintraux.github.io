// Contrast helpers (WCAG 2.2): the sidebar text switches to white on dark
// backgrounds, and the form warns about link colors that are hard to read.

function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((start) => {
    const channel = parseInt(value.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

export const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

/** Black or white, whichever reads better on the sidebar background. */
export const sidebarTextColor = (background: string) =>
  contrast("#000000", background) >= contrast("#ffffff", background)
    ? "#000000"
    : "#ffffff";

/** Minimum contrast for body text (WCAG 2.2 AA). */
export const MIN_CONTRAST = 4.5;
