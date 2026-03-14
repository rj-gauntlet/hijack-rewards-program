import { Tier } from '../constants/tiers';

export interface Player {
  playerId: string;
  displayName: string;
  email: string;
}

export interface PlayerRewards {
  playerId: string;
  currentTier: Tier;
  monthlyPoints: number;
  lifetimePoints: number;
  currentMonthKey: string;
  displayName: string;
  email: string;
  tierOverride: TierOverride | null;
  createdAt: string;
  updatedAt: string;
}

export interface TierOverride {
  tier: Tier;
  reason: string;
  expiresAt: string;
}
