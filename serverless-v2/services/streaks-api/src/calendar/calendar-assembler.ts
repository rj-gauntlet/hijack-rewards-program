import {
  ActivityType,
  CalendarDay,
  CalendarResponse,
  DailyActivity,
} from '../common/types';
import { getDaysInMonth } from '../common/utils/date-utils';

/**
 * Determine the activity type for a single day.
 * Priority: streak_broken > freeze > played > login_only > none
 */
export function getActivityType(activity: DailyActivity | undefined): ActivityType {
  if (!activity) return ActivityType.NONE;

  if (activity.streakBroken) return ActivityType.STREAK_BROKEN;
  if (activity.freezeUsed) return ActivityType.FREEZE;
  if (activity.played) return ActivityType.PLAYED;
  if (activity.loggedIn) return ActivityType.LOGIN_ONLY;

  return ActivityType.NONE;
}

/**
 * Assemble a calendar response for a given month from daily activity records.
 *
 * Returns an entry for every day in the month, filling in gaps with "none".
 * Activity records are matched by date string.
 */
export function assembleCalendar(
  activities: DailyActivity[],
  month: string, // YYYY-MM
): CalendarResponse {
  const activityMap = new Map<string, DailyActivity>();
  for (const a of activities) {
    activityMap.set(a.date, a);
  }

  const allDays = getDaysInMonth(month);
  const days: CalendarDay[] = allDays.map((date) => {
    const activity = activityMap.get(date);
    return {
      date,
      activity: getActivityType(activity),
      loginStreak: activity?.loginStreakAtDay ?? 0,
      playStreak: activity?.playStreakAtDay ?? 0,
    };
  });

  return { month, days };
}
