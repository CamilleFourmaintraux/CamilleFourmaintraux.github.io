// Pong rules, without any drawing: the page renders the state, and tests can
// run thousands of rallies in a few milliseconds.

export type Side = "left" | "right";
export type Level = "human" | "noob" | "good" | "pro" | "invincible";
export const LEVELS: Level[] = ["human", "noob", "good", "pro", "invincible"];

/** Field and pieces, in field units. Speeds are in units per second. */
export const FIELD = { width: 800, height: 500 };
export const PADDLE = { width: 14, height: 92, margin: 26, speed: 540 };
export const BALL = {
  size: 34,
  /** Speed of a serve: slow, so the player who conceded can get ready. */
  serve: 290,
  /** Speed after the first return, then each hit makes it faster. */
  rally: 430,
  gain: 1.05,
  max: 960,
  /** Largest angle off the horizontal, so the ball never goes straight up. */
  maxAngle: (58 * Math.PI) / 180,
};
/** Pause between a point and the next serve, in seconds. */
export const SERVE_DELAY = 0.8;
export const MAX_SCORE = 9999;

type PaddleState = {
  /** Top of the paddle. */
  y: number;
  /** Center the bot is heading for. */
  goal: number;
  /** When the bot looks at the ball again. */
  nextLook: number;
  /** Miss distance the bot will make on this ball, re-rolled at each return. */
  error: number;
  /** This ball will be missed on purpose: a blunder. */
  blunder: boolean;
  /** Ball direction when the error was rolled. */
  errorFor: number;
  /** Side to aim at when the other paddle waits in the middle. */
  aim: number;
};

export type Game = {
  time: number;
  ball: { x: number; y: number; vx: number; vy: number };
  paddles: Record<Side, PaddleState>;
  score: Record<Side, number>;
  /** Time of the next serve, or null during a rally. */
  serveAt: number | null;
  serveTo: Side;
  /** Returns in the current rally. */
  hits: number;
};

/** What a human player does with a paddle this frame. */
export type Control = {
  /** -1 up, 1 down, 0 still (keyboard). */
  move: number;
  /** Center to reach (touch or mouse), or null. */
  target: number | null;
};

export type Event =
  | { type: "hit"; side: Side }
  | { type: "wall" }
  | { type: "point"; side: Side }
  | { type: "serve"; side: Side };

/* ---------- Bots ---------- */

type Bot = {
  /** Time between two looks at the ball, in seconds. */
  reaction: number;
  /** Paddle speed. */
  speed: number;
  /** Largest aiming error. It never makes the paddle miss on its own. */
  error: number;
  /** Chance, for each ball sent its way, of a real blunder that misses it. */
  blunder: number;
  /** Works out the bounces on the walls, instead of following the ball. */
  predicts: boolean;
  /** Aims its returns away from the other paddle. */
  aims: boolean;
};

export const BOTS: Record<Exclude<Level, "human">, Bot> = {
  noob: {
    reaction: 0.34,
    speed: 250,
    error: 40,
    blunder: 0.3,
    predicts: false,
    aims: false,
  },
  good: {
    reaction: 0.15,
    speed: 420,
    error: 24,
    blunder: 0.09,
    predicts: true,
    aims: false,
  },
  pro: {
    reaction: 0.08,
    speed: 520,
    error: 12,
    blunder: 0.035,
    predicts: true,
    aims: true,
  },
  invincible: {
    reaction: 0,
    speed: 4000,
    error: 0,
    blunder: 0,
    predicts: true,
    aims: true,
  },
};

// Distance from the paddle center at which the ball still touches it.
const REACH = PADDLE.height / 2 + BALL.size / 2;

const paddleX = (side: Side) =>
  side === "left" ? PADDLE.margin : FIELD.width - PADDLE.margin - PADDLE.width;

/** Where the center of the ball will be when it reaches that paddle. */
export function landing(game: Game, side: Side): number {
  const { ball } = game;
  const half = BALL.size / 2;
  const front =
    side === "left"
      ? paddleX("left") + PADDLE.width + half
      : paddleX("right") - half;
  const cx = ball.x + half;
  if (ball.vx === 0) return ball.y + half;
  const time = (front - cx) / ball.vx;
  if (time < 0) return ball.y + half;
  // Bounces on the walls fold the straight line into the field.
  const low = half;
  const span = FIELD.height - BALL.size;
  let y = ball.y + half + ball.vy * time - low;
  const period = 2 * span;
  y = ((y % period) + period) % period;
  if (y > span) y = period - y;
  return y + low;
}

