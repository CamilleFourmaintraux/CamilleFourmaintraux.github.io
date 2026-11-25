// Blood and consciousness as formulas of time. No ticking: the blood left
// at any moment is computed from the wounds and the minutes elapsed.

import type { Body, BodyPart, Wound } from "./types";

export const NORMAL_BLOOD = 5;
/** Below this, the body gives out. */
export const DEATH_BLOOD = 2.5;
/** Below this, the person faints. */
export const FAINT_BLOOD = 3.2;
/** Below this, the person feels weak. */
export const WEAK_BLOOD = 4.2;
/** Blood made back per hour once nothing bleeds. */
export const REGEN_PER_HOUR = 0.25;
/** Light wounds stop bleeding by themselves, halving every few minutes. */
const HALF_LIFE = 8;

const decays = (w: Wound) => w.sev <= 2 && !w.treated;

/** Bleeding of a wound at a given time, litres per hour. */
export function bleedAt(w: Wound, clock: number): number {
  if (!decays(w)) return w.bleed;
  return w.bleed * 2 ** (-(clock - w.at) / HALF_LIFE);
}

/** Blood lost by one wound between two times. */
function lost(w: Wound, from: number, to: number): number {
  const start = Math.max(from, w.at);
  if (to <= start) return 0;
  if (!decays(w)) return (w.bleed * (to - start)) / 60;
  const rate = bleedAt(w, start);
  return (
    (((rate * HALF_LIFE) / Math.LN2) * (1 - 2 ** (-(to - start) / HALF_LIFE))) /
    60
  );
}

export function bloodAt(body: Body, clock: number): number {
  const loss = body.wounds.reduce((sum, w) => sum + lost(w, body.at, clock), 0);
  return Math.max(0, body.blood - loss);
}

export function bleeding(body: Body, clock: number): number {
  return body.wounds.reduce((sum, w) => sum + bleedAt(w, clock), 0);
}

// ---------------------------------------------------------------------------
// Trauma: blows add up even when they do not bleed. A body takes only so
// many broken bones before it goes into shock, then gives out.

/** How much a wound to each part weighs on the whole body. */
const PART_WEIGHT: Record<BodyPart, number> = {
  head: 3,
  neck: 3,
  torso: 1.5,
  armL: 0.5,
  armR: 0.5,
  handL: 0.3,
  handR: 0.3,
  legL: 0.6,
  legR: 0.6,
  footL: 0.3,
  footR: 0.3,
};
const SEV_POINTS = [0, 0.1, 0.5, 1.6, 4];

/** Everyday aches from here on. */
export const SORE_TRAUMA = 5;
/** The body goes into shock and the person blacks out. */
export const SHOCK_TRAUMA = 10;
/** Too much for any body. */
export const DEATH_TRAUMA = 16;

export function traumaOf(body: Body): number {
  return body.wounds.reduce(
    (sum, w) =>
      sum +
      PART_WEIGHT[w.part] * SEV_POINTS[w.sev] * (w.type === "blunt" ? 1 : 0.6),
    0,
  );
}

/** A bone broken there: a heavy blunt blow, or any dreadful wound. */
export function brokenAt(body: Body, part: BodyPart): boolean {
  return body.wounds.some(
    (w) =>
      w.part === part && (w.sev === 4 || (w.type === "blunt" && w.sev >= 3)),
  );
}

/**
 * A second heavy blow on a broken bone shatters it. On a cracked skull or a
 * hurt neck it is not certain, but likely: `roll` is a number from 0 to 1.
 */
export function worsened(
  body: Body,
  part: BodyPart,
  type: Wound["type"],
  sev: Wound["sev"],
  roll: number,
): Wound["sev"] {
  if (type !== "blunt" || sev !== 3 || !brokenAt(body, part)) return sev;
  if ((part === "head" || part === "neck") && roll >= 0.6) return 3;
  return 4;
}

/** Legs that still carry: a broken leg or foot does not. */
export function legsLeft(body: Body): 0 | 1 | 2 {
  const left = !brokenAt(body, "legL") && !brokenAt(body, "footL");
  const right = !brokenAt(body, "legR") && !brokenAt(body, "footR");
  return ((left ? 1 : 0) + (right ? 1 : 0)) as 0 | 1 | 2;
}

/** A hand that can still hold: its arm and itself unbroken. */
export function handWorks(body: Body, side: "left" | "right"): boolean {
  const s = side === "left" ? "L" : "R";
  return !brokenAt(body, `arm${s}`) && !brokenAt(body, `hand${s}`);
}

export type Vital = "ok" | "weak" | "down" | "dead";

export function vitalAt(body: Body, clock: number): Vital {
  if (body.dead) return "dead";
  const blood = bloodAt(body, clock);
  if (blood < DEATH_BLOOD) return "dead";
  if (traumaOf(body) >= DEATH_TRAUMA) return "dead";
  if ((body.outUntil ?? 0) > clock || blood < FAINT_BLOOD) return "down";
  if (blood < WEAK_BLOOD || body.wounds.some((w) => w.sev >= 3)) return "weak";
  return "ok";
}

/** Why a body died, for the last words. */
export function causeOf(body: Body, clock: number): NonNullable<Body["cause"]> {
  if (body.cause) return body.cause;
  if (bloodAt(body, clock) < DEATH_BLOOD) return "blood";
  return "trauma";
}

/** Folds the blood lost so far into the body, so formulas restart from now. */
export function settle(body: Body, clock: number): Body {
  const blood = bloodAt(body, clock);
  const wounds = body.wounds.map((w) => ({
    ...w,
    bleed: bleedAt(w, clock),
    at: clock,
  }));
  // Wounds that stopped bleeding keep their mark, with a zero rate.
  for (const w of wounds) if (w.bleed < 0.01) w.bleed = 0;
  let regen = 0;
  if (bleeding(body, clock) < 0.01 && blood < NORMAL_BLOOD) {
    regen = Math.min(
      NORMAL_BLOOD - blood,
      (REGEN_PER_HOUR * (clock - body.at)) / 60,
    );
  }
  return { ...body, blood: blood + regen, at: clock, wounds };
}
