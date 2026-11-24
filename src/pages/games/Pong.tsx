import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  faPause,
  faPlay,
  faRotateLeft,
  faTableTennisPaddleBall,
} from "@fortawesome/free-solid-svg-icons";
import BackHome from "@/ui/BackHome";
import Icon from "@/ui/Icon";
import { prefersReducedMotion } from "@/ui/motion";
import Page from "@/ui/Page";
import {
  BALL,
  FIELD,
  LEVELS,
  PADDLE,
  newGame,
  step,
  type Control,
  type Game,
  type Level,
  type Side,
} from "./pong/engine";

const STORAGE_KEY = "pong";
const SIDES: Side[] = ["left", "right"];
// The ball is the site icon, in the colors of the current theme.
const BALL_PICTURES = {
  light: "/img/favicon-light.svg",
  dark: "/img/favicon-dark.svg",
};
// Keys by position on the keyboard: E and D sit in the same place on QWERTY
// and AZERTY layouts.
const KEYS: Record<string, { side: Side; move: number }> = {
  KeyE: { side: "left", move: -1 },
  KeyD: { side: "left", move: 1 },
  ArrowUp: { side: "right", move: -1 },
  ArrowDown: { side: "right", move: 1 },
};

type Score = Record<Side, number>;
type Levels = Record<Side, Level>;
type State = "ready" | "playing" | "paused";

function load(): { score: Score; levels: Levels } {
  const fallback = {
    score: { left: 0, right: 0 },
    levels: { left: "human", right: "good" } as Levels,
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    const number = (value: unknown) =>
      Number.isFinite(value) ? Math.max(0, Math.floor(value as number)) : 0;
    const level = (value: unknown, otherwise: Level) =>
      LEVELS.includes(value as Level) ? (value as Level) : otherwise;
    return {
      score: {
        left: number(saved?.score?.left),
        right: number(saved?.score?.right),
      },
      levels: {
        left: level(saved?.levels?.left, fallback.levels.left),
        right: level(saved?.levels?.right, fallback.levels.right),
      },
    };
  } catch {
    return fallback;
  }
}

function save(score: Score, levels: Levels) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ score, levels }));
  } catch {
    // Storage blocked: the score simply starts again next time.
  }
}

const isFormField = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName));

const hasHuman = (levels: Levels) =>
  levels.left === "human" || levels.right === "human";

type Palette = {
  field: string;
  line: string;
  ink: string;
  left: string;
  right: string;
};

function palette(): Palette {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => style.getPropertyValue(name).trim();
  return {
    field: read("--surface"),
    line: read("--line-strong"),
    ink: read("--ink"),
    left: read("--primary"),
    right: read("--accent"),
  };
}

