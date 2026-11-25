// Verbs about bodies and people: fighting, fleeing, throwing, bandaging,
// dressing, and every way of talking to someone.

import { sear, treat } from "./body";
import { bleedAt } from "./health";
import { exert, needsOf, setNeeds, swallow, tooMuch } from "./needs";
import { scope } from "./parser";
import { runInt, runRandom } from "./rng";
import { period, periodHalf, weekday } from "./time";
import { go } from "./verbs";
import { advance, say, type Ctx } from "./core";
import { strike } from "./combat";
import {
  apologize,
  attackRisk,
  beg,
  bribe,
  playerSurrenders,
  spare,
  thank,
  valuables,
  defaultPerson,
  give,
  hostilesHere,
  insult,
  lie,
  persuade,
  shout,
  talk,
  threaten,
} from "./npc";
import { playerPlace, weatherNow } from "./systems";
import {
  bare,
  children,
  comp,
  conscious,
  destroy,
  freeHands,
  givesFire,
  hands,
  fuelLeft,
  has,
  heldIn,
  move,
  nameKey,
  peopleIn,
  ref,
  subtree,
  within,
  worn,
  placeOf,
  spawn,
  type Game,
} from "./world";
import type { Id, Intent } from "./types";
import type { Verb } from "./verbs";

const isPerson = (g: Game, id: Id | undefined): id is Id =>
  !!id && has(g, id, "actor") && id !== g.st.player;

/** The person a verb is about: the one named, or the obvious one. */
function personFor(ctx: Ctx, intent: Intent, key: string): Id | undefined {
  const g = ctx.g;
  const named =
    intent.obj?.find((id) => isPerson(g, id)) ??
    (isPerson(g, intent.ind) ? intent.ind : undefined);
  if (named) return named;
  if (intent.obj?.[0]) {
    say(ctx, `${key}.thing`, { x: ref(g, intent.obj[0]) });
    return undefined;
  }
  const person = defaultPerson(g);
  if (!person) say(ctx, "talk.nobody");
  return person;
}

const attack: Verb = {
  risk: (ctx, intent) => attackRisk(ctx.g, intent),
  run(ctx, intent) {
    const g = ctx.g;
    const target = intent.obj?.[0] ?? hostilesHere(g)[0] ?? defaultPerson(g);
    if (!target) return say(ctx, "attack.nobody");
    if (target === g.st.player || within(g, target, g.st.player)) {
      return say(ctx, "attack.self");
    }
    const weapon =
      intent.ind && within(g, intent.ind, g.st.player) ? intent.ind : undefined;
    if (!has(g, target, "body")) {
      say(ctx, "attack.thing", { x: ref(g, target) });
      return void advance(ctx, { minutes: 1 });
    }
    strike(ctx, g.st.player, target, { aim: intent.aim, with: weapon });
    advance(ctx, { minutes: 1 });
  },
};

const defend: Verb = {
  run(ctx) {
    ctx.g.st.defending = true;
    say(ctx, hostilesHere(ctx.g).length > 0 ? "defend.ready" : "defend.alone");
    advance(ctx, { minutes: 1 });
  },
};

const throwVerb: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const x = intent.obj![0];
    if (!within(g, x, g.st.player) || has(g, x, "part")) {
      return say(ctx, "throw.notHeld", { x: ref(g, x) });
    }
    if (g.st.ent[x].loc === g.st.player)
      return say(ctx, "drop.worn", { x: ref(g, x) });
    const target = isPerson(g, intent.ind) ? intent.ind : undefined;
    if (target) {
      say(ctx, "throw.at", { x: ref(g, x), y: ref(g, target) });
      const hit = strike(ctx, g.st.player, target, {
        aim: intent.aim,
        with: x,
        thrown: true,
      });
      if (!hit && g.st.ent[x]) move(g, x, playerPlace(g));
    } else {
      say(ctx, intent.ind ? "throw.atThing" : "throw.away", {
        x: ref(g, x),
        y: intent.ind ? ref(g, intent.ind) : "",
      });
      move(g, x, playerPlace(g));
    }
    advance(ctx, { minutes: 1 });
  },
};

