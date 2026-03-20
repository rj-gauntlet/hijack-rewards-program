export type RewardType = 'login_milestone' | 'play_milestone';

export interface StreakReward {
  playerId: string;
  rewardId: string;
  type: RewardType;
  milestone: number; // days (3, 7, 14, 30, 60, 90)
  points: number;
  streakCount: number; // actual streak when earned
  createdAt: string; // ISO timestamp
}

export interface MilestoneHit {
  milestone: number;
  type: RewardType;
  points: number;
}
