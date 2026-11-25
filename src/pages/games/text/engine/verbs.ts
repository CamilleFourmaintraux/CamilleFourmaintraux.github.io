// What each verb does once its words are resolved.
//
// No verb ever refuses. An action that cannot work is attempted and told as
// a failure, and may cost a little time. An action that is a bad idea asks
// for a confirmation first (see `risk`), then happens with its consequences.

import { advance, emit, say, type Ctx } from "./core";
import { has as hasText } from "./lang";
import {
  extinguish,
  isDark,
  isNauseous,
  light,
  playerPlace,
  sicken,
  weatherNow,
} from "./systems";
import { minutesUntil, period, periodHalf, weekday } from "./time";
import {
  LOAD_SLOWDOWN,
  bare,
  spawn,
  children,
  comp,
  conscious,
  destroy,
  freeHands,
  fuelLeft,
  givesFire,
  hands,
  has,
  heldIn,
  isLit,
  liftOneHand,
  liftTwoHands,
  loadTier,
  move,
  nameKey,
  nameState,
  patch,
  peopleIn,
  ref,
  refs,
  subtree,
  volumeUsed,
  weightInside,
  weightOf,
  within,
  worn,
  type Game,
} from "./world";
import { scope } from "./parser";
import { TIERS, needsOf, swallow, tier, tooMuch } from "./needs";
import { PEOPLE_VERBS, demandHere, wrapTorch } from "./actions";
import { bleedAt, bloodAt, WEAK_BLOOD } from "./health";
import {
  describePerson,
  getAway,
  hostilesHere,
  personLine,
  refuseByLeaving,
} from "./npc";
import type { Id, Intent, Msg } from "./types";

export interface Verb {
  /** Returns a risk kind and its warning when the action is a bad idea. */
  risk?: (ctx: Ctx, intent: Intent) => { kind: string; warn: Msg } | undefined;
  run: (ctx: Ctx, intent: Intent) => void;
}

const text = (g: Game, key: string) => hasText(g.content.langs.fr, key);

/** Objects lying here that could be picked up (for "take all"). */
function looseThings(g: Game): Id[] {
  return children(g, playerPlace(g)).filter(
    (id) =>
      id !== g.st.player &&
      !has(g, id, "scenery") &&
      !has(g, id, "actor") &&
      (comp(g, id, "physical")?.grip ?? "none") !== "none",
  );
}

/** Things a player carries in hand. */
function held(g: Game): Id[] {
  const { left, right } = hands(g, g.st.player);
  return [right, left].flatMap((hand) => (hand ? children(g, hand) : []));
}

/** Pockets and bags the player carries, outermost first. */
function stores(g: Game): Id[] {
  return subtree(g, g.st.player).filter((id) => {
    const kind = comp(g, id, "container")?.kind;
    return kind === "pocket" || kind === "bag";
  });
}

/** The person holding or wearing something, if not the player. */
function ownerOf(g: Game, id: Id): Id | undefined {
  for (let at = g.st.ent[id]?.loc ?? null; at; at = g.st.ent[at]?.loc ?? null) {
    if (has(g, at, "actor")) return at === g.st.player ? undefined : at;
  }
  return undefined;
}

const isPlayersHand = (g: Game, id: Id | undefined) =>
  !!id &&
  comp(g, id, "container")?.kind === "hand" &&
  within(g, id, g.st.player);

// ---------------------------------------------------------------------------
// Looking around.

export function describePlace(ctx: Ctx) {
  const g = ctx.g;
  const place = playerPlace(g);
  if (isDark(g, place)) {
    say(ctx, "look.dark");
    exitsLine(ctx);
    return;
  }
  say(ctx, "place.title", { x: ref(g, place) });
  say(ctx, `${nameKey(g, place)}.desc`);
  const info = comp(g, place, "place")!;
  if (info.outdoor) {
    const night =
      period(g.st.clock) === "night" || period(g.st.clock) === "evening";
    say(ctx, `weather.${weatherNow(g)}.${night ? "night" : "day"}`);
  }
  const things = children(g, place).filter(
    (id) =>
      id !== g.st.player &&
      !has(g, id, "scenery") &&
      !has(g, id, "door") &&
      !has(g, id, "actor"),
  );
  if (things.length > 0) say(ctx, "look.objects", { list: refs(g, things) });
  for (const person of peopleIn(g, place)) personLine(ctx, person);
  exitsLine(ctx);
}

