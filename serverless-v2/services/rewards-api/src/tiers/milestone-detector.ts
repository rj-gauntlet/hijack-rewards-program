import { MILESTONE_THRESHOLDS } from '../common/constants/milestones';

/**
 * Detect which milestones were crossed when points changed
 * from previousTotal to newTotal within the current month.
 *
 * Returns an array of milestone thresholds that were crossed
 * (empty if none).
 */
export function detectMilestones(
  previousMonthlyTotal: number,
  newMonthlyTotal: number,
): number[] {
  return MILESTONE_THRESHOLDS.filter(
    (threshold) =>
      previousMonthlyTotal < threshold && newMonthlyTotal >= threshold,
  );
}
