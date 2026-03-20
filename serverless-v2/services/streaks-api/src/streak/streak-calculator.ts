import { StreakUpdateResult } from '../common/types';
import { daysBetween, getMissedDates } from '../common/utils/date-utils';
import { MAX_STREAK_DISPLAY } from '../common/constants';

/**
 * Calculate the updated streak after a check-in or hand completion.
 *
 * Rules:
 * - Same day (gap = 0): no change (idempotent)
 * - Next day (gap = 1): streak increments by 1
 * - Gap > 1: missed days detected. If enough freezes, streak preserved (not incremented).
 *   Otherwise, streak resets to 1 (today starts a new streak).
 * - First ever check-in (lastDate = null): streak starts at 1
 * - Streak capped at MAX_STREAK_DISPLAY (365)
 */
export function calculateStreakUpdate(
  lastDate: string | null,
  today: string,
  currentStreak: number,
  freezesAvailable: number,
): StreakUpdateResult {
  // First ever check-in
  if (lastDate === null) {
    return {
      newStreak: 1,
      gapDays: 0,
      streakReset: false,
      freezesConsumed: 0,
      previousStreak: 0,
    };
  }

  const gap = daysBetween(lastDate, today);

  // Same day — idempotent
  if (gap === 0) {
    return {
      newStreak: currentStreak,
      gapDays: 0,
      streakReset: false,
      freezesConsumed: 0,
      previousStreak: currentStreak,
    };
  }

  // Consecutive day
  if (gap === 1) {
    const newStreak = Math.min(currentStreak + 1, MAX_STREAK_DISPLAY);
    return {
      newStreak,
      gapDays: 0,
      streakReset: false,
      freezesConsumed: 0,
      previousStreak: currentStreak,
    };
  }

  // Gap > 1 — missed days
  const missedDays = gap - 1; // days between lastDate and today (exclusive)

  if (freezesAvailable >= missedDays) {
    // All missed days covered by freezes — streak preserved but NOT incremented
    return {
      newStreak: currentStreak,
      gapDays: missedDays,
      streakReset: false,
      freezesConsumed: missedDays,
      previousStreak: currentStreak,
    };
  }

  // Not enough freezes — streak resets
  // Consume whatever freezes are available (they cover the earliest missed days)
  return {
    newStreak: 1, // today starts a new streak
    gapDays: missedDays,
    streakReset: true,
    freezesConsumed: freezesAvailable,
    previousStreak: currentStreak,
  };
}

/**
 * Get the list of missed date strings between lastDate and today.
 * Returns empty array if consecutive or same day.
 */
export function getMissedDatesBetween(
  lastDate: string,
  today: string,
): string[] {
  return getMissedDates(lastDate, today);
}
