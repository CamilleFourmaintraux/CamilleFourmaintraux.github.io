import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  faMagnifyingGlass,
  faPause,
  faPlay,
  faRotateLeft,
  faTableTennisPaddleBall,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { API_URL } from "@/lib/utils";
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
import { OnlineMatch, type OnlineStatus } from "./pong/online";

const STORAGE_KEY = "pong";
const SIDES: Side[] = ["left", "right"];
// What each paddle can be: a player here, a player online, or a bot.
type Choice = Level | "online";
const CHOICES: Choice[] = [
  "human",
  "online",
  "noob",
  "good",
  "pro",
  "invincible",
];
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
// An online player who hides the page for this long leaves the game.
const HIDDEN_LIMIT_MS = 20_000;
// Statuses after which a new search can start.
const ENDED: OnlineStatus[] = [
  "busy",
  "opponent-left",
  "idle",
  "lost",
  "unreachable",
];

type Score = Record<Side, number>;
type Choices = Record<Side, Choice>;
type State = "ready" | "playing" | "paused";

const other = (side: Side): Side => (side === "left" ? "right" : "left");
const onlineSideOf = (choices: Choices): Side | null =>
  choices.left === "online"
    ? "left"
    : choices.right === "online"
      ? "right"
      : null;
const hasHuman = (choices: Choices) =>
  choices.left === "human" || choices.right === "human";

function load(): { score: Score; choices: Choices } {
  const fallback = {
    score: { left: 0, right: 0 },
    choices: { left: "human", right: "good" } as Choices,
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    const number = (value: unknown) =>
      Number.isFinite(value) ? Math.max(0, Math.floor(value as number)) : 0;
    // An online game never comes back by itself after a reload.
    const level = (value: unknown, otherwise: Level) =>
      LEVELS.includes(value as Level) ? (value as Level) : otherwise;
    return {
      score: {
        left: number(saved?.score?.left),
        right: number(saved?.score?.right),
      },
      choices: {
        left: level(saved?.levels?.left, "human"),
        right: level(saved?.levels?.right, "good"),
      },
    };
  } catch {
    return fallback;
  }
}

function save(score: Score, choices: Choices) {
  if (onlineSideOf(choices)) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ score, levels: choices }),
    );
  } catch {
    // Storage blocked: the score simply starts again next time.
  }
}

const isFormField = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName));

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

/** What the field shows, in display sides. */
type View = {
  ball: { x: number; y: number };
  paddles: Record<Side, number>;
  score: Score;
};