/** Cloth for a bandage: a strip already torn, or a worn or carried shirt. */
function clothFor(g: Game): Id | undefined {
  const mine = subtree(g, g.st.player).filter(
    (id) => (comp(g, id, "cloth")?.strips ?? 0) > 0,
  );
  return mine.find((id) => isStrip(g, id)) ?? mine[0];
}

const isStrip = (g: Game, id: Id) => g.st.ent[id]?.tpl === "strip";

/** Tears a strip from a piece of cloth, into a free hand or at your feet. */
export function tearStrip(ctx: Ctx, cloth: Id): Id {
  const g = ctx.g;
  const player = g.st.player;
  const strips = comp(g, cloth, "cloth")!.strips - 1;
  const hand = freeHands(g, player)[0];
  const strip = spawn(g, "strip", hand ?? playerPlace(g));
  say(ctx, hand ? "tear.done" : "tear.drop", { cloth: bare(g, cloth) });
  if (strips <= 0) {
    say(ctx, "bandage.clothGone", { cloth: bare(g, cloth) });
    for (const child of children(g, cloth)) move(g, child, playerPlace(g));
    destroy(g, cloth);
  } else {
    g.st.ent[cloth].c.cloth = { strips };
  }
  g.st.it = [strip];
  return strip;
}

/** "Tear the shirt", "take a strip": cloth for a bandage or a torch. */
const tear: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const x =
      intent.obj?.[0] ??
      subtree(g, g.st.player).find(
        (id) => !isStrip(g, id) && (comp(g, id, "cloth")?.strips ?? 0) > 0,
      );
    if (!x) return say(ctx, "tear.nothing");
    if (isStrip(g, x)) return say(ctx, "tear.small", { x: ref(g, x) });
    if (!comp(g, x, "cloth")) {
      say(ctx, "destroy.cannot", { x: ref(g, x) });
      return void advance(ctx, { minutes: 1 });
    }
    tearStrip(ctx, x);
    advance(ctx, { minutes: 2 });
  },
};

/** A spent torch wrapped in cloth burns again, for a little while. */
export function wrapTorch(ctx: Ctx, cloth: Id, torch: Id): boolean {
  const g = ctx.g;
  const burn = comp(g, torch, "burn");
  if (!burn || burn.rate === 0) return false;
  if (fuelLeft(g, torch) > 0.3) {
    say(ctx, "wrap.notNeeded", { y: ref(g, torch) });
    return true;
  }
  const strip = isStrip(g, cloth) ? cloth : tearStrip(ctx, cloth);
  say(ctx, "wrap.done", { x: bare(g, strip), y: bare(g, torch) });
  destroy(g, strip);
  g.st.ent[torch].c.burn = {
    ...burn,
    lit: false,
    fuel: Math.max(0, fuelLeft(g, torch)) + 0.12,
    since: g.st.clock,
    gen: burn.gen + 1,
    wrapped: true,
  };
  g.st.it = [torch];
  advance(ctx, { minutes: 3 });
  return true;
}

/** "Wrap the strip around the torch", or just "wrap the torch". */
const wrap: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const x = intent.obj![0];
    if (intent.ind && wrapTorch(ctx, x, intent.ind)) return;
    if (comp(g, x, "burn")) {
      const cloth = clothFor(g);
      if (!cloth) return say(ctx, "wrap.noCloth", { y: ref(g, x) });
      if (wrapTorch(ctx, cloth, x)) return;
    }
    say(ctx, "wrap.how", { x: ref(g, x) });
  },
};

