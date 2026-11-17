export const EMOTIONS = [
  "empty",
  "curious",
  "heartened",
  "shy",
  "happy",
  "excited",
  "faceless",
  "sad",
  "crying",
] as const;

export type Emotion = (typeof EMOTIONS)[number];

/** Where the pointer is, relative to the character. */
export type Zone = "face" | "near" | "far";

// Durations in milliseconds.
const APPEAR_AFTER = 900;
const PEEK = 900;
const HOLD_TO_ERASE = 250;
const SAD_WHEN_FAR_AFTER = 600;
const SAD_WHEN_IDLE_AFTER = 12_000;
const CRY_WHEN_IDLE_AFTER = 25_000;
const CRY_WHEN_ALONE_AFTER = 1_500;
const WATCH_WHEN_ALONE_AFTER = 7_000;
const HIDE_WHEN_ALONE_AFTER = 11_000;
const AFFECTION_LIFETIME = 9_000;

const TAP_EXCITEMENT = 900;
const SHAKE_EXCITEMENT = 700;
// Speed of a "shake", in screen widths of the character per second.
const SHAKE_SPEED = 3;
// Pointer travel on the face that fills the affection, in widths.
const STROKE_TO_FILL = 2;
const WARM = 0.25;
const DELIGHTED = 0.6;

/** Everything the character knows about the visitor. Times come from performance.now(). */
export type Mood = {
  startedAt: number;
  /** The pointer is in the window, or the keyboard focus is on the character. */
  present: boolean;
  everPresent: boolean;
  arrivedAt: number;
  /** The character was out of sight when the visitor came (back). */
  wasHidden: boolean;
  leftAt: number;
  zone: Zone;
  farSince: number;
  lastActivityAt: number;
  pressed: boolean;
  pressedAt: number;
  excitedUntil: number;
  /** From 0 to 1: grows when the face is stroked, fades with time. */
  affection: number;
};

export function createMood(now: number): Mood {
  return {
    startedAt: now,
    present: false,
    everPresent: false,
    arrivedAt: 0,
    wasHidden: true,
    leftAt: 0,
    zone: "far",
    farSince: 0,
    lastActivityAt: now,
    pressed: false,
    pressedAt: 0,
    excitedUntil: 0,
    affection: 0,
  };
}

/** The emotion to show right now. Pure: the same mood always gives the same face. */
export function emotionOf(mood: Mood, now: number): Emotion {
  if (now < mood.excitedUntil) return "excited";

  if (!mood.present) {
    // Nobody yet: the screen stays empty, then she peeks and waits.
    if (!mood.everPresent) {
      return now - mood.startedAt < APPEAR_AFTER ? "empty" : "curious";
    }
    // Left alone: sad, in tears, watching for a return, then gone.
    const alone = now - mood.leftAt;
    if (alone < CRY_WHEN_ALONE_AFTER) return "sad";
    if (alone < WATCH_WHEN_ALONE_AFTER) return "crying";
    if (alone < HIDE_WHEN_ALONE_AFTER) return "curious";
    return "empty";
  }

  if (mood.wasHidden && now - mood.arrivedAt < PEEK) return "curious";

  // Holding the button on her face covers it.
  if (
    mood.pressed &&
    mood.zone === "face" &&
    now - mood.pressedAt > HOLD_TO_ERASE
  ) {
    return "faceless";
  }

  const idle = now - mood.lastActivityAt;
  if (idle > CRY_WHEN_IDLE_AFTER) return "crying";
  if (idle > SAD_WHEN_IDLE_AFTER) return "sad";

  if (mood.zone === "far") {
    return now - mood.farSince > SAD_WHEN_FAR_AFTER ? "sad" : "heartened";
  }
  if (mood.affection >= DELIGHTED) return "happy";
  // Pointed at directly she is shy, until a few strokes reassure her.
  if (mood.zone === "face" && mood.affection < WARM) return "shy";
  return "heartened";
}

export function arrive(mood: Mood, now: number) {
  if (mood.present) return;
  mood.wasHidden = emotionOf(mood, now) === "empty";
  mood.present = true;
  mood.everPresent = true;
  mood.arrivedAt = now;
  mood.lastActivityAt = now;
}

export function leave(mood: Mood, now: number) {
  if (!mood.present) return;
  mood.present = false;
  mood.pressed = false;
  mood.leftAt = now;
}

export function enterZone(mood: Mood, zone: Zone, now: number) {
  if (zone === "far" && mood.zone !== "far") mood.farSince = now;
  mood.zone = zone;
}

/** A pointer movement, measured in widths of the character. */
export function move(mood: Mood, distance: number, speed: number, now: number) {
  mood.lastActivityAt = now;
  if (mood.zone === "far") return;
  if (speed > SHAKE_SPEED) {
    mood.excitedUntil = Math.max(mood.excitedUntil, now + SHAKE_EXCITEMENT);
  } else if (mood.zone === "face" && !mood.pressed) {
    mood.affection = Math.min(1, mood.affection + distance / STROKE_TO_FILL);
  }
}

export function press(mood: Mood, now: number) {
  mood.pressed = true;
  mood.pressedAt = now;
  mood.lastActivityAt = now;
}

export function release(mood: Mood, now: number) {
  if (!mood.pressed) return;
  mood.pressed = false;
  mood.lastActivityAt = now;
  if (mood.zone !== "face") return;
  if (now - mood.pressedAt <= HOLD_TO_ERASE) poke(mood, now);
  // Having her face covered makes her shy again.
  else mood.affection = 0;
}

/** A click, a tap or the Enter key. */
export function poke(mood: Mood, now: number) {
  mood.lastActivityAt = now;
  mood.excitedUntil = now + TAP_EXCITEMENT;
  mood.affection = Math.min(1, mood.affection + 0.1);
}

/** Lets the affection fade when she is not being stroked. */
export function fade(mood: Mood, elapsed: number, now: number) {
  const stroked =
    mood.present && mood.zone === "face" && now - mood.lastActivityAt < 1_500;
  if (!stroked)
    mood.affection = Math.max(0, mood.affection - elapsed / AFFECTION_LIFETIME);
}
