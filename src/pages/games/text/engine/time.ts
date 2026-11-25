// Calendar: one integer clock in minutes. Weekday, hour and period are
// derived from it, never stored. There are no months and no seasons.

export const DAY = 24 * 60;

export type Period = "dawn" | "morning" | "afternoon" | "evening" | "night";

export const day = (clock: number) => Math.floor(clock / DAY);
export const minuteOfDay = (clock: number) => ((clock % DAY) + DAY) % DAY;
export const hour = (clock: number) => Math.floor(minuteOfDay(clock) / 60);
export const weekday = (clock: number) => day(clock) % 7;

/** Periods and the hour each one starts at. */
export const PERIODS: [Period, number][] = [
  ["dawn", 5],
  ["morning", 7],
  ["afternoon", 12],
  ["evening", 18],
  ["night", 22],
];

export function period(clock: number): Period {
  const h = hour(clock);
  if (h >= 22 || h < 5) return "night";
  if (h < 7) return "dawn";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

/** First or second half of the current period, for "late evening". */
export function periodHalf(clock: number): "early" | "late" {
  const p = period(clock);
  const start = PERIODS.find(([name]) => name === p)![1] * 60;
  const length =
    p === "night"
      ? 7 * 60
      : p === "dawn"
        ? 120
        : p === "morning"
          ? 300
          : p === "afternoon"
            ? 360
            : 240;
  const into = (minuteOfDay(clock) - start + DAY) % DAY;
  return into < length / 2 ? "early" : "late";
}

/** Minutes until the next time the clock shows `minute` of the day. */
export function minutesUntil(clock: number, minute: number): number {
  const delta = (minute - minuteOfDay(clock) + DAY) % DAY;
  return delta === 0 ? DAY : delta;
}
