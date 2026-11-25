// The two kinds of randomness of the game.
//
// World randomness is a pure hash of (world seed, system, day...). It gives
// the same answer in every game and for every path the player takes, so it is
// never saved: the weather of day 12 is recomputed from the number 12.
//
// Run randomness is a generator whose state lives in the save. Loading a save
// gives the same results again, so a failed lie stays failed.

import type { State } from "./types";

/** 32-bit hash of any list of numbers and strings (FNV-1a, then mixed). */
export function hash(...parts: (string | number)[]): number {
  let h = 0x811c9dc5;
  for (const part of parts) {
    const text = String(part);
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    // Separator, so that ("ab", "c") and ("a", "bc") differ.
    h ^= 0xff;
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** World randomness in [0, 1). Same inputs, same value, in every game. */
export function worldRandom(seed: number, ...parts: (string | number)[]) {
  return hash(seed, ...parts) / 2 ** 32;
}

/** Run randomness in [0, 1). Advances the saved generator (mulberry32). */
export function runRandom(state: State): number {
  state.rng = (state.rng + 0x6d2b79f5) >>> 0;
  let t = state.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
}

/** Whole number in [0, n). */
export function runInt(state: State, n: number): number {
  return Math.floor(runRandom(state) * n);
}
