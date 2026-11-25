// The first test scene: a dark alley of the lower town, at nightfall.
// Templates hold what never changes; entities place instances in the world.

import type { Components, Template } from "../engine/types";
import { comp, fuelLeft, within, type Game } from "../engine/world";

const START = 21 * 60; // Day 0 (Lundas), 9 pm.

const hand = (side: "left" | "right"): Template => ({
  c: {
    part: { side },
    container: { kind: "hand", maxWeight: 999, maxVolume: 999, opening: 999 },
  },
});

const pocket: Template = {
  c: {
    container: { kind: "pocket", maxWeight: 1, maxVolume: 0.5, opening: 15 },
  },
};

/** Weight kg, volume L, size cm, grip. */
const thing = (
  weight: number,
  volume: number,
  size: number,
  grip: "one" | "two" = "one",
  more: Components = {},
): Template => ({ c: { physical: { weight, volume, size, grip }, ...more } });

const scenery: Components = { scenery: { listed: false } };

/** Ordinary clothes stop little. */
const CLOTH = { slash: 0.5, pierce: 0.2, blunt: 0.3 };

export const templates: Record<string, Template> = {
  // Places.
  alley: {
    c: {
      place: {
        outdoor: true,
        ground: "cobbles",
        town: true,
        dark: "evening",
        exits: [
          { dir: "n", to: "tanners", minutes: 2 },
          { dir: "e", to: "yard", minutes: 1 },
          { dir: "w", to: "tavern", minutes: 1, door: "tavern-door" },
        ],
      },
    },
  },
  tanners: {
    c: {
      place: {
        outdoor: true,
        ground: "cobbles",
        town: true,
        dark: "night",
        exits: [{ dir: "s", to: "alley", minutes: 2 }],
      },
    },
  },
  yard: {
    c: {
      place: {
        outdoor: true,
        ground: "planks",
        dark: "evening",
        exits: [{ dir: "w", to: "alley", minutes: 1 }],
      },
    },
  },
  tavern: {
    c: {
      place: {
        outdoor: false,
        ground: "floor",
        dark: "always",
        exits: [{ dir: "e", to: "alley", minutes: 1, door: "tavern-door" }],
      },
      story: { enter: "chapter.end" },
    },
  },
  "tavern-door": {
    c: { door: { open: false, locked: true, key: "tavern-key" }, ...scenery },
  },

  // The player's body and clothes.
  player: {
    c: {
      actor: {
        strength: 5,
        endurance: 5,
        agility: 5,
        dexterity: 5,
        skills: {
          shortBlades: 2,
          longBlades: 2,
          axesMaces: 2,
          unarmed: 2,
          throwing: 2,
          eloquence: 3,
          healing: 2,
        },
      },
      physical: { weight: 70, volume: 70, size: 175, grip: "none" },
      body: { blood: 5, at: START, wounds: [], profile: "living" },
      needs: {
        hunger: 0.3,
        thirst: 0.3,
        sleep: 0.35,
        fatigue: 0.1,
        stomach: 0.2,
        water: 0,
        at: START,
        mode: "awake",
      },
    },
  },
  "hand-right": hand("right"),
  "hand-left": hand("left"),
  trousers: thing(0.6, 1, 100, "one", {
    wearable: {
      zone: "legs",
      layer: "clothes",
      covers: ["legL", "legR"],
      protection: CLOTH,
    },
  }),
  shirt: thing(0.3, 0.8, 80, "one", {
    wearable: {
      zone: "torso",
      layer: "clothes",
      covers: ["torso", "armL", "armR"],
      protection: CLOTH,
    },
    cloth: { strips: 3, makes: "strip" },
  }),
  "pocket-left": pocket,
  "pocket-right": pocket,
  purse: thing(0.05, 0.2, 10, "one", {
    container: { kind: "bag", maxWeight: 1, maxVolume: 0.3, opening: 8 },
  }),
  coins: thing(0.1, 0.02, 2, "one", { money: { yes: true } }),
  torch: thing(0.6, 0.5, 50, "one", {
    burn: { lit: false, fuel: 1, rate: 0.25, since: 0, gen: 0 },
  }),

  // Things in the alley.
  barrel: thing(25, 60, 80, "two", {
    container: { kind: "open", maxWeight: 60, maxVolume: 50, opening: 50 },
  }),
  letter: thing(0.01, 0.01, 20, "one", { destructible: { by: "hands" } }),
  apple: thing(0.2, 0.25, 8, "one", {
    edible: { food: 0.15, leaves: "apple-core" },
  }),
  "apple-core": thing(0.02, 0.03, 5, "one", { edible: { food: 0.01 } }),
  strip: thing(0.02, 0.02, 5, "one", { cloth: { strips: 1 } }),
  crate: thing(90, 80, 70, "two", { stock: { tpl: "nail", count: 200 } }),
  nail: thing(0.01, 0.005, 6, "one", {
    weapon: { type: "pierce", power: 1, skill: "shortBlades" },
  }),
  wall: { c: scenery },
  sky: { c: { ...scenery, sky: { yes: true } } },
  roofs: { c: scenery },
  stalls: { c: scenery },
  planks: { c: scenery },
  cobbles: { c: scenery },

  // Tanners' Street.
  dagger: thing(0.4, 0.2, 30, "one", {
    weapon: { type: "pierce", power: 4, skill: "shortBlades" },
  }),
  stone: thing(0.5, 0.2, 10, "one", {
    weapon: { type: "blunt", power: 3, skill: "throwing", thrown: true },
  }),
  fountain: { c: { ...scenery, drinkable: {} } },

  // Back yard.
  brazier: {
    c: {
      ...scenery,
      burn: { lit: true, fuel: 1, rate: 0, since: 0, gen: 0 },
      fire: { always: true },
      heats: { yes: true },
    },
  },
  mushroom: thing(0.05, 0.05, 6, "one", {
    edible: { dubious: true, effect: "nausea", food: 0.02 },
  }),
  sword: thing(1.4, 1, 100, "one", {
    weapon: { type: "slash", power: 7, skill: "longBlades" },
  }),

  // Rask, the robber who waits in the alley.
  bandit: {
    c: {
      actor: {
        strength: 6,
        endurance: 5,
        agility: 5,
        dexterity: 4,
        skills: { axesMaces: 3, unarmed: 3 },
      },
      physical: { weight: 75, volume: 75, size: 180, grip: "none" },
      body: { blood: 5, at: START, wounds: [], profile: "living" },
      mind: {
        role: "robber",
        attitude: -40,
        morale: 55,
        traits: ["greedy", "cruel"],
        topics: {
          self: { say: "rask.self" },
          letter: { say: "rask.letter", surrendered: true },
          tavern: { say: "rask.tavern", surrendered: true },
          key: { say: "rask.key", surrendered: true, give: "tavern-key" },
        },
      },
    },
  },
  cudgel: thing(1.2, 1, 70, "one", {
    weapon: { type: "blunt", power: 5, skill: "axesMaces" },
  }),
  jerkin: thing(2, 3, 70, "one", {
    wearable: {
      zone: "torso",
      layer: "armor",
      covers: ["torso"],
      protection: { slash: 2, pierce: 1.5, blunt: 1.5 },
    },
  }),
  pouch: thing(0.1, 0.4, 15, "one", {
    container: { kind: "bag", maxWeight: 2, maxVolume: 0.6, opening: 10 },
  }),
  key: thing(0.05, 0.01, 8),

  // The drunk tanner of Tanners' Street.
  tanner: {
    c: {
      actor: { strength: 4, endurance: 4, agility: 3, dexterity: 4 },
      physical: { weight: 65, volume: 65, size: 170, grip: "none" },
      body: { blood: 5, at: START, wounds: [], profile: "living" },
      mind: {
        role: "civilian",
        attitude: 20,
        morale: 20,
        traits: ["fearful", "drunk", "hungry"],
        topics: {
          tavern: { say: "tanner.tavern" },
          bandit: { say: "tanner.bandit" },
          letter: { say: "tanner.letter" },
          key: { say: "tanner.key", min: 50 },
          self: { say: "tanner.self" },
          town: { say: "tanner.town" },
        },
      },
    },
  },
  bottle: thing(0.8, 1, 30, "one", { drinkable: { litres: 0 } }),
  apron: thing(1, 2, 90, "one", {
    wearable: {
      zone: "torso",
      layer: "clothes",
      covers: ["torso", "legL", "legR"],
      protection: { slash: 1, pierce: 0.5, blunt: 0.5 },
    },
  }),
};

