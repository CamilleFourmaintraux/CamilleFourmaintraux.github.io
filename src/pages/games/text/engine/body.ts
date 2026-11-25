// Bodies: where a blow lands, the wounds it leaves, bleeding over time,
// fainting, waking and death. There are no hit points: the state of a person
// comes from their wounds and the blood they have left.

import { emit, onScheduled, say, schedule, type Ctx } from "./core";
import {
  NORMAL_BLOOD,
  WEAK_BLOOD,
  bleeding,
  bloodAt,
  settle,
  vitalAt,
  type Vital,
} from "./health";
import { runInt, runRandom } from "./rng";
import { bare, comp, has, patch, placeOf, type Game } from "./world";
import type { Body, BodyPart, DamageType, Id, Wound } from "./types";

export const PARTS: BodyPart[] = [
  "head",
  "neck",
  "torso",
  "armL",
  "armR",
  "handL",
  "handR",
  "legL",
  "legR",
  "footL",
  "footR",
];

/** Where a blow that strays from its target lands instead. */
export const NEIGHBOURS: Record<BodyPart, BodyPart[]> = {
  head: ["neck", "torso"],
  neck: ["head", "torso"],
  torso: ["neck", "armL", "armR", "legL", "legR"],
  armL: ["torso", "handL"],
  armR: ["torso", "handR"],
  handL: ["armL"],
  handR: ["armR"],
  legL: ["torso", "footL"],
  legR: ["torso", "footR"],
  footL: ["legL"],
  footR: ["legR"],
};

/** How often a blow aimed at nothing in particular lands on each part. */
const FREQUENCY: [BodyPart, number][] = [
  ["torso", 38],
  ["head", 8],
  ["neck", 2],
  ["armL", 10],
  ["armR", 10],
  ["handL", 4],
  ["handR", 4],
  ["legL", 10],
  ["legR", 10],
  ["footL", 2],
  ["footR", 2],
];

/** Small targets are harder to hit on purpose. */
export const SMALL_PARTS: BodyPart[] = [
  "head",
  "neck",
  "handL",
  "handR",
  "footL",
  "footR",
];

export function randomPart(g: Game): BodyPart {
  let roll = runInt(g.st, 100);
  for (const [part, weight] of FREQUENCY) {
    if (roll < weight) return part;
    roll -= weight;
  }
  return "torso";
}

export function strayPart(g: Game, aimed: BodyPart): BodyPart {
  const options = NEIGHBOURS[aimed];
  return options[runInt(g.st, options.length)];
}

/** "arm" without a side: either one. */
export function sidedPart(g: Game, aim: string): BodyPart {
  if ((PARTS as string[]).includes(aim)) return aim as BodyPart;
  const side = runRandom(g.st) < 0.5 ? "L" : "R";
  return `${aim}${side}` as BodyPart;
}

/** The hand on the same side as an arm or hand, if any. */
export function handSide(part: BodyPart): "left" | "right" | undefined {
  if (part === "armL" || part === "handL") return "left";
  if (part === "armR" || part === "handR") return "right";
  return undefined;
}

// Litres per hour, by damage type and severity (index 1 to 4).
const BLEED: Record<DamageType, number[]> = {
  slash: [0, 0, 0.7, 1.4, 3],
  pierce: [0, 0, 0.5, 1.6, 3.5],
  blunt: [0, 0, 0, 0, 0.6],
};

export function bodyOf(g: Game, id: Id): Body | undefined {
  return comp(g, id, "body");
}

/** Adds a wound. Returns the state of the person afterwards. */
export function inflict(
  ctx: Ctx,
  target: Id,
  part: BodyPart,
  type: DamageType,
  sev: Wound["sev"],
): Vital {
  const g = ctx.g;
  const clock = g.st.clock;
  const body = settle(bodyOf(g, target)!, clock);
  let bleed = body.profile === "undead" ? 0 : BLEED[type][sev];
  if (part === "neck") bleed *= 2;
  const wound: Wound = { part, type, sev, bleed, at: clock };
  const next: Body = { ...body, wounds: [...body.wounds, wound] };
  if (part === "head" && sev === 4) next.dead = true;
  else if (part === "head" && sev === 3 && body.profile === "living") {
    next.outUntil = clock + 10 + runInt(g.st, 25);
  }
  patch(g, target, "body", next);
  emit(ctx, { type: "wounded", target, sev });
  watchBodies(g);
  const vital = vitalAt(next, clock);
  if (vital === "dead") patch(g, target, "body", { dead: true });
  return vital;
}

