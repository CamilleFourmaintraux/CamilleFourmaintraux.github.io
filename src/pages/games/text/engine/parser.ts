// From typed text to an intent: which verb, which objects, which direction
// or duration. The parser reads French and English, whatever the language
// of the interface, and looks for names among what the player can perceive.

import {
  comp,
  children,
  conscious,
  hands,
  has,
  heldIn,
  nameKey,
  nameState,
  placeOf,
  subtree,
  within,
  type Game,
} from "./world";
import { isDark } from "./systems";
import type { LangData } from "./lang";
import type { Id, Intent, Lang, Pending } from "./types";

/** What each verb expects after it. */
export const VERBS: Record<
  string,
  {
    obj?: "one" | "many";
    ind?: boolean;
    dir?: boolean;
    duration?: boolean;
    /** The object may be left out: the verb finds the obvious one. */
    optional?: boolean;
    /** A body part can be named ("at the head"). */
    aim?: boolean;
    /** About a person, with an optional topic. */
    people?: boolean;
  }
> = {
  look: {},
  examine: { obj: "one" },
  go: { dir: true },
  exits: {},
  take: { obj: "many", ind: true },
  drop: { obj: "many", ind: true },
  put: { obj: "many", ind: true },
  inventory: {},
  wait: { duration: true },
  rest: { duration: true },
  time: {},
  status: {},
  help: {},
  light: { obj: "one", ind: true },
  extinguish: { obj: "one" },
  eat: { obj: "one" },
  destroy: { obj: "one" },
  open: { obj: "one" },
  close: { obj: "one" },
  attack: { obj: "one", ind: true, aim: true, optional: true },
  defend: {},
  throw: { obj: "one", ind: true, aim: true },
  bandage: { obj: "one", aim: true, optional: true },
  wear: { obj: "one" },
  takeoff: { obj: "one" },
  give: { obj: "one", ind: true },
  shout: {},
  talk: { people: true },
  ask: { people: true },
  threaten: { people: true },
  persuade: { people: true },
  lie: { people: true },
  beg: { people: true },
  insult: { people: true },
  bribe: { people: true },
  flee: {},
  spare: { people: true },
  surrender: {},
  apologize: { people: true },
  thank: { people: true },
  drink: { obj: "one", optional: true },
  sleep: {},
  cauterize: { obj: "one", aim: true, optional: true },
  burn: { obj: "one" },
  tear: { obj: "one", optional: true },
  wrap: { obj: "one", ind: true },
  swap: {},
  load: {},
  use: { obj: "one", ind: true },
  heat: { obj: "one", ind: true, optional: true },
  meta: {},
};

export type Parsed =
  | { kind: "empty" }
  | { kind: "yes" }
  | { kind: "no" }
  | { kind: "intent"; intent: Intent }
  | { kind: "unknownVerb"; word: string }
  | { kind: "unknownWord"; word: string }
  | { kind: "notHere"; dark: boolean }
  | { kind: "noExit" }
  | { kind: "question" }
  | { kind: "notYet"; word: string }
  | { kind: "relative" }
  | { kind: "meta" }
  | { kind: "mood"; mood: string }
  | { kind: "impossible" }
  | { kind: "far" }
  | { kind: "which"; intent: Intent; slot: "obj" | "ind"; options: Id[] }
  | { kind: "what"; intent: Intent; slot: "obj" | "ind" };

// ---------------------------------------------------------------------------
// Words.