function exitMsgs(g: Game): Msg[] {
  const exits = comp(g, playerPlace(g), "place")?.exits ?? [];
  return exits.map((exit) => {
    const p = { dir: { k: `dir.${exit.dir}` }, to: ref(g, exit.to) };
    return exit.door
      ? { k: "exit.door", p: { ...p, door: ref(g, exit.door) } }
      : { k: "exit.item", p };
  });
}

function exitsLine(ctx: Ctx) {
  const msgs = exitMsgs(ctx.g);
  if (msgs.length === 0) return;
  const dark = isDark(ctx.g, playerPlace(ctx.g));
  say(ctx, dark ? "look.exitsDark" : "look.exits", { list: msgs });
}

const look: Verb = { run: (ctx) => describePlace(ctx) };

const exits: Verb = {
  run(ctx) {
    const msgs = exitMsgs(ctx.g);
    if (msgs.length === 0) return say(ctx, "exits.none");
    say(ctx, "exits.title");
    msgs.forEach((msg, i) => say(ctx, "exits.line", { n: i + 1, exit: msg }));
  },
};

const examine: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const x = intent.obj![0];
    if (has(g, x, "place")) return describePlace(ctx);
    if (has(g, x, "sky")) return say(ctx, skyKey(g));
    // In the dark, only what you carry can be looked at properly.
    if (isDark(g, playerPlace(g)) && !subtree(g, g.st.player).includes(x)) {
      const who = has(g, x, "actor") ? "examine.darkPerson" : "examine.dark";
      return say(ctx, who, { x: ref(g, x) });
    }
    // A description per state when there is one: a spent torch is a stick.
    const burn = comp(g, x, "burn");
    const state =
      burn?.wrapped && fuelLeft(g, x) > 0 ? "wrapped" : nameState(g, x);
    const base = `${nameKey(g, x)}.desc`;
    const key =
      state && text(g, `${base}.${state}`) ? `${base}.${state}` : base;
    if (!has(g, x, "part"))
      say(ctx, text(g, key) ? key : "examine.default", { x: ref(g, x) });
    if (has(g, x, "actor") && x !== g.st.player) return describePerson(ctx, x);
    if (burn && burn.rate > 0 && key === base) {
      const fuel = fuelLeft(g, x);
      const tier =
        fuel <= 0
          ? "spent"
          : fuel < 0.15
            ? "last"
            : fuel < 0.35
              ? "low"
              : fuel < 0.7
                ? "half"
                : "full";
      say(ctx, `fuel.${tier}.${isLit(g, x) ? "lit" : "out"}`, { x: ref(g, x) });
    }
    const container = comp(g, x, "container");
    if (container) {
      const inside = children(g, x);
      if (container.kind === "hand") {
        say(ctx, inside.length ? "examine.holds" : "examine.handEmpty", {
          x: ref(g, x),
          list: refs(g, inside),
        });
      } else {
        say(ctx, inside.length ? "examine.contains" : "examine.empty", {
          x: ref(g, x),
          list: refs(g, inside),
        });
      }
    }
    const weight = weightOf(g, x);
    const grip = comp(g, x, "physical")?.grip;
    if (grip && grip !== "none" && weight > liftOneHand(g, g.st.player)) {
      say(
        ctx,
        weight > liftTwoHands(g, g.st.player)
          ? "examine.immovable"
          : "examine.heavy",
        { x: ref(g, x) },
      );
    }
  },
};

