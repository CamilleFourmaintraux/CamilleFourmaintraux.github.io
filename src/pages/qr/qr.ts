// QR code generator: what the form describes, the text it encodes and the
// SVG picture drawn from it. Everything runs in the browser.
import qrcode from "qrcode-generator";
import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { uid } from "../cv/model";

export type ContentKind =
  | "link"
  | "text"
  | "email"
  | "phone"
  | "wifi"
  | "contact";
export type ModuleStyle = "square" | "rounded" | "dots" | "leaf";
export type EyeFrame = "square" | "rounded" | "circle";
export type EyeCenter = "square" | "rounded" | "circle";
export type Correction = "auto" | "L" | "M" | "Q" | "H";
export type Level = Exclude<Correction, "auto">;
export type LogoKind = "none" | "icon" | "image";
export type LogoShape = "square" | "circle";
export type WifiSecurity = "WPA" | "WEP" | "nopass";

/** One query parameter of a link, such as src=linkedin. */
export type LinkParam = { id: string; name: string; value: string };

export type QrContent = {
  kind: ContentKind;
  /** Address of the link, without its query parameters. */
  link: string;
  params: LinkParam[];
  /** Adds "_qr-code" to the value of a "src" parameter, to tell scans from
   * clicks on the same document. */
  sourceSuffix: boolean;
  text: string;
  email: { to: string; subject: string; body: string };
  phone: string;
  wifi: {
    ssid: string;
    password: string;
    security: WifiSecurity;
    hidden: boolean;
  };
  contact: {
    firstName: string;
    lastName: string;
    organization: string;
    title: string;
    phone: string;
    email: string;
    url: string;
  };
};

export type QrStyle = {
  modules: ModuleStyle;
  eyeFrame: EyeFrame;
  eyeCenter: EyeCenter;
  foreground: string;
  background: string;
  eyeColor: string;
  /** Finder patterns in their own color. */
  customEyes: boolean;
  transparent: boolean;
  roundedCorners: boolean;
  /** Quiet zone around the code, in modules. */
  margin: number;
  correction: Correction;
};

export type QrLogo = {
  kind: LogoKind;
  icon: LogoIconKey;
  iconColor: string;
  /** PNG data URL. */
  image: string | null;
  /** Width of the logo area, as a share of the code width. */
  size: number;
  shape: LogoShape;
  /** Removes the modules under the logo instead of drawing over them. */
  clear: boolean;
};

export type QrSettings = {
  version: 1;
  content: QrContent;
  style: QrStyle;
  logo: QrLogo;
};

export const LOGO_ICON_KEYS = [
  "link",
  "globe",
  "envelope",
  "phone",
  "wifi",
  "user",
  "location",
  "linkedin",
  "github",
  "gitlab",
  "youtube",
  "discord",
  "instagram",
  "x",
  "whatsapp",
  "steam",
] as const;
export type LogoIconKey = (typeof LOGO_ICON_KEYS)[number];

export const PORTFOLIO_HOST = "camillefourmaintraux.github.io";
export const SOURCE_PARAM = "src";
export const QR_SUFFIX = "_qr-code";

export const linkParam = (name = "", value = ""): LinkParam => ({
  id: uid(),
  name,
  value,
});
export const LOGO_SIZE = { min: 0.1, max: 0.3, step: 0.01 };
export const MARGIN = { min: 0, max: 8 };

export function defaultSettings(): QrSettings {
  return {
    version: 1,
    content: {
      kind: "link",
      link: `https://${PORTFOLIO_HOST}/`,
      params: [linkParam(SOURCE_PARAM, "qr-code-generator")],
      sourceSuffix: false,
      text: "",
      email: { to: "", subject: "", body: "" },
      phone: "",
      wifi: { ssid: "", password: "", security: "WPA", hidden: false },
      contact: {
        firstName: "",
        lastName: "",
        organization: "",
        title: "",
        phone: "",
        email: "",
        url: "",
      },
    },
    style: {
      modules: "square",
      eyeFrame: "square",
      eyeCenter: "square",
      foreground: "#000000",
      background: "#ffffff",
      eyeColor: "#336450",
      customEyes: false,
      transparent: false,
      roundedCorners: false,
      margin: 4,
      correction: "auto",
    },
    logo: {
      kind: "none",
      icon: "link",
      iconColor: "#000000",
      image: null,
      size: 0.22,
      shape: "square",
      clear: true,
    },
  };
}