/** "Switch hands": what is in the right hand goes to the left. */
const swap: Verb = {
  run(ctx) {
    const g = ctx.g;
    const { left, right } = hands(g, g.st.player);
    if (!left || !right) return say(ctx, "swap.cannot");
    const inLeft = heldIn(g, left);
    const inRight = heldIn(g, right);
    if (!inLeft && !inRight) return say(ctx, "swap.empty");
    if (inLeft && comp(g, inLeft, "physical")?.grip === "two")
      return say(ctx, "swap.both", { x: ref(g, inLeft) });
    if (inLeft) move(g, inLeft, right);
    if (inRight) move(g, inRight, left);
    say(ctx, "swap.done", {
      x: inRight ? ref(g, inRight) : "",
      y: inLeft ? ref(g, inLeft) : "",
    });
    advance(ctx, { minutes: 1 });
  },
};

const bandage: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const target = isPerson(g, intent.obj?.[0]) ? intent.obj![0] : g.st.player;
    const cloth = clothFor(g);
    if (!cloth) return say(ctx, "bandage.noCloth");
    const wound = treat(g, target);
    // A strip already torn: it is used up, the shirt is left alone.
    if (wound && isStrip(g, cloth)) {
      say(ctx, target === g.st.player ? "bandage.strip" : "bandage.stripThem", {
        x: ref(g, target),
        part: { n: `part.${wound.part}` },
      });
      destroy(g, cloth);
      return void advance(ctx, {
        minutes: hostilesHere(g).length > 0 ? 2 : 8,
      });
    }
    if (!wound)
      return say(
        ctx,
        target === g.st.player ? "bandage.nothing" : "bandage.nothingThem",
        { x: ref(g, target) },
      );
    const strips = comp(g, cloth, "cloth")!.strips - 1;
    say(ctx, target === g.st.player ? "bandage.done" : "bandage.doneThem", {
      x: ref(g, target),
      cloth: bare(g, cloth),
      part: { n: `part.${wound.part}` },
    });
    if (strips <= 0) {
      say(ctx, "bandage.clothGone", { cloth: bare(g, cloth) });
      for (const child of children(g, cloth)) move(g, child, playerPlace(g));
      destroy(g, cloth);
    } else {
      g.st.ent[cloth].c.cloth = { strips };
    }
    advance(ctx, { minutes: hostilesHere(g).length > 0 ? 2 : 10 });
  },
};

const wear: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const x = intent.obj![0];
    const player = g.st.player;
    const piece = comp(g, x, "wearable");
    if (!piece) {
      if (has(g, x, "weapon") || has(g, x, "physical")) {
        // "Equip the sword": hold it.
        const hand = freeHands(g, player)[0];
        if (
          within(g, x, player) &&
          comp(g, g.st.ent[x].loc!, "container")?.kind === "hand"
        ) {
          return say(ctx, "take.already", { x: ref(g, x) });
        }
        if (!hand) return say(ctx, "take.handsFull", { x: ref(g, x) });
        say(ctx, "wear.wield", { x: ref(g, x) });
        move(g, x, hand);
        return void advance(ctx, { minutes: 1 });
      }
      return say(ctx, "wear.cannot", { x: ref(g, x) });
    }
    if (g.st.ent[x].loc === player)
      return say(ctx, "wear.already", { x: ref(g, x) });
    const owner =
      g.st.ent[x].loc && has(g, g.st.ent[x].loc!, "actor")
        ? g.st.ent[x].loc
        : undefined;
    if (owner && owner !== player)
      return say(ctx, "wear.notYours", { x: ref(g, x) });
    const clash = worn(g, player).find((id) => {
      const other = comp(g, id, "wearable")!;
      return other.zone === piece.zone && other.layer === piece.layer;
    });
    if (clash) {
      say(ctx, "wear.clash", { x: ref(g, x), y: ref(g, clash) });
      return void advance(ctx, { minutes: 1 });
    }
    say(ctx, "wear.done", { x: ref(g, x) });
    move(g, x, player);
    advance(ctx, { minutes: piece.layer === "armor" ? 5 : 2 });
  },
};

