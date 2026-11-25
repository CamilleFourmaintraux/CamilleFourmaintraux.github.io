// People: what they think of the player, how brave they are, and what they
// do each round. Talking, trading and fighting are modes of one encounter,
// so the social verbs (threaten, persuade, lie, beg, insult, give) work in
// all of them and can turn one into another.

import { announce, lastVital, noteVital, worstWound } from "./body";
import { setNeeds } from "./needs";
import { playerAsleep } from "./systems";
import { advance, emit, on, onScheduled, say, type Ctx } from "./core";
import { escapes, outruns, rating, strike, wielded } from "./combat";
import { runInt, runRandom } from "./rng";
import {
  bare,
  children,
  comp,
  conscious,
  freeHands,
  has,
  move,
  patch,
  peopleIn,
  placeOf,
  ref,
  refs,
  skill,
  subtree,
  vital,
  within,
  type Game,
} from "./world";
import type { Id, Intent, Mind, Msg } from "./types";

export const mindOf = (g: Game, id: Id) => comp(g, id, "mind");
const setMind = (g: Game, id: Id, values: Partial<Mind>) =>
  patch(g, id, "mind", values);
const d10 = (g: Game) => 1 + runInt(g.st, 10);
const has_ = (mind: Mind | undefined, trait: string) =>
  !!mind?.traits.includes(trait);

const here = (g: Game) => placeOf(g, g.st.player);

/** People awake in the player's place. */
export function awakeHere(g: Game): Id[] {
  return peopleIn(g, here(g)).filter((id) => conscious(g, id));
}

export function hostilesHere(g: Game): Id[] {
  return awakeHere(g).filter((id) => mindOf(g, id)?.hostile);
}

/** The person a social verb is about when none is named. */
export function defaultPerson(g: Game): Id | undefined {
  const awake = awakeHere(g);
  const engaged = awake.find((id) => g.st.enc[id]);
  if (engaged) return engaged;
  if (awake.length === 1) return awake[0];
  const people = peopleIn(g, here(g));
  return people.length === 1 ? people[0] : undefined;
}

/** Valuables a robber wants: coins, and the purse that holds them. */
export function valuables(g: Game, owner: Id): Id[] {
  const coins = subtree(g, owner).filter((id) => g.st.ent[id].tpl === "coins");
  const out = coins.map((id) => {
    const holder = g.st.ent[id].loc!;
    return comp(g, holder, "container")?.kind === "bag" ? holder : id;
  });
  return [...new Set(out)];
}

/** Moves things into a person's pockets (their first bag, or their body). */
function pocket(g: Game, person: Id, items: Id[]) {
  const bag = subtree(g, person).find(
    (id) => comp(g, id, "container")?.kind === "bag",
  );
  for (const item of items) move(g, item, bag ?? person);
}

/** A person leaves by a random way out. */
function leave(ctx: Ctx, person: Id, key: string) {
  const g = ctx.g;
  const place = placeOf(g, person);
  const exits = (comp(g, place, "place")?.exits ?? []).filter((exit) => {
    const door = exit.door ? comp(g, exit.door, "door") : undefined;
    return !door || door.open || !door.locked;
  });
  delete g.st.enc[person];
  if (exits.length === 0) return;
  const exit = exits[runInt(g.st, exits.length)];
  say(ctx, key, { x: bare(g, person), dir: { k: `dirTo.${exit.dir}` } });
  move(g, person, exit.to);
}

function startFight(ctx: Ctx, person: Id) {
  setMind(ctx.g, person, { hostile: true, surrendered: false });
  ctx.g.st.enc[person] = { mode: "fight" };
}

/** A beaten robber or a cornered civilian gives up. */
function surrender(ctx: Ctx, person: Id) {
  const g = ctx.g;
  setMind(g, person, { hostile: false, surrendered: true });
  g.st.enc[person] = { mode: "talk" };
  const { item } = wielded(g, person);
  const armed = item && has(g, item, "weapon");
  say(ctx, armed ? "npc.surrenders" : "npc.surrenders.unarmed", {
    x: ref(g, person),
  });
  if (item) move(g, item, placeOf(g, person));
}

