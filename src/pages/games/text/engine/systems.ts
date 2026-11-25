// Systems that run on their own as time passes: fire, light, periods of the
// day, weather, and the short sickness of a bad meal. Each one owns its data
// and reacts to scheduled or domain events.

import { emit, on, onScheduled, say, schedule, type Ctx } from "./core";
import { worldRandom } from "./rng";
import { startNeeds } from "./needs";
import { DAY, PERIODS, minuteOfDay, period, day } from "./time";
import {
  bare,
  comp,
  fuelLeft,
  has,
  isLit,
  patch,
  placeOf,
  subtree,
  type Game,
} from "./world";
import type { Id } from "./types";

// ---------------------------------------------------------------------------
// Light and darkness.

/** Is this place too dark to see, given the hour and the lights in it? */
export function isDark(g: Game, place: Id): boolean {
  const rule = comp(g, place, "place")?.dark ?? "never";
  if (rule === "never") return false;
  const p = period(g.st.clock);
  const darkNow =
    rule === "always" ||
    (rule === "night" && p === "night") ||
    (rule === "evening" && (p === "evening" || p === "night" || p === "dawn"));
  if (!darkNow) return false;
  return !subtree(g, place).some((id) => isLit(g, id));
}

export const playerPlace = (g: Game) => placeOf(g, g.st.player);
export const playerInDark = (g: Game) => isDark(g, playerPlace(g));

/** Can the player notice something happening to this entity? */
/** The player sleeps: small things go by unnoticed. */
export const playerAsleep = (g: Game) =>
  comp(g, g.st.player, "needs")?.mode === "asleep";

export function perceives(g: Game, id: Id): boolean {
  return (
    !!g.st.ent[id] && placeOf(g, id) === playerPlace(g) && !playerAsleep(g)
  );
}

// ---------------------------------------------------------------------------
// Things that burn. Fuel is computed from the time elapsed (world.fuelLeft);
// only the moments worth a message are scheduled.

const LOW_FUEL = 0.15;

function scheduleBurn(g: Game, id: Id) {
  const burn = comp(g, id, "burn");
  if (!burn || !burn.lit || burn.rate === 0) return;
  const hours = (fuel: number) => ((burn.fuel - fuel) / burn.rate) * 60;
  if (burn.fuel > LOW_FUEL) {
    schedule(g, {
      at: burn.since + Math.ceil(hours(LOW_FUEL)),
      type: "burn.low",
      target: id,
      gen: burn.gen,
    });
  }
  schedule(g, {
    at: burn.since + Math.ceil(hours(0)),
    type: "burn.out",
    target: id,
    gen: burn.gen,
  });
}

export function light(ctx: Ctx, id: Id) {
  const g = ctx.g;
  const burn = comp(g, id, "burn")!;
  const wasDark = playerInDark(g);
  patch(g, id, "burn", { lit: true, since: g.st.clock, gen: burn.gen + 1 });
  scheduleBurn(g, id);
  if (wasDark && !playerInDark(g)) say(ctx, "light.reveals");
  emit(ctx, { type: "lit", target: id });
}

export function extinguish(ctx: Ctx, id: Id) {
  const g = ctx.g;
  const burn = comp(g, id, "burn")!;
  const wasDark = playerInDark(g);
  patch(g, id, "burn", {
    lit: false,
    fuel: fuelLeft(g, id),
    since: g.st.clock,
    gen: burn.gen + 1,
  });
  if (!wasDark && playerInDark(g)) say(ctx, "dark.falls");
  emit(ctx, { type: "extinguished", target: id });
}

const stale = (g: Game, id: Id | undefined, gen: number | undefined) =>
  !id || comp(g, id, "burn")?.gen !== gen;

onScheduled("burn.low", (ctx, event) => {
  const g = ctx.g;
  if (stale(g, event.target, event.gen) || !perceives(g, event.target!)) return;
  say(ctx, "burn.low", { x: bare(g, event.target!) });
  ctx.interrupted = true;
});