/* ---------- Encoded text ---------- */

/** Adds https:// to a bare address such as "example.com/page". */
export function normalizeLink(value: string): string {
  const link = value.trim();
  if (!link) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(link)) return link;
  return `https://${link.replace(/^\/+/, "")}`;
}

/** Splits a link into its address (hash kept) and its query parameters. */
export function splitLink(value: string): {
  address: string;
  params: [string, string][];
} {
  const hashAt = value.indexOf("#");
  const beforeHash = hashAt < 0 ? value : value.slice(0, hashAt);
  const hash = hashAt < 0 ? "" : value.slice(hashAt);
  const queryAt = beforeHash.indexOf("?");
  if (queryAt < 0) return { address: value, params: [] };
  return {
    address: beforeHash.slice(0, queryAt) + hash,
    params: [...new URLSearchParams(beforeHash.slice(queryAt + 1))],
  };
}

/** Adds parameters to the list. A name already there takes the new value. */
export function mergeParams(
  list: LinkParam[],
  pairs: [string, string][],
): LinkParam[] {
  const next = [...list];
  for (const [name, value] of pairs) {
    const index = next.findIndex((param) => param.name === name);
    if (index >= 0) next[index] = { ...next[index], value };
    else next.push(linkParam(name, value));
  }
  return next;
}

export const hasSourceParam = (params: LinkParam[]) =>
  params.some((param) => param.name.trim() === SOURCE_PARAM);

/** The full link: address, then the parameters, then the hash. */
export function buildLink(content: QrContent): string {
  const { address, params: typed } = splitLink(content.link.trim());
  const base = normalizeLink(address);
  if (!base) return "";
  const pairs = mergeParams(content.params, typed)
    .map(({ name, value }) => [name.trim(), value] as [string, string])
    .filter(([name]) => name)
    .map(([name, value]): [string, string] =>
      content.sourceSuffix &&
      name === SOURCE_PARAM &&
      value &&
      !value.endsWith(QR_SUFFIX)
        ? [name, value + QR_SUFFIX]
        : [name, value],
    );
  if (pairs.length === 0) return base;
  const query = new URLSearchParams(pairs).toString();
  const hashAt = base.indexOf("#");
  return hashAt < 0
    ? `${base}?${query}`
    : `${base.slice(0, hashAt)}?${query}${base.slice(hashAt)}`;
}