function flee(ctx: Ctx, person: Id) {
  setMind(ctx.g, person, { fled: true, hostile: false });
  leave(ctx, person, "npc.flees");
}

// ---------------------------------------------------------------------------
// Roles: how each kind of person behaves.

interface Role {
  /** When the player and this person meet: the player came in, or the
   *  person arrived. */
  meet?: (ctx: Ctx, person: Id, how?: "arrive") => void;
  /** Each round the player acts near this person. */
  act?: (ctx: Ctx, person: Id) => void;
  /** Answer to yes or no, when this person asked something. */
  answer?: (ctx: Ctx, person: Id, yes: boolean) => void;
}

/** Fight, or give up when hurt and frightened enough. */
function fightOrFold(ctx: Ctx, person: Id, aims: string[]) {
  const g = ctx.g;
  const mind = mindOf(g, person)!;
  const shaken =
    mind.morale < 20 || (worstWound(g, person) >= 3 && mind.morale < 40);
  if (shaken) {
    const wantsToRun = runRandom(g.st) < (has_(mind, "cruel") ? 0.7 : 0.5);
    if (!wantsToRun) return surrender(ctx, person);
    // The player can bar the way: cornered, the person gives up.
    if (conscious(g, g.st.player) && !outruns(g, person, g.st.player)) {
      say(ctx, "npc.blocked", { x: ref(g, person) });
      return surrender(ctx, person);
    }
    flee(ctx, person);
    return;
  }
  if (!conscious(g, g.st.player)) return;
  strike(ctx, person, g.st.player, {
    aim: aims[runInt(g.st, aims.length)] || undefined,
  });
}

function rob(ctx: Ctx, person: Id, items: Id[]) {
  const g = ctx.g;
  pocket(g, person, items);
  setMind(g, person, {
    satisfied: true,
    hostile: false,
    attitude: (mindOf(g, person)?.attitude ?? 0) + 20,
  });
  delete g.st.enc[person];
}

const ROLES: Record<string, Role> = {
  robber: {
    meet(ctx, person, how) {
      const g = ctx.g;
      const mind = mindOf(g, person)!;
      const w = wielded(g, person).item;
      if (mind.hostile) {
        g.st.enc[person] = { mode: "fight" };
        return say(ctx, "robber.resume", { x: ref(g, person) });
      }
      if (mind.satisfied || mind.surrendered || mind.fled) return;
      g.st.enc[person] = {
        mode: "talk",
        question: "purse",
        patience: 2,
        fresh: true,
      };
      // He does not leap out to block a sleeper's way: he wakes him up.
      // Nor a man who stands still: he walks up to him.
      let variant = "";
      if (playerAsleep(g)) {
        setNeeds(g, g.st.player, { mode: "awake" });
        say(ctx, "sleep.wake.event");
        ctx.wokeUp = true;
        variant = ".asleep";
      } else if (how === "arrive") variant = ".approach";
      say(ctx, `${w ? "robber.demand" : "robber.demandUnarmed"}${variant}`, {
        x: ref(g, person),
        w: w ? ref(g, w) : "",
      });
    },
    act(ctx, person) {
      const g = ctx.g;
      const mind = mindOf(g, person)!;
      const enc = g.st.enc[person];
      if (mind.hostile) return fightOrFold(ctx, person, ["", "", "head"]);
      if (enc?.question !== "purse") return;
      // No reaction on the very turn of the meeting.
      if (enc.fresh) return void delete enc.fresh;
      enc.patience = (enc.patience ?? 2) - 1;
      if (enc.patience > 0)
        return say(ctx, "robber.waiting", { x: ref(g, person) });
      say(ctx, "robber.impatient", { x: ref(g, person) });
      startFight(ctx, person);
      strike(ctx, person, g.st.player, { aim: "head" });
    },
    answer(ctx, person, yes) {
      const g = ctx.g;
      if (!yes) {
        say(ctx, "robber.refused", { x: ref(g, person) });
        startFight(ctx, person);
        return;
      }
      handOver(ctx, person);
    },
  },
  civilian: {
    act(ctx, person) {
      const g = ctx.g;
      const mind = mindOf(g, person)!;
      // Attacked, a civilian runs and calls for help.
      if (mind.hostile || g.st.enc[person]?.mode === "fight") {
        say(ctx, "civilian.cries", { x: ref(g, person) });
        emit(ctx, { type: "noise", actor: person });
        if (conscious(g, g.st.player) && !outruns(g, person, g.st.player)) {
          say(ctx, "npc.blocked", { x: ref(g, person) });
          return surrender(ctx, person);
        }
        flee(ctx, person);
      }
    },
  },
};

