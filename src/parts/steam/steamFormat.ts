export function formatHours(minutes: number, lang: string): string {
  const hours = minutes / 60;
  return new Intl.NumberFormat(lang, {
    maximumFractionDigits: hours < 10 ? 1 : 0,
  }).format(hours);
}

export function formatDate(unixSeconds: number, lang: string): string {
  return new Date(unixSeconds * 1000).toLocaleDateString(lang, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatPercent(value: number, lang: string): string {
  return new Intl.NumberFormat(lang, {
    maximumFractionDigits: value < 10 ? 1 : 0,
  }).format(value);
}

export function completion(unlocked: number, total: number): number {
  return total > 0 ? Math.round((unlocked / total) * 100) : 0;
}
