/** Data locală în format YYYY-MM-DD (ex. "2026-11-12"). */
export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Ziua săptămânii pentru o dată YYYY-MM-DD: 0 = duminică ... 6 = sâmbătă. */
export function weekdayOf(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12).getDay();
}