/** The sky tells the hour, the weather and, by the stars or the sun, the way. */
function skyKey(g: Game): string {
  const w = weatherNow(g);
  const p = period(g.st.clock);
  const night = p === "night" || p === "evening" || p === "dawn";
  if (w === "rain") return night ? "sky.rain.night" : "sky.rain.day";
  if (w === "cloudy") return night ? "sky.cloudy.night" : "sky.cloudy.day";
  return night ? "sky.clear.night" : "sky.clear.day";
}

// ---------------------------------------------------------------------------
// Moving.

/** A locked door opens when the player carries its key. */
function unlockWithKey(ctx: Ctx, door: Id): boolean {
  const g = ctx.g;
  const key = comp(g, door, "door")?.key;
  if (!key || !g.st.ent[key] || !within(g, key, g.st.player)) return false;
  patch(g, door, "door", { locked: false, open: true });
  say(ctx, "open.unlock", { x: ref(g, door), key: bare(g, key) });
  return true;
}

export const go: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const exits = comp(g, playerPlace(g), "place")!.exits;
    let index = intent.exit;
    if (intent.dir === "back") {
      index = exits.findIndex((exit) => exit.to === g.st.flags.prev);
      if (index < 0) return say(ctx, "go.noBack");
    }
    const exit = exits[index!];
    // Leaving a fight means getting away first.
    refuseByLeaving(ctx);
    if (!getAway(ctx)) return void advance(ctx, { minutes: 1 });
    if (exit.door) {
      const door = comp(g, exit.door, "door")!;
      if (!door.open && door.locked && !unlockWithKey(ctx, exit.door)) {
        say(ctx, "go.locked", { door: ref(g, exit.door) });
        advance(ctx, { minutes: 1 });
        return;
      }
      if (!comp(g, exit.door, "door")!.open) {
        patch(g, exit.door, "door", { open: true });
        say(ctx, "open.done", { x: ref(g, exit.door) });
      }
    }
    const tier = loadTier(g, g.st.player);
    if (tier === "overloaded") say(ctx, "go.strain");
    if (isDark(g, playerPlace(g))) say(ctx, "go.grope");
    advance(ctx, { minutes: exit.minutes * LOAD_SLOWDOWN[tier] });
    const from = g.st.ent[g.st.player].loc;
    g.st.flags.prev = from ?? "";
    move(g, g.st.player, exit.to);
    describePlace(ctx);
    const story = comp(g, exit.to, "place") && comp(g, exit.to, "story");
    if (story && !g.st.flags[`story.${exit.to}`]) {
      g.st.flags[`story.${exit.to}`] = true;
      say(ctx, story.enter);
    }
    emit(ctx, { type: "moved", target: g.st.player, from, to: exit.to });
  },
};

// ---------------------------------------------------------------------------
// Taking, dropping, putting away.

