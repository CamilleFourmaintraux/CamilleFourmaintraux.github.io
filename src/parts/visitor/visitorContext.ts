export type VisitActions = {
  chat: number;
  contact: boolean;
  recontact: boolean;
  documents: string[];
};

export type VisitorContext = {
  src: string | null;
  referrer: string | null;
  pages: string[];
  language: string;
  timeZone: string | null;
  device: "mobile" | "tablet" | "desktop";
  os: string | null;
  browser: string | null;
  landedAt: string;
  activeMs: number;
  totalMs: number;
  actions: VisitActions;
};

type StoredVisit = Pick<
  VisitorContext,
  "src" | "referrer" | "pages" | "landedAt" | "activeMs" | "actions"
> & { id: string };

const STORAGE_KEY = "visitor-context-v2";
const OPT_OUT_KEY = "visit-stats-opt-out";
const MAX_PAGES = 30;
const MAX_DOCUMENTS = 10;

let visit: StoredVisit | null = null;
// Start of the current visible period, used to measure active time.
let visibleSince: number | null = null;

function readSrc(): string | null {
  // ?src= may be before the hash (/?src=cv#/home) or inside it (#/home?src=cv).
  const hashQuery = window.location.hash.split("?")[1] ?? "";
  const value =
    new URLSearchParams(window.location.search).get("src") ??
    new URLSearchParams(hashQuery).get("src");
  const clean = value?.trim().slice(0, 60);
  return clean ? clean : null;
}

function readReferrer(): string | null {
  try {
    if (!document.referrer) return null;
    const url = new URL(document.referrer);
    if (url.host === window.location.host) return null;
    return url.protocol.startsWith("http")
      ? url.hostname.replace(/^www\./, "")
      : url.href.slice(0, 80);
  } catch {
    return null;
  }
}

function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

const emptyActions = (): VisitActions => ({
  chat: 0,
  contact: false,
  recontact: false,
  documents: [],
});

function save() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(visit));
  } catch {
    // Storage may be unavailable (private mode): the context stays in memory.
  }
}

function load(): StoredVisit {
  if (visit) return visit;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as StoredVisit;
      if (
        typeof data.id === "string" &&
        Array.isArray(data.pages) &&
        typeof data.landedAt === "string"
      ) {
        visit = {
          ...data,
          activeMs: Number(data.activeMs) || 0,
          actions: { ...emptyActions(), ...data.actions },
        };
      }
    }
  } catch {
    visit = null;
  }
  if (!visit) {
    visit = {
      id: randomId(),
      src: readSrc(),
      referrer: readReferrer(),
      pages: [],
      landedAt: new Date().toISOString(),
      activeMs: 0,
      actions: emptyActions(),
    };
  } else if (!visit.src) {
    // A tagged link opened later in the same tab still counts.
    visit.src = readSrc();
  }
  save();
  return visit;
}

function pauseTimer() {
  const current = load();
  if (visibleSince !== null) {
    current.activeMs += Date.now() - visibleSince;
    visibleSince = null;
    save();
  }
}

function resumeTimer() {
  if (visibleSince === null) visibleSince = Date.now();
}

export function recordPage(path: string) {
  const current = load();
  if (current.pages[current.pages.length - 1] === path) return;
  current.pages = [...current.pages, path].slice(-MAX_PAGES);
  save();
}

export function recordAction(
  action: "chat" | "contact" | "recontact" | "document",
  detail?: string,
) {
  const { actions } = load();
  if (action === "chat") actions.chat += 1;
  else if (action === "document") {
    const name = detail?.slice(0, 60);
    if (name && !actions.documents.includes(name)) {
      actions.documents = [...actions.documents, name].slice(-MAX_DOCUMENTS);
    }
  } else actions[action] = true;
  save();
}

export function getVisitId(): string {
  return load().id;
}

export function isVisitStatsDisabled(): boolean {
  const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean })
    .globalPrivacyControl;
  if (gpc) return true;
  try {
    return localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setVisitStatsDisabled(disabled: boolean) {
  try {
    if (disabled) localStorage.setItem(OPT_OUT_KEY, "1");
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {
    // Without storage the choice cannot be kept.
  }
}

function detectDevice(ua: string): VisitorContext["device"] {
  const hints = (
    navigator as Navigator & { userAgentData?: { mobile?: boolean } }
  ).userAgentData;
  if (hints?.mobile) return "mobile";
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)))
    return "tablet";
  if (/Mobi|iPhone|iPod/i.test(ua)) return "mobile";
  // iPadOS reports itself as macOS: detect touch support.
  if (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return "tablet";
  return "desktop";
}

function detectOs(ua: string): string | null {
  if (/Windows/i.test(ua)) return "Windows";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Macintosh/i.test(ua))
    return navigator.maxTouchPoints > 1 ? "iPadOS" : "macOS";
  if (/Android/i.test(ua)) return "Android";
  if (/CrOS/i.test(ua)) return "ChromeOS";
  if (/Linux/i.test(ua)) return "Linux";
  return null;
}

function detectBrowser(ua: string): string | null {
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/SamsungBrowser/.test(ua)) return "Samsung Internet";
  if (/Firefox|FxiOS/.test(ua)) return "Firefox";
  if (/Chrome|CriOS/.test(ua)) return "Chrome";
  if (/Safari/.test(ua)) return "Safari";
  return null;
}

export function getVisitorContext(): VisitorContext {
  const current = load();
  const ua = navigator.userAgent;
  let timeZone: string | null = null;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    timeZone = null;
  }
  const now = Date.now();
  return {
    src: current.src,
    referrer: current.referrer,
    pages: [...current.pages],
    landedAt: current.landedAt,
    actions: { ...current.actions, documents: [...current.actions.documents] },
    activeMs:
      current.activeMs + (visibleSince !== null ? now - visibleSince : 0),
    totalMs: Math.max(0, now - Date.parse(current.landedAt)),
    language: navigator.language,
    timeZone,
    device: detectDevice(ua),
    os: detectOs(ua),
    browser: detectBrowser(ua),
  };
}

// Captures the landing information as soon as the module is loaded.
load();
if (document.visibilityState === "visible") resumeTimer();
document.addEventListener("visibilitychange", () =>
  document.visibilityState === "visible" ? resumeTimer() : pauseTimer(),
);
window.addEventListener("pagehide", pauseTimer);
window.addEventListener("pageshow", () => {
  if (document.visibilityState === "visible") resumeTimer();
});
