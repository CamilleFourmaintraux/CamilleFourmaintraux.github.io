// Shared types of the text game engine. The engine knows nothing about React
// or about a particular story: the content (templates, places, texts) is
// handed to it when a game is created.

export type Id = string;
export type Lang = "fr" | "en";

/** How an object is held. "none": it cannot be lifted at all. */
export type Grip = "one" | "two" | "none";

export interface Physical {
  /** Kilograms. */
  weight: number;
  /** Litres. */
  volume: number;
  /** Largest dimension, centimetres. */
  size: number;
  grip: Grip;
}

export type ContainerKind = "hand" | "pocket" | "bag" | "open";

export interface Container {
  kind: ContainerKind;
  maxWeight: number;
  maxVolume: number;
  /** Largest object that goes through the opening, centimetres. */
  opening: number;
}

export interface Exit {
  /** Compass or special direction: n, s, e, w, ne, nw, se, sw, up, down, in, out. */
  dir: string;
  to: Id;
  /** Walking time with no load. */
  minutes: number;
  /** Door between the two places, if any. */
  door?: Id;
}

/** When a place is too dark to see without a light. */
export type DarkRule = "never" | "night" | "evening" | "always";

export interface Place {
  exits: Exit[];
  outdoor: boolean;
  dark: DarkRule;
  /** What one lies on to sleep here. */
  ground?: "bed" | "floor" | "planks" | "cobbles" | "dirt";
  /** A town street: thieves about at night. */
  town?: boolean;
}

export interface Actor {
  // Hidden values, around 5 for an ordinary adult. Never shown to the player.
  strength: number;
  endurance: number;
  agility: number;
  dexterity: number;
  /** Know-how by family, 0 to 10. Missing means 1. */
  skills?: Partial<Record<Skill, number>>;
}

export type Skill =
  | "shortBlades"
  | "longBlades"
  | "axesMaces"
  | "polearms"
  | "unarmed"
  | "shield"
  | "shooting"
  | "throwing"
  | "lockpicking"
  | "larceny"
  | "stealth"
  | "eloquence"
  | "healing";

export type DamageType = "slash" | "pierce" | "blunt";

export type BodyPart =
  | "head"
  | "neck"
  | "torso"
  | "armL"
  | "armR"
  | "handL"
  | "handR"
  | "legL"
  | "legR"
  | "footL"
  | "footR";

export interface Weapon {
  type: DamageType;
  /** Around 2 for a fist, 5 for a club, 7 for a sword. */
  power: number;
  skill: Skill;
  /** Made to be thrown (a stone, a javelin). */
  thrown?: boolean;
}

/** Threshold removed from the power of a blow, by damage type. */
export interface Protection {
  slash: number;
  pierce: number;
  blunt: number;
}

export interface Wound {
  part: BodyPart;
  type: DamageType;
  /** 1 scratch, 2 light, 3 grave, 4 critical. */
  sev: 1 | 2 | 3 | 4;
  /** Litres per hour at `at`. Light wounds slow down on their own. */
  bleed: number;
  at: number;
  treated?: boolean;
  /** Closed with a hot blade rather than a bandage. */
  seared?: boolean;
}

export interface Body {
  /** Litres of blood at `at`. About 5 for an adult. */
  blood: number;
  at: number;
  wounds: Wound[];
  dead?: boolean;
  /** Knocked out until this clock time. */
  outUntil?: number;
  /** Undead feel no shock and do not bleed. */
  profile: "living" | "undead";
}

/** Hidden needs, 0 (fine) to 1 (dire), at clock `at`. */
export interface Needs {
  hunger: number;
  thirst: number;
  /** The need to sleep. */
  sleep: number;
  /** Physical tiredness, gone with rest. */
  fatigue: number;
  /** Litres in the stomach. */
  stomach: number;
  /** Litres of water drunk beyond thirst. */
  water: number;
  at: number;
  mode: "awake" | "rest" | "asleep";
  /** 0 to 1: how good the current bed is. */
  comfort?: number;
}

export interface Mind {
  /** What drives the behaviour: robber, civilian... */
  role: string;
  /** -100 hostile to 100 friendly, towards the player. */
  attitude: number;
  /** 0 to 100. Low morale flees or gives up. */
  morale: number;
  traits: string[];
  hostile?: boolean;
  surrendered?: boolean;
  fled?: boolean;
  /** The robber already took what he wanted. */
  satisfied?: boolean;
  /** Topics this person can talk about, by topic id. */
  topics?: Record<string, Topic>;
}

export interface Topic {
  /** Message key of the answer. */
  say: string;
  /** Lowest attitude needed, unless surrendered. */
  min?: number;
  /** Hands an item over after answering. */
  give?: Id;
  /** Only once the person gave up. */
  surrendered?: boolean;
}

/** Something that burns: a torch, a candle, a brazier. */
export interface Burn {
  lit: boolean;
  /** 0 to 1, as it was at `since`. */
  fuel: number;
  /** Fuel used per hour while lit. 0 burns forever. */
  rate: number;
  /** Clock time when `fuel` was recorded. */
  since: number;
  /** Bumped at every change so that stale scheduled events are ignored. */
  gen: number;
}

