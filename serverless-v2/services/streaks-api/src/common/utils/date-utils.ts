/**
 * UTC date utilities for streak calculations.
 * All dates are UTC calendar days represented as YYYY-MM-DD strings.
 */

export function getUtcToday(): string {
  return formatDate(new Date());
}

export function getUtcYesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return formatDate(d);
}

export function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function daysBetween(dateStrA: string, dateStrB: string): number {
  const a = parseDate(dateStrA);
  const b = parseDate(dateStrB);
  const diffMs = b.getTime() - a.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
}

export function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7); // YYYY-MM
}

export function getDaysInMonth(monthKey: string): string[] {
  const [y, m] = monthKey.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const days: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(`${monthKey}-${String(d).padStart(2, '0')}`);
  }
  return days;
}

export function getMissedDates(
  lastDate: string,
  today: string,
): string[] {
  const gap = daysBetween(lastDate, today);
  if (gap <= 1) return [];
  const missed: string[] = [];
  for (let i = 1; i < gap; i++) {
    missed.push(addDays(lastDate, i));
  }
  return missed;
}
