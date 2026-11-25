// The world: entities, their components and where each one is.
//
// Every entity has exactly one position, which is another entity: a place, a
// hand, a pocket, a barrel. Together they form a tree, so the weight someone
// carries is the sum of a subtree, dropping something is changing its
// position, and searching a body is listing its subtree.

import type {
  ComponentName,
  Components,
  Entity,
  Id,
  Lang,
  NameRef,
  Skill,
  State,
  Template,
} from "./types";
import type { LangData } from "./lang";
import { vitalAt, type Vital } from "./health";

export interface Content {
  /** Version of the content. A new version may move the world seed. */
  version: number;
  worldSeed: number;
  /** Clock at the start of a game, in minutes since day 0 at midnight. */
  start: number;
  player: Id;
  templates: Record<string, Template>;
  entities: { id: Id; tpl: string; loc: Id | null; c?: Components }[];
  /** Events planned from the start: arrivals, departures. */
  schedule?: { at: number; type: string; target?: Id; to?: Id }[];
  langs: Record<Lang, LangData>;
}

/** A running game: the content (never changes) and the state (saved). */
export interface Game {
  content: Content;
  st: State;
  /** Cache of the children of each entity, rebuilt after a move. */
  index?: Map<Id, Id[]>;
}

export const SAVE_VERSION = 2;

export function initialEntities(content: Content): Record<Id, Entity> {
  const ent: Record<Id, Entity> = {};
  for (const { id, tpl, loc, c } of content.entities) {
    if (!content.templates[tpl]) throw new Error(`Unknown template ${tpl}`);
    ent[id] = { id, tpl, loc, c: structuredClone(c ?? {}) };
  }
  return ent;
}

export function newState(content: Content, seed: number): State {
  return {
    v: SAVE_VERSION,
    clock: content.start,
    seed,
    rng: seed >>> 0,
    ent: initialEntities(content),
    queue: [],
    confirmed: {},
    it: [],
    flags: {},
    journal: [],
    player: content.player,
    seq: 0,
    enc: {},
  };
}

/** A component as the entity sees it: template values, then its own. */
export function comp<K extends ComponentName>(
  g: Game,
  id: Id,
  key: K,
): Components[K] | undefined {
  const e = g.st.ent[id];
  if (!e) return undefined;
  const own = e.c[key];
  const base = g.content.templates[e.tpl]?.c[key];
  if (own === undefined) return base;
  if (base === undefined) return own;
  return { ...base, ...own } as Components[K];
}

export function has(g: Game, id: Id, key: ComponentName): boolean {
  return comp(g, id, key) !== undefined;
}

/** Changes some fields of a component on this entity only. */
export function patch<K extends ComponentName>(
  g: Game,
  id: Id,
  key: K,
  values: Partial<NonNullable<Components[K]>>,
) {
  const e = g.st.ent[id];
  const current = comp(g, id, key) ?? {};
  e.c[key] = { ...current, ...values } as Components[K];
}

export function children(g: Game, id: Id): Id[] {
  if (!g.index) {
    g.index = new Map();
    for (const e of Object.values(g.st.ent)) {
      if (e.loc === null) continue;
      const list = g.index.get(e.loc);
      if (list) list.push(e.id);
      else g.index.set(e.loc, [e.id]);
    }
  }
  return g.index.get(id) ?? [];
}

export function move(g: Game, id: Id, to: Id | null) {
  g.st.ent[id].loc = to;
  g.index = undefined;
}

/** Removes an entity and everything inside it from the world. */
export function destroy(g: Game, id: Id) {
  for (const child of [...children(g, id)]) destroy(g, child);
  delete g.st.ent[id];
  g.index = undefined;
}

/** The entity itself, then everything inside it, depth first. */
export function subtree(g: Game, id: Id): Id[] {
  const out = [id];
  for (const child of children(g, id)) out.push(...subtree(g, child));
  return out;
}

/** Is `id` somewhere inside `root` (or root itself)? */
export function within(g: Game, id: Id, root: Id): boolean {
  for (let at: Id | null = id; at; at = g.st.ent[at]?.loc ?? null) {
    if (at === root) return true;
  }
  return false;
}

export function placeOf(g: Game, id: Id): Id {
  for (let at: Id | null = id; at; at = g.st.ent[at]?.loc ?? null) {
    if (has(g, at, "place")) return at;
  }
  throw new Error(`${id} is in no place`);
}

export function nameKey(g: Game, id: Id): string {
  return comp(g, id, "name")?.key ?? g.st.ent[id].tpl;
}

/** State adjective shown with the name ("lit torch"). */
export function nameState(g: Game, id: Id): string | undefined {
  const body = comp(g, id, "body");
  if (body && id !== g.st.player) {
    const vital = vitalAt(body, g.st.clock);
    if (vital === "dead" || vital === "down") return vital;
  }
  // A shirt torn into bandages shows it.
  const cloth = comp(g, id, "cloth");
  const whole = g.content.templates[g.st.ent[id]?.tpl ?? ""]?.c.cloth?.strips;
  if (cloth && whole !== undefined && cloth.strips < whole) return "torn";
  const burn = comp(g, id, "burn");
  if (burn && burn.rate > 0) {
    if (burn.lit) return "lit";
    return fuelLeft(g, id) <= 0 ? "spent" : "out";
  }
  return undefined;
}

/** Freezes the name of an entity for a message. */
export function ref(g: Game, id: Id): NameRef {
  const out = bare(g, id);
  const s = nameState(g, id);
  if (s) out.s = s;
  return out;
}