/** The player gives what a robber asked for. */
function handOver(ctx: Ctx, person: Id) {
  const g = ctx.g;
  const items = valuables(g, g.st.player);
  if (items.length === 0) {
    say(ctx, "robber.nothing", { x: ref(g, person) });
    startFight(ctx, person);
    return;
  }
  say(ctx, "robber.takes", { x: ref(g, person), list: refs(g, items) });
  rob(ctx, person, items);
  leave(ctx, person, "robber.leaves");
}

const roleOf = (g: Game, id: Id) => ROLES[mindOf(g, id)?.role ?? ""] ?? {};

// ---------------------------------------------------------------------------
// Rounds: after each action of the player that takes time, the people
// around react. Looking, examining and the like are free.

export function npcRound(ctx: Ctx) {
  const g = ctx.g;
  for (const person of awakeHere(g)) {
    if (g.st.flags.dead || !conscious(g, g.st.player)) break;
    if (placeOf(g, person) !== here(g)) continue;
    roleOf(g, person).act?.(ctx, person);
  }
  delete g.st.defending;
}

/** Yes or no to a question a person asked. False if nobody asked. */
export function answerPerson(ctx: Ctx, yes: boolean): boolean {
  const g = ctx.g;
  const person = awakeHere(g).find((id) => g.st.enc[id]?.question);
  if (!person) return false;
  const role = roleOf(g, person);
  delete g.st.enc[person].question;
  role.answer?.(ctx, person, yes);
  return true;
}

function meetAll(ctx: Ctx) {
  for (const person of peopleIn(ctx.g, here(ctx.g))) {
    if (conscious(ctx.g, person)) roleOf(ctx.g, person).meet?.(ctx, person);
  }
}

on("moved", (ctx, event) => {
  if (event.target === ctx.g.st.player && has(ctx.g, event.to ?? "", "place"))
    meetAll(ctx);
});

// Someone arrives at a planned time (content schedule).
onScheduled("arrive", (ctx, event) => {
  const g = ctx.g;
  if (!event.target || !event.to || !g.st.ent[event.target]) return;
  if (!conscious(g, event.target)) return;
  move(g, event.target, event.to);
  if (event.to === here(g)) {
    ctx.interrupted = true;
    roleOf(g, event.target).meet?.(ctx, event.target, "arrive");
  }
});

// Being attacked turns a person against the player.
on("attacked", (ctx, event) => {
  const g = ctx.g;
  if (event.actor !== g.st.player || !event.target || !mindOf(g, event.target))
    return;
  const mind = mindOf(g, event.target)!;
  setMind(g, event.target, {
    hostile: mind.role !== "civilian",
    surrendered: false,
    attitude: Math.min(mind.attitude, -60),
  });
  g.st.enc[event.target] = { mode: "fight" };
});

// Wounds shake a person's nerve.
on("wounded", (ctx, event) => {
  const g = ctx.g;
  if (!event.target) return;
  const mind = mindOf(g, event.target);
  if (!mind) return;
  const drop =
    [0, 3, 8, 20, 35][event.sev ?? 1] + (has_(mind, "fearful") ? 10 : 0);
  setMind(g, event.target, { morale: Math.max(0, mind.morale - drop) });
});

