import { MILESTONES } from '../common/constants';
import { MilestoneHit, StreakType } from '../common/types';

/**
 * Detect milestones crossed when a streak advances from previousStreak to newStreak.
 *
 * Rules:
 * - Only milestones where previousStreak < milestone.days <= newStreak are returned
 * - Rewards are per-milestone-per-streak (re-earnable after reset)
 * - If streak was reset (previousStreak came from a different streak), only check newStreak directly
 * - Returns empty array if no milestones crossed
 */
export function detectMilestones(
  previousStreak: number,
  newStreak: number,
  type: StreakType,
): MilestoneHit[] {
  if (newStreak <= previousStreak) return [];

  const hits: MilestoneHit[] = [];

  for (const milestone of MILESTONES) {
    if (previousStreak < milestone.days && newStreak >= milestone.days) {
      hits.push({
        milestone: milestone.days,
        type: type === 'login' ? 'login_milestone' : 'play_milestone',
        points:
          type === 'login' ? milestone.loginReward : milestone.playReward,
      });
    }
  }

  return hits;
}

/**
 * Get the next milestone for a given streak count.
 * Returns null if the streak has passed all milestones.
 */
export function getNextMilestone(
  currentStreak: number,
  type: StreakType,
): { days: number; reward: number; daysRemaining: number } | null {
  for (const milestone of MILESTONES) {
    if (currentStreak < milestone.days) {
      return {
        days: milestone.days,
        reward:
          type === 'login' ? milestone.loginReward : milestone.playReward,
        daysRemaining: milestone.days - currentStreak,
      };
    }
  }
  return null;
}