/** The name alone, without its state ("the torch", not "the lit torch"). */
export function bare(g: Game, id: Id): NameRef {
  const out: NameRef = { n: nameKey(g, id) };
  if (id !== g.st.player && within(g, id, g.st.player)) out.o = true;
  return out;
}

export function refs(g: Game, ids: Id[]): NameRef[] {
  return ids.map((id) => ref(g, id));
}

/** Fuel left now, computed from the time elapsed rather than ticked. */
export function fuelLeft(g: Game, id: Id): number {
  const burn = comp(g, id, "burn");
  if (!burn) return 0;
  if (!burn.lit || burn.rate === 0) return burn.fuel;
  const used = (burn.rate * (g.st.clock - burn.since)) / 60;
  return Math.max(0, burn.fuel - used);
}

export function isLit(g: Game, id: Id): boolean {
  const burn = comp(g, id, "burn");
  return !!burn && burn.lit && (burn.rate === 0 || fuelLeft(g, id) > 0);
}

/** Objects that can give fire: a lit brazier, a lit torch. */
export function givesFire(g: Game, id: Id): boolean {
  const fire = comp(g, id, "fire");
  if (fire?.always) return true;
  return isLit(g, id);
}

// ---------------------------------------------------------------------------
// Bodies, hands and what is worn.

export function hands(g: Game, actor: Id): { left?: Id; right?: Id } {
  const out: { left?: Id; right?: Id } = {};
  for (const child of children(g, actor)) {
    const part = comp(g, child, "part");
    if (part?.side && comp(g, child, "container")?.kind === "hand") {
      out[part.side] = child;
    }
  }
  return out;
}

/** What a hand holds, including a two-handed object held by the other. */
export function heldIn(g: Game, hand: Id): Id | undefined {
  return children(g, hand)[0];
}

/** Hands that hold nothing, a two-handed object filling both. */
export function freeHands(g: Game, actor: Id): Id[] {
  const { left, right } = hands(g, actor);
  const twoHanded = [left, right].some((hand) => {
    const item = hand ? heldIn(g, hand) : undefined;
    return item !== undefined && comp(g, item, "physical")?.grip === "two";
  });
  if (twoHanded) return [];
  return [right, left].filter(
    (hand): hand is Id => !!hand && heldIn(g, hand) === undefined,
  );
}

export function worn(g: Game, actor: Id): Id[] {
  return children(g, actor).filter((id) => has(g, id, "wearable"));
}

/** Total weight of an entity and of everything inside it. */
export function weightOf(g: Game, id: Id): number {
  let total = comp(g, id, "physical")?.weight ?? 0;
  for (const child of children(g, id)) total += weightOf(g, child);
  return total;
}

/** Volume taken inside a container by what it holds. */
export function volumeUsed(g: Game, id: Id): number {
  return children(g, id).reduce(
    (sum, child) => sum + (comp(g, child, "physical")?.volume ?? 0),
    0,
  );
}

export function weightInside(g: Game, id: Id): number {
  return children(g, id).reduce((sum, child) => sum + weightOf(g, child), 0);
}

// ---------------------------------------------------------------------------
// Capacities derived from the hidden values.

export function strength(g: Game, actor: Id): number {
  return comp(g, actor, "actor")?.strength ?? 5;
}

/** Heaviest object one hand can lift, kilograms. */
export const liftOneHand = (g: Game, actor: Id) => 2 * strength(g, actor);
/** Heaviest object both hands can lift. */
export const liftTwoHands = (g: Game, actor: Id) => 7 * strength(g, actor);
/** Load carried without slowing down much. */
export const carryCapacity = (g: Game, actor: Id) => 6 * strength(g, actor);

export type LoadTier = "light" | "loaded" | "heavy" | "overloaded";

export function loadTier(g: Game, actor: Id): LoadTier {
  const ratio =
    (weightOf(g, actor) - bodyWeight(g, actor)) / carryCapacity(g, actor);
  if (ratio < 0.4) return "light";
  if (ratio < 0.7) return "loaded";
  if (ratio < 1) return "heavy";
  return "overloaded";
}

function bodyWeight(g: Game, actor: Id) {
  return comp(g, actor, "physical")?.weight ?? 0;
}

/** Travel time multiplier of each load tier. */
export const LOAD_SLOWDOWN: Record<LoadTier, number> = {
  light: 1,
  loaded: 1.25,
  heavy: 1.6,
  overloaded: 3,
};

// ---------------------------------------------------------------------------
// People.

export function vital(g: Game, id: Id): Vital {
  const body = comp(g, id, "body");
  return body ? vitalAt(body, g.st.clock) : "ok";
}

/** Awake and able to act. */
export const conscious = (g: Game, id: Id) => {
  const v = vital(g, id);
  return v === "ok" || v === "weak";
};

/** Other people in a place, alive or not. */
export function peopleIn(g: Game, place: Id): Id[] {
  return children(g, place).filter(
    (id) => id !== g.st.player && has(g, id, "actor"),
  );
}

export function skill(g: Game, actor: Id, name: Skill): number {
  return comp(g, actor, "actor")?.skills?.[name] ?? 1;
}

/** Creates a new entity from a template (what is left of an apple...). */
export function spawn(g: Game, tpl: string, loc: Id): Id {
  const id = `${tpl}#${g.st.seq++}`;
  g.st.ent[id] = { id, tpl, loc, c: {} };
  g.index = undefined;
  return id;
}
