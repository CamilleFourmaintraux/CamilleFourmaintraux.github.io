// Turning message keys into sentences, with French and English grammar.
//
// Systems never write sentences: they produce a key and parameters. The text
// is chosen only when it is shown, which lets the player switch language in
// the middle of a game and read the whole journal again in the new one.

import type { Lang, Msg, NameRef, Param } from "./types";

export interface NameDef {
  /** Noun, with any fixed adjective ("épée longue", "long sword"). */
  n: string;
  /** French gender. */
  g?: "m" | "f";
  /** Plural noun ("pièces de cuivre"). */
  pl?: boolean;
  /** French aspirated h: no elision ("le hachoir"). */
  h?: boolean;
  /** English: force "an" or "a". */
  an?: boolean;
  /** Proper noun: never an article. */
  proper?: boolean;
  /** State adjectives, already agreed ("allumée" / "lit"). */
  adj?: Record<string, string>;
  /** More words the parser accepts for this thing. */
  w?: string[];
}

export interface LangData {
  lang: Lang;
  messages: Record<string, string | string[]>;
  names: Record<string, NameDef>;
  /** Verb id -> every phrase that calls it. */
  verbs: Record<string, string[]>;
  /** Direction -> words. */
  dirs: Record<string, string[]>;
  /** Words the parser ignores. */
  stop: string[];
  /** Preposition id -> words. */
  preps: Record<string, string[]>;
  pronouns: string[];
  all: string[];
  yes: string[];
  no: string[];
  numbers: Record<string, number>;
  /** Unit word -> minutes. */
  units: Record<string, number>;
  until: string[];
  /** Time word -> minute of the day. */
  times: Record<string, number>;
  /** Elided word -> full word ("l" -> "le"). */
  elisions: Record<string, string>;
  ordinals: Record<string, number>;
  /** Words between the last two items of a list. */
  and: string;
  or: string;
  /** Prepositions that may also be part of a name ("pièces de cuivre"). */
  softPreps: Record<string, string[]>;
  /** Conversation topic id -> words that bring it up. */
  topics: Record<string, string[]>;
  /** Words that start a question the game cannot answer ("why"). */
  questions: string[];
  /** Words for actions planned but not written yet. */
  later: string[];
  /** Directions relative to the player, meaningless here ("left"). */
  relative: string[];
  /** Words for going back where one came from. */
  back: string[];
  /** Words around a command that add nothing ("let's", "je vais", "please"). */
  fillers: string[];
  /** "is", "est": glue words of a question. */
  copulas: string[];
  /** About the game itself: quit, save, menu. */
  meta: string[];
  /** Things no one can do: fly, teleport. */
  impossible: string[];
  /** Words joining a list of things: "and", "et". */
  andWords: string[];
  /** Mood id -> words that show it ("sad", "ouch", "lol"). */
  moods: Record<string, string[]>;
  /** Drinking a lot, or a little. */
  lots: string[];
  /** Words that open a question by their place: "are you…", "est-ce…". */
  questionLeads: string[];
  /**
   * The narrator, who can be spoken to when named ("narrator", "voice"),
   * and who answers a few questions the player asks about themselves.
   */
  narrator: {
    names: string[];
    /** "I", "me": the player speaking of themselves. */
    self: string[];
    /** "You": someone spoken to. */
    you: string[];
    /** "Was": the past, for "who was I". */
    past: string[];
    /** "Am", "are", "was": the verb of a question about being. */
    be: string[];
    qtypes: Record<"who" | "where" | "when" | "what" | "why" | "how", string[]>;
    topics: Record<"ghost" | "exist" | "think" | "beggar", string[]>;
  };
  /** Words between "go" and a place that add nothing: "go see the tanner". */
  goFillers: string[];
  /** "Me" in "give me the key". */
  selfWords: string[];
  /** Answers to "give, or be given?". */
  giveWords: string[];
  receiveWords: string[];
  /** "The body", for someone lying senseless or dead. */
  bodyWords: string[];
  /** "to" in "use the brazier to light the torch". */
  purpose: string[];
  sip: string[];
}

const VOWEL = /^[aeiouyàâäéèêëîïôöùûüœæh]/i;

function phrase(L: LangData, ref: NameRef): { def: NameDef; text: string } {
  const def = L.names[ref.n] ?? { n: ref.n, g: "m" };
  const adj = ref.s ? def.adj?.[ref.s] : undefined;
  let text = def.n;
  if (adj) text = L.lang === "fr" ? `${def.n} ${adj}` : `${adj} ${def.n}`;
  return { def, text };
}

