import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import manifest from "@/data/media.json";
import Icon from "@/ui/Icon";
import { usePageTitle } from "@/ui/usePageTitle";
import {
  EMOTIONS,
  advance,
  clickPicture,
  createMood,
  drift,
  emotionOf,
  leave,
  point,
  type Emotion,
  type Zone,
} from "./emotion";
import Snow from "./Snow";
import "./miku.css";

type Variant = { width: number; src: string };
const media = manifest as Record<
  string,
  { width: number; height: number; variants?: Variant[] }
>;

const TICK_MS = 100;
// The pointer is "near" within this distance of the center of the
// picture, in widths of the picture.
const NEAR_RADIUS = 1.2;
// Smallest change of distance, in pixels, that counts as a direction.
const DRIFT_STEP = 6;
// Snow between two faces, as on an old television: short enough to keep
// the reaction lively. A little random, like a real signal.
const SNOW_MS = 260;
const SNOW_SPREAD = 120;

function zoneOf(x: number, y: number, rect: DOMRect): Zone {
  if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
    return "on";
  }
  return distanceTo(x, y, rect) < rect.width * NEAR_RADIUS ? "near" : "far";
}

function distanceTo(x: number, y: number, rect: DOMRect): number {
  return Math.hypot(
    x - (rect.left + rect.width / 2),
    y - (rect.top + rect.height / 2),
  );
}

/** Hidden page: a character on an old screen who reacts to the pointer. */
export default function Miku() {
  const { t } = useTranslation();
  const headingRef = usePageTitle(t("miku.title"));
  const screenRef = useRef<HTMLButtonElement>(null);
  // Face on the screen, and snow while it changes to the next one.
  const [emotion, setEmotion] = useState<Emotion>("empty");
  const [snowing, setSnowing] = useState(false);
  const faces = useRef(new Map<Emotion, HTMLImageElement>());
  const emptyScreen = useCallback(() => faces.current.get("empty") ?? null, []);

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

    const mood = createMood();
    // Without a mouse, nobody hovers: the visitor is simply there, at a distance.
    const hover = window.matchMedia("(hover: hover)").matches;
    if (!hover) point(mood, "far", performance.now());

    let rect = screen.getBoundingClientRect();
    let anchor: number | null = null;
    let byKeyboard = false;

    // A hidden picture is only decoded when it first shows, which would
    // flash black: every face is decoded now instead.
    let stopped = false;
    const decoded = (face: Emotion) =>
      faces.current
        .get(face)
        ?.decode()
        .catch(() => {}) ?? Promise.resolve();
    for (const face of EMOTIONS) decoded(face);

    // The face to reach. While the snow runs, the latest one wins.
    let target: Emotion = "empty";
    let snowTimer: number | undefined;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const show = (next: Emotion) => {
      if (next === target) return;
      target = next;
      if (calm.matches) {
        setEmotion(next);
        return;
      }
      if (snowTimer !== undefined) return;
      setSnowing(true);
      snowTimer = window.setTimeout(
        async () => {
          // The snow lasts until the new face is ready to show.
          let face: Emotion;
          do {
            face = target;
            await decoded(face);
          } while (face !== target);
          if (stopped) return;
          snowTimer = undefined;
          // Both in the same render: the face replaces the snow at once.
          setSnowing(false);
          setEmotion(face);
        },
        SNOW_MS + Math.random() * SNOW_SPREAD,
      );
    };

    const refresh = () => {
      const now = performance.now();
      advance(mood, now);
      show(emotionOf(mood, now));
    };
    const measure = () => {
      rect = screen.getBoundingClientRect();
    };

    const track = (x: number, y: number) => {
      point(mood, zoneOf(x, y, rect), performance.now());
      // Direction of the pointer, ignoring tiny hand tremors.
      const distance = distanceTo(x, y, rect);
      if (anchor === null) anchor = distance;
      if (Math.abs(distance - anchor) >= DRIFT_STEP) {
        drift(mood, distance - anchor);
        anchor = distance;
      }
    };

    const onMove = (event: PointerEvent) => {
      byKeyboard = false;
      track(event.clientX, event.clientY);
      refresh();
    };

    const onDown = (event: PointerEvent) => {
      track(event.clientX, event.clientY);
      if (
        event.button === 0 &&
        zoneOf(event.clientX, event.clientY, rect) === "on"
      ) {
        clickPicture(mood, performance.now());
      }
      refresh();
    };

    const onUp = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return;
      // A lifted finger leaves the visitor in the room, at a distance.
      anchor = null;
      point(mood, "far", performance.now());
      refresh();
    };

    const onLeave = () => {
      anchor = null;
      if (hover) leave(mood, performance.now());
      else point(mood, "far", performance.now());
      refresh();
    };
    const onMouseOut = (event: MouseEvent) => {
      if (!event.relatedTarget) onLeave();
    };

    // The keyboard stands in for the pointer: focus is a visit, Enter a click.
    const onFocus = () => {
      if (!screen.matches(":focus-visible")) return;
      byKeyboard = true;
      if (!mood.inside) point(mood, "far", performance.now());
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
      clickPicture(mood, performance.now());
      refresh();
    };

    const onVisibility = () => {
      if (document.hidden) onLeave();
    };

    const timer = window.setInterval(refresh, TICK_MS);

    const root = document.documentElement;
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("visibilitychange", onVisibility);
    screen.addEventListener("focus", onFocus);
    screen.addEventListener("blur", onBlur);
    screen.addEventListener("click", onClick);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.clearTimeout(snowTimer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
      root.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("mouseout", onMouseOut);
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
              ref={(element) => {
                if (element) faces.current.set(name, element);
                else faces.current.delete(name);
              }}
              className={name === emotion ? "is-shown" : undefined}
              src={variants[variants.length - 1]?.src}
              srcSet={variants.map((v) => `${v.src} ${v.width}w`).join(", ")}
              sizes="min(11rem, 23vw)"
              width={1446}
              height={1080}
              alt=""
              draggable={false}
              decoding="async"
            />
          );
        })}
        <Snow active={snowing} screen={emptyScreen} />
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
