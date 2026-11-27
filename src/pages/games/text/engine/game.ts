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
  VERBS,
  langsFor,
  type Parsed,
} from "./parser";
import { startSystems } from "./systems";
import { VERB_RUNNERS, describePlace, misfit, stores } from "./verbs";
import {
  comp,
  destroy,
  newState,
  ref,
  refs,
  setComp,
  spawn,
  vital,
  type Content,
  type Game,
} from "./world";
import type { Id, Intent, Lang, Turn } from "./types";

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
  for (const key of g.content.intro ?? []) say(ctx, key);
  describePlace(ctx);
  drain(ctx);
  g.st.journal.push({ in: "", out: ctx.out, t: g.st.clock });
  return g;
}

function run(ctx: Ctx, intent: Intent, raw: string, confirmed: boolean) {
  const g = ctx.g;
  const verb = VERB_RUNNERS[intent.verb];
  if (!verb) return say(ctx, "parse.unknownVerb", { w: raw });
  // A verb that needs a thing never runs without one: it asks instead.
  const spec = VERBS[intent.verb];
  if (spec?.obj && !spec.optional && !intent.all && !intent.obj?.length) {
    g.st.pending = { kind: "what", intent, slot: "obj" };
    return say(ctx, `ask.${intent.verb}`);
  }
  const risk = verb.risk?.(ctx, intent);
  if (risk && !confirmed) {
    const last = g.st.confirmed[risk.kind];
    if (last === undefined || g.st.clock - last > CONFIRM_SPAN) {
      g.st.pending = { kind: "confirm", raw, intent, risk: risk.kind };
      ctx.out.push(risk.warn);
      return;
    }
  }
  // "Take a nail": one comes out of the crate's stock for the verb to use,
  // and goes back if the verb did nothing with it.
  let picked: { one: Id; source: Id } | undefined;
  if (intent.stock && intent.obj?.[0]) {
    const source = intent.obj[0];
    const stock = comp(g, source, "stock");
    if (!stock || stock.count <= 0)
      return say(ctx, "stock.empty", { x: ref(g, source) });
    picked = { one: spawn(g, stock.tpl, source), source };
    intent = { ...intent, obj: [picked.one] };
  }
  if (intent.obj && intent.obj.length > 0) g.st.it = [...intent.obj];
  verb.run(ctx, intent);
  if (picked) {
    const stock = comp(g, picked.source, "stock")!;
    if (g.st.ent[picked.one]?.loc === picked.source) destroy(g, picked.one);
    else
      setComp(g, picked.source, "stock", { ...stock, count: stock.count - 1 });
  }
  // Counted from the end of the action: after a nap in the street, sleeping
  // there again needs no new warning.
  if (risk) g.st.confirmed[risk.kind] = g.st.clock;
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
  // A plain "ok" or "no" is not worth a look from anyone.
  if (witness && !["ok", "no", "never", "despair"].includes(name))
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
    case "narrator":
      return say(ctx, parsed.key);
    case "far":
      return say(ctx, parsed.place ? "go.farNamed" : "go.far", {
        x: parsed.place ? ref(ctx.g, parsed.place) : "",
      });
    case "farWhich":
      return say(ctx, "go.farWhich", { list: refs(ctx.g, parsed.places) });
    case "meta":
      return say(ctx, "meta");
    case "impossible":
      return say(ctx, "impossible");
    case "mood":
      return mood(ctx, parsed.mood);
    case "notHere":
      return say(ctx, parsed.dark ? "parse.notHereDark" : "parse.notHere");
    case "noExit":
      // No way up or down here: said as such, not as a few steps that way.
      return say(
        ctx,
        parsed.dir === "up" || parsed.dir === "down"
          ? `go.noExit.${parsed.dir}`
          : "go.noExit",
      );
    case "what":
      g.st.pending = { kind: "what", intent: parsed.intent, slot: parsed.slot };
      return say(ctx, `ask.${parsed.intent.verb}`);
    case "giveOrGet":
      g.st.pending = { kind: "giveOrGet" };
      return say(ctx, "give.which");
    case "askFor":
      g.st.pending = { kind: "prefix", text: ASK_PREFIX };
      return say(ctx, "ask.request");
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
/** "Give me": both languages are read, so the English words always work. */
const ASK_PREFIX = "give me";

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
  } else if (pending?.kind === "giveOrGet") {
    // "Give, or be given?": either answer asks what.
    const tokens = tokenize(langsFor(g, lang), raw);
    const L = langsFor(g, lang);
    if (tokens.some((t) => L.some((l) => l.receiveWords.includes(t)))) {
      g.st.pending = { kind: "prefix", text: ASK_PREFIX };
      say(ctx, "ask.request");
    } else if (tokens.some((t) => L.some((l) => l.giveWords.includes(t)))) {
      g.st.pending = { kind: "what", intent: { verb: "give" }, slot: "obj" };
      say(ctx, "ask.give");
    } else handle(ctx, parse(g, lang, raw), raw);
  } else if (pending?.kind === "prefix") {
    // The answer finishes the command the question started.
    const full = `${pending.text} ${raw}`;
    handle(ctx, parse(g, lang, full), full);
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
    const first = parts.length === 1 ? parse(g, lang, raw) : undefined;
    const last = g.st.flags.lastCommand as string | undefined;
    if (first?.kind === "intent" && first.intent.verb === "again") {
      // "Try again": the last command, once more.
      if (last) handle(ctx, parse(g, lang, last), last);
      else say(ctx, "again.nothing");
    } else {
      if (parts.length > 1) chain(ctx, lang, parts, raw);
      else handle(ctx, first!, raw);
      g.st.flags.lastCommand = raw;
    }
  }

  drain(ctx);
  const turn: Turn = { in: raw, out: ctx.out, t: g.st.clock };
  g.st.journal.push(turn);
  if (g.st.journal.length > JOURNAL_LIMIT)
    g.st.journal.splice(0, g.st.journal.length - JOURNAL_LIMIT);
  return { turn, placeChanged: ctx.placeChanged };
}
