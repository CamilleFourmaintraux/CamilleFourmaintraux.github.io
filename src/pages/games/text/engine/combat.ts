// Resolving a blow: reach, aim, the part actually hit, protection, wound.
//
// 1. Reach: agility (dexterity at a distance) and weapon skill against the
//    defender's dodge, better when they chose to defend.
// 2. Aim: dexterity and the same skill decide whether the blow lands where
//    it was aimed or on a neighbouring part.
// 3. Protection: every worn piece covering that part removes its threshold
//    for this damage type. A powerful enough blow still goes through.
// 4. Wound: what remains gives the severity, which gives the bleeding.

import {
  inflict,
  noteVital,
  randomPart,
  sidedPart,
  SMALL_PARTS,
  strayPart,
  handSide,
} from "./body";
import { emit, say, type Ctx } from "./core";
import { causeOf, handWorks, legsLeft, traumaOf, worsened } from "./health";
import { has as hasText } from "./lang";
import { exert, needsPenalty } from "./needs";
import { runInt } from "./rng";
import { isNauseous, isDark } from "./systems";
import {
  bare,
  children,
  comp,
  conscious,
  hands,
  has,
  loadTier,
  move,
  placeOf,
  ref,
  skill,
  vital,
  worn,
  type Game,
} from "./world";
import type { BodyPart, DamageType, Id, Msg, Weapon } from "./types";

const FISTS: Weapon = { type: "blunt", power: 2, skill: "unarmed" };

const stat = (
  g: Game,
  id: Id,
  name: "strength" | "agility" | "dexterity" | "endurance",
) => comp(g, id, "actor")?.[name] ?? 5;

const d10 = (g: Game) => 1 + runInt(g.st, 10);

/** What someone strikes with: a weapon in hand, any object, or fists. */
export function wielded(
  g: Game,
  actor: Id,
  prefer?: Id,
): { item?: Id; weapon: Weapon } {
  const { left, right } = hands(g, actor);
  const held = [right, left].flatMap((hand) => (hand ? children(g, hand) : []));
  const choice =
    prefer && held.includes(prefer)
      ? prefer
      : (held.find((id) => has(g, id, "weapon")) ?? held[0]);
  if (!choice) return { weapon: FISTS };
  const weapon = comp(g, choice, "weapon");
  if (weapon) return { item: choice, weapon };
  // Anything can hit: a torch, a bottle, a barrel.
  const weight = comp(g, choice, "physical")?.weight ?? 0.5;
  return {
    item: choice,
    weapon: {
      type: "blunt",
      power: Math.min(6, 1 + weight * 1.5),
      skill: "unarmed",
    },
  };
}

/** Penalty from the state of a fighter. */
function hampered(g: Game, id: Id): number {
  let penalty = 0;
  if (vital(g, id) === "weak") penalty += 2;
  if (id === g.st.player && isNauseous(g)) penalty += 1;
  penalty += needsPenalty(g, id);
  if (isDark(g, placeOf(g, id))) penalty += 3;
  const body = comp(g, id, "body");
  if (body) {
    // Broken bones and bruises add up, and so does a useless arm.
    penalty += Math.min(4, traumaOf(body) / 3);
    if (!handWorks(body, "left")) penalty += 1;
    if (!handWorks(body, "right")) penalty += 1;
    penalty += [3, 1, 0][legsLeft(body)];
  }
  return penalty;
}

/** Running on a broken leg is slow; on two, impossible. */
function legPenalty(g: Game, id: Id): number {
  const body = comp(g, id, "body");
  return body ? [20, 4, 0][legsLeft(body)] : 0;
}

/** Rough fighting strength, to warn the player before a hopeless fight. */
export function rating(g: Game, id: Id): number {
  const { weapon } = wielded(g, id);
  const armor = protectionAt(g, id, "torso", "slash").amount;
  return (
    stat(g, id, "agility") +
    skill(g, id, weapon.skill) +
    weapon.power * 0.6 +
    armor * 0.5 +
    (stat(g, id, "strength") - 5) * 0.5 -
    hampered(g, id)
  );
}

/** Total protection of worn pieces covering a part, and the outermost one. */
export function protectionAt(
  g: Game,
  id: Id,
  part: BodyPart,
  type: DamageType,
) {
  let amount = 0;
  let outer: Id | undefined;
  for (const piece of worn(g, id)) {
    const wear = comp(g, piece, "wearable");
    if (!wear?.covers?.includes(part) || !wear.protection) continue;
    amount += wear.protection[type];
    if (!outer || wear.layer === "armor") outer = piece;
  }
  return { amount, outer };
}

function severity(remaining: number): 0 | 1 | 2 | 3 | 4 {
  if (remaining <= 0) return 0;
  if (remaining < 1.5) return 1;
  if (remaining < 4) return 2;
  if (remaining < 8) return 3;
  return 4;
}

export interface Blow {
  aim?: string;
  with?: Id;
  thrown?: boolean;
}

