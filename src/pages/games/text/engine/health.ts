// Blood and consciousness as formulas of time. No ticking: the blood left
// at any moment is computed from the wounds and the minutes elapsed.

import type { Body, Wound } from "./types";

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

export type Vital = "ok" | "weak" | "down" | "dead";

export function vitalAt(body: Body, clock: number): Vital {
  if (body.dead) return "dead";
  const blood = bloodAt(body, clock);
  if (blood < DEATH_BLOOD) return "dead";
  if ((body.outUntil ?? 0) > clock || blood < FAINT_BLOOD) return "down";
  if (blood < WEAK_BLOOD || body.wounds.some((w) => w.sev >= 3)) return "weak";
  return "ok";
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