/** Stops or slows the worst bleeding wound. */
export function treat(g: Game, target: Id): Wound | undefined {
  const clock = g.st.clock;
  const body = settle(bodyOf(g, target)!, clock);
  const open = body.wounds
    .filter((w) => !w.treated && (w.bleed > 0 || w.sev >= 2))
    .sort((a, b) => b.bleed - a.bleed || b.sev - a.sev)[0];
  if (!open) return undefined;
  const wounds = body.wounds.map((w) => {
    if (w !== open) return w;
    const bleed = w.sev === 4 ? w.bleed * 0.35 : w.sev === 3 ? 0.1 : 0;
    return { ...w, bleed, at: clock, treated: true };
  });
  patch(g, target, "body", { ...body, wounds });
  watchBodies(g);
  return open;
}

// ---------------------------------------------------------------------------
// A check every few minutes while someone bleeds, faints or heals. It folds
// the blood lost into the body and tells the player what changed.

const CHECK_EVERY = 5;

function needsWatching(body: Body, clock: number): boolean {
  if (body.dead) return false;
  return (
    bleeding(body, clock) > 0 ||
    bloodAt(body, clock) < NORMAL_BLOOD ||
    (body.outUntil ?? 0) > clock
  );
}

export function watchBodies(g: Game) {
  if (Number(g.st.flags.bodyCheckAt ?? -1) > g.st.clock) return;
  g.st.flags.bodyCheckAt = g.st.clock + CHECK_EVERY;
  schedule(g, { at: g.st.clock + CHECK_EVERY, type: "body.check" });
}

/** The last state the player was told about, to announce only changes. */
export function noteVital(g: Game, id: Id, vital: Vital) {
  g.st.flags[`vital.${id}`] = vital;
}

export const lastVital = (g: Game, id: Id) =>
  (g.st.flags[`vital.${id}`] as Vital | undefined) ?? "ok";

onScheduled("body.check", (ctx) => {
  const g = ctx.g;
  delete g.st.flags.bodyCheckAt;
  let again = false;
  for (const id of Object.keys(g.st.ent)) {
    const before = comp(g, id, "body");
    if (!before || before.dead) continue;
    const body = settle(before, g.st.clock);
    const now = vitalAt(body, g.st.clock);
    if (now === "dead") body.dead = true;
    patch(g, id, "body", body);
    const was = lastVital(g, id);
    if (now !== was) {
      noteVital(g, id, now);
      announce(ctx, id, was, now);
    }
    if (needsWatching(body, g.st.clock)) again = true;
  }
  if (again) watchBodies(g);
});

/** Tells the player about a change they can notice. */
export function announce(ctx: Ctx, id: Id, was: Vital, now: Vital) {
  const g = ctx.g;
  if (id === g.st.player) {
    if (now === "dead") {
      g.st.flags.dead = true;
      say(ctx, "you.bledOut");
    } else if (now === "down") say(ctx, "you.faint");
    else if (now === "weak" && was === "ok") {
      const body = comp(g, id, "body")!;
      say(
        ctx,
        bloodAt(body, g.st.clock) < WEAK_BLOOD ? "you.weak" : "you.hurt",
      );
    } else if (was === "down") say(ctx, "you.wake");
    ctx.interrupted = true;
    return;
  }
  if (!has(g, id, "actor") || placeOf(g, id) !== placeOf(g, g.st.player))
    return;
  const x = bare(g, id);
  if (now === "dead") say(ctx, "npc.dies", { x });
  else if (now === "down") say(ctx, "npc.faints", { x });
  else if (was === "down") say(ctx, "npc.wakes", { x });
  ctx.interrupted = true;
}

/** The worst wound, for descriptions and morale. */
export function worstWound(g: Game, id: Id): number {
  return Math.max(0, ...(bodyOf(g, id)?.wounds.map((w) => w.sev) ?? []));
}

export function isBleeding(g: Game, id: Id): boolean {
  const body = bodyOf(g, id);
  return !!body && bleeding(body, g.st.clock) > 0.05;
}

/** Searing a wound shut with a hot blade: no more bleeding, much pain. */
export function sear(g: Game, target: Id, index: number) {
  const clock = g.st.clock;
  const body = settle(bodyOf(g, target)!, clock);
  const wounds = body.wounds.map((w, i) =>
    i === index
      ? { ...w, bleed: 0, at: clock, treated: true, seared: true }
      : w,
  );
  patch(g, target, "body", { ...body, wounds });
}