const takeOff: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const x = intent.obj![0];
    const player = g.st.player;
    if (g.st.ent[x].loc !== player || !has(g, x, "wearable")) {
      return say(ctx, "takeoff.notWorn", { x: ref(g, x) });
    }
    const hand = freeHands(g, player)[0];
    say(ctx, hand ? "takeoff.done" : "takeoff.drop", { x: ref(g, x) });
    move(g, x, hand ?? playerPlace(g));
    advance(ctx, { minutes: 2 });
  },
};

// Talking. Every one of these lets the people around react.

const ALONE = new Set(["apologize", "thank", "spare"]);

const social = (key: string, act: (ctx: Ctx, person: Id) => void): Verb => ({
  run(ctx, intent) {
    if (ALONE.has(key) && !intent.obj?.length && !defaultPerson(ctx.g)) {
      say(ctx, `${key}.alone`);
      return void advance(ctx, { minutes: 1 });
    }
    const person = personFor(ctx, intent, key);
    if (person) act(ctx, person);
    advance(ctx, { minutes: 1 });
  },
});

const talkVerb: Verb = {
  run(ctx, intent) {
    const person = personFor(ctx, intent, "talk");
    if (person) talk(ctx, person, intent.topic);
    advance(ctx, { minutes: 2 });
  },
};

const giveVerb: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const item = intent.obj?.find((id) => !isPerson(g, id));
    const person = isPerson(g, intent.ind)
      ? intent.ind
      : (intent.obj?.find((id) => isPerson(g, id)) ?? defaultPerson(g));
    if (!item) return say(ctx, "ask.give");
    if (!person) return say(ctx, "talk.nobody");
    give(ctx, item, person);
    advance(ctx, { minutes: 1 });
  },
};

const shoutVerb: Verb = {
  run(ctx) {
    shout(ctx);
    advance(ctx, { minutes: 1 });
  },
};

// ---------------------------------------------------------------------------
// Running away, drinking, sleeping, searing a wound.

const flee: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const exits = comp(g, playerPlace(g), "place")!.exits;
    let index =
      intent.dir === "back"
        ? exits.findIndex((e) => e.to === g.st.flags.prev)
        : intent.exit;
    if (index === undefined || index < 0) {
      // Back where one came from, or any way out.
      const back = exits.findIndex((e) => e.to === g.st.flags.prev);
      index = back >= 0 ? back : runInt(g.st, exits.length);
    }
    if (exits.length === 0) return say(ctx, "go.noExit");
    if (hostilesHere(g).length === 0) say(ctx, "flee.calm");
    exert(g, g.st.player, 0.08);
    go.run(ctx, { verb: "go", exit: index });
  },
};

/** What can be drunk here: a named source, or the nearest one. */
function drinkSource(g: Game, intent: Intent): Id | undefined {
  const named = intent.obj?.[0];
  if (named) return named;
  return scope(g).find((id) => has(g, id, "drinkable"));
}