/** One attack. Returns false if it missed. */
export function strike(
  ctx: Ctx,
  attacker: Id,
  target: Id,
  blow: Blow = {},
): boolean {
  const g = ctx.g;
  const player = g.st.player;
  const you = attacker === player;
  const them = target === player;
  const { item, weapon } =
    blow.thrown && blow.with
      ? {
          item: blow.with,
          weapon: comp(g, blow.with, "weapon") ?? {
            type: "blunt" as const,
            power: 2,
            skill: "throwing" as const,
          },
        }
      : wielded(g, attacker, blow.with);
  const a = ref(g, attacker);
  const d = ref(g, target);
  const how: Msg = { k: `how.${weapon.type}` };
  emit(ctx, { type: "attacked", actor: attacker, target });
  exert(g, attacker, 0.04);

  // 1. Reach.
  const down = !conscious(g, target);
  const reachStat = blow.thrown
    ? stat(g, attacker, "dexterity")
    : stat(g, attacker, "agility");
  const reach =
    reachStat +
    skill(g, attacker, blow.thrown ? "throwing" : weapon.skill) +
    d10(g) -
    hampered(g, attacker);
  const defending = them ? !!g.st.defending : false;
  const dodge = down
    ? -99
    : stat(g, target, "agility") +
      d10(g) +
      (defending ? 4 : 0) -
      hampered(g, target) -
      legPenalty(g, target);
  if (reach <= dodge) {
    const parried = defending && wielded(g, target).item !== undefined;
    if (you) say(ctx, parried ? "miss.you.parried" : "miss.you", { d });
    else if (them) say(ctx, parried ? "miss.them.parried" : "miss.them", { a });
    else say(ctx, "miss.other", { a, d });
    return false;
  }

  // 2. Aim: where the blow actually lands.
  let part: BodyPart;
  if (blow.aim) {
    const aimed = sidedPart(g, blow.aim);
    const precision =
      stat(g, attacker, "dexterity") +
      skill(g, attacker, blow.thrown ? "throwing" : weapon.skill) +
      d10(g) -
      hampered(g, attacker) -
      (SMALL_PARTS.includes(aimed) ? 3 : 0) +
      (down ? 10 : 0);
    part = precision >= 13 ? aimed : strayPart(g, aimed);
    if (part !== aimed && you)
      say(ctx, "aim.strays", { aim: { n: `part.${aimed}` } });
  } else {
    part = randomPart(g);
  }

  // 3. Protection. A blow that barely reaches lands softly; a clean one
  // carries the full weight of the weapon.
  const strength = stat(g, attacker, "strength") - 5;
  const margin = down ? 5 : Math.min(5, reach - dodge);
  const quality = 0.15 + 0.12 * margin;
  const power =
    (weapon.power + strength * (blow.thrown ? 0.3 : 0.5) + runInt(g.st, 3)) *
      quality +
    (down ? 2 : 0);
  const { amount, outer } = protectionAt(g, target, part, weapon.type);
  let sev = severity(power - amount);
  // A blow that kills or maims the player outright only comes from someone
  // clearly stronger: losing to bad luck against a weak foe is no fun.
  if (them && sev === 4 && rating(g, attacker) - rating(g, target) < 3) sev = 3;
  // But a bone already broken gives way under the next heavy blow.
  const targetBody = comp(g, target, "body");
  if (sev > 0 && targetBody)
    sev = worsened(
      targetBody,
      part,
      weapon.type,
      sev as 1 | 2 | 3 | 4,
      runInt(g.st, 100) / 100,
    );
  const p = { a, d, part: { n: `part.${part}` }, how };
  if (sev === 0) {
    if (outer)
      say(
        ctx,
        you ? "absorbed.you" : them ? "absorbed.them" : "absorbed.other",
        { ...p, armor: ref(g, outer) },
      );
    else say(ctx, you ? "graze.you" : them ? "graze.them" : "graze.other", p);
    return true;
  }

  // 4. Wound.
  say(ctx, you ? "hit.you" : them ? "hit.them" : "hit.other", p);
  const sevKey = `sev.${weapon.type}.${sev}`;
  const special = hasText(g.content.langs.fr, `${sevKey}.${part}`);
  say(ctx, special ? `${sevKey}.${part}` : sevKey);
  const before = vital(g, target);
  const after = inflict(ctx, target, part, weapon.type, sev);
  if (item && blow.thrown) move(g, item, placeOf(g, target));

  // A grave wound to an arm or hand makes it let go.
  const side = sev >= 3 ? handSide(part) : undefined;
  const hand = side ? hands(g, target)[side] : undefined;
  const dropped = hand ? children(g, hand)[0] : undefined;
  if (dropped && after !== "dead") {
    say(ctx, them ? "drop.you" : "drop.them", { d, x: ref(g, dropped) });
    move(g, dropped, placeOf(g, target));
  }
  if ((after === "dead" || after === "down") && after !== before) {
    noteVital(g, target, after);
    if (them) {
      if (after === "dead") {
        g.st.flags.dead = true;
        const cause = causeOf(comp(g, target, "body")!, g.st.clock);
        say(ctx, cause === "blood" ? "you.killed" : `you.killed.${cause}`);
      } else say(ctx, "you.knockedOut");
    } else
      say(ctx, after === "dead" ? "npc.dies" : "npc.faints", {
        x: bare(g, target),
      });
  }
  return true;
}

/** Can the player get away from everyone hostile here? */
export function escapes(g: Game, chasers: Id[]): { ok: boolean; blocker?: Id } {
  const player = g.st.player;
  const load = { light: 0, loaded: 1, heavy: 2, overloaded: 5 }[
    loadTier(g, player)
  ];
  const run =
    stat(g, player, "agility") +
    d10(g) -
    load -
    legPenalty(g, player) -
    hampered(g, player);
  for (const id of chasers) {
    const block =
      stat(g, id, "agility") + d10(g) - legPenalty(g, id) - hampered(g, id);
    if (block >= run) return { ok: false, blocker: id };
  }
  return { ok: true };
}

/** Does a runner get past someone trying to stop them? */
export function outruns(g: Game, runner: Id, chaser: Id): boolean {
  const run =
    stat(g, runner, "agility") +
    d10(g) -
    legPenalty(g, runner) -
    hampered(g, runner);
  const block =
    stat(g, chaser, "agility") +
    d10(g) -
    legPenalty(g, chaser) -
    hampered(g, chaser);
  return run > block;
}
