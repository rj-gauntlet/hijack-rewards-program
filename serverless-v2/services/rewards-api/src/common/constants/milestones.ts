export const MILESTONE_THRESHOLDS = [500, 1000, 2500, 5000, 10000] as const;

export type MilestoneThreshold = (typeof MILESTONE_THRESHOLDS)[number];

export function getMilestoneMessage(threshold: MilestoneThreshold): string {
  return `You've earned ${threshold.toLocaleString()} points this month!`;
}