export interface Wearable {
  zone:
    | "head"
    | "torso"
    | "arms"
    | "hands"
    | "legs"
    | "feet"
    | "face"
    | "back"
    | "belt";
  layer: "clothes" | "armor" | "extra";
  /** Body parts it protects. */
  covers?: BodyPart[];
  protection?: Protection;
}

export interface Door {
  open: boolean;
  locked: boolean;
  /** Entity id of the key that opens it. */
  key?: Id;
}

export interface Edible {
  /** Effect once eaten. */
  effect?: "nausea";
  /** The character can tell it may be a bad idea. */
  dubious?: boolean;
  /** How much hunger it takes away, 0 to 1. */
  food?: number;
  /** Template of what is left once eaten (an apple core). */
  leaves?: string;
}

/** Something one can drink from or drink. */
export interface Drinkable {
  /** Litres left; absent for a fountain that never runs dry. */
  litres?: number;
}

/** All components an entity may have. Templates and instances share it. */
export interface Components {
  /** Key of the name in the language files. Defaults to the template id. */
  name?: { key: string };
  physical?: Physical;
  container?: Container;
  place?: Place;
  actor?: Actor;
  burn?: Burn;
  wearable?: Wearable;
  door?: Door;
  edible?: Edible;
  /** Can light other things (a fire, a lit torch has it implicitly). */
  fire?: { always: boolean };
  /** Can be destroyed by hand (torn, crushed). */
  destructible?: { by: "hands" };
  /** Part of a body (hand), never listed as an object. */
  part?: { side?: "left" | "right" };
  /** Described by the place text, not listed among the objects. */
  scenery?: { listed: false };
  weapon?: Weapon;
  body?: Body;
  mind?: Mind;
  needs?: Needs;
  drinkable?: Drinkable;
  /** Can heat a blade red (embers, a forge). */
  heats?: { yes: true };
  /** The sky above an outdoor place. */
  sky?: { yes: true };
  /** Clock until which a blade stays hot enough to sear a wound. */
  hot?: { until: number };
  /** Cloth that can be torn into bandages. */
  cloth?: { strips: number };
  /** Message shown the first time the player enters this place. */
  story?: { enter: string };
}

export type ComponentName = keyof Components;

export interface Template {
  c: Components;
}

export interface Entity {
  id: Id;
  tpl: string;
  /** Container entity (a place, a hand, a pocket...). null: out of the world. */
  loc: Id | null;
  /** Instance values, merged over the template's per component. */
  c: Components;
}

/** A reference to an entity frozen at the moment a message is written. */
export interface NameRef {
  n: string;
  /** State adjective key (lit, out...). */
  s?: string;
  /** Carried by the player: "your torch" rather than "the torch". */
  o?: true;
}

export type Param = string | number | NameRef | NameRef[] | Msg | Msg[];

/** A message is a key plus parameters, turned into text only when shown. */
export interface Msg {
  k: string;
  p?: Record<string, Param>;
  /** Variant index, picked with the run randomness. */
  v?: number;
}

export interface Turn {
  /** What the player typed. Empty for messages that open the game. */
  in: string;
  out: Msg[];
  /** Clock after the turn. */
  t: number;
}

export interface Scheduled {
  at: number;
  type: string;
  target?: Id;
  /** Destination of an arrival. */
  to?: Id;
  gen?: number;
  seq: number;
}

/** A meeting between the player and someone. */
export interface Encounter {
  mode: "talk" | "fight";
  /** An open question the player can answer yes or no to. */
  question?: string;
  /** Turns left before someone runs out of patience. */
  patience?: number;
  /** Opened this turn: no reaction until the player had a chance to act. */
  fresh?: boolean;
}

/** Everything an action needs once the words are resolved. */
export interface Intent {
  verb: string;
  obj?: Id[];
  ind?: Id;
  prep?: string;
  dir?: string;
  exit?: number;
  minutes?: number;
  until?: number;
  all?: boolean;
  /** Body part aimed at, or a side-less "arm". */
  aim?: string;
  /** Conversation topic. */
  topic?: string;
  /** How much to drink. */
  amount?: "sip" | "lots";
  /** Words of the indirect object, kept while the direct one is asked. */
  indWords?: string[];
}

export type Pending =
  | { kind: "confirm"; raw: string; intent: Intent; risk: string }
  | {
      kind: "which";
      intent: Intent;
      slot: "obj" | "ind";
      options: Id[];
    }
  | { kind: "what"; intent: Intent; slot: "obj" | "ind" };

export interface State {
  /** Save format version. */
  v: number;
  clock: number;
  /** Seed of this run, drawn at the start of a new game. */
  seed: number;
  /** State of the run randomness. */
  rng: number;
  ent: Record<Id, Entity>;
  queue: Scheduled[];
  pending?: Pending;
  /** Risk kind -> clock of the last confirmation. */
  confirmed: Record<string, number>;
  /** Last objects referred to, for "it". */
  it: Id[];
  flags: Record<string, number | string | boolean>;
  journal: Turn[];
  player: Id;
  seq: number;
  /** Open encounters, by person. */
  enc: Record<Id, Encounter>;
  /** The player defends this round. */
  defending?: boolean;
}
