// Behavior of the character of the hidden page, as a pure state machine:
// events change the mood, and emotionOf() tells which face to show at a
// given time. Durations are in milliseconds.

export const EMOTIONS = [
  "empty",
  "curious",
  "shy",
  "heartened",
  "excited",
  "sad",
  "happy",
  "crying",
  "faceless",
  "faceless_curious",
] as const;

export type Emotion = (typeof EMOTIONS)[number];

/** Where the pointer is: on the picture, close to it or far from it. */
export type Zone = "on" | "near" | "far";

/**
 * 1. She peeks while the visitor keeps away.
 * 2. She shows herself, shyly, hides when clicked and is sad when left alone.
 * 3. She reacts to every move, until clicked too fast.
 * 4. She is gone until the page is reloaded.
 */
export type Phase = 1 | 2 | 3 | 4;

// Phases 1 and 2: time spent at a distance before the next phase.
const NEXT_PHASE_AFTER = 15_000;
// Phase 2: curious face between the hiding after a click and the shy one.
const REVEAL = 1_000;
// Phase 3.
const HAPPY = 1_500;
const CRYING = 2_500;
const LOOKING_BACK = 1_500;
const RAPID_CLICKS = 4;
const RAPID_WINDOW = 1_000;
const FACELESS = 4_000;
const FACELESS_CURIOUS = 1_500;

export type Mood = {
  phase: Phase;
  /** The pointer is in the window, or a touch or keyboard visitor is there. */
  inside: boolean;
  zone: Zone;
  /** Phases 1 and 2: since when the visitor keeps away. */
  farSince: number | null;
  /** Phase 2: hidden after a click, until the pointer moves away. */
  hiddenByClick: boolean;
  /** Phase 2: end of the curious face shown when she comes back. */
  revealUntil: number;
  /** Phase 3: last direction of the pointer, relative to the picture. */
  trend: "closer" | "away" | null;
  leftAt: number | null;
  happyUntil: number;
  clicks: number[];
  brokenAt: number | null;
};

export function createMood(): Mood {
  return {
    phase: 1,
    inside: false,
    zone: "far",
    farSince: null,
    hiddenByClick: false,
    revealUntil: 0,
    trend: null,
    leftAt: null,
    happyUntil: 0,
    clicks: [],
    brokenAt: null,
  };
}

const keepsAway = (mood: Mood) =>
  mood.inside && mood.zone === "far" && mood.farSince !== null;

/** Since when the visitor keeps away and she watches, if they do. */
function watchedSince(mood: Mood): number | null {
  if (!keepsAway(mood)) return null;
  return mood.phase === 2
    ? Math.max(mood.farSince!, mood.revealUntil)
    : mood.farSince;
}

/** Moves to the next phase when its time has come. Call it regularly. */
export function advance(mood: Mood, now: number) {
  if (mood.phase === 1 || mood.phase === 2) {
    const since = watchedSince(mood);
    if (since === null || now - since < NEXT_PHASE_AFTER) return;
    if (mood.phase === 1) {
      mood.phase = 2;
      mood.farSince = now;
    } else {
      mood.phase = 3;
      mood.trend = null;
    }
  } else if (mood.phase === 3 && mood.brokenAt !== null) {
    if (now - mood.brokenAt >= FACELESS + FACELESS_CURIOUS) mood.phase = 4;
  }
}

export function emotionOf(mood: Mood, now: number): Emotion {
  switch (mood.phase) {
    case 1:
      return keepsAway(mood) ? "curious" : "empty";

    case 2:
      if (mood.hiddenByClick) return "empty";
      if (!mood.inside) return "sad";
      if (mood.zone !== "far" || now < mood.revealUntil) return "curious";
      return "shy";

    case 3: {
      if (mood.brokenAt !== null) {
        return now - mood.brokenAt < FACELESS ? "faceless" : "faceless_curious";
      }
      if (now < mood.happyUntil) return "happy";
      if (!mood.inside) {
        if (mood.leftAt === null) return "empty";
        const gone = now - mood.leftAt;
        if (gone < CRYING) return "crying";
        if (gone < CRYING + LOOKING_BACK) return "curious";
        return "empty";
      }
      if (mood.zone === "on") return "heartened";
      return mood.trend === "away" ? "sad" : "excited";
    }

    case 4:
      return "empty";
  }
}

/** The pointer is in the window, in the given zone. */
export function point(mood: Mood, zone: Zone, now: number) {
  const wasAway = keepsAway(mood);
  mood.inside = true;
  mood.leftAt = null;
  mood.zone = zone;
  if (zone !== "far") {
    mood.farSince = null;
  } else {
    if (mood.hiddenByClick) {
      // Moving away after a click lets her come back, curious for a moment.
      mood.hiddenByClick = false;
      mood.revealUntil = now + REVEAL;
    }
    if (!wasAway) mood.farSince = now;
  }
}

/** The pointer moved by this much towards (< 0) or away from (> 0) the picture. */
export function drift(mood: Mood, delta: number) {
  if (mood.phase !== 3 || delta === 0) return;
  mood.trend = delta < 0 ? "closer" : "away";
}

export function leave(mood: Mood, now: number) {
  if (!mood.inside) return;
  mood.inside = false;
  mood.farSince = null;
  mood.hiddenByClick = false;
  mood.trend = null;
  if (mood.phase === 3) mood.leftAt = now;
}

/** A click (or a tap, or the Enter key) on the picture. */
export function clickPicture(mood: Mood, now: number) {
  if (mood.phase === 2) {
    mood.hiddenByClick = true;
    mood.revealUntil = 0;
    mood.farSince = null;
  } else if (mood.phase === 3 && mood.brokenAt === null) {
    mood.clicks = [...mood.clicks.filter((at) => now - at < RAPID_WINDOW), now];
    if (mood.clicks.length >= RAPID_CLICKS) {
      mood.brokenAt = now;
      mood.happyUntil = 0;
    } else {
      mood.happyUntil = now + HAPPY;
    }
  }
}
