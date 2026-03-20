export interface Milestone {
  days: number;
  loginReward: number;
  playReward: number;
  description: string;
}

export const MILESTONES: readonly Milestone[] = [
  { days: 3, loginReward: 50, playReward: 100, description: '3-day streak' },
  { days: 7, loginReward: 150, playReward: 300, description: '7-day streak' },
  { days: 14, loginReward: 400, playReward: 800, description: '14-day streak' },
  { days: 30, loginReward: 1000, playReward: 2000, description: '30-day streak' },
  { days: 60, loginReward: 2500, playReward: 5000, description: '60-day streak' },
  { days: 90, loginReward: 5000, playReward: 10000, description: '90-day streak' },
] as const;

export const MILESTONE_DAYS = MILESTONES.map((m) => m.days);

export const MAX_STREAK_DISPLAY = 365;