export const entities: {
  id: string;
  tpl: string;
  loc: string | null;
  c?: Components;
}[] = [
  { id: "alley", tpl: "alley", loc: null },
  { id: "tanners", tpl: "tanners", loc: null },
  { id: "yard", tpl: "yard", loc: null },
  { id: "tavern", tpl: "tavern", loc: null },
  { id: "tavern-door", tpl: "tavern-door", loc: "alley" },

  { id: "player", tpl: "player", loc: "alley" },
  { id: "player-hand-right", tpl: "hand-right", loc: "player" },
  { id: "player-hand-left", tpl: "hand-left", loc: "player" },
  {
    id: "torch",
    tpl: "torch",
    loc: "player-hand-right",
    c: { burn: { lit: true, fuel: 0.3, rate: 0.25, since: START, gen: 0 } },
  },
  { id: "shirt", tpl: "shirt", loc: "player" },
  { id: "trousers", tpl: "trousers", loc: "player" },
  { id: "pocket-left", tpl: "pocket-left", loc: "trousers" },
  { id: "pocket-right", tpl: "pocket-right", loc: "trousers" },
  { id: "purse", tpl: "purse", loc: "pocket-left" },
  { id: "coins", tpl: "coins", loc: "purse" },

  { id: "wall", tpl: "wall", loc: "alley" },
  { id: "alley-sky", tpl: "sky", loc: "alley" },
  { id: "alley-roofs", tpl: "roofs", loc: "alley" },
  { id: "tanners-sky", tpl: "sky", loc: "tanners" },
  { id: "tanners-roofs", tpl: "roofs", loc: "tanners" },
  { id: "tanners-cobbles", tpl: "cobbles", loc: "tanners" },
  { id: "stalls", tpl: "stalls", loc: "tanners" },
  { id: "yard-sky", tpl: "sky", loc: "yard" },
  { id: "planks", tpl: "planks", loc: "yard" },
  { id: "cobbles", tpl: "cobbles", loc: "alley" },
  { id: "barrel", tpl: "barrel", loc: "alley" },
  { id: "letter", tpl: "letter", loc: "barrel" },
  { id: "apple", tpl: "apple", loc: "alley" },
  { id: "crate", tpl: "crate", loc: "alley" },

  { id: "fountain", tpl: "fountain", loc: "tanners" },
  { id: "dagger", tpl: "dagger", loc: "tanners" },
  { id: "stone", tpl: "stone", loc: "tanners" },

  { id: "brazier", tpl: "brazier", loc: "yard" },
  { id: "mushroom", tpl: "mushroom", loc: "yard" },
  { id: "sword", tpl: "sword", loc: "yard" },

  // Rask arrives a little after the player, out of nowhere.
  { id: "bandit", tpl: "bandit", loc: null },
  { id: "bandit-hand-right", tpl: "hand-right", loc: "bandit" },
  { id: "bandit-hand-left", tpl: "hand-left", loc: "bandit" },
  { id: "cudgel", tpl: "cudgel", loc: "bandit-hand-right" },
  { id: "jerkin", tpl: "jerkin", loc: "bandit" },
  { id: "pouch", tpl: "pouch", loc: "bandit" },
  { id: "bandit-coins", tpl: "coins", loc: "pouch" },
  { id: "tavern-key", tpl: "key", loc: "pouch" },

  { id: "tanner", tpl: "tanner", loc: "tanners" },
  { id: "tanner-hand-right", tpl: "hand-right", loc: "tanner" },
  { id: "tanner-hand-left", tpl: "hand-left", loc: "tanner" },
  { id: "bottle", tpl: "bottle", loc: "tanner-hand-right" },
  { id: "apron", tpl: "apron", loc: "tanner" },
];