function steer(
  game: Game,
  side: Side,
  bot: Bot,
  random: () => number,
  dt: number,
) {
  const paddle = game.paddles[side];
  const { ball } = game;
  const coming = side === "left" ? ball.vx < 0 : ball.vx > 0;
  const direction = Math.sign(ball.vx);

  if (game.time >= paddle.nextLook) {
    paddle.nextLook = game.time + bot.reaction * (0.75 + random() * 0.5);
    if (coming && game.serveAt === null) {
      // A new miss distance for each ball sent its way.
      if (paddle.errorFor !== direction) {
        paddle.errorFor = direction;
        paddle.blunder = random() < bot.blunder;
        const sign = random() < 0.5 ? -1 : 1;
        paddle.error = paddle.blunder
          ? sign * (REACH + 10 + random() * 40)
          : (random() * 2 - 1) * bot.error;
        paddle.aim = random() < 0.5 ? -1 : 1;
      }
      let spot = bot.predicts ? landing(game, side) : ball.y + BALL.size / 2;
      if (bot.aims && !paddle.blunder) {
        // Hits the ball off center, to send it away from the other paddle.
        const other = game.paddles[side === "left" ? "right" : "left"];
        const gap = other.y + PADDLE.height / 2 - FIELD.height / 2;
        const away = Math.abs(gap) < 30 ? paddle.aim : gap < 0 ? 1 : -1;
        spot -= away * PADDLE.height * 0.28;
      }
      paddle.goal = spot + paddle.error;
    } else {
      // Back to the middle while the ball goes the other way.
      paddle.errorFor = 0;
      paddle.goal = bot.predicts
        ? FIELD.height / 2
        : (paddle.goal * 2 + ball.y + BALL.size / 2) / 3;
    }
  }
  const center = paddle.y + PADDLE.height / 2;
  const gap = paddle.goal - center;
  const step = Math.min(Math.abs(gap), bot.speed * dt);
  if (Math.abs(gap) > 1) paddle.y += Math.sign(gap) * step;
}

/* ---------- Game ---------- */

const clampPaddle = (y: number) =>
  Math.max(0, Math.min(FIELD.height - PADDLE.height, y));

function centerBall(game: Game) {
  game.ball.x = (FIELD.width - BALL.size) / 2;
  game.ball.y = (FIELD.height - BALL.size) / 2;
  game.ball.vx = 0;
  game.ball.vy = 0;
}

export function newGame(
  score: Record<Side, number> = { left: 0, right: 0 },
  random: () => number = Math.random,
): Game {
  const paddle = (): PaddleState => ({
    y: (FIELD.height - PADDLE.height) / 2,
    goal: FIELD.height / 2,
    nextLook: 0,
    error: 0,
    blunder: false,
    errorFor: 0,
    aim: 1,
  });
  const game: Game = {
    time: 0,
    ball: { x: 0, y: 0, vx: 0, vy: 0 },
    paddles: { left: paddle(), right: paddle() },
    score: { ...score },
    serveAt: 0,
    serveTo: random() < 0.5 ? "left" : "right",
    hits: 0,
  };
  centerBall(game);
  return game;
}

function serve(game: Game, random: () => number) {
  // Slow, toward the player who conceded, with a random slope.
  const angle = ((random() * 2 - 1) * (28 * Math.PI)) / 180;
  const direction = game.serveTo === "left" ? -1 : 1;
  game.ball.vx = direction * BALL.serve * Math.cos(angle);
  game.ball.vy = BALL.serve * Math.sin(angle);
  game.serveAt = null;
  game.hits = 0;
}

