// Generates the lightweight media used by the current design.
//
//   npm run media
//
// Reads the original pictures of public/img (still used by the *-old pages),
// writes resized WebP files and MP4 clips to public/media, and records their
// dimensions in src/data/media.json so that pages can reserve the right space.
// GIF conversion needs ffmpeg on the PATH.
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(root, "public/img");
const outputDir = join(root, "public/media");
const manifestFile = join(root, "src/data/media.json");

const FOLDERS = ["cursus", "portfolio", "passions", "miku"];
const EXTRA_FILES = [
  "header/me_green.jpg",
  "header/me_red.jpg",
  "header/but_nobody_came.jpg",
];
// Sources that no page of the current design displays.
const IGNORED = new Set([
  "passions/DVD_logo.png",
  "portfolio/codeSwipe.png",
  "portfolio/codeSwipeSignUp.png",
]);
const WIDTHS = [480, 960, 1440];
const PORTRAIT_WIDTHS = [240, 480];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const sources = [
  ...FOLDERS.flatMap((folder) => walk(join(sourceDir, folder))),
  ...EXTRA_FILES.map((file) => join(sourceDir, file)),
]
  .map((path) => relative(sourceDir, path).replaceAll("\\", "/"))
  .filter((key) => !IGNORED.has(key))
  .sort();

rmSync(outputDir, { recursive: true, force: true });
const manifest = {};
let before = 0;
let after = 0;

for (const key of sources) {
  const input = join(sourceDir, key);
  const base = key.slice(0, -extname(key).length);
  const output = (suffix) => {
    const file = join(outputDir, `${base}${suffix}`);
    mkdirSync(dirname(file), { recursive: true });
    return file;
  };
  const publicPath = (suffix) => `/media/${base}${suffix}`;
  before += statSync(input).size;

  if (extname(key) === ".gif") {
    const { width, height } = await sharp(input).metadata();
    const even = (n) => n - (n % 2);
    execFileSync("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-i",
      input,
      "-movflags",
      "+faststart",
      "-an",
      "-vf",
      `scale=${even(width)}:${even(height)}:flags=lanczos`,
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "26",
      "-preset",
      "veryslow",
      output(".mp4"),
    ]);
    await sharp(input, { pages: 1 })
      .webp({ quality: 80 })
      .toFile(output("-poster.webp"));
    after +=
      statSync(output(".mp4")).size + statSync(output("-poster.webp")).size;
    manifest[key] = {
      width: even(width),
      height: even(height),
      video: publicPath(".mp4"),
      poster: publicPath("-poster.webp"),
    };
    continue;
  }

  // rotate() applies the EXIF orientation of phone pictures.
  const image = sharp(input).rotate();
  const { width, height } = await image
    .toBuffer({ resolveWithObject: true })
    .then((r) => r.info);
  const targets = key.startsWith("header/") ? PORTRAIT_WIDTHS : WIDTHS;
  const widths = targets.filter((w) => w < width);
  if (widths.length < targets.length)
    widths.push(Math.min(width, targets.at(-1)));
  const unique = [...new Set(widths)];
  const variants = [];
  for (const w of unique) {
    const suffix = `-${w}.webp`;
    await image
      .clone()
      .resize({ width: w })
      .webp({ quality: 80, effort: 6 })
      .toFile(output(suffix));
    after += statSync(output(suffix)).size;
    variants.push({ width: w, src: publicPath(suffix) });
  }
  const largest = unique.at(-1);
  manifest[key] = {
    width: largest,
    height: Math.round((height * largest) / width),
    variants,
  };
}

mkdirSync(dirname(manifestFile), { recursive: true });
writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
console.log(`${sources.length} files: ${mb(before)} -> ${mb(after)}`);