export const schedule = [
  { at: START + 25, type: "arrive", target: "bandit", to: "alley" },
];

export const SCENE = {
  start: START,
  player: "player",
  worldSeed: 0x5eed1e55,
  version: 3,
};

/** "Think": what the character might do next in this scene, first match. */
const doorLocked = (g: Game) => !!comp(g, "tavern-door", "door")?.locked;
const hasKey = (g: Game) =>
  !!g.st.ent["tavern-key"] && within(g, "tavern-key", g.st.player);
export const hints: { key: string; when: (g: Game) => boolean }[] = [
  {
    key: "hint.torch",
    when: (g) =>
      !!g.st.ent.torch &&
      within(g, "torch", g.st.player) &&
      fuelLeft(g, "torch") <= 0 &&
      (g.st.visited ?? []).includes("yard"),
  },
  { key: "hint.letter", when: (g) => !g.st.flags["seen.letter"] },
  { key: "hint.key", when: (g) => doorLocked(g) && hasKey(g) },
  {
    key: "hint.robber",
    when: (g) =>
      doorLocked(g) &&
      !!g.st.ent.bandit?.loc &&
      !!g.st.ent["tavern-key"] &&
      within(g, "tavern-key", "bandit"),
  },
  { key: "hint.tanner", when: (g) => !g.st.flags["talked.tanner"] },
  { key: "hint.door", when: (g) => doorLocked(g) },
  { key: "hint.inside", when: () => true },
];
