// The previous design stays reachable: every route also exists with this
// suffix (/cursus-old, /portfolio-old...). The home page is /old.
export const LEGACY_SUFFIX = "-old";
export const LEGACY_HOME = "/old";

/** "/cursus#experiences" -> "/cursus-old#experiences". */
export function legacyPath(path: string): string {
  const [pathname, hash] = path.split("#");
  const clean = pathname.replace(/\/+$/, "");
  const target = clean === "" ? LEGACY_HOME : `${clean}${LEGACY_SUFFIX}`;
  return hash ? `${target}#${hash}` : target;
}

export function isLegacyPath(pathname: string): boolean {
  const clean = pathname.replace(/\/+$/, "");
  return clean === LEGACY_HOME || clean.endsWith(LEGACY_SUFFIX);
}

/** "/cursus-old" -> "/cursus". */
export function currentPath(pathname: string): string {
  const clean = pathname.replace(/\/+$/, "");
  if (clean === LEGACY_HOME) return "/";
  return clean.endsWith(LEGACY_SUFFIX)
    ? clean.slice(0, -LEGACY_SUFFIX.length)
    : clean || "/";
}

// Pages of the current design that have no previous version to link to.
const WITHOUT_LEGACY = [
  "/cv-generator",
  "/generateur-cv",
  "/cv",
  "/qr-code-generator",
  "/generateur-qr-code",
  "/qr-code",
  "/qr",
  "/background-remover",
  "/retirer-le-fond",
  "/detourage",
  "/miku",
];

export function hasLegacyVersion(pathname: string): boolean {
  return !WITHOUT_LEGACY.includes(pathname.replace(/\/+$/, ""));
}
