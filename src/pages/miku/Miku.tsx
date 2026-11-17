import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import manifest from "@/data/media.json";
import Icon from "@/ui/Icon";
import { usePageTitle } from "@/ui/usePageTitle";
import {
  EMOTIONS,
  arrive,
  createMood,
  emotionOf,
  enterZone,
  fade,
  leave,
  move,
  poke,
  press,
  release,
  type Emotion,
  type Zone,
} from "./emotion";
import "./miku.css";

type Variant = { width: number; src: string };
const media = manifest as Record<
  string,
  { width: number; height: number; variants?: Variant[] }
>;

const TICK_MS = 100;
// Face of the character inside the picture, as fractions of its size.
const FACE = { x: 0.52, y: 0.55, radiusX: 0.26, radiusY: 0.44 };
const NEAR_MARGIN = 0.12;

function zoneOf(x: number, y: number, rect: DOMRect): Zone {
  const nx = (x - rect.left) / rect.width;
  const ny = (y - rect.top) / rect.height;
  const dx = (nx - FACE.x) / FACE.radiusX;
  const dy = (ny - FACE.y) / FACE.radiusY;
  if (dx * dx + dy * dy <= 1) return "face";
  const near =
    nx > -NEAR_MARGIN &&
    nx < 1 + NEAR_MARGIN &&
    ny > -NEAR_MARGIN &&
    ny < 1 + NEAR_MARGIN;
  return near ? "near" : "far";
}

/** Hidden page: a character on an old screen who reacts to the pointer. */
export default function Miku() {
  const { t } = useTranslation();
  const headingRef = usePageTitle(t("miku.title"));
  const screenRef = useRef<HTMLButtonElement>(null);
  const [emotion, setEmotion] = useState<Emotion>("empty");

  // The whole window turns black, scrollbar gutter and browser bar included.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const previousColor = themeColor?.getAttribute("content");
    root.dataset.page = "miku";
    themeColor?.setAttribute("content", "#000000");
    return () => {
      delete root.dataset.page;
      if (previousColor) themeColor?.setAttribute("content", previousColor);
    };
  }, []);

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;

    const mood = createMood(performance.now());
    let rect = screen.getBoundingClientRect();
    let last = { x: 0, y: 0, at: 0 };
    let speed = 0;
    let lastTick = performance.now();
    let byKeyboard = false;

    const refresh = () => setEmotion(emotionOf(mood, performance.now()));
    const measure = () => {
      rect = screen.getBoundingClientRect();
    };

    const onMove = (event: PointerEvent) => {
      const now = performance.now();
      byKeyboard = false;
      arrive(mood, now);
      enterZone(mood, zoneOf(event.clientX, event.clientY, rect), now);
      const elapsed = now - last.at;
      const distance =
        Math.hypot(event.clientX - last.x, event.clientY - last.y) / rect.width;
      // Smoothed, and ignored after a pause or a jump from outside.
      speed =
        elapsed > 0 && elapsed < 120
          ? speed * 0.7 + (distance / elapsed) * 300
          : 0;
      if (elapsed < 120) move(mood, distance, speed, now);
      else move(mood, 0, 0, now);
      last = { x: event.clientX, y: event.clientY, at: now };
      refresh();
    };

    const onDown = (event: PointerEvent) => {
      const now = performance.now();
      arrive(mood, now);
      enterZone(mood, zoneOf(event.clientX, event.clientY, rect), now);
      last = { x: event.clientX, y: event.clientY, at: now };
      speed = 0;
      press(mood, now);
      refresh();
    };

    const onUp = (event: PointerEvent) => {
      const now = performance.now();
      release(mood, now);
      // A finger that lifts is a visitor going away.
      if (event.pointerType !== "mouse") leave(mood, now);
      refresh();
    };

    const onLeave = () => {
      leave(mood, performance.now());
      refresh();
    };

    // The keyboard stands in for the pointer: focus is a visit, Enter a poke.
    const onFocus = () => {
      if (!screen.matches(":focus-visible")) return;
      const now = performance.now();
      byKeyboard = true;
      arrive(mood, now);
      enterZone(mood, "near", now);
      refresh();
    };
    const onBlur = () => {
      if (!byKeyboard) return;
      byKeyboard = false;
      onLeave();
    };
    const onClick = (event: MouseEvent) => {
      // Pointer clicks are already handled by the pointer events.
      if (event.detail !== 0) return;
      const now = performance.now();
      arrive(mood, now);
      poke(mood, now);
      refresh();
    };

    const onVisibility = () => {
      if (document.hidden) onLeave();
    };

    const timer = window.setInterval(() => {
      const now = performance.now();
      fade(mood, now - lastTick, now);
      lastTick = now;
      refresh();
    }, TICK_MS);

    const root = document.documentElement;
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onLeave, { passive: true });
    window.addEventListener("resize", measure);
    root.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    screen.addEventListener("focus", onFocus);
    screen.addEventListener("blur", onBlur);
    screen.addEventListener("click", onClick);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onLeave);
      window.removeEventListener("resize", measure);
      root.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      screen.removeEventListener("focus", onFocus);
      screen.removeEventListener("blur", onBlur);
      screen.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <main className="miku">
      <h1 className="sr-only" ref={headingRef} tabIndex={-1}>
        {t("miku.title")}
      </h1>

      <Link to="/" className="miku-back">
        <Icon icon={faArrowLeft} />
        {t("miku.back")}
      </Link>

      <button
        type="button"
        ref={screenRef}
        className="miku-screen"
        data-emotion={emotion}
        aria-label={t("miku.character")}
        aria-describedby="miku-help"
      >
        {/* Every face is loaded up front, so that reactions are instant. */}
        {EMOTIONS.map((name) => {
          const variants = media[`miku/${name}.png`]?.variants ?? [];
          return (
            <img
              key={name}
              className={name === emotion ? "is-shown" : undefined}
              src={variants[variants.length - 1]?.src}
              srcSet={variants.map((v) => `${v.src} ${v.width}w`).join(", ")}
              sizes="(min-width: 48rem) 46rem, 92vw"
              width={1446}
              height={1080}
              alt=""
              draggable={false}
              decoding="async"
            />
          );
        })}
      </button>

      <p id="miku-help" className="sr-only">
        {t("miku.help")}
      </p>
      <p className="sr-only" role="status">
        {t(`miku.emotions.${emotion}`)}
      </p>
    </main>
  );
}