/** The player passed out: robbers help themselves, then time goes by. */
export function passOut(ctx: Ctx) {
  const g = ctx.g;
  let robbed = false;
  for (const person of awakeHere(g)) {
    const mind = mindOf(g, person)!;
    if (mind.role !== "robber" || mind.satisfied) continue;
    const items = valuables(g, g.st.player);
    if (items.length > 0) robbed = true;
    rob(ctx, person, items);
    move(g, person, comp(g, here(g), "place")!.exits[0].to);
  }
  advance(ctx, {
    until: (game) => vital(game, game.st.player) !== "down",
    max: 12 * 60,
    step: 5,
  });
  if (g.st.flags.dead) return;
  const now = vital(g, g.st.player);
  if (now === "down") return;
  // Coming to is told at once, not at the next check of the body.
  const was = lastVital(g, g.st.player);
  if (was === "down") {
    noteVital(g, g.st.player, now);
    announce(ctx, g.st.player, was, now);
  }
  if (robbed) say(ctx, "you.robbed");
}

// ---------------------------------------------------------------------------
// Descriptions.

/** One line per person in the place description. */
export function personLine(ctx: Ctx, person: Id) {
  const g = ctx.g;
  // A robber lying in wait is not seen before he jumps out.
  const lurking = mindOf(g, person);
  if (
    lurking?.role === "robber" &&
    !lurking.hostile &&
    !lurking.satisfied &&
    !lurking.surrendered &&
    !lurking.fled &&
    !g.st.enc[person]
  ) {
    return;
  }
  const x = bare(g, person);
  const v = vital(g, person);
  const mind = mindOf(g, person);
  if (v === "dead") return say(ctx, "npc.line.dead", { x });
  if (v === "down") return say(ctx, "npc.line.down", { x });
  if (mind?.surrendered) return say(ctx, "npc.line.surrendered", { x });
  const { item } = wielded(g, person);
  if (mind?.hostile) {
    return say(ctx, item ? "npc.line.hostile" : "npc.line.hostileUnarmed", {
      x,
      w: item ? ref(g, item) : "",
    });
  }
  const key = `${g.st.ent[person].tpl}.here`;
  say(ctx, g.content.langs.fr.messages[key] ? key : "npc.line", { x });
}

/** What examining a person tells. */
export function describePerson(ctx: Ctx, person: Id) {
  const g = ctx.g;
  const x = ref(g, person);
  const v = vital(g, person);
  const { item } = wielded(g, person);
  if (item && v !== "dead" && v !== "down")
    say(ctx, "npc.holds", { x, w: ref(g, item) });
  const clothes = children(g, person).filter((id) => has(g, id, "wearable"));
  if (clothes.length > 0) say(ctx, "npc.wears", { x, list: refs(g, clothes) });
  const sev = worstWound(g, person);
  if (sev >= 2) say(ctx, `npc.hurt.${Math.min(sev, 4)}`, { x });
  if (v === "dead" || v === "down") {
    const things = subtree(g, person).filter(
      (id) =>
        id !== person &&
        !has(g, id, "part") &&
        !has(g, id, "wearable") &&
        !comp(g, id, "container"),
    );
    say(ctx, things.length ? "npc.search" : "npc.searchEmpty", {
      x: bare(g, person),
      list: refs(g, things),
    });
    return;
  }
  const mind = mindOf(g, person);
  if (mind && !mind.hostile && !mind.surrendered) {
    say(
      ctx,
      mind.attitude >= 30
        ? "npc.mood.friendly"
        : mind.attitude <= -30
          ? "npc.mood.hostile"
          : "npc.mood.neutral",
      { x },
    );
  }
  const gap = rating(g, person) - rating(g, g.st.player);
  if (gap >= 3) say(ctx, "npc.danger.high", { x });
  else if (gap <= -3) say(ctx, "npc.danger.low", { x });
}

// ---------------------------------------------------------------------------
// Social verbs. Each returns nothing; the messages tell what happened.