const drink: Verb = {
  risk(ctx, intent) {
    const g = ctx.g;
    const source = drinkSource(g, intent);
    if (!source || !has(g, source, "drinkable")) return undefined;
    const litres = litresFor(g, intent);
    if (!tooMuch(g, g.st.player, litres, litres)) return undefined;
    // Already full, or about to gulp far more than thirst asks for.
    const full = (needsOf(g, g.st.player)?.stomach ?? 0) > 0.8;
    return {
      kind: "too-much-drink",
      warn: {
        k: full ? "drink.full" : "drink.tooMuch",
        p: { x: ref(g, source) },
      },
    };
  },
  run(ctx, intent) {
    const g = ctx.g;
    const source = drinkSource(g, intent);
    if (!source) return say(ctx, "drink.nothing");
    const drinkable = comp(g, source, "drinkable");
    if (!drinkable) return say(ctx, "drink.cannot", { x: ref(g, source) });
    if (drinkable.litres !== undefined && drinkable.litres <= 0) {
      return say(ctx, "drink.empty", { x: ref(g, source) });
    }
    let litres = litresFor(g, intent);
    if (drinkable.litres !== undefined) {
      litres = Math.min(litres, drinkable.litres);
      g.st.ent[source].c.drinkable = { litres: drinkable.litres - litres };
    }
    const key = `${nameKey(g, source)}.drink`;
    say(ctx, g.content.langs.fr.messages[key] ? key : "drink.done", {
      x: ref(g, source),
    });
    const thirsty = (needsOf(g, g.st.player)?.thirst ?? 0) >= 0.1;
    say(
      ctx,
      litres >= 1.5
        ? "drink.lots"
        : litres <= 0.15
          ? "drink.sip"
          : thirsty
            ? "drink.enough"
            : "drink.notThirsty",
    );
    swallow(ctx, g.st.player, { water: litres, volume: litres });
    advance(ctx, { minutes: litres >= 1.5 ? 5 : 2 });
  },
};

/** "Drink" drinks until thirst is gone; "a sip" or "everything" say more. */
function litresFor(g: Game, intent: Intent): number {
  if (intent.amount === "sip") return 0.1;
  if (intent.amount === "lots" || intent.all) return 2;
  const thirst = needsOf(g, g.st.player)?.thirst ?? 0.3;
  return Math.max(0.2, Math.min(1.2, thirst * 2));
}

/** How good a bed this place makes, and its worst flaw. */
export function comfortHere(g: Game): { comfort: number; worst: string } {
  const place = playerPlace(g);
  const info = comp(g, place, "place")!;
  const ground = {
    bed: 0.9,
    floor: 0.5,
    planks: 0.45,
    dirt: 0.4,
    cobbles: 0.3,
  }[info.ground ?? "dirt"];
  const flaws: [string, number][] = [
    ["ground", ground < 0.5 ? 0.5 - ground : 0],
  ];
  const p = period(g.st.clock);
  if (info.outdoor && weatherNow(g) === "rain") flaws.push(["rain", 0.25]);
  if (info.outdoor && (p === "morning" || p === "afternoon"))
    flaws.push(["light", 0.3]);
  flaws.push([
    "noise",
    0.15 * peopleIn(g, place).filter((id) => conscious(g, id)).length,
  ]);
  const needs = needsOf(g, g.st.player);
  if (needs && (needs.hunger >= 0.6 || needs.thirst >= 0.6))
    flaws.push([needs.thirst >= needs.hunger ? "thirst" : "hunger", 0.15]);
  if ((comp(g, g.st.player, "body")?.wounds ?? []).some((w) => w.sev >= 3))
    flaws.push(["pain", 0.2]);
  if (
    worn(g, g.st.player).some(
      (id) => comp(g, id, "wearable")?.layer === "armor",
    )
  )
    flaws.push(["armor", 0.15]);
  if (!info.outdoor) flaws.push(["shelter", -0.1]);
  const total = flaws.reduce((sum, [, v]) => sum + v, 0);
  const worst =
    flaws.filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "uneasy";
  return { comfort: Math.max(0, Math.min(1, ground + 0.1 - total)), worst };
}

