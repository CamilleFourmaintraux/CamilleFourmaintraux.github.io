// The action pipeline: every command goes through the same steps.
//
// 1. Parse the words into an intent (or ask which one, or what).
// 2. Evaluate the risk: a bad idea is put on hold until confirmed.
// 3. Run the verb, which changes the state, emits events and spends time
//    through the single `advance` function.
// 4. Let the systems react to the events.
// 5. Record the messages in the journal, as keys, for any language.

import { drain, newCtx, say, type Ctx } from "./core";
import { answerPerson, awakeHere, npcRound, passOut } from "./npc";
import {
  answer,
  parse,
  splitCommands,
  tokenize,
  langsFor,
  type Parsed,
} from "./parser";
import { startSystems } from "./systems";
import { VERB_RUNNERS, describePlace, misfit, stores } from "./verbs";
import { newState, ref, refs, vital, type Content, type Game } from "./world";
import type { Intent, Lang, Turn } from "./types";

/** How long a confirmation covers the same kind of risk, in minutes. */
const CONFIRM_SPAN = 10;
const JOURNAL_LIMIT = 300;
/** Verbs that take no time: the people around do not react to them. */
const FREE = new Set([
  "look",
  "examine",
  "exits",
  "inventory",
  "help",
  "time",
  "status",
]);

export function newGame(content: Content, seed: number): Game {
  const g: Game = { content, st: newState(content, seed) };
  startSystems(g);
  const ctx = newCtx(g);
  say(ctx, "intro");
  describePlace(ctx);
  drain(ctx);
  g.st.journal.push({ in: "", out: ctx.out, t: g.st.clock });
  return g;
}

function run(ctx: Ctx, intent: Intent, raw: string, confirmed: boolean) {
  const g = ctx.g;
  const verb = VERB_RUNNERS[intent.verb];
  if (!verb) return say(ctx, "parse.unknownVerb", { w: raw });
  const risk = verb.risk?.(ctx, intent);
  if (risk && !confirmed) {
    const last = g.st.confirmed[risk.kind];
    if (last === undefined || g.st.clock - last > CONFIRM_SPAN) {
      g.st.pending = { kind: "confirm", raw, intent, risk: risk.kind };
      ctx.out.push(risk.warn);
      return;
    }
  }
  if (risk) g.st.confirmed[risk.kind] = g.st.clock;
  if (intent.obj && intent.obj.length > 0) g.st.it = [...intent.obj];
  verb.run(ctx, intent);
  if (FREE.has(intent.verb)) return;
  afterAction(ctx);
}

/** The people around react, and a player who fell loses some time. */
function afterAction(ctx: Ctx) {
  const g = ctx.g;
  drain(ctx);
  npcRound(ctx);
  drain(ctx);
  if (!g.st.flags.dead && vital(g, g.st.player) === "down") passOut(ctx);
  if (g.st.flags.dead) say(ctx, "game.over");
}

/** The input, shortened for a reply. */
function quoted(raw: string): string {
  const text = raw.replace(/\s+/g, " ").trim();
  return text.length > 60 ? `${text.slice(0, 57)}...` : text;
}

/** Not understood. After a few misses in a row, a hint follows. */
function misunderstood(ctx: Ctx, key: string, p: Record<string, string>) {
  const g = ctx.g;
  const misses = Number(g.st.flags.misses ?? 0) + 1;
  g.st.flags.misses = misses;
  say(ctx, key, p);
  if (misses >= 3 && misses % 3 === 0) say(ctx, "parse.hint");
}

/** A feeling, an exclamation: the character shows it, others may notice. */
function mood(ctx: Ctx, name: string) {
  const g = ctx.g;
  say(ctx, `mood.${name}`);
  const witness = awakeHere(g)[0];
  if (witness && name !== "ok" && name !== "never")
    say(ctx, `mood.seen.${name}`, { x: ref(g, witness) });
  if (name === "never" && g.st.pending) delete g.st.pending;
}

