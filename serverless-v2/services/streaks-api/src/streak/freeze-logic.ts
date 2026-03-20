import { FreezeConsumeResult, StreakPlayer } from '../common/types';
import { getMonthKey } from '../common/utils/date-utils';

/**
 * Attempt to consume freezes for missed days.
 *
 * Rules:
 * - One freeze per missed day
 * - Multiple freezes can cover multiple consecutive missed days
 * - Freezes are consumed chronologically (earliest missed day first)
 * - Streak survives only if ALL missed days are covered
 * - Freeze preserves streak but does NOT increment it
 *
 * @param freezesAvailable Current freeze balance
 * @param missedDates Array of missed date strings (chronological)
 * @returns Result with protection details
 */
export function tryConsumeFreezes(
  freezesAvailable: number,
  missedDates: string[],
): FreezeConsumeResult {
  if (missedDates.length === 0) {
    return {
      daysProtected: 0,
      daysUnprotected: 0,
      streakSurvived: true,
      freezeDates: [],
    };
  }

  const freezesToUse = Math.min(freezesAvailable, missedDates.length);
  const freezeDates = missedDates.slice(0, freezesToUse);
  const daysUnprotected = missedDates.length - freezesToUse;

  return {
    daysProtected: freezesToUse,
    daysUnprotected,
    streakSurvived: daysUnprotected === 0,
    freezeDates,
  };
}

/**
 * Check if the player should receive their monthly free freeze.
 * Granted on the 1st of each month (lazy evaluation).
 *
 * @param player Current player state
 * @param today Today's date string (YYYY-MM-DD)
 * @returns Updated player fields if a grant occurred, or null
 */
export function checkMonthlyFreezeGrant(
  player: Pick<StreakPlayer, 'lastFreezeGrantDate' | 'freezesAvailable' | 'freezesUsedThisMonth'>,
  today: string,
): {
  freezesAvailable: number;
  freezesUsedThisMonth: number;
  lastFreezeGrantDate: string;
} | null {
  const currentMonth = getMonthKey(today);

  if (player.lastFreezeGrantDate === currentMonth) {
    return null; // already granted this month
  }

  return {
    freezesAvailable: player.freezesAvailable + 1,
    freezesUsedThisMonth: 0, // reset counter for new month
    lastFreezeGrantDate: currentMonth,
  };
}