function unable(ctx: Ctx, person: Id): boolean {
  const g = ctx.g;
  const v = vital(g, person);
  if (v === "dead")
    return (say(ctx, "talk.dead", { x: bare(g, person) }), true);
  if (v === "down")
    return (say(ctx, "talk.down", { x: bare(g, person) }), true);
  return false;
}

/** The robber's demand is still open: talk costs patience. */
function stalling(ctx: Ctx, person: Id): boolean {
  const g = ctx.g;
  if (g.st.enc[person]?.question !== "purse") return false;
  say(ctx, "robber.noTalk", { x: ref(g, person) });
  return true;
}

function topicList(g: Game, person: Id): Msg[] {
  const mind = mindOf(g, person)!;
  return Object.keys(mind.topics ?? {}).map((topic) => ({
    k: `topic.${topic}`,
  }));
}

export function talk(ctx: Ctx, person: Id, topic?: string) {
  const g = ctx.g;
  if (unable(ctx, person) || stalling(ctx, person)) return;
  const mind = mindOf(g, person);
  if (!mind) return say(ctx, "talk.thing", { x: ref(g, person) });
  if (mind.hostile) return say(ctx, "talk.fighting", { x: ref(g, person) });
  const tpl = g.st.ent[person].tpl;
  const known = (key: string) => g.content.langs.fr.messages[key] !== undefined;
  // Someone the player hurt or insulted does not chat.
  const cold = mind.attitude < -30 && !mind.surrendered;
  if (!topic) {
    const greet = cold ? `${tpl}.greet.cold` : `${tpl}.greet`;
    say(ctx, known(greet) ? greet : cold ? "talk.greet.cold" : "talk.greet", {
      x: ref(g, person),
    });
    if (cold) return;
    const topics = topicList(g, person);
    if (topics.length > 0) say(ctx, "talk.topics", { list: topics });
    return;
  }
  const entry = mind.topics?.[topic];
  if (!entry) {
    // Each person says "no idea" in their own way.
    const key = cold ? `${tpl}.greet.cold` : `${tpl}.unknown`;
    return say(ctx, known(key) ? key : "talk.unknown", { x: ref(g, person) });
  }
  const open =
    mind.surrendered ||
    (!entry.surrendered && mind.attitude >= (entry.min ?? -30));
  if (!open) return say(ctx, "talk.refuses", { x: ref(g, person) });
  say(ctx, entry.say);
  if (entry.give && g.st.ent[entry.give] && within(g, entry.give, person)) {
    const hand = freeHands(g, g.st.player)[0];
    move(g, entry.give, hand ?? here(g));
    say(ctx, hand ? "talk.gives" : "talk.givesGround", {
      x: ref(g, person),
      y: ref(g, entry.give),
    });
  }
}

/** Threat strength: the weapon in hand, the build, the tone. */
function threat(g: Game): number {
  const { item, weapon } = wielded(g, g.st.player);
  const strength = comp(g, g.st.player, "actor")?.strength ?? 5;
  return (
    (item ? weapon.power * 0.6 : 0) +
    (strength - 5) +
    skill(g, g.st.player, "eloquence") * 0.5 +
    d10(g)
  );
}

function nerve(g: Game, person: Id): number {
  const mind = mindOf(g, person)!;
  return (
    mind.morale / 10 +
    d10(g) +
    (has_(mind, "brave") ? 3 : 0) -
    (has_(mind, "fearful") ? 3 : 0)
  );
}

function wits(g: Game, person: Id): number {
  const mind = mindOf(g, person)!;
  return (
    5 + d10(g) - (has_(mind, "drunk") ? 2 : 0) + (has_(mind, "greedy") ? 1 : 0)
  );
}

const speech = (g: Game) => skill(g, g.st.player, "eloquence") + d10(g);