/** Moves an object into a hand, or tells why it does not work. */
function grab(ctx: Ctx, x: Id, wanted?: Id): number {
  const g = ctx.g;
  const player = g.st.player;
  const physical = comp(g, x, "physical");
  if (has(g, x, "part")) {
    say(ctx, "take.part", { x: ref(g, x) });
    return 0;
  }
  if (!physical || physical.grip === "none") {
    say(ctx, "take.fixed", { x: ref(g, x) });
    return 1;
  }
  const loc = g.st.ent[x].loc!;
  if (isPlayersHand(g, loc)) {
    // "Put the torch in my left hand": from one hand to the other.
    if (wanted && wanted !== loc && isPlayersHand(g, wanted)) {
      const there = heldIn(g, wanted);
      if (physical.grip === "two") {
        say(ctx, "take.already", { x: ref(g, x) });
        return 0;
      }
      if (there) {
        say(ctx, "hand.full", { hand: bare(g, wanted), x: ref(g, there) });
        return 0;
      }
      move(g, x, wanted);
      say(ctx, "hand.switch", { x: ref(g, x), hand: bare(g, wanted) });
      return 1;
    }
    say(ctx, "take.already", { x: ref(g, x) });
    return 0;
  }
  if (has(g, x, "wearable") && loc === player) {
    say(ctx, "take.worn", { x: ref(g, x) });
    return 0;
  }
  // Belongings of someone awake are not free for the taking.
  const owner = ownerOf(g, x);
  if (owner && conscious(g, owner) && !comp(g, owner, "mind")?.surrendered) {
    say(ctx, "take.fromPerson", { x: ref(g, x), y: ref(g, owner) });
    return 0;
  }
  const weight = weightOf(g, x);
  const free = freeHands(g, player);
  if (physical.grip === "two") {
    if (free.length < 2) {
      say(ctx, "take.needTwo", { x: ref(g, x) });
      return 0;
    }
    if (weight > liftTwoHands(g, player)) {
      say(ctx, "take.tooHeavy", { x: ref(g, x) });
      return 2;
    }
    say(ctx, "take.both", { x: ref(g, x) });
    move(g, x, free[0]);
    emit(ctx, { type: "moved", target: x, from: loc, to: free[0] });
    return 1;
  }
  if (weight > liftOneHand(g, player)) {
    say(ctx, "take.tooHeavy", { x: ref(g, x) });
    return 2;
  }
  const hand = wanted && free.includes(wanted) ? wanted : free[0];
  if (!hand) {
    say(ctx, "take.handsFull", { x: ref(g, x) });
    return 0;
  }
  if (wanted && hand !== wanted)
    say(ctx, "take.otherHand", { hand: ref(g, wanted) });
  const fromStore = within(g, loc, player);
  say(ctx, fromStore ? "take.fromStore" : "take.done", {
    x: ref(g, x),
    from: ref(g, loc),
    hand: ref(g, hand),
  });
  move(g, x, hand);
  emit(ctx, { type: "moved", target: x, from: loc, to: hand });
  return 1;
}

const take: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    // "Take all" leaves out what needs both hands or a strong back.
    const objects = intent.all
      ? looseThings(g).filter(
          (id) =>
            comp(g, id, "physical")!.grip === "one" &&
            weightOf(g, id) <= liftOneHand(g, g.st.player),
        )
      : intent.obj!;
    if (objects.length === 0) return say(ctx, "take.nothing");
    const wanted = isPlayersHand(g, intent.ind) ? intent.ind : undefined;
    let minutes = 0;
    for (const x of objects) minutes += grab(ctx, x, wanted);
    advance(ctx, { minutes });
  },
};

const drop: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    // "Jeter la pierre sur le bandit" is throwing it at him.
    if (intent.ind && has(g, intent.ind, "actor"))
      return PEOPLE_VERBS.throw.run(ctx, intent);
    if (intent.ind && intent.prep && intent.prep !== "with")
      return put.run(ctx, intent);
    const objects = intent.all ? held(g) : intent.obj!;
    if (objects.length === 0) return say(ctx, "drop.nothing");
    const place = playerPlace(g);
    let minutes = 0;
    for (const x of objects) {
      if (!within(g, x, g.st.player) || has(g, x, "part")) {
        say(ctx, "drop.notCarried", { x: ref(g, x) });
      } else if (g.st.ent[x].loc === g.st.player) {
        say(ctx, "drop.worn", { x: ref(g, x) });
      } else {
        const from = g.st.ent[x].loc;
        say(ctx, "drop.done", { x: ref(g, x) });
        move(g, x, place);
        emit(ctx, { type: "moved", target: x, from, to: place });
        minutes += 1;
      }
    }
    advance(ctx, { minutes });
  },
};

/** Why `x` does not go into `c`, or undefined if it fits. */
export function misfit(g: Game, x: Id, c: Id): string | undefined {
  const container = comp(g, c, "container");
  if (!container) return "put.notContainer";
  if (x === c || within(g, c, x)) return "put.self";
  const physical = comp(g, x, "physical");
  if (!physical || physical.grip === "none") return "take.fixed";
  if (container.kind === "hand")
    return children(g, c).length > 0 ? "put.handBusy" : undefined;
  if (physical.size > container.opening) return "put.tooLong";
  if (weightOf(g, x) + weightInside(g, c) > container.maxWeight)
    return "put.tooHeavy";
  if (physical.volume + volumeUsed(g, c) > container.maxVolume)
    return "put.full";
  return undefined;
}

