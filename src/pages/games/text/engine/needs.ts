// Needs: hunger, thirst, physical fatigue, the need to sleep, what the
// stomach holds and the water drunk beyond thirst. They are hidden values
// computed from the time elapsed; the player only reads sentences when a
// threshold is crossed or when asking how they feel.

import { onScheduled, say, schedule, type Ctx } from "./core";
import { comp, patch, type Game } from "./world";
import type { Id, Needs } from "./types";

/** Change per hour of each value, by what the person is doing. */
const RATES: Record<
  Needs["mode"],
  Record<"hunger" | "thirst" | "sleep" | "fatigue", number>
> = {
  awake: { hunger: 0.03, thirst: 0.045, sleep: 0.06, fatigue: -0.3 },
  rest: { hunger: 0.027, thirst: 0.04, sleep: 0.05, fatigue: -0.8 },
  asleep: { hunger: 0.02, thirst: 0.025, sleep: -0.13, fatigue: -1 },
};
/** Litres per hour the stomach digests and the body gets rid of. */
const DIGEST = 0.6;
const FLUSH = 0.8;

const clamp = (x: number) => Math.max(0, Math.min(1, x));

/** The needs of a person at the current time, without saving anything. */
export function needsOf(g: Game, id: Id): Needs | undefined {
  const n = comp(g, id, "needs");
  if (!n) return undefined;
  const hours = (g.st.clock - n.at) / 60;
  const rate = RATES[n.mode];
  // Sleep restores faster when the bed is good.
  const sleepRate =
    n.mode === "asleep"
      ? rate.sleep * (0.45 + 0.55 * (n.comfort ?? 0.5))
      : rate.sleep;
  return {
    ...n,
    hunger: clamp(n.hunger + rate.hunger * hours),
    thirst: clamp(n.thirst + rate.thirst * hours),
    sleep: clamp(n.sleep + sleepRate * hours),
    fatigue: clamp(n.fatigue + rate.fatigue * hours),
    stomach: Math.max(0, n.stomach - DIGEST * hours),
    water: Math.max(0, n.water - FLUSH * hours),
    at: g.st.clock,
  };
}

/** Saves the current values and changes some of them. */
export function setNeeds(g: Game, id: Id, values: Partial<Needs>) {
  const now = needsOf(g, id);
  if (now) patch(g, id, "needs", { ...now, ...values });
}

/** Physical effort: a blow, a sprint, a heavy load. */
export function exert(g: Game, id: Id, amount: number) {
  const n = needsOf(g, id);
  if (n) setNeeds(g, id, { fatigue: clamp(n.fatigue + amount) });
}

// Thresholds that give a message, from the mildest.
export const TIERS: Record<
  "hunger" | "thirst" | "sleep" | "fatigue",
  number[]
> = {
  hunger: [0.35, 0.6, 0.85],
  thirst: [0.35, 0.6, 0.85],
  sleep: [0.5, 0.75, 0.95],
  fatigue: [0.5, 0.8],
};

export function tier(value: number, steps: number[]): number {
  return steps.filter((step) => value >= step).length;
}

/** A penalty to every check when tired, hungry or thirsty. */
export function needsPenalty(g: Game, id: Id): number {
  const n = needsOf(g, id);
  if (!n) return 0;
  return (
    (tier(n.sleep, TIERS.sleep) >= 2 ? 1 : 0) +
    (tier(n.hunger, TIERS.hunger) >= 3 ? 1 : 0) +
    (tier(n.thirst, TIERS.thirst) >= 3 ? 1 : 0) +
    (tier(n.fatigue, TIERS.fatigue) >= 2 ? 1 : 0)
  );
}

const CHECK_EVERY = 15;

