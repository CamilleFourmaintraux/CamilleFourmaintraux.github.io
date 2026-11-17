// Checks the color pairs of the design tokens against WCAG 2.2 AA.
//
//   npm run check:a11y
//
// Text needs 4.5:1, borders of controls and graphics need 3:1.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../src/styles/base.css"),
  "utf8",
);

function tokens(block) {
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [
      m[1],
      m[2],
    ]),
  );
}

const darkStart = css.indexOf('&[data-theme="dark"]');
const light = tokens(
  css.slice(css.indexOf(':root[data-ui="v2"] {'), darkStart),
);
const dark = {
  ...light,
  ...tokens(css.slice(darkStart, css.indexOf("}", darkStart))),
};

function luminance(hex) {
  const channels = [1, 3, 5].map((i) => {
    const value = parseInt(hex.slice(i, i + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

// [foreground, background, minimum ratio]
const PAIRS = [
  ["ink", "bg", 4.5],
  ["ink", "surface", 4.5],
  ["ink", "surface-2", 4.5],
  ["ink-2", "bg", 4.5],
  ["ink-2", "surface", 4.5],
  ["ink-2", "surface-2", 4.5],
  ["primary", "bg", 4.5],
  ["primary", "surface", 4.5],
  ["primary", "surface-2", 4.5],
  ["primary", "primary-soft", 4.5],
  ["primary-ink", "primary", 4.5],
  ["primary-ink", "primary-hover", 4.5],
  ["ink", "primary-soft", 4.5],
  ["accent", "bg", 4.5],
  ["accent", "surface", 4.5],
  ["accent", "accent-soft", 4.5],
  ["danger", "surface", 4.5],
  ["danger", "bg", 4.5],
  ["danger", "danger-soft", 4.5],
  ["bg", "ink", 4.5],
  ["line-strong", "bg", 3],
  ["line-strong", "surface", 3],
  ["accent", "surface-2", 3],
  ["maze-path", "surface-2", 3],
];

let failures = 0;
for (const [name, theme] of [
  ["light", light],
  ["dark", dark],
]) {
  for (const [foreground, background, minimum] of PAIRS) {
    const ratio = contrast(theme[foreground], theme[background]);
    const ok = ratio >= minimum;
    if (!ok) failures++;
    console.log(
      `${ok ? "ok  " : "FAIL"} ${name.padEnd(5)} ${foreground} on ${background}: ` +
        `${ratio.toFixed(2)} (min ${minimum})`,
    );
  }
}
process.exitCode = failures ? 1 : 0;