/** Answers that are not commands: questions, errors, a pending action. */
function handle(ctx: Ctx, parsed: Parsed, raw: string) {
  const g = ctx.g;
  switch (parsed.kind) {
    case "empty":
      return say(ctx, "parse.empty");
    case "yes":
    case "no":
      if (answerPerson(ctx, parsed.kind === "yes")) return afterAction(ctx);
      // Nobody asked: just a "yes" or a "no" said aloud.
      return mood(ctx, parsed.kind === "yes" ? "ok" : "no");
    case "question":
      return say(ctx, "parse.question");
    case "notYet":
      return say(ctx, "parse.notYet", { w: parsed.word });
    case "relative":
      return say(ctx, "parse.relative");
    case "unknownVerb":
      return misunderstood(ctx, "parse.unknown", { w: quoted(raw) });
    case "unknownWord":
      return misunderstood(ctx, "parse.unknownWord", { w: parsed.word });
    case "far":
      return say(ctx, "go.far");
    case "meta":
      return say(ctx, "meta");
    case "impossible":
      return say(ctx, "impossible");
    case "mood":
      return mood(ctx, parsed.mood);
    case "notHere":
      return say(ctx, parsed.dark ? "parse.notHereDark" : "parse.notHere");
    case "noExit":
      return say(ctx, "go.noExit");
    case "what":
      g.st.pending = { kind: "what", intent: parsed.intent, slot: parsed.slot };
      return say(ctx, `ask.${parsed.intent.verb}`);
    case "which": {
      // "Put it in my pocket": any pocket where it fits will do.
      const intent = parsed.intent;
      if (intent.verb === "put" && parsed.slot === "ind" && intent.obj) {
        const own = stores(g);
        if (parsed.options.every((id) => own.includes(id))) {
          const fits = parsed.options.find((c) =>
            intent.obj!.every((x) => !misfit(g, x, c)),
          );
          intent.ind = fits ?? parsed.options[0];
          return run(ctx, intent, raw, false);
        }
      }
      g.st.pending = {
        kind: "which",
        intent,
        slot: parsed.slot,
        options: parsed.options,
      };
      return say(ctx, "parse.which", { list: refs(g, parsed.options) });
    }
    case "intent":
      g.st.flags.misses = 0;
      return run(ctx, parsed.intent, raw, false);
  }
}

const same = (g: Game, lang: Lang, a: string, b: string) => {
  const L = langsFor(g, lang);
  return tokenize(L, a).join(" ") === tokenize(L, b).join(" ");
};

/** Plays one command. Returns the turn and whether to autosave. */
/**
 * "Take a strip, put it on the torch": each command in turn, as long as the
 * game does not stop to ask something. A piece that means nothing is
 * passed over when another one makes sense.
 */
function chain(ctx: Ctx, lang: Lang, parts: string[], raw: string) {
  const g = ctx.g;
  let done = 0;
  for (const part of parts) {
    const parsed = parse(g, lang, part);
    if (parsed.kind === "unknownVerb" || parsed.kind === "empty") continue;
    handle(ctx, parsed, part);
    drain(ctx);
    done++;
    if (g.st.pending || g.st.flags.dead) break;
  }
  if (done === 0) handle(ctx, parse(g, lang, raw), raw);
}

export function play(
  g: Game,
  lang: Lang,
  input: string,
): { turn: Turn; placeChanged: boolean } {
  const ctx = newCtx(g);
  const raw = input.trim().slice(0, 200);
  const pending = g.st.pending;
  delete g.st.pending;

  if (g.st.flags.dead) {
    say(ctx, "game.over");
    const turn: Turn = { in: raw, out: ctx.out, t: g.st.clock };
    g.st.journal.push(turn);
    return { turn, placeChanged: false };
  }

  if (pending?.kind === "confirm") {
    const parsed = parse(g, lang, raw);
    if (parsed.kind === "yes" || same(g, lang, raw, pending.raw)) {
      run(ctx, pending.intent, pending.raw, true);
    } else if (parsed.kind === "no") {
      say(ctx, "confirm.cancel");
    } else {
      handle(ctx, parsed, raw);
    }
  } else if (pending) {
    const answered = answer(g, lang, raw, pending);
    const failed =
      answered?.kind === "notHere" || answered?.kind === "unknownWord";
    const fresh = !answered || failed ? parse(g, lang, raw) : undefined;
    if (fresh && (!failed || fresh.kind !== "unknownVerb")) {
      handle(ctx, fresh, raw);
    } else {
      // Not a command either: tell why the answer did not work, and keep
      // the question open.
      handle(ctx, answered!, raw);
      if (failed) g.st.pending = pending;
    }
  } else {
    const parts = splitCommands(g, lang, raw);
    if (parts.length > 1) chain(ctx, lang, parts, raw);
    else handle(ctx, parse(g, lang, raw), raw);
  }

  drain(ctx);
  const turn: Turn = { in: raw, out: ctx.out, t: g.st.clock };
  g.st.journal.push(turn);
  if (g.st.journal.length > JOURNAL_LIMIT)
    g.st.journal.splice(0, g.st.journal.length - JOURNAL_LIMIT);
  return { turn, placeChanged: ctx.placeChanged };
}