export function threaten(ctx: Ctx, person: Id) {
  const g = ctx.g;
  if (unable(ctx, person)) return;
  const mind = mindOf(g, person);
  if (!mind) return say(ctx, "threaten.thing", { x: ref(g, person) });
  if (threat(g) > nerve(g, person)) {
    setMind(g, person, {
      morale: Math.max(0, mind.morale - 25),
      attitude: mind.attitude - 10,
    });
    if (mind.role === "robber" && !mind.hostile) {
      say(ctx, "threaten.robber.works", { x: ref(g, person) });
      setMind(g, person, { fled: true });
      return leave(ctx, person, "npc.backsOff");
    }
    if (mind.hostile) return say(ctx, "threaten.shaken", { x: ref(g, person) });
    say(ctx, "threaten.works", { x: ref(g, person) });
    if (has_(mind, "fearful")) flee(ctx, person);
    return;
  }
  setMind(g, person, { attitude: mind.attitude - 15 });
  if (mind.role === "robber" && !mind.hostile) {
    say(ctx, "threaten.robber.fails", { x: ref(g, person) });
    startFight(ctx, person);
    return;
  }
  say(ctx, "threaten.fails", { x: ref(g, person) });
}

export function persuade(ctx: Ctx, person: Id) {
  const g = ctx.g;
  if (unable(ctx, person)) return;
  const mind = mindOf(g, person);
  if (!mind) return say(ctx, "persuade.thing", { x: ref(g, person) });
  const works = speech(g) + mind.attitude / 20 > wits(g, person);
  if (mind.role === "robber" && g.st.enc[person]?.question === "purse") {
    if (!works) return say(ctx, "persuade.robber.fails", { x: ref(g, person) });
    say(ctx, "persuade.robber.works", { x: ref(g, person) });
    setMind(g, person, { satisfied: true });
    return leave(ctx, person, "robber.leavesEmpty");
  }
  if (mind.hostile) {
    if (!works) return say(ctx, "persuade.fight.fails", { x: ref(g, person) });
    setMind(g, person, {
      hostile: false,
      attitude: Math.max(mind.attitude, -20),
    });
    g.st.enc[person] = { mode: "talk" };
    return say(ctx, "persuade.fight.works", { x: ref(g, person) });
  }
  if (!works) return say(ctx, "persuade.fails", { x: ref(g, person) });
  setMind(g, person, { attitude: mind.attitude + 15 });
  say(ctx, "persuade.works", { x: ref(g, person) });
}

export function lie(ctx: Ctx, person: Id) {
  const g = ctx.g;
  if (unable(ctx, person)) return;
  const mind = mindOf(g, person);
  if (!mind) return say(ctx, "lie.thing", { x: ref(g, person) });
  if (mind.role === "robber" && g.st.enc[person]?.question === "purse") {
    // Saying you have nothing is no lie if the purse is hidden elsewhere.
    const truth = valuables(g, g.st.player).length === 0;
    if (truth || speech(g) > wits(g, person) + 1) {
      say(ctx, "lie.robber.works", { x: ref(g, person) });
      setMind(g, person, { satisfied: true });
      return leave(ctx, person, "robber.leavesEmpty");
    }
    say(ctx, "lie.robber.fails", { x: ref(g, person) });
    startFight(ctx, person);
    return;
  }
  say(ctx, speech(g) > wits(g, person) ? "lie.works" : "lie.fails", {
    x: ref(g, person),
  });
  if (speech(g) <= wits(g, person))
    setMind(g, person, { attitude: mind.attitude - 10 });
}

export function beg(ctx: Ctx, person: Id) {
  const g = ctx.g;
  if (unable(ctx, person)) return;
  const mind = mindOf(g, person);
  if (!mind) return say(ctx, "beg.thing", { x: ref(g, person) });
  const pity =
    d10(g) +
    skill(g, g.st.player, "eloquence") -
    (has_(mind, "cruel") ? 4 : 0) +
    mind.attitude / 25;
  if (mind.hostile) {
    if (pity < 7) return say(ctx, "beg.fight.fails", { x: ref(g, person) });
    setMind(g, person, { hostile: false });
    if (mind.role === "robber" && !mind.satisfied) {
      g.st.enc[person] = { mode: "talk", question: "purse", patience: 2 };
      return say(ctx, "beg.robber.spares", { x: ref(g, person) });
    }
    delete g.st.enc[person];
    return say(ctx, "beg.fight.works", { x: ref(g, person) });
  }
  if (mind.role === "robber" && g.st.enc[person]?.question === "purse") {
    if (pity < 8) return say(ctx, "beg.robber.fails", { x: ref(g, person) });
    say(ctx, "beg.robber.works", { x: ref(g, person) });
    setMind(g, person, { satisfied: true });
    return leave(ctx, person, "robber.leavesEmpty");
  }
  setMind(g, person, { attitude: mind.attitude + 5 });
  say(ctx, "beg.default", { x: ref(g, person) });
}