const put: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const objects = intent.all ? held(g) : intent.obj!;
    if (objects.length === 0) return say(ctx, "drop.nothing");
    let minutes = 0;
    // "Mettre le gilet": put on, not put away.
    const [first] = objects;
    if (
      !intent.ind &&
      objects.length === 1 &&
      has(g, first, "wearable") &&
      g.st.ent[first].loc !== g.st.player
    ) {
      return PEOPLE_VERBS.wear.run(ctx, intent);
    }
    for (const x of objects) {
      const c = intent.ind ?? stores(g).find((store) => !misfit(g, x, store));
      if (!c) {
        say(ctx, "put.noRoom", { x: ref(g, x) });
        continue;
      }
      if (isPlayersHand(g, c)) {
        minutes += grab(ctx, x, c);
        continue;
      }
      const why = misfit(g, x, c);
      // A strip of cloth, or the shirt, around a torch.
      if (why && comp(g, x, "cloth") && PEOPLE_VERBS.wrap) {
        if (wrapTorch(ctx, x, c)) continue;
      }
      if (why === "put.notContainer" && givesFire(g, c)) {
        // A torch held to the embers catches.
        if (comp(g, x, "burn")) {
          lightVerb.run(ctx, { verb: "light", obj: [x], ind: c });
          continue;
        }
        if (has(g, x, "destructible")) {
          say(ctx, "fire.burns", { x: ref(g, x) });
          destroy(g, x);
          minutes += 1;
          continue;
        }
        if (PEOPLE_VERBS.heat) {
          PEOPLE_VERBS.heat.run(ctx, { verb: "heat", obj: [x], ind: c });
          continue;
        }
      }
      if (why) {
        say(ctx, why, { x: ref(g, x), c: ref(g, c) });
        minutes += why === "put.notContainer" || why === "put.self" ? 0 : 1;
        continue;
      }
      if (
        !within(g, x, g.st.player) &&
        weightOf(g, x) > liftTwoHands(g, g.st.player)
      ) {
        say(ctx, "take.tooHeavy", { x: ref(g, x) });
        minutes += 2;
        continue;
      }
      const from = g.st.ent[x].loc;
      say(ctx, within(g, c, g.st.player) ? "put.stow" : "put.done", {
        x: ref(g, x),
        c: ref(g, c),
      });
      move(g, x, c);
      emit(ctx, { type: "moved", target: x, from, to: c });
      minutes += 1;
    }
    advance(ctx, { minutes });
  },
};

const inventory: Verb = {
  run(ctx) {
    const g = ctx.g;
    const player = g.st.player;
    const { left, right } = hands(g, player);
    const inRight = right ? heldIn(g, right) : undefined;
    const inLeft = left ? heldIn(g, left) : undefined;
    const twoHanded = [inRight, inLeft].find(
      (x) => x && comp(g, x, "physical")?.grip === "two",
    );
    if (twoHanded) {
      say(ctx, "inv.both", { x: ref(g, twoHanded) });
    } else {
      for (const hand of [right, left]) {
        if (!hand) continue;
        const x = heldIn(g, hand);
        say(
          ctx,
          x ? "inv.hand" : "inv.handEmpty",
          x ? { hand: ref(g, hand), x: ref(g, x) } : { hand: ref(g, hand) },
        );
      }
    }
    const clothes = worn(g, player);
    if (clothes.length > 0) say(ctx, "inv.worn", { list: refs(g, clothes) });
    for (const store of stores(g)) {
      const inside = children(g, store);
      say(ctx, inside.length ? "inv.store" : "inv.storeEmpty", {
        c: ref(g, store),
        list: refs(g, inside),
      });
    }
    // The load is told only when it slows you down ("weight" tells it always).
    if (loadTier(g, player) !== "light")
      say(ctx, `load.${loadTier(g, player)}`);
  },
};

// ---------------------------------------------------------------------------
// Time.

