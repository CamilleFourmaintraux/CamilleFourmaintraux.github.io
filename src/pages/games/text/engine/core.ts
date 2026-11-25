// The turn context, the event bus and the scheduler.
//
// Systems never change data that another system owns. They emit a domain
// event and the owner reacts. Events are handled in order through a queue,
// never by recursion, with a hard limit against loops.

import { runInt } from "./rng";
import { variants } from "./lang";
import type { Game } from "./world";
import type { Id, Msg, Param, Scheduled } from "./types";

export interface GameEvent {
  type: string;
  actor?: Id;
  target?: Id;
  from?: Id | null;
  to?: Id | null;
  /** Severity of a wound. */
  sev?: number;
}

export interface Ctx {
  g: Game;
  out: Msg[];
  queue: GameEvent[];
  /** A long voluntary wait may stop early when something happens. */
  interruptible: boolean;
  interrupted: boolean;
  /** The player went to another place this turn (autosave point). */
  placeChanged: boolean;
  /** Someone already woke the player up this turn, and said so. */
  wokeUp?: boolean;
}

export function newCtx(g: Game): Ctx {
  return {
    g,
    out: [],
    queue: [],
    interruptible: false,
    interrupted: false,
    placeChanged: false,
  };
}

/** Writes a message. A key with variants gets one picked at random. */
export function say(ctx: Ctx, k: string, p?: Record<string, Param>) {
  const msg: Msg = p ? { k, p } : { k };
  if (variants(ctx.g.content.langs.fr, k) > 1) msg.v = runInt(ctx.g.st, 997);
  ctx.out.push(msg);
}

// ---------------------------------------------------------------------------
// Event bus.

type Listener = (ctx: Ctx, event: GameEvent) => void;
const listeners = new Map<string, Listener[]>();

export function on(type: string, listener: Listener) {
  const list = listeners.get(type);
  if (list) list.push(listener);
  else listeners.set(type, [listener]);
}

export function emit(ctx: Ctx, event: GameEvent) {
  ctx.queue.push(event);
}

const MAX_EVENTS = 500;

/** Hands every queued event to its listeners, oldest first. */
export function drain(ctx: Ctx) {
  let handled = 0;
  while (ctx.queue.length > 0) {
    if (++handled > MAX_EVENTS) throw new Error("Event loop");
    const event = ctx.queue.shift()!;
    for (const listener of listeners.get(event.type) ?? [])
      listener(ctx, event);
  }
}

// ---------------------------------------------------------------------------
// Scheduler: dated events in a queue sorted by time.

type ScheduledHandler = (ctx: Ctx, event: Scheduled) => void;
const scheduledHandlers = new Map<string, ScheduledHandler>();

export function onScheduled(type: string, handler: ScheduledHandler) {
  scheduledHandlers.set(type, handler);
}

export function schedule(g: Game, event: Omit<Scheduled, "seq">) {
  const item: Scheduled = { ...event, seq: g.st.seq++ };
  const queue = g.st.queue;
  let i = queue.length;
  while (i > 0 && queue[i - 1].at > item.at) i--;
  queue.splice(i, 0, item);
}

/** Runs every scheduled event up to `end`. Returns false if interrupted. */
function runUntil(ctx: Ctx, end: number): boolean {
  const st = ctx.g.st;
  while (st.queue.length > 0 && st.queue[0].at <= end) {
    const event = st.queue.shift()!;
    st.clock = Math.max(st.clock, event.at);
    scheduledHandlers.get(event.type)?.(ctx, event);
    drain(ctx);
    if (ctx.interruptible && ctx.interrupted) return false;
  }
  st.clock = Math.max(st.clock, end);
  return true;
}

export type Advance =
  | { minutes: number }
  | { until: (g: Game) => boolean; max: number; step?: number };

/**
 * The single way time moves forward. A two-minute walk, an hour of waiting
 * and a night of sleep all go through here, so the torch burns down and
 * scheduled events fire the same way in every case. Continuous values (fuel,
 * later hunger and bleeding) are formulas of the elapsed time, not ticks.
 * Returns the minutes that actually passed.
 */
export function advance(ctx: Ctx, request: Advance): number {
  const st = ctx.g.st;
  const start = st.clock;
  if ("minutes" in request) {
    runUntil(ctx, start + Math.max(0, Math.round(request.minutes)));
  } else {
    const step = request.step ?? 15;
    while (st.clock - start < request.max) {
      const next = Math.min(st.clock + step, start + request.max);
      if (!runUntil(ctx, next) || request.until(ctx.g)) break;
    }
  }
  return st.clock - start;
}