const fold = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’`´]/g, "'")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae");

/** Light stemming so that plurals match: "pommes" -> "pomme". */
const stem = (word: string) =>
  word.length > 3 && /[sx]$/.test(word) ? word.slice(0, -1) : word;

export function tokenize(L: LangData[], text: string): string[] {
  // English contractions: "don't" -> "do not", "let's" -> "let us".
  let folded = fold(text)
    .replace(/n't\b/g, " not")
    .replace(/\b(let)'s\b/g, "$1 us")
    .replace(/'(s|re|ll|d|ve|m)\b/g, " $1");
  // Elisions: "l'épée" -> "le epee", "jusqu'au" -> "jusque au".
  folded = folded.replace(/\b([a-z]+)'/g, (_whole, word: string) => {
    for (const lang of L) {
      if (lang.elisions[word]) return ` ${lang.elisions[word]} `;
    }
    return ` ${word} `;
  });
  return folded
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

const normalized = new WeakMap<LangData, LangData>();

/** The word lists of a language, folded like typed text (no accents). */
function normalize(L: LangData): LangData {
  const cached = normalized.get(L);
  if (cached) return cached;
  const words = (list: string[]) => list.map(fold);
  const keys = <T>(record: Record<string, T>) =>
    Object.fromEntries(
      Object.entries(record).map(([k, v]) => [fold(k), v]),
    ) as Record<string, T>;
  const lists = (record: Record<string, string[]>) =>
    Object.fromEntries(Object.entries(record).map(([k, v]) => [k, words(v)]));
  const out: LangData = {
    ...L,
    stop: words(L.stop),
    pronouns: words(L.pronouns),
    all: words(L.all),
    yes: words(L.yes),
    no: words(L.no),
    until: words(L.until),
    preps: lists(L.preps),
    softPreps: lists(L.softPreps),
    topics: lists(L.topics),
    questions: words(L.questions),
    later: words(L.later),
    relative: words(L.relative),
    back: words(L.back),
    fillers: words(L.fillers),
    copulas: words(L.copulas),
    meta: words(L.meta),
    impossible: words(L.impossible),
    andWords: words(L.andWords),
    moods: lists(L.moods),
    lots: words(L.lots),
    sip: words(L.sip),
    dirs: lists(L.dirs),
    numbers: keys(L.numbers),
    units: keys(L.units),
    times: keys(L.times),
    ordinals: keys(L.ordinals),
    elisions: Object.fromEntries(
      Object.entries(L.elisions).map(([k, v]) => [fold(k), fold(v)]),
    ),
  };
  normalized.set(L, out);
  return out;
}

/** The languages to read with: the interface one first, then the other. */
export function langsFor(g: Game, lang: Lang): LangData[] {
  const other: Lang = lang === "fr" ? "en" : "fr";
  return [normalize(g.content.langs[lang]), normalize(g.content.langs[other])];
}

function wordSet(L: LangData[], words: string[]): Set<string> {
  return new Set(words.flatMap((w) => tokenize(L, w)).map(stem));
}

/** Every word that names this entity, in both languages. */
function namesOf(g: Game, L: LangData[], id: Id): Set<string> {
  const key = nameKey(g, id);
  const state = nameState(g, id);
  const words: string[] = [];
  for (const lang of L) {
    const def = lang.names[key];
    if (!def) continue;
    words.push(def.n, ...(def.w ?? []));
    if (state && def.adj?.[state]) words.push(def.adj[state]);
  }
  const stop = new Set(L.flatMap((lang) => lang.stop));
  return new Set([...wordSet(L, words)].filter((w) => !stop.has(w)));
}

/** Everything the player can refer to right now. */
export function scope(g: Game): Id[] {
  const player = g.st.player;
  const own = subtree(g, player);
  const place = placeOf(g, player);
  // In the dark, people nearby are still heard, and what lies on the
  // ground can be found by feeling around. Not their belongings.
  if (isDark(g, place)) {
    return [
      ...own,
      ...children(g, place).filter(
        (id) =>
          id !== player &&
          (has(g, id, "actor") ||
            (!has(g, id, "scenery") && !has(g, id, "place"))),
      ),
    ];
  }
  const seen = new Set(own);
  const visit = (id: Id) => {
    if (seen.has(id)) return;
    seen.add(id);
    // Someone awake shows what they hold and wear, not their pockets.
    if (has(g, id, "actor") && id !== player) {
      const open = !conscious(g, id) || comp(g, id, "mind")?.surrendered;
      for (const child of children(g, id)) {
        if (open) visit(child);
        else if (has(g, child, "wearable")) seen.add(child);
        else if (comp(g, child, "container")?.kind === "hand") {
          for (const held of children(g, child)) seen.add(held);
        }
      }
      return;
    }
    for (const child of children(g, id)) visit(child);
  };
  visit(place);
  for (const exit of comp(g, place, "place")?.exits ?? []) {
    if (exit.door) seen.add(exit.door);
  }
  // Other people's hands are not things to name.
  return [...seen].filter(
    (id) => id !== player && (!has(g, id, "part") || within(g, id, player)),
  );
}

// ---------------------------------------------------------------------------
// Parsing.

interface Words {
  L: LangData[];
  stop: Set<string>;
}

function matchPhrase(tokens: string[], phrases: string[], L: LangData[]) {
  let best = 0;
  for (const phrase of phrases) {
    const words = tokenize(L, phrase);
    if (words.length > best && words.every((w, i) => tokens[i] === w)) {
      best = words.length;
    }
  }
  return best;
}

/** Finds the verb at the start of the sentence, in either language. */
function findVerb(L: LangData[], tokens: string[]) {
  let rest = tokens;
  // "je prends", "I take", "let's go", "je vais prendre", "please".
  const filler = (t: string) =>
    ["je", "i"].includes(t) || L.some((lang) => lang.fillers.includes(t));
  while (rest.length > 1 && filler(rest[0])) rest = rest.slice(1);
  while (rest.length > 1 && filler(rest[rest.length - 1]))
    rest = rest.slice(0, -1);
  for (const lang of L) {
    let best: { verb: string; length: number } | undefined;
    for (const [verb, phrases] of Object.entries(lang.verbs)) {
      const length = matchPhrase(rest, phrases, L);
      if (length > (best?.length ?? 0)) best = { verb, length };
    }
    if (best) return { verb: best.verb, rest: rest.slice(best.length), lang };
  }
  return undefined;
}

function findDir(L: LangData[], tokens: string[]): string | undefined {
  for (const lang of L) {
    for (const [dir, words] of Object.entries(lang.dirs)) {
      if (tokens.some((t) => words.map(fold).includes(t))) return dir;
    }
  }
  return undefined;
}

function splitAnd(L: LangData[], tokens: string[]): string[][] {
  const parts: string[][] = [[]];
  for (const t of tokens) {
    if (L.some((l) => l.andWords.includes(t))) parts.push([]);
    else parts[parts.length - 1].push(t);
  }
  return parts.filter((part) => part.length > 0);
}

const isAll = (L: LangData[], tokens: string[]) => {
  const stop = new Set(L.flatMap((l) => l.stop));
  const content = tokens.filter((t) => !stop.has(t));
  return (
    content.length > 0 &&
    content.every((t) => L.some((lang) => lang.all.includes(t)))
  );
};

const isPronoun = (L: LangData[], t: string) =>
  L.some((lang) => lang.pronouns.includes(t));

/** Splits "the apple in the barrel" around its preposition. */
function splitPrep(L: LangData[], tokens: string[]) {
  for (let i = 0; i < tokens.length; i++) {
    for (const lang of L) {
      for (const [prep, words] of Object.entries(lang.preps)) {
        if (words.includes(tokens[i])) {
          return { obj: tokens.slice(0, i), prep, ind: tokens.slice(i + 1) };
        }
      }
    }
  }
  return { obj: tokens, prep: undefined, ind: [] as string[] };
}

/** Levenshtein distance, stopping early above 1. */
/** Edit distance with swaps of two neighbours (Damerau), capped. */
export function distance(a: string, b: string, cap = 2): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** How many typos a word of this length may carry. */
const allowed = (word: string) =>
  word.length >= 8 ? 2 : word.length >= 4 ? 1 : 0;

/** Same word, the start of it, or one typo away. */
function close(word: string, name: string): boolean {
  if (word === name) return true;
  if (word.length >= 3 && name.startsWith(word)) return true;
  return word.length >= 5 && distance(word, name) <= allowed(word);
}

/** Every word that names something in the game, in both languages. */
function vocabulary(w: Words): Set<string> {
  return new Set(
    w.L.flatMap((lang) =>
      Object.values(lang.names).flatMap((def) => [
        def.n,
        ...(def.w ?? []),
        ...Object.values(def.adj ?? {}),
      ]),
    )
      .flatMap((word) => tokenize(w.L, word))
      .map(stem),
  );
}

function splitSoft(L: LangData[], tokens: string[]) {
  for (let i = tokens.length - 2; i > 0; i--) {
    if (
      L.some((lang) =>
        Object.values(lang.softPreps).some((words) =>
          words.includes(tokens[i]),
        ),
      )
    ) {
      return { obj: tokens.slice(0, i), ind: tokens.slice(i + 1) };
    }
  }
  return undefined;
}

type Resolved =
  | { ok: Id[] }
  | { none: "unknown"; word: string }
  | { none: "notHere" }
  | { many: Id[] }
  | { empty: true };

/** Finds the entities a phrase names among `candidates`. */
export function resolve(
  g: Game,
  w: Words,
  tokens: string[],
  candidates: Id[],
): Resolved {
  const content = tokens.filter((t) => !w.stop.has(t) && !isPronoun(w.L, t));
  if (content.length === 0) {
    if (tokens.some((t) => isPronoun(w.L, t))) {
      const it = g.st.it.filter((id) => candidates.includes(id));
      if (it.length > 0) return { ok: it };
    }
    return { empty: true };
  }
  const wanted = content.map(stem);
  const found = candidates.filter((id) => {
    const names = namesOf(g, w.L, id);
    return wanted.every((word) => names.has(word));
  });
  if (found.length === 0) {
    // A typo or a word cut short ("mush"): close enough, if only one fits.
    const fuzzy = candidates.filter((id) => {
      const names = [...namesOf(g, w.L, id)];
      return wanted.every((word) => names.some((name) => close(word, name)));
    });
    found.push(...fuzzy);
  }
  // "Tanneur" names the tanner before Tanners' Street.
  if (found.length > 1 && found.some((id) => !has(g, id, "place"))) {
    const things = found.filter((id) => !has(g, id, "place"));
    found.length = 0;
    found.push(...things);
  }
  if (found.length === 1) return { ok: found };
  if (found.length > 1) {
    // Identical things (two apples) do not need a question.
    const same = new Set(
      found.map((id) => `${nameKey(g, id)}/${nameState(g, id) ?? ""}`),
    );
    return same.size === 1 ? { ok: [found[0]] } : { many: found };
  }
  // Is every word known somewhere in the game? Then it is just not here.
  const known = vocabulary(w);
  const unknown = wanted.find((word) => !known.has(word));
  // Words the game does not know are ignored if the rest still names
  // something: "throw it like Donkey Kong" throws it.
  if (unknown) {
    const kept = content.filter((_, i) => known.has(wanted[i]));
    if (kept.length > 0) {
      const retry = resolve(g, w, kept, candidates);
      if ("ok" in retry || "many" in retry) return retry;
    } else if (tokens.some((t) => isPronoun(w.L, t))) {
      const it = g.st.it.filter((id) => candidates.includes(id));
      if (it.length > 0) return { ok: it };
    }
  }
  return unknown
    ? { none: "unknown", word: content[wanted.indexOf(unknown)] }
    : { none: "notHere" };
}

function parseDuration(
  L: LangData[],
  tokens: string[],
): { minutes?: number; until?: number } {
  const lookup = <T>(
    pick: (lang: LangData) => Record<string, T>,
    t: string,
  ) => {
    for (const lang of L) if (pick(lang)[t] !== undefined) return pick(lang)[t];
    return undefined;
  };
  if (tokens.some((t) => L.some((lang) => lang.until.includes(t)))) {
    for (const t of tokens) {
      const minute = lookup((lang) => lang.times, t);
      if (minute !== undefined) return { until: minute };
    }
  }
  for (const t of tokens) {
    const minute = lookup((lang) => lang.times, t);
    if (minute !== undefined && !lookup((lang) => lang.units, t))
      return { until: minute };
  }
  let total = 0;
  let number: number | undefined;
  let factor = 1;
  let lastUnit = 0;
  for (const t of tokens) {
    const glued = /^(\d+)h(\d+)?$/.exec(t) ?? /^(\d+)(min|mn|m)$/.exec(t);
    if (glued) {
      if (glued[2] && /^\d+$/.test(glued[2]))
        total += Number(glued[1]) * 60 + Number(glued[2]);
      else total += Number(glued[1]) * (t.endsWith("h") ? 60 : 1);
      continue;
    }
    if (/^\d+$/.test(t)) {
      number = Number(t);
      continue;
    }
    if (t === "demi" || t === "half") factor = 0.5;
    else if (t === "quart" || t === "quarter") factor = 0.25;
    const num = lookup((lang) => lang.numbers, t);
    if (num !== undefined) number = num;
    const unit = lookup((lang) => lang.units, t);
    if (unit !== undefined) {
      total += (number ?? 1) * unit * factor;
      lastUnit = unit;
      number = undefined;
      factor = 1;
    }
  }
  // "une heure 30": a bare number after hours counts as minutes.
  if (number !== undefined)
    total += lastUnit === 60 ? number : number * (lastUnit || 1);
  return total > 0 ? { minutes: Math.round(total) } : {};
}

/** Exits of the current place, with every word that names each one. */
function exitWords(g: Game, w: Words) {
  const place = placeOf(g, g.st.player);
  return (comp(g, place, "place")?.exits ?? []).map((exit) => {
    const words = new Set(namesOf(g, w.L, exit.to));
    if (exit.door)
      for (const word of namesOf(g, w.L, exit.door)) words.add(word);
    return words;
  });
}

function parseGo(g: Game, w: Words, tokens: string[]): Parsed {
  const exits = comp(g, placeOf(g, g.st.player), "place")?.exits ?? [];
  const dir = findDir(w.L, tokens);
  if (dir) {
    const index = exits.findIndex((exit) => exit.dir === dir);
    return index < 0
      ? { kind: "noExit" }
      : { kind: "intent", intent: { verb: "go", dir, exit: index } };
  }
  const number = tokens.find((t) => /^\d+$/.test(t));
  if (number) {
    const index = Number(number) - 1;
    return exits[index]
      ? { kind: "intent", intent: { verb: "go", exit: index } }
      : { kind: "noExit" };
  }
  const preps = new Set(w.L.flatMap((l) => Object.values(l.preps).flat()));
  const wanted = tokens
    .filter(
      (t) =>
        !w.stop.has(t) && !preps.has(t) && !w.L.some((l) => l.back.includes(t)),
    )
    .map(stem);
  const goingBack = tokens.some((t) => w.L.some((l) => l.back.includes(t)));
  if (wanted.length === 0) {
    if (goingBack)
      return { kind: "intent", intent: { verb: "go", dir: "back" } };
    return { kind: "what", intent: { verb: "go" }, slot: "obj" };
  }
  const lists = exitWords(g, w);
  const index = lists.findIndex((words) =>
    wanted.every((word) => words.has(word)),
  );
  if (index < 0 && goingBack) {
    return { kind: "intent", intent: { verb: "go", dir: "back" } };
  }
  return index < 0
    ? { kind: "noExit" }
    : { kind: "intent", intent: { verb: "go", exit: index } };
}

/** Fills the object or indirect slot of an intent from words. */
export function fillSlot(
  g: Game,
  w: Words,
  intent: Intent,
  slot: "obj" | "ind",
  tokens: string[],
  candidates = scope(g),
): Parsed | undefined {
  if (slot === "obj" && isAll(w.L, tokens)) {
    intent.all = true;
    intent.obj = [];
    return undefined;
  }
  // "the dagger and the stone": each part names one thing.
  const parts = splitAnd(w.L, tokens);
  if (slot === "obj" && parts.length > 1) {
    intent.obj = [];
    for (const part of parts) {
      const one = resolve(g, w, part, candidates);
      if ("ok" in one) intent.obj.push(...one.ok);
      else if ("many" in one)
        return { kind: "which", intent, slot, options: one.many };
      else if ("none" in one && one.none === "unknown")
        return { kind: "unknownWord", word: one.word };
      else if ("none" in one)
        return { kind: "notHere", dark: isDark(g, placeOf(g, g.st.player)) };
    }
    return undefined;
  }
  const found = resolve(g, w, tokens, candidates);
  if ("ok" in found) {
    if (slot === "obj") intent.obj = found.ok;
    else intent.ind = found.ok[0];
    return undefined;
  }
  if ("many" in found)
    return { kind: "which", intent, slot, options: found.many };
  if ("empty" in found) return { kind: "what", intent, slot };
  if (found.none === "unknown")
    return { kind: "unknownWord", word: found.word };
  return { kind: "notHere", dark: isDark(g, placeOf(g, g.st.player)) };
}

export function parse(g: Game, lang: Lang, text: string): Parsed {
  const L = langsFor(g, lang);
  const w: Words = { L, stop: new Set(L.flatMap((l) => l.stop)) };
  if (text.trim() === "?") return { kind: "intent", intent: { verb: "help" } };
  const tokens = tokenize(L, text);
  if (tokens.length === 0) return { kind: "empty" };
  if (tokens.length <= 2 && L.some((l) => l.yes.includes(tokens[0])))
    return { kind: "yes" };
  if (tokens.length <= 2 && L.some((l) => l.no.includes(tokens[0])))
    return { kind: "no" };

  // A bare direction or exit number.
  if (tokens.length === 1 && /^\d+$/.test(tokens[0]))
    return parseGo(g, w, tokens);
  if (tokens.length === 1 && findDir(L, tokens)) return parseGo(g, w, tokens);

  // "La manger", "le prendre": a French pronoun comes before its verb.
  if (
    tokens.length > 1 &&
    isPronoun(L, tokens[0]) &&
    startsWithVerb(L, tokens.slice(1))
  ) {
    return parse(g, lang, [...tokens.slice(1), tokens[0]].join(" "));
  }
  let found = findVerb(L, tokens);
  if (!found) {
    const special = specialWords(g, w, tokens);
    if (special) return special;
    // A typo in the verb. A single word is only fixed into a verb that
    // needs nothing more: "road" is not "read".
    const fixed = corrected(g, w, tokens);
    const needs = fixed ? (VERBS[fixed.verb] ?? {}) : {};
    const alone =
      !needs.obj ||
      needs.optional ||
      needs.people ||
      needs.dir ||
      needs.duration;
    // A longer word cut or mistyped ("htrow") is a verb all the same.
    if (fixed && (tokens.length > 1 || alone || tokens[0].length >= 5))
      found = findVerb(L, fixed.tokens);
  }
  // "You still there, tanner?": a question mark makes it a question.
  if (!found && text.trim().endsWith("?")) {
    const words = tokens.filter(
      (t) => !["i", "je"].includes(t) && !L.some((l) => l.fillers.includes(t)),
    );
    return question(g, w, words);
  }
  if (!found) return fallback(g, w, tokens);
  let { verb } = found;
  let { rest } = found;
  rest = fixNouns(g, w, rest);
  // "Use the brazier to light the torch": the second verb says what to do,
  // and the first thing is what to do it with.
  if (verb === "use") {
    const to = rest.findIndex((t) => L.some((l) => l.purpose.includes(t)));
    const after = to >= 0 ? rest.slice(to + 1) : [];
    const words =
      after.length === 0 || findVerb(L, after)
        ? after
        : (corrected(g, w, after)?.tokens ?? after);
    const then = to >= 0 ? findVerb(L, words) : undefined;
    if (then) {
      const tool = rest.slice(0, to);
      const inner = parse(g, lang, words.join(" "));
      if (inner.kind === "intent" && tool.length > 0) {
        const found = resolve(g, w, tool, scope(g));
        if ("ok" in found && !inner.intent.ind) inner.intent.ind = found.ok[0];
      }
      return inner;
    }
  }
  const spec = VERBS[verb] ?? {};

  if (spec.dir) return parseGo(g, w, rest);
  if (verb === "flee") {
    const where = parseGo(g, w, rest);
    const intent: Intent = { verb: "flee" };
    if (where.kind === "intent")
      Object.assign(intent, where.intent, { verb: "flee" });
    return { kind: "intent", intent };
  }
  if (spec.people) return parsePeople(g, w, verb, rest);
  if (verb === "shout") return { kind: "intent", intent: { verb } };
  let aim: string | undefined;
  if (spec.aim) ({ aim, rest } = extractAim(L, rest));
  if (spec.duration)
    return { kind: "intent", intent: { verb, ...parseDuration(L, rest) } };

  // "regarder la torche" is examining it.
  const meaningful = rest.filter((t) => !w.stop.has(t));
  if (verb === "look" && meaningful.length > 0) verb = "examine";
  const finalSpec = VERBS[verb] ?? {};
  const intent: Intent = { verb };
  if (aim) intent.aim = aim;
  if (verb === "drink") {
    // "A sip", "everything": how much, not what.
    const lots = rest.some((t) =>
      L.some((l) => l.all.includes(t) || l.lots.includes(t)),
    );
    const sip = rest.some((t) => L.some((l) => l.sip.includes(t)));
    if (lots) intent.amount = "lots";
    else if (sip) intent.amount = "sip";
    rest = rest.filter(
      (t) =>
        !L.some(
          (l) => l.all.includes(t) || l.lots.includes(t) || l.sip.includes(t),
        ),
    );
  }
  if (!finalSpec.obj) return { kind: "intent", intent };
  if (
    finalSpec.optional &&
    rest.every((t) => w.stop.has(t) || isPronoun(L, t))
  ) {
    return { kind: "intent", intent };
  }

  const split = splitPrep(L, rest);
  const { prep } = split;
  let { obj, ind } = split;
  // "Drink from the fountain": a verb with a single object takes it even
  // behind a preposition.
  if (obj.every((t) => w.stop.has(t)) && ind.length > 0 && !finalSpec.ind) {
    obj = ind;
    ind = [];
  }
  if (prep) intent.prep = prep;
  const first = fillSlot(g, w, intent, "obj", obj);
  // Words that name nothing, after a verb that can do without an object,
  // mean the obvious target: "panser ma blessure", "fight back".
  if (first && finalSpec.optional && first.kind === "unknownWord") {
    delete intent.obj;
    return { kind: "intent", intent };
  }
  // "la pomme du tonneau": "du" may also belong to a name, so it splits
  // the sentence only when the whole phrase names nothing.
  if (
    first &&
    !prep &&
    ["notHere", "unknownWord", "which"].includes(first.kind)
  ) {
    const soft = splitSoft(L, obj);
    if (soft) {
      const trial: Intent = { verb };
      if (
        !fillSlot(g, w, trial, "obj", soft.obj) &&
        !fillSlot(g, w, trial, "ind", soft.ind)
      ) {
        return { kind: "intent", intent: { ...trial, prep: "from" } };
      }
    }
  }
  // "Throw like Donkey Kong": with one thing in hand, that is what flies.
  if (
    first &&
    verb === "throw" &&
    ["notHere", "unknownWord"].includes(first.kind)
  ) {
    const inHand = Object.values(hands(g, g.st.player))
      .map((hand) => (hand ? heldIn(g, hand) : undefined))
      .filter((id): id is Id => !!id);
    const unique = [...new Set(inHand)];
    if (unique.length === 1) {
      return { kind: "intent", intent: { ...intent, obj: unique } };
    }
  }
  // "Take a strip", "get some cloth": none is lying about, so tear one.
  if (
    first &&
    ["take", "use"].includes(verb) &&
    ["notHere", "unknownWord"].includes(first.kind) &&
    obj.some((t) => stripWords(L).has(stem(t)))
  ) {
    return { kind: "intent", intent: { verb: "tear" } };
  }
  if (first) {
    if (first.kind === "which" || first.kind === "what") intent.indWords = ind;
    return first;
  }
  if (finalSpec.ind && ind.length > 0) {
    const second = fillSlot(g, w, intent, "ind", ind);
    if (second) return second;
  }
  return { kind: "intent", intent };
}

/** Reading the answer to "Which one?" or "What do you want to take?". */
export function answer(
  g: Game,
  lang: Lang,
  text: string,
  pending: Pending,
): Parsed | undefined {
  if (pending.kind === "confirm") return undefined;
  const L = langsFor(g, lang);
  const w: Words = { L, stop: new Set(L.flatMap((l) => l.stop)) };
  const tokens = tokenize(L, text);
  const intent: Intent = structuredClone(pending.intent);
  if (intent.verb === "go") {
    const parsed = parseGo(g, w, tokens);
    return parsed.kind === "intent" ? parsed : undefined;
  }
  let result: Parsed | undefined;
  if (pending.kind === "which") {
    const ordinal = tokens
      .map(
        (t) =>
          L.find((l) => l.ordinals[t] !== undefined)?.ordinals[t] ??
          (/^\d+$/.test(t) ? Number(t) : undefined),
      )
      .find((n) => n !== undefined);
    if (pending.slot === "obj" && isAll(L, tokens)) {
      // "Both", "the two of them".
      intent.obj = [...pending.options];
    } else if (ordinal !== undefined && pending.options[ordinal - 1]) {
      if (pending.slot === "obj") intent.obj = [pending.options[ordinal - 1]];
      else intent.ind = pending.options[ordinal - 1];
    } else {
      result = fillSlot(g, w, intent, pending.slot, tokens, pending.options);
      if (result) return result.kind === "which" ? result : undefined;
    }
  } else {
    result = fillSlot(g, w, intent, pending.slot, tokens);
    // Not a name at all: the player moved on to another command.
    if (result && result.kind !== "which") return undefined;
    if (result) return result;
  }
  if (pending.slot === "obj" && intent.indWords && intent.indWords.length > 0) {
    const second = fillSlot(g, w, intent, "ind", intent.indWords);
    delete intent.indWords;
    if (second) return second;
  }
  delete intent.indWords;
  return { kind: "intent", intent };
}

// ---------------------------------------------------------------------------
// Forgiveness: what to do with words that start with no known verb.

/** The first word with one typo fixed, if it then names a verb. */
/** Every word the game knows, in names, directions and special lists. */
function knownWords(g: Game, w: Words): Set<string> {
  const known = new Set(vocabulary(w));
  for (const lang of w.L) {
    const lists = [
      lang.stop,
      lang.questions,
      lang.later,
      lang.relative,
      lang.back,
      lang.yes,
      lang.no,
      lang.all,
      lang.pronouns,
      lang.fillers,
      lang.copulas,
      lang.meta,
      lang.impossible,
      ...Object.values(lang.moods),
    ];
    for (const list of [
      ...lists,
      ...Object.values(lang.dirs),
      ...Object.values(lang.topics),
    ]) {
      for (const word of list) known.add(stem(word));
    }
  }
  void g;
  return known;
}

/** The first word with one typo fixed, if it then names a verb. */
function corrected(
  g: Game,
  w: Words,
  tokens: string[],
): { tokens: string[]; verb: string } | undefined {
  const L = w.L;
  const first = tokens[0];
  if (!first) return undefined;
  // A word the game knows is no typo ("back" is not "pack").
  if (first.length < 4 || knownWords(g, w).has(stem(first))) return undefined;
  // The language of the interface first; a word cut short ("threat")
  // before a word one letter away ("treat").
  for (const lang of L) {
    const prefix = new Map<string, string>();
    const typo = new Map<string, string>();
    for (const [verb, phrases] of Object.entries(lang.verbs)) {
      for (const phrase of phrases) {
        const word = tokenize(L, phrase);
        if (word.length !== 1 || word[0].length < 4) continue;
        if (word[0].startsWith(first)) prefix.set(verb, word[0]);
        else if (distance(first, word[0]) <= allowed(word[0]))
          typo.set(verb, word[0]);
      }
    }
    for (const found of [prefix, typo]) {
      if (found.size === 1) {
        const [[verb, word]] = [...found];
        return { tokens: [word, ...tokens.slice(1)], verb };
      }
      if (found.size > 1) return undefined;
    }
  }
  return undefined;
}

/** Words for a strip of cloth, which can be torn when none exists. */
function stripWords(L: LangData[]): Set<string> {
  const words = L.flatMap((l) => [
    l.names.strip?.n ?? "",
    ...(l.names.strip?.w ?? []),
  ]);
  return new Set(
    words
      .filter(Boolean)
      .flatMap((word) => tokenize(L, word))
      .map(stem),
  );
}

/** Mistyped names of things around ("brzier") become the right ones. */
function fixNouns(g: Game, w: Words, tokens: string[]): string[] {
  const known = vocabulary(w);
  const near = [...new Set(scope(g).flatMap((id) => [...namesOf(g, w.L, id)]))];
  return tokens.map((t) => {
    if (t.length < 5 || known.has(stem(t)) || knownWords(g, w).has(stem(t)))
      return t;
    const close = near.filter(
      (word) => word.length >= 4 && distance(t, word, 3) <= allowed(word),
    );
    return close.length === 1 ? close[0] : t;
  });
}

/** "torch brazier": two things here, each named on its own. */
function pairOf(g: Game, w: Words, content: string[]): [Id, Id] | undefined {
  if (content.length < 2 || content.length > 4) return undefined;
  for (let cut = 1; cut < content.length; cut++) {
    const a = resolve(g, w, content.slice(0, cut), scope(g));
    const b = resolve(g, w, content.slice(cut), scope(g));
    if ("ok" in a && "ok" in b && a.ok[0] !== b.ok[0])
      return [a.ok[0], b.ok[0]];
  }
  return undefined;
}

/**
 * Splits "take a strip, put it on the torch" into two commands. A comma or
 * "and" splits only when a verb follows; "then", ";" and full stops always.
 */
export function splitCommands(g: Game, lang: Lang, text: string): string[] {
  const L = langsFor(g, lang);
  // A question stays whole: "Do I wear it like a hat?" is not two orders.
  if (text.includes("?")) return [text];
  const pieces = text
    .split(/[;.]+|\b(?:and then|then|et puis|puis|ensuite)\b/i)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const piece of pieces) {
    const parts = piece.split(/(,|\band\b|\bet\b)/i);
    let current = parts[0];
    for (let i = 1; i < parts.length; i += 2) {
      const next = parts[i + 1] ?? "";
      if (startsWithVerb(L, tokenize(L, next))) {
        out.push(current.trim());
        current = next;
      } else current += parts[i] + next;
    }
    out.push(current.trim());
  }
  return out.filter(Boolean);
}

/** The first real word is a verb ("put it on", not "the stone"). */
function startsWithVerb(L: LangData[], tokens: string[]): boolean {
  if (tokens.length > 1 && isPronoun(L, tokens[0]))
    return startsWithVerb(L, tokens.slice(1));
  const found = findVerb(L, tokens);
  if (!found) return false;
  return found.rest.length < tokens.length;
}

/** Words that are not verbs but still mean something. */
function specialWords(g: Game, w: Words, tokens: string[]): Parsed | undefined {
  const L = w.L;
  const has = (list: (lang: LangData) => string[], t: string) =>
    L.some((l) => list(l).includes(t));
  const words = tokens.filter(
    (t) => !["i", "je"].includes(t) && !has((l) => l.fillers, t),
  );
  const first =
    words.find((t) => !w.stop.has(t) && !has((l) => l.copulas, t)) ??
    words[0] ??
    tokens[0];
  if (tokens.some((t) => has((l) => l.meta, t)) && tokens.length <= 3)
    return { kind: "meta" };
  if (has((l) => l.questions, first)) return question(g, w, words);
  for (const lang of L) {
    for (const [mood, list] of Object.entries(lang.moods)) {
      const head = words.length <= 4 ? words : words.slice(0, 2);
      if (head.some((t) => list.includes(t))) return { kind: "mood", mood };
    }
  }
  if (has((l) => l.later, first)) return { kind: "notYet", word: first };
  if (has((l) => l.impossible, first)) return { kind: "impossible" };
  if (has((l) => l.relative, first) && tokens.length <= 2)
    return { kind: "relative" };
  return undefined;
}

/** "What is a prowler?", "who wrote the letter?": a question. */
function question(g: Game, w: Words, words: string[]): Parsed {
  const L = w.L;
  const glue = new Set(
    L.flatMap((l) => [...l.questions, ...l.stop, ...l.fillers, ...l.copulas]),
  );
  const content = words.filter((t) => !glue.has(t));
  const person = awakePeople(g)[0];
  // Someone who can answer: the question goes to them.
  if (person) {
    const topic = topicOf(w, content) ?? "unknown";
    return { kind: "intent", intent: { verb: "ask", obj: [person], topic } };
  }
  // Alone: a thing in sight can be looked at; anything else stays a thought.
  if (
    content.length > 0 &&
    content.length <= 3 &&
    content.every((t) => vocabulary(w).has(stem(t)))
  ) {
    const found = resolve(g, w, content, scope(g));
    if ("ok" in found)
      return { kind: "intent", intent: { verb: "examine", obj: found.ok } };
  }
  return { kind: "question" };
}

/** The conversation subject named by some words, if any. */
function topicOf(w: Words, content: string[]): string | undefined {
  for (const lang of w.L) {
    for (const [topic, list] of Object.entries(lang.topics)) {
      const set = new Set(
        list.flatMap((word) => tokenize(w.L, word)).map(stem),
      );
      if (content.some((t) => set.has(stem(t)))) return topic;
    }
  }
  return undefined;
}

const awakePeople = (g: Game) =>
  scope(g).filter((id) => isPerson(g, id) && conscious(g, id));

function fallback(g: Game, w: Words, tokens: string[]): Parsed {
  const L = w.L;
  const glue = new Set(
    L.flatMap((l) => [...l.fillers, ...l.stop, ...l.copulas]),
  );
  const words = tokens.filter((t) => !["i", "je"].includes(t));
  const first = words[0] ?? tokens[0];
  if (L.some((l) => l.back.includes(first))) return parseGo(g, w, tokens);
  // A bare name, and nothing else the game does not know: look at the
  // thing, or walk to the place. A whole sentence is not a bare name.
  const content = fixNouns(
    g,
    w,
    words.filter((t) => !glue.has(t)),
  );
  const known = vocabulary(w);
  // Two things named side by side, "torch brazier": use one with the other.
  const pair = pairOf(g, w, content);
  if (pair) {
    return {
      kind: "intent",
      intent: { verb: "use", obj: [pair[0]], ind: pair[1] },
    };
  }
  if (
    content.length > 0 &&
    content.length <= 3 &&
    content.every((t) => known.has(stem(t)))
  ) {
    const found = resolve(g, w, content, scope(g));
    if ("ok" in found)
      return { kind: "intent", intent: { verb: "examine", obj: found.ok } };
    if ("many" in found) {
      return {
        kind: "which",
        intent: { verb: "examine" },
        slot: "obj",
        options: found.many,
      };
    }
    // Talking with someone, a bare subject is a question to them.
    const person = awakePeople(g)[0];
    if (person) {
      const topic = topicOf(w, content);
      if (topic)
        return {
          kind: "intent",
          intent: { verb: "ask", obj: [person], topic },
        };
    }
    const go = parseGo(g, w, content);
    if (go.kind === "intent") return go;
    // A place known but not next to here.
    if (
      Object.keys(g.st.ent).some(
        (id) =>
          has(g, id, "place") &&
          content.every((t) => namesOf(g, L, id).has(stem(t))),
      )
    ) {
      return { kind: "far" };
    }
    return { kind: "notHere", dark: isDark(g, placeOf(g, g.st.player)) };
  }
  return { kind: "unknownVerb", word: first };
}

/** Finds a body part in the words ("at the head") and removes it. */
function extractAim(
  L: LangData[],
  tokens: string[],
): { aim?: string; rest: string[] } {
  const stems = tokens.map(stem);
  let best: { key: string; at: number; length: number } | undefined;
  for (const lang of L) {
    for (const [key, def] of Object.entries(lang.names)) {
      if (!key.startsWith("part.")) continue;
      for (const phrase of [def.n, ...(def.w ?? [])]) {
        const words = tokenize(L, phrase).map(stem);
        for (let at = 0; at + words.length <= stems.length; at++) {
          if (
            words.every((word, i) => stems[at + i] === word) &&
            words.length > (best?.length ?? 0)
          ) {
            best = { key, at, length: words.length };
          }
        }
      }
    }
  }
  if (!best) return { rest: tokens };
  // Drop the little words before the part: "à la", "in the".
  let start = best.at;
  const little = new Set(
    L.flatMap((l) => [
      ...l.stop,
      ...Object.values(l.preps).flat(),
      ...Object.values(l.softPreps).flat(),
    ]),
  );
  while (start > 0 && little.has(tokens[start - 1])) start--;
  return {
    aim: best.key.slice("part.".length),
    rest: [...tokens.slice(0, start), ...tokens.slice(best.at + best.length)],
  };
}

const isPerson = (g: Game, id: Id) => id !== g.st.player && has(g, id, "actor");

/** "Ask the tanner about the tavern", "threaten him", "talk". */
function parsePeople(g: Game, w: Words, verb: string, rest: string[]): Parsed {
  const L = w.L;
  const intent: Intent = { verb };
  const stems = rest.map(stem);
  const used = new Set<number>();
  // A word naming someone here is that person, not a topic.
  const present = scope(g).filter((id) => isPerson(g, id));
  const names = new Set(present.flatMap((id) => [...namesOf(g, L, id)]));
  for (const lang of L) {
    for (const [topic, words] of Object.entries(lang.topics)) {
      const set = new Set(words.flatMap((word) => tokenize(L, word)).map(stem));
      stems.forEach((word, i) => {
        if (!set.has(word) || names.has(word)) return;
        if (!intent.topic) intent.topic = topic;
        used.add(i);
      });
    }
  }
  const preps = new Set(
    L.flatMap((l) => [
      ...Object.values(l.preps).flat(),
      ...Object.values(l.softPreps).flat(),
    ]),
  );
  const content = rest.filter(
    (t, i) => !used.has(i) && !w.stop.has(t) && !preps.has(t),
  );
  if (content.length === 0) return { kind: "intent", intent };
  const all = scope(g);
  const people = all.filter((id) => isPerson(g, id));
  // Words that name a person here; the others may be an unknown topic.
  const personWords = content.filter((t) =>
    people.some((id) => namesOf(g, L, id).has(stem(t))),
  );
  const leftover = content.filter(
    (t) => !personWords.includes(t) && !isPronoun(L, t),
  );
  if (personWords.length > 0) {
    const found = resolve(g, w, personWords, people);
    if ("ok" in found) intent.obj = found.ok;
    else if ("many" in found)
      return { kind: "which", intent, slot: "obj", options: found.many };
  } else if (leftover.length > 0 && !intent.topic) {
    // "Talk to the barrel": a thing, not a person.
    const thing = resolve(g, w, leftover, all);
    if ("ok" in thing) {
      intent.obj = thing.ok;
      return { kind: "intent", intent };
    }
  }
  if (
    leftover.length > 0 &&
    !intent.topic &&
    (verb === "ask" || verb === "talk")
  )
    intent.topic = "unknown";
  return { kind: "intent", intent };
}