function waitFor(ctx: Ctx, intent: Intent, rest: boolean) {
  const g = ctx.g;
  if (hostilesHere(g).length > 0) {
    say(ctx, "wait.notNow");
    return void advance(ctx, { minutes: 1 });
  }
  // A robber waiting for the purse does not wait half an hour with you.
  const robber = demandHere(g);
  if (robber) {
    say(ctx, "wait.stare", { x: ref(g, robber) });
    return void advance(ctx, { minutes: 2 });
  }
  const minutes =
    intent.until !== undefined
      ? minutesUntil(g.st.clock, intent.until)
      : (intent.minutes ?? 10);
  say(ctx, rest ? "rest.start" : "wait.start");
  ctx.interruptible = true;
  const elapsed = advance(ctx, { minutes });
  ctx.interruptible = false;
  if (elapsed < minutes) say(ctx, "wait.interrupted");
  else say(ctx, "time.now", timeParams(g));
}

function timeParams(g: Game) {
  const clock = g.st.clock;
  return {
    day: { k: `weekday.${weekday(clock)}` },
    when: { k: `when.${period(clock)}.${periodHalf(clock)}` },
  };
}

const wait: Verb = { run: (ctx, intent) => waitFor(ctx, intent, false) };
const rest: Verb = { run: (ctx, intent) => waitFor(ctx, intent, true) };
const time: Verb = { run: (ctx) => say(ctx, "time.now", timeParams(ctx.g)) };

const status: Verb = {
  run(ctx) {
    const g = ctx.g;
    const player = g.st.player;
    const body = comp(g, player, "body");
    let fine = !isNauseous(g);
    if (body) {
      // Two bruises on the same arm read as one line, not the same twice.
      const said = new Set<string>();
      const once = (key: string, p: Record<string, unknown>) => {
        const id = key + JSON.stringify(p);
        if (said.has(id)) return;
        said.add(id);
        say(ctx, key, p as never);
      };
      const ribs = body.wounds.filter(
        (w) => w.type === "blunt" && w.sev >= 3 && w.part === "torso",
      );
      const blood = bloodAt(body, g.st.clock);
      if (blood < WEAK_BLOOD) {
        say(ctx, "status.blood");
        fine = false;
      }
      for (const w of body.wounds) {
        // A broken bone is named for where it is: a cracked skull, a broken
        // leg, not "a broken bone on the head".
        if (w.type === "blunt" && w.sev >= 3) {
          const group =
            w.part === "head"
              ? "head"
              : w.part === "neck"
                ? "neck"
                : w.part === "torso"
                  ? "torso"
                  : "limb";
          // Several ribs: one line, bandaged only once all of them are.
          const many = group === "torso" && ribs.length > 1;
          const treated = many ? ribs.every((r) => r.treated) : w.treated;
          once(
            `status.broken.${group}${many ? ".many" : ""}${treated ? ".treated" : ""}`,
            {
              part: { n: `part.${w.part}` },
            },
          );
          fine = false;
          continue;
        }
        const bleeds = bleedAt(w, g.st.clock) > 0.05;
        once(
          w.seared
            ? "status.wound.seared"
            : w.treated
              ? "status.wound.treated"
              : bleeds
                ? "status.wound.bleeding"
                : "status.wound",
          {
            w: { k: `wound.${w.type}.${w.sev}` },
            part: { n: `part.${w.part}` },
          },
        );
        fine = false;
      }
    }
    if (isNauseous(g)) say(ctx, "status.nauseous");
    const needs = needsOf(g, player);
    if (needs) {
      for (const key of ["thirst", "hunger", "sleep", "fatigue"] as const) {
        const level = tier(needs[key], TIERS[key]);
        if (level > 0) {
          say(ctx, `need.${key}.${level}`);
          fine = false;
        }
      }
    }
    // The load is told only when it slows you down ("weight" tells it always).
    if (loadTier(g, player) !== "light")
      say(ctx, `load.${loadTier(g, player)}`);
    if (fine) say(ctx, "status.fine");
  },
};