export function insult(ctx: Ctx, person: Id) {
  const g = ctx.g;
  if (unable(ctx, person)) return;
  const mind = mindOf(g, person);
  if (!mind) return say(ctx, "insult.thing", { x: ref(g, person) });
  setMind(g, person, { attitude: mind.attitude - 25 });
  if (mind.role === "robber" && !mind.hostile && !mind.surrendered) {
    say(ctx, "insult.robber", { x: ref(g, person) });
    startFight(ctx, person);
    return;
  }
  say(ctx, has_(mind, "fearful") ? "insult.fearful" : "insult.default", {
    x: ref(g, person),
  });
}

export function give(ctx: Ctx, item: Id, person: Id) {
  const g = ctx.g;
  if (unable(ctx, person)) return;
  const mind = mindOf(g, person);
  if (!mind)
    return say(ctx, "give.thing", { x: ref(g, person), y: ref(g, item) });
  if (!within(g, item, g.st.player))
    return say(ctx, "drop.notCarried", { x: ref(g, item) });
  const isMoney =
    valuables(g, g.st.player).includes(item) || g.st.ent[item].tpl === "coins";
  if (mind.role === "robber" && !mind.satisfied && isMoney) {
    say(ctx, "robber.takes", { x: ref(g, person), list: [ref(g, item)] });
    rob(ctx, person, [item]);
    return leave(ctx, person, "robber.leaves");
  }
  if (isMoney) {
    say(ctx, "give.bribe", { x: ref(g, person), y: ref(g, item) });
    pocket(g, person, [item]);
    setMind(g, person, { attitude: mind.attitude + 40 });
    return;
  }
  if (has(g, item, "edible") && has_(mind, "hungry")) {
    say(ctx, "give.food", { x: ref(g, person), y: bare(g, item) });
    pocket(g, person, [item]);
    setMind(g, person, { attitude: mind.attitude + 15 });
    return;
  }
  say(ctx, "give.refused", { x: ref(g, person), y: ref(g, item) });
}

export function shout(ctx: Ctx) {
  const g = ctx.g;
  emit(ctx, { type: "noise", actor: g.st.player });
  const robber = awakeHere(g).find((id) => g.st.enc[id]?.question === "purse");
  if (robber) return say(ctx, "shout.robber", { x: ref(g, robber) });
  if (hostilesHere(g).length > 0) return say(ctx, "shout.fight");
  const person = awakeHere(g)[0];
  if (person) return say(ctx, "shout.startles", { x: ref(g, person) });
  say(ctx, "shout.alone");
}

/** Walking away from a robber's demand is a refusal. */
export function refuseByLeaving(ctx: Ctx) {
  const g = ctx.g;
  const person = awakeHere(g).find((id) => g.st.enc[id]?.question === "purse");
  if (!person) return;
  delete g.st.enc[person].question;
  say(ctx, "robber.notSoFast", { x: ref(g, person) });
  startFight(ctx, person);
}

/** Paying someone off: whatever money the player carries. */
export function bribe(ctx: Ctx, person: Id) {
  const g = ctx.g;
  const money = valuables(g, g.st.player)[0];
  if (!money) return say(ctx, "bribe.nothing");
  give(ctx, money, person);
}