const sleep: Verb = {
  risk(ctx) {
    const g = ctx.g;
    const place = comp(g, playerPlace(g), "place");
    if (
      place?.town &&
      place.outdoor &&
      hostilesHere(g).length === 0 &&
      !demandHere(g)
    ) {
      return { kind: "sleep-outside", warn: { k: "sleep.warnStreet" } };
    }
    return undefined;
  },
  run(ctx) {
    const g = ctx.g;
    const player = g.st.player;
    if (hostilesHere(g).length > 0) {
      say(ctx, "sleep.notNow");
      return void advance(ctx, { minutes: 1 });
    }
    // A robber waits for an answer: lying down again is ignoring him.
    const robber = demandHere(g);
    if (robber) {
      say(ctx, "sleep.ignore", { x: ref(g, robber) });
      return void advance(ctx, { minutes: 2 });
    }
    const needs = needsOf(g, player)!;
    if (needs.sleep < 0.3) {
      say(ctx, "sleep.notTired");
      return void advance(ctx, { minutes: 15 });
    }
    const { comfort, worst } = comfortHere(g);
    if (comfort < 0.15 && needs.sleep < 0.7) {
      say(ctx, `sleep.cannot.${worst}`);
      return void advance(ctx, { minutes: 30 });
    }
    const ground = comp(g, playerPlace(g), "place")?.ground ?? "dirt";
    say(ctx, `sleep.start.${ground}`);
    setNeeds(g, player, { mode: "asleep", comfort });
    let cause = "";
    ctx.interruptible = true;
    advance(ctx, {
      until: (game) => {
        cause = wakeReason(ctx, game, comfort, worst);
        return cause !== "";
      },
      max: 14 * 60,
      step: 15,
    });
    ctx.interruptible = false;
    setNeeds(g, player, { mode: "awake" });
    if (g.st.flags.dead || ctx.wokeUp) return;
    say(ctx, `sleep.wake.${cause || "event"}`);
    say(ctx, "time.now", {
      day: { k: `weekday.${weekday(g.st.clock)}` },
      when: { k: `when.${period(g.st.clock)}.${periodHalf(g.st.clock)}` },
    });
    if ((needsOf(g, player)?.sleep ?? 0) >= 0.4) say(ctx, "sleep.stillTired");
  },
};

/** Someone here waiting for the player to hand over the purse. */
export function demandHere(g: Game): Id | undefined {
  return Object.entries(g.st.enc).find(
    ([id, enc]) =>
      enc.mode === "talk" &&
      enc.question === "purse" &&
      placeOf(g, id) === playerPlace(g),
  )?.[0];
}

/** Checked every quarter of an hour of sleep. Empty: sleep on. */
function wakeReason(ctx: Ctx, g: Game, comfort: number, worst: string): string {
  const n = needsOf(g, g.st.player)!;
  if (n.sleep <= 0.02) return "rested";
  if (n.thirst >= 0.9) return "thirst";
  if (n.hunger >= 0.9) return "hunger";
  const place = comp(g, playerPlace(g), "place")!;
  const p = period(g.st.clock);
  if (
    place.outdoor &&
    (p === "morning" || (p === "dawn" && periodHalf(g.st.clock) === "late"))
  ) {
    if (runRandom(g.st) < 0.6) return "light";
  }
  // Asleep in a street: a thief may come by.
  const money = valuables(g, g.st.player);
  if (
    place.town &&
    place.outdoor &&
    money.length > 0 &&
    runRandom(g.st) < 0.02
  ) {
    for (const item of money) move(g, item, null);
    return "thief";
  }
  const restless = (1 - comfort) * 0.1 * (1 - n.sleep * 0.7);
  if (runRandom(g.st) < restless) return worst;
  void ctx;
  return "";
}

/** A blade in hand, for heating or searing. */
function bladeInHand(g: Game): Id | undefined {
  const { left, right } = hands(g, g.st.player);
  return [right, left]
    .flatMap((hand) => (hand ? children(g, hand) : []))
    .find((id) => {
      const weapon = comp(g, id, "weapon");
      return weapon && weapon.type !== "blunt";
    });
}

/** The best fire around: a brazier's embers rather than a torch. */
function pickFire(g: Game, not?: Id): Id | undefined {
  const fires = scope(g).filter((id) => id !== not && givesFire(g, id));
  return fires.find((id) => has(g, id, "heats")) ?? fires[0];
}