const help: Verb = { run: (ctx) => say(ctx, "help") };

// ---------------------------------------------------------------------------
// Fire.

const lightVerb: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const x = intent.obj![0];
    const burn = comp(g, x, "burn");
    if (!burn) {
      say(ctx, "light.cannot", { x: ref(g, x) });
      return void advance(ctx, { minutes: 1 });
    }
    if (isLit(g, x)) return say(ctx, "light.already", { x: bare(g, x) });
    if (burn.rate > 0 && fuelLeft(g, x) <= 0)
      return say(ctx, "light.spent", { x: bare(g, x) });
    const source =
      intent.ind && givesFire(g, intent.ind)
        ? intent.ind
        : scope(g).find((id) => id !== x && givesFire(g, id));
    if (!source) return say(ctx, "light.noFire", { x: bare(g, x) });
    say(ctx, "light.done", { x: bare(g, x), from: bare(g, source) });
    light(ctx, x);
    advance(ctx, { minutes: 1 });
  },
};

const extinguishVerb: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const x = intent.obj![0];
    const burn = comp(g, x, "burn");
    if (!burn || !isLit(g, x))
      return say(ctx, "extinguish.notLit", { x: bare(g, x) });
    if (burn.rate === 0) {
      say(ctx, "extinguish.cannot", { x: bare(g, x) });
      return void advance(ctx, { minutes: 1 });
    }
    say(ctx, "extinguish.done", { x: bare(g, x) });
    extinguish(ctx, x);
    advance(ctx, { minutes: 1 });
  },
};

// ---------------------------------------------------------------------------
// Eating and destroying.

const eat: Verb = {
  risk(ctx, intent) {
    const g = ctx.g;
    const x = intent.obj![0];
    if (comp(g, x, "edible")?.dubious) {
      return {
        kind: "dubious-food",
        warn: { k: "eat.dubious", p: { x: ref(g, x) } },
      };
    }
    const volume = comp(g, x, "physical")?.volume ?? 0.2;
    if (has(g, x, "edible") && tooMuch(g, g.st.player, volume)) {
      return {
        kind: "too-much-food",
        warn: { k: "eat.full", p: { x: ref(g, x) } },
      };
    }
    return undefined;
  },
  run(ctx, intent) {
    const g = ctx.g;
    const x = intent.obj![0];
    const edible = comp(g, x, "edible");
    if (!edible) return say(ctx, "eat.inedible", { x: ref(g, x) });
    const name = ref(g, x);
    const key = `${nameKey(g, x)}.eaten`;
    const where = g.st.ent[x].loc;
    const volume = comp(g, x, "physical")?.volume ?? 0.2;
    destroy(g, x);
    emit(ctx, { type: "consumed", target: x });
    say(ctx, text(g, key) ? key : "eat.done", { x: name });
    // What is left: an apple core stays in hand.
    if (edible.leaves && where) spawn(g, edible.leaves, where);
    swallow(ctx, g.st.player, { food: edible.food ?? 0.05, volume });
    advance(ctx, { minutes: 5 });
    if (edible.effect === "nausea") {
      sicken(ctx, 120);
      say(ctx, "eat.sick");
    }
  },
};

const destroyVerb: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const x = intent.obj![0];
    // "Rip the shirt": cloth tears into strips.
    if (comp(g, x, "cloth") && PEOPLE_VERBS.tear)
      return PEOPLE_VERBS.tear.run(ctx, { ...intent, verb: "tear" });
    if (!has(g, x, "destructible")) {
      say(ctx, "destroy.cannot", { x: ref(g, x) });
      return void advance(ctx, { minutes: 1 });
    }
    const name = ref(g, x);
    const key = `${nameKey(g, x)}.destroyed`;
    const spilled = children(g, x);
    const place = playerPlace(g);
    for (const child of spilled) move(g, child, place);
    destroy(g, x);
    emit(ctx, { type: "destroyed", target: x });
    say(ctx, text(g, key) ? key : "destroy.done", { x: name });
    advance(ctx, { minutes: 1 });
  },
};