// Wi-Fi and MeCard-like formats escape these characters with a backslash.
const escapeWifi = (value: string) => value.replace(/([\\;,:"])/g, "\\$1");
const escapeVcard = (value: string) =>
  value.replace(/([\\;,])/g, "\\$1").replace(/\r?\n/g, "\\n");

/** The text stored in the QR code. */
export function encodeContent(content: QrContent): string {
  switch (content.kind) {
    case "link":
      return buildLink(content);
    case "text":
      return content.text;
    case "email": {
      const { to, subject, body } = content.email;
      if (!to.trim() && !subject.trim() && !body.trim()) return "";
      const query = [
        subject.trim() && `subject=${encodeURIComponent(subject.trim())}`,
        body.trim() && `body=${encodeURIComponent(body.trim())}`,
      ].filter(Boolean);
      return `mailto:${to.trim()}${query.length ? `?${query.join("&")}` : ""}`;
    }
    case "phone": {
      const phone = content.phone.replace(/[^\d+*#]/g, "");
      return phone && `tel:${phone}`;
    }
    case "wifi": {
      const { ssid, password, security, hidden } = content.wifi;
      if (!ssid.trim()) return "";
      const parts = [`T:${security}`, `S:${escapeWifi(ssid)}`];
      if (security !== "nopass") parts.push(`P:${escapeWifi(password)}`);
      if (hidden) parts.push("H:true");
      return `WIFI:${parts.join(";")};;`;
    }
    case "contact": {
      const c = content.contact;
      const name = [c.firstName, c.lastName].map((part) => part.trim());
      const fields: [string, string][] = [
        ["N", `${escapeVcard(name[1])};${escapeVcard(name[0])};;;`],
        ["FN", escapeVcard(name.filter(Boolean).join(" "))],
        ["ORG", escapeVcard(c.organization.trim())],
        ["TITLE", escapeVcard(c.title.trim())],
        ["TEL", c.phone.trim()],
        ["EMAIL", c.email.trim()],
        ["URL", escapeVcard(normalizeLink(c.url))],
      ];
      const lines = fields.filter(
        ([key, value]) => value && !(key === "N" && value === ";;;;"),
      );
      if (lines.length === 0) return "";
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        ...lines.map(([key, value]) => `${key}:${value}`),
        "END:VCARD",
      ].join("\n");
    }
  }
}

/* ---------- Matrix ---------- */

export type Matrix = { count: number; level: Level; dark: boolean[][] };

/** "auto" means M, or H when a logo hides part of the code. */
export function resolveLevel(style: QrStyle, logo: QrLogo): Level {
  if (style.correction !== "auto") return style.correction;
  return hasLogo(logo) ? "H" : "M";
}

export const hasLogo = (logo: QrLogo) =>
  logo.kind === "icon" || (logo.kind === "image" && logo.image !== null);

// The library writes one byte per character: UTF-8 bytes are passed that way
// so that accents and emoji survive. Readers detect UTF-8 on their own.
function byteString(text: string): string {
  let out = "";
  for (const byte of new TextEncoder().encode(text)) {
    out += String.fromCharCode(byte);
  }
  return out;
}

/** Throws when the text is too long for a QR code at that level. */
export function buildMatrix(text: string, level: Level): Matrix {
  const code = qrcode(0, level);
  code.addData(byteString(text), "Byte");
  code.make();
  const count = code.getModuleCount();
  const dark = Array.from({ length: count }, (_, row) =>
    Array.from({ length: count }, (_, col) => code.isDark(row, col)),
  );
  return { count, level, dark };
}

/** QR version (1 to 40) from the module count. */
export const versionOf = (count: number) => (count - 17) / 4;

/* ---------- SVG ---------- */

const fmt = (value: number) => String(Math.round(value * 1000) / 1000);

function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  if (r <= 0) return `M${fmt(x)} ${fmt(y)}h${fmt(w)}v${fmt(h)}h${fmt(-w)}z`;
  return (
    `M${fmt(x + r)} ${fmt(y)}h${fmt(w - 2 * r)}` +
    `a${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(r)} ${fmt(r)}v${fmt(h - 2 * r)}` +
    `a${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(-r)} ${fmt(r)}h${fmt(-(w - 2 * r))}` +
    `a${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(-r)} ${fmt(-r)}v${fmt(-(h - 2 * r))}` +
    `a${fmt(r)} ${fmt(r)} 0 0 1 ${fmt(r)} ${fmt(-r)}z`
  );
}

function circle(cx: number, cy: number, r: number) {
  return (
    `M${fmt(cx - r)} ${fmt(cy)}` +
    `a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(2 * r)} 0` +
    `a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(-2 * r)} 0z`
  );
}

/** A module whose corners are rounded one by one (radius 0 or 0.5). */
function module(
  x: number,
  y: number,
  [tl, tr, br, bl]: [number, number, number, number],
) {
  const arc = (r: number, dx: number, dy: number) =>
    r ? `a${r} ${r} 0 0 1 ${dx} ${dy}` : "";
  return (
    `M${fmt(x + tl)} ${y}h${fmt(1 - tl - tr)}${arc(tr, tr, tr)}` +
    `v${fmt(1 - tr - br)}${arc(br, -br, br)}` +
    `h${fmt(-(1 - br - bl))}${arc(bl, -bl, -bl)}` +
    `v${fmt(-(1 - bl - tl))}${arc(tl, tl, -tl)}z`
  );
}

const escapeAttr = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function isFinder(row: number, col: number, count: number) {
  const near = (value: number) => value < 7;
  const far = (value: number) => value >= count - 7;
  return (
    (near(row) && near(col)) ||
    (near(row) && far(col)) ||
    (far(row) && near(col))
  );
}

/** Centers of the alignment patterns (ISO/IEC 18004, annex E). */
export function alignmentCenters(count: number): [number, number][] {
  const version = versionOf(count);
  if (version === 1) return [];
  const amount = Math.floor(version / 7) + 2;
  const last = count - 7;
  const step =
    version === 32 ? 26 : Math.ceil((last - 6) / (amount - 1) / 2) * 2;
  const positions = [6];
  for (let i = amount - 2; i >= 0; i--) positions.push(last - i * step);
  const centers: [number, number][] = [];
  for (const row of positions) {
    for (const col of positions) {
      // The three corners belong to the finder patterns.
      if (
        (row === 6 && (col === 6 || col === last)) ||
        (row === last && col === 6)
      )
        continue;
      centers.push([row, col]);
    }
  }
  return centers;
}

export type RenderOptions = {
  matrix: Matrix;
  style: QrStyle;
  logo: QrLogo;
  /** Icon drawn in the middle when logo.kind is "icon". */
  icon?: IconDefinition;
  /** Accessible title of the picture. */
  title?: string;
  /** Width and height of the SVG file, in pixels. */
  pixels?: number;
};

/** The QR code as a standalone SVG document. */
export function renderSvg({
  matrix,
  style,
  logo,
  icon,
  title,
  pixels,
}: RenderOptions): string {
  const { count, dark } = matrix;
  const m = style.margin;
  const total = count + 2 * m;
  const center = total / 2;
  const showLogo = hasLogo(logo);

  // Area kept free for the logo, in modules.
  const plate = showLogo ? count * logo.size : 0;
  const clearArea = showLogo && logo.clear;
  const hidden = (row: number, col: number) => {
    if (!clearArea) return false;
    const x = col + m;
    const y = row + m;
    if (logo.shape === "circle") {
      const dx = x + 0.5 - center;
      const dy = y + 0.5 - center;
      return Math.hypot(dx, dy) < plate / 2 + 0.35;
    }
    const half = plate / 2;
    return (
      x + 1 > center - half &&
      x < center + half &&
      y + 1 > center - half &&
      y < center + half
    );
  };
  // Alignment patterns are drawn whole, in the shape of the corner markers:
  // readers find them more easily than a group of separate dots. Those under
  // the logo are left to the error correction.
  const alignments = alignmentCenters(count).filter(([row, col]) => {
    for (let r = row - 2; r <= row + 2; r++)
      for (let c = col - 2; c <= col + 2; c++) if (hidden(r, c)) return false;
    return true;
  });
  const inAlignment = (row: number, col: number) =>
    alignments.some(
      ([r, c]) => Math.abs(row - r) <= 2 && Math.abs(col - c) <= 2,
    );
  const on = (row: number, col: number) =>
    row >= 0 &&
    col >= 0 &&
    row < count &&
    col < count &&
    dark[row][col] &&
    !isFinder(row, col, count) &&
    !inAlignment(row, col) &&
    !hidden(row, col);

  // Data modules, as one path so that touching modules never show seams.
  let data = "";
  const r = 0.5;
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (!on(row, col)) continue;
      const x = col + m;
      const y = row + m;
      if (style.modules === "dots") {
        data += circle(x + 0.5, y + 0.5, 0.46);
        continue;
      }
      if (style.modules === "square") {
        // Horizontal runs keep the path short.
        let end = col;
        while (end + 1 < count && on(row, end + 1)) end++;
        data += `M${x} ${y}h${end - col + 1}v1h${-(end - col + 1)}z`;
        col = end;
        continue;
      }
      const top = on(row - 1, col);
      const bottom = on(row + 1, col);
      const left = on(row, col - 1);
      const right = on(row, col + 1);
      const leaf = style.modules === "leaf";
      data += module(x, y, [
        !top && !left ? r : 0,
        !leaf && !top && !right ? r : 0,
        !bottom && !right ? r : 0,
        !leaf && !bottom && !left ? r : 0,
      ]);
    }
  }

  // Finder patterns.
  let frames = "";
  let centers = "";
  for (const [row, col] of [
    [0, 0],
    [0, count - 7],
    [count - 7, 0],
  ]) {
    const x = col + m;
    const y = row + m;
    if (style.eyeFrame === "circle") {
      frames += circle(x + 3.5, y + 3.5, 3.5) + circle(x + 3.5, y + 3.5, 2.5);
    } else {
      const radius = style.eyeFrame === "rounded" ? [2, 1.3] : [0, 0];
      frames +=
        roundedRect(x, y, 7, 7, radius[0]) +
        roundedRect(x + 1, y + 1, 5, 5, radius[1]);
    }
    if (style.eyeCenter === "circle") centers += circle(x + 3.5, y + 3.5, 1.5);
    else
      centers += roundedRect(
        x + 2,
        y + 2,
        3,
        3,
        style.eyeCenter === "rounded" ? 0.9 : 0,
      );
  }

  let rings = "";
  for (const [row, col] of alignments) {
    const x = col + m - 2;
    const y = row + m - 2;
    if (style.eyeFrame === "circle") {
      rings += circle(x + 2.5, y + 2.5, 2.5) + circle(x + 2.5, y + 2.5, 1.5);
    } else {
      const radius = style.eyeFrame === "rounded" ? [1.4, 0.8] : [0, 0];
      rings +=
        roundedRect(x, y, 5, 5, radius[0]) +
        roundedRect(x + 1, y + 1, 3, 3, radius[1]);
    }
    if (style.eyeCenter === "circle") rings += circle(x + 2.5, y + 2.5, 0.5);
    else
      rings += roundedRect(
        x + 2,
        y + 2,
        1,
        1,
        style.eyeCenter === "rounded" ? 0.3 : 0,
      );
  }

  const eye = style.customEyes ? style.eyeColor : style.foreground;
  const parts: string[] = [];
  const size = pixels ? ` width="${pixels}" height="${pixels}"` : "";
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}"${size}${
      title ? ` role="img"` : ""
    }>`,
  );
  if (title) parts.push(`<title>${escapeAttr(title)}</title>`);
  if (!style.transparent) {
    const radius = style.roundedCorners ? Math.min(total * 0.1, m * 0.9) : 0;
    parts.push(
      `<rect width="${total}" height="${total}"${
        radius ? ` rx="${fmt(radius)}"` : ""
      } fill="${style.background}"/>`,
    );
  }
  parts.push(
    `<path d="${data}" fill="${style.foreground}"${
      style.modules === "square" ? ` shape-rendering="crispEdges"` : ""
    }/>`,
  );
  if (rings)
    parts.push(
      `<path d="${rings}" fill="${style.foreground}" fill-rule="evenodd"/>`,
    );
  parts.push(`<path d="${frames}" fill="${eye}" fill-rule="evenodd"/>`);
  parts.push(`<path d="${centers}" fill="${eye}"/>`);

  if (showLogo) {
    let box = plate;
    if (clearArea) {
      // Room between the modules and the logo.
      box = logo.shape === "circle" ? plate / Math.SQRT2 - 0.3 : plate - 1.2;
    }
    const x = center - box / 2;
    if (logo.kind === "image" && logo.image) {
      parts.push(
        `<image href="${escapeAttr(logo.image)}" x="${fmt(x)}" y="${fmt(x)}" width="${fmt(
          box,
        )}" height="${fmt(box)}" preserveAspectRatio="xMidYMid meet"/>`,
      );
    } else if (logo.kind === "icon" && icon) {
      const [width, height, , , path] = icon.icon;
      const scale = box / Math.max(width, height);
      const dx = center - (width * scale) / 2;
      const dy = center - (height * scale) / 2;
      const d = Array.isArray(path) ? path.join(" ") : path;
      parts.push(
        `<path transform="translate(${fmt(dx)} ${fmt(dy)}) scale(${scale.toFixed(
          5,
        )})" d="${d}" fill="${logo.iconColor}"/>`,
      );
    }
  }
  parts.push("</svg>");
  return parts.join("");
}