/** "You hold the blade in the embers" or "in the flame of your torch". */
function heatLine(ctx: Ctx, blade: Id, fire: Id) {
  const g = ctx.g;
  say(ctx, has(g, fire, "heats") ? "heat.done" : "heat.flame", {
    x: ref(g, blade),
    y: ref(g, fire),
  });
}

const heat: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const x = intent.obj?.[0] ?? bladeInHand(g);
    if (!x) return say(ctx, "heat.nothing");
    const weapon = comp(g, x, "weapon");
    const fire =
      intent.ind && givesFire(g, intent.ind) ? intent.ind : pickFire(g, x);
    if (!fire) return say(ctx, "heat.noFire", { x: ref(g, x) });
    if (!weapon || weapon.type === "blunt") {
      say(ctx, "heat.pointless", { x: ref(g, x), y: bare(g, fire) });
      return void advance(ctx, { minutes: 1 });
    }
    heatLine(ctx, x, fire);
    g.st.ent[x].c.hot = { until: g.st.clock + 15 };
    advance(ctx, { minutes: 5 });
  },
};

const cauterize: Verb = {
  run(ctx) {
    const g = ctx.g;
    const player = g.st.player;
    const body = comp(g, player, "body")!;
    const index = body.wounds
      .map((w, i) => ({ w, i, rate: bleedAt(w, g.st.clock) }))
      .filter(({ w, rate }) => rate > 0.05 && w.type !== "blunt")
      .sort((a, b) => b.rate - a.rate)[0]?.i;
    if (index === undefined) return say(ctx, "cauterize.nothing");
    const wound = body.wounds[index];
    const blade = bladeInHand(g);
    if (!blade) return say(ctx, "cauterize.noBlade");
    if ((comp(g, blade, "hot")?.until ?? 0) <= g.st.clock) {
      const fire = pickFire(g, blade);
      if (!fire) return say(ctx, "cauterize.cold", { x: ref(g, blade) });
      heatLine(ctx, blade, fire);
      advance(ctx, { minutes: 5 });
    }
    sear(g, player, index);
    say(ctx, "cauterize.done", {
      x: ref(g, blade),
      part: { n: `part.${wound.part}` },
    });
    exert(g, player, 0.15);
    delete g.st.ent[blade].c.hot;
    advance(ctx, { minutes: 2 });
  },
};

/** "Burn the letter": into the fire with it. A blade only gets hot. */
const burn: Verb = {
  run(ctx, intent) {
    const g = ctx.g;
    const x = intent.obj![0];
    const fire = pickFire(g, x);
    if (!fire) return say(ctx, "burn.noFire", { x: ref(g, x) });
    if (has(g, x, "destructible")) {
      say(ctx, "fire.burns", { x: ref(g, x) });
      destroy(g, x);
      return void advance(ctx, { minutes: 1 });
    }
    if (comp(g, x, "weapon")) return heat.run(ctx, { ...intent, ind: fire });
    say(ctx, "burn.cannot", { x: ref(g, x) });
    advance(ctx, { minutes: 1 });
  },
};

export const PEOPLE_VERBS: Record<string, Verb> = {
  tear,
  wrap,
  swap,
  burn,
  flee,
  drink,
  sleep,
  heat,
  cauterize,
  spare: social("spare", spare),
  surrender: {
    run(ctx) {
      playerSurrenders(ctx);
      advance(ctx, { minutes: 1 });
    },
  },
  apologize: social("apologize", apologize),
  thank: social("thank", thank),
  attack,
  defend,
  throw: throwVerb,
  bandage,
  wear,
  takeoff: takeOff,
  talk: talkVerb,
  ask: talkVerb,
  threaten: social("threaten", threaten),
  persuade: social("persuade", persuade),
  lie: social("lie", lie),
  beg: social("beg", beg),
  insult: social("insult", insult),
  bribe: social("bribe", bribe),
  give: giveVerb,
  shout: shoutVerb,
};