/** Before attacking someone much stronger, the player is warned. */
export function attackRisk(
  g: Game,
  intent: Intent,
): { kind: string; warn: Msg } | undefined {
  const target = intent.obj?.[0];
  if (!target || !has(g, target, "actor") || !conscious(g, target))
    return undefined;
  if (g.st.enc[target]?.mode === "fight") return undefined;
  const gap = rating(g, target) - rating(g, g.st.player);
  if (gap < 3) return undefined;
  const unarmed = !wielded(g, g.st.player).item;
  return {
    kind: `stronger:${target}`,
    warn: {
      k: unarmed ? "attack.warnUnarmed" : "attack.warn",
      p: { x: ref(g, target) },
    },
  };
}

/** Running away: from hostile people only. Returns true when free to go. */
export function getAway(ctx: Ctx): boolean {
  const g = ctx.g;
  const chasers = hostilesHere(g);
  if (chasers.length === 0) return true;
  const result = escapes(g, chasers);
  if (result.ok) {
    say(ctx, "flee.ok");
    return true;
  }
  say(ctx, "flee.blocked", { x: ref(g, result.blocker!) });
  return false;
}

// ---------------------------------------------------------------------------
// Mercy, surrender, apologies, thanks.

/** Letting someone who gave up go free. */
export function spare(ctx: Ctx, person: Id) {
  const g = ctx.g;
  if (unable(ctx, person)) return;
  const mind = mindOf(g, person);
  if (!mind) return say(ctx, "spare.thing", { x: ref(g, person) });
  if (mind.hostile) return say(ctx, "spare.hostile", { x: ref(g, person) });
  if (!mind.surrendered)
    return say(ctx, "spare.nothing", { x: ref(g, person) });
  setMind(g, person, {
    surrendered: false,
    fled: true,
    attitude: mind.attitude + 30,
  });
  say(ctx, "spare.done", { x: ref(g, person) });
  leave(ctx, person, "npc.leaves");
}

/** The player raises their hands. */
export function playerSurrenders(ctx: Ctx) {
  const g = ctx.g;
  const robber = awakeHere(g).find((id) => g.st.enc[id]?.question === "purse");
  if (robber) {
    say(ctx, "surrender.robber");
    delete g.st.enc[robber].question;
    return handOver(ctx, robber);
  }
  const foe = hostilesHere(g)[0];
  if (foe) {
    say(ctx, "surrender.fight");
    return beg(ctx, foe);
  }
  say(ctx, "surrender.alone");
}

export function apologize(ctx: Ctx, person: Id) {
  const g = ctx.g;
  if (unable(ctx, person)) return;
  const mind = mindOf(g, person);
  if (!mind) return say(ctx, "apologize.thing", { x: ref(g, person) });
  if (g.st.enc[person]?.question === "purse")
    return say(ctx, "apologize.robber", { x: ref(g, person) });
  if (mind.hostile) return say(ctx, "apologize.hostile", { x: ref(g, person) });
  if (mind.attitude >= 0)
    return say(ctx, "apologize.puzzled", { x: ref(g, person) });
  // Once an hour at most: sorry loses its weight when repeated.
  const flag = `sorry.${person}`;
  if (g.st.clock - Number(g.st.flags[flag] ?? -999) < 60) {
    return say(ctx, "apologize.again", { x: ref(g, person) });
  }
  g.st.flags[flag] = g.st.clock;
  setMind(g, person, { attitude: mind.attitude + 20 });
  say(
    ctx,
    mind.attitude + 20 >= -30 ? "apologize.accepted" : "apologize.cold",
    { x: ref(g, person) },
  );
}

export function thank(ctx: Ctx, person: Id) {
  const g = ctx.g;
  if (unable(ctx, person)) return;
  const mind = mindOf(g, person);
  if (!mind) return say(ctx, "thank.thing", { x: ref(g, person) });
  if (mind.hostile) return say(ctx, "thank.hostile", { x: ref(g, person) });
  setMind(g, person, { attitude: Math.min(mind.attitude + 3, 60) });
  say(ctx, "thank.done", { x: ref(g, person) });
}