onScheduled("burn.out", (ctx, event) => {
  const g = ctx.g;
  const id = event.target!;
  if (stale(g, id, event.gen)) return;
  const wasDark = playerInDark(g);
  const burn = comp(g, id, "burn")!;
  patch(g, id, "burn", {
    lit: false,
    fuel: 0,
    since: g.st.clock,
    gen: burn.gen + 1,
  });
  if (!perceives(g, id)) return;
  say(ctx, "burn.out", { x: bare(g, id) });
  if (!wasDark && playerInDark(g)) say(ctx, "dark.falls");
  ctx.interrupted = true;
});

// ---------------------------------------------------------------------------
// Periods of the day. A recurring event announces sunrise and nightfall to a
// player who is outside.

function nextPeriodStart(clock: number): number {
  const now = minuteOfDay(clock);
  const starts = PERIODS.map(([, h]) => h * 60);
  const next = starts.find((minute) => minute > now) ?? starts[0] + DAY;
  return clock + (next - now);
}

onScheduled("period", (ctx) => {
  const g = ctx.g;
  schedule(g, { at: nextPeriodStart(g.st.clock), type: "period" });
  const place = playerPlace(g);
  if (!comp(g, place, "place")?.outdoor || playerAsleep(g)) return;
  say(ctx, `period.${period(g.st.clock)}`);
});

// ---------------------------------------------------------------------------
// Weather: world randomness, the same day after day in every game. Each day
// leans on the day before, so a storm does not turn into a heatwave.

export type Weather = "clear" | "cloudy" | "rain";

export function weather(g: Game, d: number, depth = 2): Weather {
  const seed = g.content.worldSeed;
  const before = depth > 0 ? weather(g, d - 1, depth - 1) : "cloudy";
  const roll = worldRandom(seed, "weather", d);
  const rain = before === "rain" ? 0.45 : before === "cloudy" ? 0.25 : 0.1;
  if (roll < rain) return "rain";
  return roll < rain + 0.35 ? "cloudy" : "clear";
}

export const weatherNow = (g: Game) => weather(g, day(g.st.clock));

// ---------------------------------------------------------------------------
// A bad meal: a short sickness. The needs system will take this over later.

export function sicken(ctx: Ctx, minutes: number) {
  const g = ctx.g;
  const end = g.st.clock + minutes;
  g.st.flags.nauseousUntil = end;
  schedule(g, { at: end, type: "nausea.end" });
}

onScheduled("nausea.end", (ctx) => {
  const g = ctx.g;
  if (Number(g.st.flags.nauseousUntil ?? 0) > g.st.clock) return;
  delete g.st.flags.nauseousUntil;
  say(ctx, "nausea.end");
});

export const isNauseous = (g: Game) =>
  Number(g.st.flags.nauseousUntil ?? 0) > g.st.clock;

// ---------------------------------------------------------------------------
// Starting a game: everything that runs on its own gets its first event.

export function startSystems(g: Game) {
  for (const id of Object.keys(g.st.ent)) {
    if (isLit(g, id)) scheduleBurn(g, id);
  }
  schedule(g, { at: nextPeriodStart(g.st.clock), type: "period" });
  for (const event of g.content.schedule ?? []) schedule(g, event);
  startNeeds(g);
}

on("moved", (ctx, event) => {
  // The player walking into another place is an autosave point.
  if (event.target === ctx.g.st.player && has(ctx.g, event.to ?? "", "place")) {
    ctx.placeChanged = true;
    const visited = (ctx.g.st.visited ??= []);
    if (!visited.includes(event.to!)) visited.push(event.to!);
  }
});

/** Lit things carried by the player or lying here (for descriptions). */
export function lightsHere(g: Game): Id[] {
  return subtree(g, playerPlace(g)).filter((id) => isLit(g, id));
}