export default function Pong() {
  const { t } = useTranslation();
  const [initial] = useState(load);
  const [choices, setChoices] = useState<Choices>(initial.choices);
  const [score, setScore] = useState<Score>(initial.score);
  const [state, setState] = useState<State>(() =>
    !hasHuman(initial.choices) && !prefersReducedMotion() ? "playing" : "ready",
  );
  const [announce, setAnnounce] = useState("");
  const [online, setOnline] = useState<OnlineStatus | null>(null);
  const [onlineScore, setOnlineScore] = useState({ me: 0, them: 0 });
  // Bumped to search for a new opponent.
  const [search, setSearch] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game>(newGame(initial.score));
  const matchRef = useRef<OnlineMatch | null>(null);
  const choicesRef = useRef(choices);
  const stateRef = useRef(state);
  const onlineRef = useRef(online);
  // Texts drawn on the field, kept up to date for the drawing loop.
  const textsRef = useRef({ start: "", paused: "", online: "" });

  const onlineSide = onlineSideOf(choices);
  // The local player sits opposite the online opponent.
  const me = onlineSide ? other(onlineSide) : null;

  useEffect(() => {
    choicesRef.current = choices;
    stateRef.current = state;
    onlineRef.current = online;
    textsRef.current = {
      start: t("pong.start"),
      paused: t("pong.paused"),
      online:
        online && online !== "playing" ? t(`pong.online.short.${online}`) : "",
    };
  }, [choices, state, online, t]);

  const changeLevel = (side: Side, choice: Choice) => {
    let next: Choices = { ...choices, [side]: choice };
    if (choice === "online")
      next = { [side]: "online", [other(side)]: "human" } as Choices;
    // Online play needs the player here: anything else leaves it.
    else if (choices[other(side)] === "online" && choice !== "human")
      next = { [side]: choice, [other(side)]: "good" } as Choices;
    setChoices(next);
    save(gameRef.current.score, next);
    if (
      !onlineSideOf(next) &&
      !hasHuman(next) &&
      state === "ready" &&
      !prefersReducedMotion()
    )
      setState("playing");
  };

  const leaveOnline = () => {
    if (onlineSide) changeLevel(onlineSide, "good");
  };

  const resetScore = () => {
    const zero = { left: 0, right: 0 };
    gameRef.current = newGame(zero);
    setScore(zero);
    save(zero, choices);
    setAnnounce(t("pong.resetDone"));
    if (hasHuman(choices)) setState("ready");
  };

  const toggle = () =>
    setState((current) => (current === "playing" ? "paused" : "playing"));

  // Online: a search starts when a side becomes "online player", and stops
  // when it changes back or the page closes.
  useEffect(() => {
    if (!onlineSide) return;
    setOnlineScore({ me: 0, them: 0 });
    const match = new OnlineMatch(API_URL, setOnline, (side, points) => {
      const mine = side === match.side;
      const own = match.side ? points[match.side] : 0;
      const rival = match.side ? points[other(match.side)] : 0;
      setOnlineScore({ me: own, them: rival });
      setAnnounce(
        t(mine ? "pong.online.pointMe" : "pong.online.pointThem", {
          me: own,
          them: rival,
        }),
      );
    });
    matchRef.current = match;
    match.start();
    return () => {
      match.stop();
      matchRef.current = null;
      setOnline(null);
    };
  }, [onlineSide, search, t]);

  // Hiding the page for long during an online game leaves it.
  useEffect(() => {
    if (!onlineSide) return;
    let timer = 0;
    const onVisibility = () => {
      window.clearTimeout(timer);
      if (document.hidden)
        timer = window.setTimeout(() => {
          matchRef.current?.stop();
          setOnline("lost");
        }, HIDDEN_LIMIT_MS);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [onlineSide]);

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
    // Online: the local paddle moves at once, the other one is smoothed.
    const center = (FIELD.height - PADDLE.height) / 2;
    let mine = center;
    let theirs = center;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * ratio);
      canvas.height = Math.round(canvas.clientHeight * ratio);
    };
    resize();
    const resizer = new ResizeObserver(resize);
    resizer.observe(canvas);

    const isOnline = () => onlineSideOf(choicesRef.current) !== null;
    const start = () => {
      if (!isOnline() && stateRef.current !== "playing") setState("playing");
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

    /** The local paddle online, with every key and finger. */
    const moveMine = (dt: number) => {
      const { left, right } = controls();
      const target = left.target ?? right.target;
      if (target !== null) {
        const gap = target - (mine + PADDLE.height / 2);
        mine +=
          Math.sign(gap) * Math.min(Math.abs(gap), PADDLE.speed * 2.5 * dt);
      } else {
        mine += Math.sign(left.move + right.move) * PADDLE.speed * dt;
      }
      mine = Math.max(0, Math.min(FIELD.height - PADDLE.height, mine));
    };

    const onlineView = (dt: number, now: number): View | null => {
      const match = matchRef.current;
      const mySide = onlineSideOf(choicesRef.current);
      if (!match || !mySide) return null;
      const display = other(mySide);
      moveMine(dt);
      if (onlineRef.current === "playing") match.sendPaddle(mine);
      const snapshot = match.snapshot;
      const ball = {
        x: (FIELD.width - BALL.size) / 2,
        y: (FIELD.height - BALL.size) / 2,
      };
      const score = { left: 0, right: 0 };
      if (snapshot && match.side && onlineRef.current === "playing") {
        // The ball keeps moving between two messages from the server.
        const ahead = snapshot.serving
          ? 0
          : Math.min(0.1, (now - snapshot.at) / 1000);
        let x = snapshot.ball.x + snapshot.ball.vx * ahead;
        let y = snapshot.ball.y + snapshot.ball.vy * ahead;
        const low = FIELD.height - BALL.size;
        if (y < 0) y = -y;
        if (y > low) y = 2 * low - y;
        // Each player sees the field from their own side.
        const mirrored = match.side !== display;
        if (mirrored) x = FIELD.width - BALL.size - x;
        ball.x = Math.max(0, Math.min(FIELD.width - BALL.size, x));
        ball.y = y;
        const target = snapshot.paddles[other(match.side)];
        theirs += (target - theirs) * (1 - Math.exp(-dt * 25));
        score[display] = snapshot.score[match.side];
        score[other(display)] = snapshot.score[other(match.side)];
      }
      const paddles = { left: 0, right: 0 };
      paddles[display] = mine;
      paddles[other(display)] = theirs;
      return { ball, paddles, score };
    };

    const draw = (view: View, overlay: string) => {
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
      context.fillText(String(view.score.left), FIELD.width / 2 - 36, 24);
      context.textAlign = "left";
      context.fillText(String(view.score.right), FIELD.width / 2 + 36, 24);
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
          view.paddles[side],
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
          view.ball.x,
          view.ball.y,
          BALL.size,
          BALL.size,
        );

      if (overlay) {
        context.font = `600 24px "Atkinson Hyperlegible Next", system-ui, sans-serif`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        const width = context.measureText(overlay).width + 40;
        const y = FIELD.height / 2 + 70;
        context.fillStyle = colors.field;
        context.globalAlpha = 0.92;
        context.beginPath();
        context.roundRect(FIELD.width / 2 - width / 2, y - 24, width, 48, 8);
        context.fill();
        context.globalAlpha = 1;
        context.fillStyle = colors.ink;
        context.fillText(overlay, FIELD.width / 2, y);
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const view = onlineView(dt, now);
      if (view) {
        draw(view, textsRef.current.online);
      } else {
        const game = gameRef.current;
        if (stateRef.current === "playing" && visible && !document.hidden) {
          const levels = choicesRef.current as Record<Side, Level>;
          for (const event of step(game, dt, levels, controls())) {
            if (event.type !== "point") continue;
            const next = { ...game.score };
            setScore(next);
            save(next, choicesRef.current);
            // Bots against bots would fill a screen reader with points.
            if (hasHuman(choicesRef.current))
              setAnnounce(
                t(`pong.point.${event.side}`, {
                  left: next.left,
                  right: next.right,
                }),
              );
          }
        }
        const text =
          stateRef.current === "playing"
            ? ""
            : stateRef.current === "paused"
              ? textsRef.current.paused
              : textsRef.current.start;
        draw(
          {
            ball: game.ball,
            paddles: { left: game.paddles.left.y, right: game.paddles.right.y },
            score: game.score,
          },
          text,
        );
      }
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
      // Online, every game key moves the local paddle.
      if (!isOnline() && choicesRef.current[key.side] !== "human") return;
      // The arrows would scroll the page while someone plays.
      if (visible) event.preventDefault();
      pressed.add(event.code);
      start();
    };
    const onKeyUp = (event: KeyboardEvent) => pressed.delete(event.code);
    // A player who leaves the window cannot press keys: a local game waits.
    const onBlur = () => {
      pressed.clear();
      pointers.clear();
      if (
        !isOnline() &&
        hasHuman(choicesRef.current) &&
        stateRef.current === "playing"
      )
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
      if (!isOnline() && choicesRef.current[point.side] !== "human") {
        if (!hasHuman(choicesRef.current)) start();
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

  const hint = (side: Side) => {
    const choice = choices[side];
    if (choice === "online") return t("pong.hints.online");
    if (choice === "human")
      return t(me === side ? "pong.keys.online" : `pong.keys.${side}`);
    return t(`pong.hints.${choice}`);
  };

  const fieldLabel = onlineSide
    ? t("pong.online.field", onlineScore)
    : t("pong.field", { left: score.left, right: score.right });

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
          className={`pong-field${hasHuman(choices) ? " is-playable" : ""}`}
          role="img"
          aria-label={fieldLabel}
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
                value={choices[side]}
                aria-describedby={`pong-${side}-hint`}
                onChange={(event) =>
                  changeLevel(side, event.target.value as Choice)
                }
              >
                {CHOICES.map((choice) => (
                  <option key={choice} value={choice}>
                    {t(`pong.levels.${choice}`)}
                  </option>
                ))}
              </select>
              <p className="pong-hint" id={`pong-${side}-hint`}>
                {hint(side)}
              </p>
            </div>
          ))}
          <div className="pong-actions">
            {onlineSide ? (
              <>
                {online && ENDED.includes(online) && (
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={() => setSearch((value) => value + 1)}
                  >
                    <Icon icon={faMagnifyingGlass} /> {t("pong.online.again")}
                  </button>
                )}
                <button type="button" className="button" onClick={leaveOnline}>
                  <Icon icon={faXmark} />{" "}
                  {online === "playing"
                    ? t("pong.online.quit")
                    : t("pong.online.cancel")}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={toggle}
                >
                  <Icon icon={state === "playing" ? faPause : faPlay} />{" "}
                  {playLabel}
                </button>
                <button type="button" className="button" onClick={resetScore}>
                  <Icon icon={faRotateLeft} /> {t("pong.reset")}
                </button>
              </>
            )}
          </div>
        </div>
        {onlineSide && online && (
          <p className="pong-online" aria-live="polite">
            {online === "playing"
              ? t("pong.online.long.playing", {
                  side: t(`pong.online.sides.${me}`),
                })
              : t(`pong.online.long.${online}`)}
          </p>
        )}
        <p className="note pong-help">{t("pong.help")}</p>
      </div>
      <BackHome />
    </Page>
  );
}
