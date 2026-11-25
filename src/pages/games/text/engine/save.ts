// Saves keep only what differs from the starting world, plus the clock and
// the run randomness. The world randomness (weather...) is recomputed, never
// saved. Each save carries its format version; migrations bring an old save
// up to date one version at a time.

import {
  SAVE_VERSION,
  initialEntities,
  type Content,
  type Game,
} from "./world";
import { schedule } from "./core";
import { startNeeds } from "./needs";
import type { Entity, Id, State } from "./types";

export interface SaveData {
  v: number;
  /** Content version the save was made with. */
  cv: number;
  /** Changed or new entities; null for removed ones. */
  changed: Record<Id, Entity | null>;
  state: Omit<State, "ent">;
}

/** Version n -> n + 1. */
const MIGRATIONS: ((save: SaveData) => SaveData)[] = [
  // 1 -> 2: encounters with people.
  (save) => ({ ...save, v: 2, state: { ...save.state, enc: {} } }),
];

export function serialize(g: Game): string {
  const initial = initialEntities(g.content);
  const changed: Record<Id, Entity | null> = {};
  for (const [id, entity] of Object.entries(g.st.ent)) {
    if (JSON.stringify(entity) !== JSON.stringify(initial[id]))
      changed[id] = entity;
  }
  for (const id of Object.keys(initial)) {
    if (!g.st.ent[id]) changed[id] = null;
  }
  const { ent: _ent, ...state } = g.st;
  void _ent;
  const save: SaveData = {
    v: SAVE_VERSION,
    cv: g.content.version,
    changed,
    state,
  };
  return JSON.stringify(save);
}

export function deserialize(content: Content, text: string): Game {
  let save = JSON.parse(text) as SaveData;
  if (typeof save.v !== "number" || save.v > SAVE_VERSION)
    throw new Error("Unknown save version");
  while (save.v < SAVE_VERSION) save = MIGRATIONS[save.v - 1](save);
  const ent = initialEntities(content);
  for (const [id, entity] of Object.entries(save.changed)) {
    if (entity === null) delete ent[id];
    else ent[id] = entity;
  }
  const g: Game = { content, st: { ...save.state, v: SAVE_VERSION, ent } };
  // Newer content: planned events that the old game never got, if their
  // time has not passed yet.
  if (save.cv !== content.version) {
    for (const event of content.schedule ?? []) {
      const known = g.st.queue.some(
        (e) => e.type === event.type && e.target === event.target,
      );
      if (!known && event.at > g.st.clock) schedule(g, event);
    }
  }
  // Systems added since the save was made start running now.
  startNeeds(g);
  return g;
}