function bounceOff(game: Game, side: Side, random: () => number) {
  const { ball } = game;
  const paddle = game.paddles[side];
  // Where the ball met the paddle, from -1 (top) to 1 (bottom).
  const reach = PADDLE.height / 2 + BALL.size / 2;
  const offset =
    (ball.y + BALL.size / 2 - (paddle.y + PADDLE.height / 2)) / reach;
  // A little randomness keeps rallies from repeating forever.
  const jitter = ((random() * 2 - 1) * (4 * Math.PI)) / 180;
  const angle = Math.max(
    -BALL.maxAngle,
    Math.min(BALL.maxAngle, offset * BALL.maxAngle + jitter),
  );
  const speed = Math.min(
    BALL.max,
    Math.max(BALL.rally, Math.hypot(ball.vx, ball.vy) * BALL.gain),
  );
  const direction = side === "left" ? 1 : -1;
  ball.vx = direction * speed * Math.cos(angle);
  ball.vy = speed * Math.sin(angle);
  ball.x =
    side === "left"
      ? paddleX("left") + PADDLE.width
      : paddleX("right") - BALL.size;
  game.hits++;
}

const touches = (game: Game, side: Side) => {
  const { ball } = game;
  const paddle = game.paddles[side];
  const x = paddleX(side);
  return (
    ball.x <= x + PADDLE.width &&
    ball.x + BALL.size >= x &&
    ball.y + BALL.size >= paddle.y &&
    ball.y <= paddle.y + PADDLE.height
  );
};

// Small steps keep the fastest ball from passing through a paddle.
const STEP = 1 / 240;

/**
 * Moves the game forward by dt seconds and returns what happened. Points stop
 * at MAX_SCORE.
 */
export function step(
  game: Game,
  dt: number,
  levels: Record<Side, Level>,
  controls: Record<Side, Control>,
  random: () => number = Math.random,
): Event[] {
  const events: Event[] = [];
  let left = dt;
  while (left > 1e-9) {
    const h = Math.min(STEP, left);
    left -= h;
    game.time += h;

    for (const side of ["left", "right"] as const) {
      const level = levels[side];
      const paddle = game.paddles[side];
      if (level === "human") {
        const control = controls[side];
        if (control.target !== null) {
          // Touch: follows the finger quickly, but not instantly.
          const gap = control.target - (paddle.y + PADDLE.height / 2);
          paddle.y +=
            Math.sign(gap) * Math.min(Math.abs(gap), PADDLE.speed * 2.5 * h);
        } else {
          paddle.y += control.move * PADDLE.speed * h;
        }
      } else {
        steer(game, side, BOTS[level], random, h);
      }
      paddle.y = clampPaddle(paddle.y);
    }

    if (game.serveAt !== null) {
      if (game.time >= game.serveAt) {
        serve(game, random);
        events.push({ type: "serve", side: game.serveTo });
      }
      continue;
    }

    const { ball } = game;
    ball.x += ball.vx * h;
    ball.y += ball.vy * h;

    if (ball.y <= 0) {
      ball.y = 0;
      ball.vy = Math.abs(ball.vy);
      events.push({ type: "wall" });
    } else if (ball.y + BALL.size >= FIELD.height) {
      ball.y = FIELD.height - BALL.size;
      ball.vy = -Math.abs(ball.vy);
      events.push({ type: "wall" });
    }

    if (ball.vx < 0 && touches(game, "left") && ball.x > paddleX("left")) {
      bounceOff(game, "left", random);
      events.push({ type: "hit", side: "left" });
    } else if (
      ball.vx > 0 &&
      touches(game, "right") &&
      ball.x + BALL.size < paddleX("right") + PADDLE.width
    ) {
      bounceOff(game, "right", random);
      events.push({ type: "hit", side: "right" });
    }

    // Touching the left edge gives the point to the right, and the reverse.
    const scorer: Side | null =
      ball.x <= 0 ? "right" : ball.x + BALL.size >= FIELD.width ? "left" : null;
    if (scorer) {
      game.score[scorer] = Math.min(MAX_SCORE, game.score[scorer] + 1);
      game.serveTo = scorer === "left" ? "right" : "left";
      game.serveAt = game.time + SERVE_DELAY;
      centerBall(game);
      events.push({ type: "point", side: scorer });
    }
  }
  return events;
}

/** Current speed of the ball, for tests and effects. */
export const ballSpeed = (game: Game) => Math.hypot(game.ball.vx, game.ball.vy);
