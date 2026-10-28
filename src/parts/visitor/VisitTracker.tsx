import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { API_URL } from "../../Utils";
import {
  getVisitId,
  getVisitorContext,
  isVisitStatsDisabled,
  recordAction,
  recordPage,
} from "./visitorContext";

const MIN_ACTIVE_MS = 1000;

let lastSentActiveMs = -1;

// Sends the visit to the back-end, which emails it once the visitor is gone.
function sendVisit() {
  if (isVisitStatsDisabled() || navigator.webdriver) return;
  const context = getVisitorContext();
  if (context.activeMs < MIN_ACTIVE_MS) return;
  if (context.activeMs === lastSentActiveMs) return;
  lastSentActiveMs = context.activeMs;

  // text/plain avoids a CORS preflight, which beacons cannot do.
  const body = JSON.stringify({ id: getVisitId(), context });
  const url = `${API_URL}/visit`;
  try {
    if (navigator.sendBeacon?.(url, new Blob([body], { type: "text/plain" })))
      return;
  } catch {
    // Falls back to fetch below.
  }
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body,
    keepalive: true,
    credentials: "omit",
  }).catch(() => {});
}

function trackDocument(event: MouseEvent) {
  const link = (event.target as Element | null)?.closest?.("a");
  const href = link?.getAttribute("href");
  if (!href || !/\.pdf($|[?#])/i.test(href)) return;
  const file = href.split(/[?#]/)[0].split("/").pop();
  if (file) recordAction("document", decodeURIComponent(file));
}

export default function VisitTracker() {
  const { pathname } = useLocation();
  useEffect(() => recordPage(pathname), [pathname]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") sendVisit();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", sendVisit);
    document.addEventListener("click", trackDocument, true);
    document.addEventListener("auxclick", trackDocument, true);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", sendVisit);
      document.removeEventListener("click", trackDocument, true);
      document.removeEventListener("auxclick", trackDocument, true);
    };
  }, []);

  return null;
}