export default function Pong() {
  const { t } = useTranslation();
  const [initial] = useState(load);
  const [levels, setLevels] = useState<Levels>(initial.levels);
  const [score, setScore] = useState<Score>(initial.score);
  const [state, setState] = useState<State>(() =>
    !hasHuman(initial.levels) && !prefersReducedMotion() ? "playing" : "ready",
  );
  const [announce, setAnnounce] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game>(newGame(initial.score));
  const levelsRef = useRef(levels);
  const stateRef = useRef(state);
  // Texts drawn on the field, kept up to date for the drawing loop.
  const textsRef = useRef({ start: "", paused: "" });

  useEffect(() => {
    levelsRef.current = levels;
    stateRef.current = state;
    textsRef.current = { start: t("pong.start"), paused: t("pong.paused") };
  }, [levels, state, t]);

  // Bots only: the game runs by itself, unless motion should be reduced.
  const changeLevel = (side: Side, level: Level) => {
    const next = { ...levels, [side]: level };
    setLevels(next);
    save(gameRef.current.score, next);
    if (!hasHuman(next) && state === "ready" && !prefersReducedMotion())
      setState("playing");
  };

  const resetScore = () => {
    const zero = { left: 0, right: 0 };
    gameRef.current = newGame(zero);
    setScore(zero);
    save(zero, levels);
    setAnnounce(t("pong.resetDone"));
    if (hasHuman(levels)) setState("ready");
  };

  const toggle = () =>
    setState((current) => (current === "playing" ? "paused" : "playing"));

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const pictures = {
      light: Object.assign(new Image(), { src: BALL_PICTURES.light }),
      dark: Object.assign(new Image(), { src: BALL_PICTURES.dark }),
    };
    let theme = document.documentElement.dataset.theme;
    let colors = palette();
    const pressed = new Set<string>();
    // Fingers or mouse on the field, by side: the center to reach.
    const pointers = new Map<number, { side: Side; y: number }>();
    let visible = true;
    let last = performance.now();
    let frame = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * ratio);
      canvas.height = Math.round(canvas.clientHeight * ratio);
    };
    resize();
    const resizer = new ResizeObserver(resize);
    resizer.observe(canvas);

    const start = () => {
      if (stateRef.current !== "playing") setState("playing");
    };

    const controls = (): Record<Side, Control> => {
      const result = {
        left: { move: 0, target: null } as Control,
        right: { move: 0, target: null } as Control,
      };
      for (const code of pressed) {
        const key = KEYS[code];
        if (key) result[key.side].move += key.move;
      }
      for (const pointer of pointers.values())
        result[pointer.side].target = pointer.y;
      return result;
    };

    const draw = () => {
      const game = gameRef.current;
      const current = document.documentElement.dataset.theme;
      if (current !== theme) {
        theme = current;
        colors = palette();
      }
      const scale = canvas.width / FIELD.width;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.fillStyle = colors.field;
      context.fillRect(0, 0, FIELD.width, FIELD.height);

      // Net in the middle.
      context.strokeStyle = colors.line;
      context.lineWidth = 4;
      context.setLineDash([14, 14]);
      context.beginPath();
      context.moveTo(FIELD.width / 2, 8);
      context.lineTo(FIELD.width / 2, FIELD.height - 8);
      context.stroke();
      context.setLineDash([]);

      // Scores, large and faded behind the play.
      context.fillStyle = colors.ink;
      context.globalAlpha = 0.3;
      context.font = `700 72px "Bricolage Grotesque", system-ui, sans-serif`;
      context.textBaseline = "top";
      context.textAlign = "right";
      context.fillText(String(game.score.left), FIELD.width / 2 - 36, 24);
      context.textAlign = "left";
      context.fillText(String(game.score.right), FIELD.width / 2 + 36, 24);
      context.globalAlpha = 1;

      for (const side of SIDES) {
        context.fillStyle = side === "left" ? colors.left : colors.right;
        const x =
          side === "left"
            ? PADDLE.margin
            : FIELD.width - PADDLE.margin - PADDLE.width;
        context.beginPath();
        context.roundRect(
          x,
          game.paddles[side].y,
          PADDLE.width,
          PADDLE.height,
          4,
        );
        context.fill();
      }

      const picture = theme === "dark" ? pictures.dark : pictures.light;
      if (picture.complete && picture.naturalWidth > 0)
        context.drawImage(
          picture,
          game.ball.x,
          game.ball.y,
          BALL.size,
          BALL.size,
        );

      if (stateRef.current !== "playing") {
        const text =
          stateRef.current === "paused"
            ? textsRef.current.paused
            : textsRef.current.start;
        context.font = `600 24px "Atkinson Hyperlegible Next", system-ui, sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        const width = context.measureText(text).width + 40;
        const y = FIELD.height / 2 + 70;
        context.fillStyle = colors.field;
        context.globalAlpha = 0.92;
        context.beginPath();
        context.roundRect(FIELD.width / 2 - width / 2, y - 24, width, 48, 8);
        context.fill();
        context.globalAlpha = 1;
        context.fillStyle = colors.ink;
        context.fillText(text, FIELD.width / 2, y);
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (stateRef.current === "playing" && visible && !document.hidden) {
        const game = gameRef.current;
        const events = step(game, dt, levelsRef.current, controls());
        for (const event of events) {
          if (event.type !== "point") continue;
          const next = { ...game.score };
          setScore(next);
          save(next, levelsRef.current);
          // Bots against bots would fill a screen reader with points.
          if (hasHuman(levelsRef.current))
            setAnnounce(
              t(`pong.point.${event.side}`, {
                left: next.left,
                right: next.right,
              }),
            );
        }
      }
      draw();
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(canvas);

    const onKeyDown = (event: KeyboardEvent) => {
      const key = KEYS[event.code];
      if (!key || isFormField(event.target) || event.ctrlKey || event.metaKey)
        return;
      if (levelsRef.current[key.side] !== "human") return;
      // The arrows would scroll the page while the right player plays.
      if (visible) event.preventDefault();
      pressed.add(event.code);
      start();
    };
    const onKeyUp = (event: KeyboardEvent) => pressed.delete(event.code);
    // A player who leaves the window cannot press keys: the game waits.
    const onBlur = () => {
      pressed.clear();
      pointers.clear();
      if (hasHuman(levelsRef.current) && stateRef.current === "playing")
        setState("paused");
    };

    const fieldPoint = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * FIELD.width;
      const y = ((event.clientY - rect.top) / rect.height) * FIELD.height;
      return { side: (x < FIELD.width / 2 ? "left" : "right") as Side, y };
    };
    const onPointerDown = (event: PointerEvent) => {
      const point = fieldPoint(event);
      if (levelsRef.current[point.side] !== "human") {
        if (!hasHuman(levelsRef.current)) start();
        return;
      }
      canvas.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, point);
      start();
    };
    const onPointerMove = (event: PointerEvent) => {
      const pointer = pointers.get(event.pointerId);
      if (pointer) pointer.y = fieldPoint(event).y;
    };
    const onPointerUp = (event: PointerEvent) =>
      pointers.delete(event.pointerId);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    return () => {
      cancelAnimationFrame(frame);
      resizer.disconnect();
      observer.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, [t]);

  const playLabel =
    state === "playing"
      ? t("pong.pause")
      : state === "paused"
        ? t("pong.resume")
        : t("pong.play");

  return (
    <Page
      title={t("pong.title")}
      icon={faTableTennisPaddleBall}
      lead={<p>{t("pong.lead")}</p>}
    >
      <p className="sr-only" role="status">
        {announce}
      </p>
      <div className="pong">
        <canvas
          ref={canvasRef}
          className={`pong-field${hasHuman(levels) ? " is-playable" : ""}`}
          role="img"
          aria-label={t("pong.field", {
            left: score.left,
            right: score.right,
          })}
        />
        <div className="pong-controls">
          {SIDES.map((side) => (
            <div key={side} className={`field pong-side is-${side}`}>
              <label htmlFor={`pong-${side}`}>
                <span className="pong-swatch" aria-hidden="true" />
                {t(`pong.sides.${side}`)}
              </label>
              <select
                id={`pong-${side}`}
                value={levels[side]}
                aria-describedby={`pong-${side}-hint`}
                onChange={(event) =>
                  changeLevel(side, event.target.value as Level)
                }
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {t(`pong.levels.${level}`)}
                  </option>
                ))}
              </select>
              <p className="pong-hint" id={`pong-${side}-hint`}>
                {levels[side] === "human"
                  ? t(`pong.keys.${side}`)
                  : t(`pong.hints.${levels[side]}`)}
              </p>
            </div>
          ))}
          <div className="pong-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={toggle}
            >
              <Icon icon={state === "playing" ? faPause : faPlay} /> {playLabel}
            </button>
            <button type="button" className="button" onClick={resetScore}>
              <Icon icon={faRotateLeft} /> {t("pong.reset")}
            </button>
          </div>
        </div>
        <p className="note pong-help">{t("pong.help")}</p>
      </div>
      <BackHome />
    </Page>
  );
}