// ---------------------------------------------------------------------------
// Doors.

const open: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const x = intent.obj![0];
    const door = comp(g, x, "door");
    if (!door) return say(ctx, "open.cannot", { x: ref(g, x) });
    if (door.open) return say(ctx, "open.already", { x: ref(g, x) });
    if (door.locked && !unlockWithKey(ctx, x)) {
      say(ctx, "open.locked", { x: ref(g, x) });
      return void advance(ctx, { minutes: 1 });
    }
    if (!door.locked) {
      patch(g, x, "door", { open: true });
      say(ctx, "open.done", { x: ref(g, x) });
    }
  },
};

const close: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const x = intent.obj![0];
    const door = comp(g, x, "door");
    if (!door) return say(ctx, "close.cannot", { x: ref(g, x) });
    if (!door.open) return say(ctx, "close.already", { x: ref(g, x) });
    patch(g, x, "door", { open: false });
    say(ctx, "close.done", { x: ref(g, x) });
  },
};

/** "Weight", "how much do I carry". */
const load: Verb = {
  run(ctx) {
    say(ctx, `load.${loadTier(ctx.g, ctx.g.st.player)}`);
  },
};

/** "Use the torch": what using a thing means depends on the thing. */
const use: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const x = intent.obj![0];
    const y = intent.ind;
    const runs = (verb: string, i: Partial<Intent>) =>
      VERB_RUNNERS[verb].run(ctx, { verb, ...i });
    const player = g.st.player;
    if (y) {
      if (comp(g, x, "burn") && givesFire(g, y))
        return runs("light", { obj: [x], ind: y });
      if (givesFire(g, x) && comp(g, y, "burn"))
        return runs("light", { obj: [y], ind: x });
      if (comp(g, x, "cloth") && wrapTorch(ctx, x, y)) return;
      if (comp(g, y, "cloth") && wrapTorch(ctx, y, x)) return;
      // Into the fire: the letter burns, the blade gets hot.
      const [thing, fire] = givesFire(g, y) ? [x, y] : [y, x];
      if (givesFire(g, fire) && !givesFire(g, thing))
        return runs("put", { obj: [thing], ind: fire });
      if (has(g, y, "actor")) return runs("give", { obj: [x], ind: y });
      return say(ctx, "use.how", { x: ref(g, x) });
    }
    const burn = comp(g, x, "burn");
    if (burn && burn.rate > 0) {
      if (isLit(g, x)) return say(ctx, "use.lit", { x: ref(g, x) });
      return runs("light", { obj: [x] });
    }
    if (givesFire(g, x)) {
      const torch = subtree(g, player).find(
        (id) => comp(g, id, "burn") && !isLit(g, id),
      );
      if (torch) return runs("light", { obj: [torch], ind: x });
      say(ctx, "use.warm", { x: ref(g, x) });
      return void advance(ctx, { minutes: 5 });
    }
    if (has(g, x, "edible")) return runs("eat", { obj: [x] });
    if (has(g, x, "drinkable")) return runs("drink", { obj: [x] });
    if (comp(g, x, "cloth")) return runs("bandage", {});
    if (has(g, x, "wearable") && g.st.ent[x].loc !== player)
      return runs("wear", { obj: [x] });
    if (comp(g, x, "weapon")) {
      if (!within(g, x, player)) return runs("take", { obj: [x] });
      return say(ctx, "use.weapon", { x: ref(g, x) });
    }
    if (has(g, x, "container")) return runs("examine", { obj: [x] });
    say(ctx, "use.how", { x: ref(g, x) });
  },
};

export const VERB_RUNNERS: Record<string, Verb> = {
  load,
  use,
  ...PEOPLE_VERBS,
  look,
  examine,
  exits,
  go,
  take,
  drop,
  put,
  inventory,
  wait,
  rest,
  time,
  status,
  help,
  light: lightVerb,
  extinguish: extinguishVerb,
  eat,
  destroy: destroyVerb,
  open,
  close,
};

export { stores };