/** One noun phrase, with the article or form a template asks for. */
export function nounPhrase(L: LangData, ref: NameRef, mod: string): string {
  const { def, text } = phrase(L, ref);
  const m = mod.toLowerCase();
  if (m === "e") return L.lang === "fr" && def.g === "f" ? "e" : "";
  if (m === "s") return L.lang === "fr" && def.pl ? "s" : "";
  if (def.proper || m === "name") return text;
  // Something the player carries: "your torch".
  const own = ref.o && m !== "a";
  if (L.lang === "fr") {
    const elide = VOWEL.test(def.n) && !def.h && !def.pl;
    const fem = def.g === "f";
    switch (m) {
      case "a":
        return `${def.pl ? "des" : fem ? "une" : "un"} ${text}`;
      case "of":
        if (own) return `de ${def.pl ? "vos" : "votre"} ${text}`;
        if (def.pl) return `des ${text}`;
        return elide ? `de l’${text}` : `${fem ? "de la" : "du"} ${text}`;
      case "to":
        if (own) return `à ${def.pl ? "vos" : "votre"} ${text}`;
        if (def.pl) return `aux ${text}`;
        return elide ? `à l’${text}` : `${fem ? "à la" : "au"} ${text}`;
      case "your":
        return `${def.pl ? "vos" : "votre"} ${text}`;
      default:
        if (own) return `${def.pl ? "vos" : "votre"} ${text}`;
        if (def.pl) return `les ${text}`;
        return elide ? `l’${text}` : `${fem ? "la" : "le"} ${text}`;
    }
  }
  switch (m) {
    case "a": {
      if (def.pl) return `some ${text}`;
      const an = def.an ?? /^[aeiou]/i.test(text);
      return `${an ? "an" : "a"} ${text}`;
    }
    case "of":
      return `of ${ref.o ? "your" : "the"} ${text}`;
    case "to":
      return `to ${ref.o ? "your" : "the"} ${text}`;
    case "your":
      return `your ${text}`;
    default:
      return own ? `your ${text}` : `the ${text}`;
  }
}

function join(L: LangData, parts: string[], or = false): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")}${or ? L.or : L.and}${parts[parts.length - 1]}`;
}

export function list(L: LangData, refs: NameRef[], mod: string): string {
  const or = mod === "or";
  return join(
    L,
    refs.map((ref) => nounPhrase(L, ref, or ? "the" : mod)),
    or,
  );
}

const isRef = (value: Param): value is NameRef =>
  typeof value === "object" && !Array.isArray(value) && "n" in value;
const isMsg = (value: Param): value is Msg =>
  typeof value === "object" && !Array.isArray(value) && "k" in value;

function capitalize(text: string): string {
  const i = text.search(/\p{L}/u);
  return i < 0
    ? text
    : text.slice(0, i) + text[i].toUpperCase() + text.slice(i + 1);
}

/** Fills a template. Modifiers in capitals capitalize the result. */
function fill(L: LangData, template: string, params: Msg["p"]): string {
  return template.replace(
    /\{(\w+)(?::(\w+))?\}/g,
    (whole, name: string, mod?: string) => {
      const value = params?.[name];
      if (value === undefined) return whole;
      let text: string;
      if (Array.isArray(value)) {
        text =
          value.length > 0 && isMsg(value[0])
            ? join(
                L,
                (value as Msg[]).map((m) => fill(L, pick(L, m), m.p)),
              )
            : list(L, value as NameRef[], mod ?? "a");
      } else if (isRef(value))
        text = nounPhrase(L, value as NameRef, mod ?? "the");
      else if (isMsg(value))
        text = fill(L, pick(L, value as Msg), (value as Msg).p);
      else text = String(value);
      return mod && /^[A-Z]/.test(mod) ? capitalize(text) : text;
    },
  );
}

function pick(L: LangData, msg: Msg): string {
  const entry = L.messages[msg.k];
  if (entry === undefined) return `[${msg.k}]`;
  return Array.isArray(entry) ? entry[(msg.v ?? 0) % entry.length] : entry;
}

export function has(L: LangData, key: string): boolean {
  return L.messages[key] !== undefined;
}

export function render(L: LangData, msg: Msg): string {
  let text = capitalize(fill(L, pick(L, msg), msg.p));
  if (L.lang === "fr") {
    // French typography: thin no-break space before ? ! ; : and inside « ».
    text = text.replace(/ ([?!;:»])/g, " $1").replace(/« /g, "« ");
  }
  return text;
}

/** Number of variants of a message, to pick one with the run randomness. */
export function variants(L: LangData, key: string): number {
  const entry = L.messages[key];
  return Array.isArray(entry) ? entry.length : 1;
}