/** A check every quarter of an hour: thresholds crossed give a message. */
onScheduled("needs.check", (ctx) => {
  const g = ctx.g;
  schedule(g, { at: g.st.clock + CHECK_EVERY, type: "needs.check" });
  const player = g.st.player;
  const n = needsOf(g, player);
  if (!n || g.st.flags.dead) return;
  for (const key of ["thirst", "hunger", "sleep", "fatigue"] as const) {
    const now = tier(n[key], TIERS[key]);
    const before = Number(g.st.flags[`need.${key}`] ?? 0);
    g.st.flags[`need.${key}`] = now;
    // Only getting worse is news; while asleep, the body keeps quiet.
    if (now > before && n.mode !== "asleep") {
      say(ctx, `need.${key}.${now}`);
      if (now >= 2) ctx.interrupted = true;
    }
  }
  // Days without water, weeks without food: the body gives up.
  for (const key of ["thirst", "hunger"] as const) {
    const flag = `need.${key}.since`;
    if (n[key] < 1) {
      delete g.st.flags[flag];
      continue;
    }
    const since = Number(g.st.flags[flag] ?? g.st.clock);
    g.st.flags[flag] = since;
    const limit = key === "thirst" ? 2 * 24 * 60 : 20 * 24 * 60;
    if (g.st.clock - since >= limit) {
      g.st.flags.dead = true;
      say(ctx, `you.${key}Death`);
      ctx.interrupted = true;
      return;
    }
  }
});

export function startNeeds(g: Game) {
  // How the body feels at the start is known already: only changes are news.
  const n = needsOf(g, g.st.player);
  if (n)
    for (const key of ["thirst", "hunger", "sleep", "fatigue"] as const)
      g.st.flags[`need.${key}`] ??= tier(n[key], TIERS[key]);
  if (!g.st.queue.some((e) => e.type === "needs.check")) {
    schedule(g, { at: g.st.clock + CHECK_EVERY, type: "needs.check" });
  }
}

// ---------------------------------------------------------------------------
// Eating and drinking.

/** Above this, the stomach feels full and eating more asks first. */
export const STOMACH_FULL = 1.2;
const STOMACH_SICK = 2.2;
const STOMACH_BURST = 4;
/** Water beyond thirst: dangerous, then deadly. */
const WATER_SICK = 3.5;
const WATER_DEADLY = 6;

/** What happens once something is swallowed. */
export function swallow(
  ctx: Ctx,
  id: Id,
  values: { food?: number; water?: number; volume: number },
) {
  const g = ctx.g;
  const n = needsOf(g, id);
  if (!n) return;
  const water = values.water ?? 0;
  // Water quenches thirst first; the rest is too much.
  const quench = Math.min(n.thirst, water / 2);
  const excess = Math.max(0, water - quench * 2);
  const next: Partial<Needs> = {
    hunger: clamp(n.hunger - (values.food ?? 0)),
    thirst: clamp(n.thirst - quench),
    stomach: n.stomach + values.volume,
    water: n.water + excess,
  };
  setNeeds(g, id, next);
  for (const key of ["hunger", "thirst"] as const) {
    g.st.flags[`need.${key}`] = tier(next[key]!, TIERS[key]);
  }
  if (next.water! >= WATER_DEADLY || next.stomach! >= STOMACH_BURST) {
    g.st.flags.dead = true;
    say(ctx, next.water! >= WATER_DEADLY ? "you.waterDeath" : "you.burstDeath");
    return;
  }
  if (next.water! >= WATER_SICK || next.stomach! >= STOMACH_SICK) {
    say(ctx, "stomach.sick");
    g.st.flags.nauseousUntil = Math.max(
      Number(g.st.flags.nauseousUntil ?? 0),
      g.st.clock + 90,
    );
    schedule(g, { at: g.st.clock + 90, type: "nausea.end" });
  } else if (next.stomach! >= STOMACH_FULL) {
    say(ctx, "stomach.full");
  }
}

/** Will this be too much? Used to warn before eating or drinking. */
export function tooMuch(g: Game, id: Id, volume: number, water = 0): boolean {
  const n = needsOf(g, id);
  if (!n) return false;
  return (
    n.stomach + volume > STOMACH_FULL ||
    n.water + Math.max(0, water - n.thirst * 2) > 2.5
  );
}