/* ---------- Pictures ---------- */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unreadable picture"));
    image.src = src;
  });
}

const svgUrl = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

/** Draws the SVG on a canvas of the given size, on white when asked. */
export async function rasterize(
  svg: string,
  size: number,
  white = false,
): Promise<HTMLCanvasElement> {
  const image = await loadImage(svgUrl(svg));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  if (white) {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
  }
  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0, size, size);
  return canvas;
}

export const toPng = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG failed"))),
      "image/png",
    ),
  );

/** A PNG size close to the asked one where every module is whole pixels. */
export function crispSize(asked: number, total: number): number {
  return Math.max(total, Math.round(asked / total) * total);
}

const MAX_LOGO = 512;

/** Reads a logo file into a PNG data URL of at most 512 px, transparency kept. */
export async function readLogo(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const width = image.naturalWidth || MAX_LOGO;
    const height = image.naturalHeight || MAX_LOGO;
    const scale = Math.min(1, MAX_LOGO / Math.max(width, height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Decodes the picture with jsQR, as a phone would, to check it still reads. */
export async function readBack(svg: string, total: number): Promise<string> {
  const { default: jsQR } = await import("jsqr");
  const canvas = await rasterize(svg, crispSize(600, total), true);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  const { data, width, height } = context.getImageData(
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const result = jsQR(data, width, height, {
    inversionAttempts: "attemptBoth",
  });
  if (!result) return "";
  // jsQR reads bytes as Latin-1 when it cannot tell: decode them as UTF-8.
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      new Uint8Array(result.binaryData),
    );
  } catch {
    return result.data;
  }
}
