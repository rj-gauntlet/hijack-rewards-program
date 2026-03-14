/**
 * Month key format: "YYYY-MM" (e.g., "2026-03").
 * Used throughout the system for tracking monthly points,
 * tier history, and leaderboard periods.
 */

export function getCurrentMonthKey(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getPreviousMonthKey(monthKey: string): string {
  const { year, month } = parseMonthKey(monthKey);

  if (month === 1) {
    return formatMonthKey(year - 1, 12);
  }
  return formatMonthKey(year, month - 1);
}

export function getNextMonthKey(monthKey: string): string {
  const { year, month } = parseMonthKey(monthKey);

  if (month === 12) {
    return formatMonthKey(year + 1, 1);
  }
  return formatMonthKey(year, month + 1);
}

/**
 * Returns the last N month keys ending with the given month (inclusive),
 * in chronological order (oldest first).
 */
export function getLastNMonthKeys(monthKey: string, count: number): string[] {
  const keys: string[] = [];
  let current = monthKey;

  for (let i = 0; i < count; i++) {
    keys.unshift(current);
    current = getPreviousMonthKey(current);
  }

  return keys;
}

/**
 * Compare two month keys. Returns:
 * - negative if a < b (a is earlier)
 * - 0 if equal
 * - positive if a > b (a is later)
 */
export function compareMonthKeys(a: string, b: string): number {
  return a.localeCompare(b);
}

export function isValidMonthKey(monthKey: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
  if (!match) return false;

  const month = parseInt(match[2], 10);
  return month >= 1 && month <= 12;
}

function parseMonthKey(monthKey: string): { year: number; month: number } {
  if (!isValidMonthKey(monthKey)) {
    throw new Error(`Invalid month key: "${monthKey}". Expected format: YYYY-MM`);
  }

  const [yearStr, monthStr] = monthKey.split('-');
  return {
    year: parseInt(yearStr, 10),
    month: parseInt(monthStr, 10),
  };
}

function formatMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}
