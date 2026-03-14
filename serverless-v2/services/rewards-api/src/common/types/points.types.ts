import { Tier } from '../constants/tiers';

export interface PointsLedgerEntry {
  playerId: string;
  timestamp: number;
  transactionId: string;
  handId: string;
  tableId: string;
  tableStakes: string;
  bigBlind: number;
  basePoints: number;
  multiplier: number;
  earnedPoints: number;
  playerTier: Tier;
  monthKey: string;
  type: 'hand' | 'admin_adjust';
  reason: string | null;
  createdAt: string;
}

export interface AwardPointsInput {
  playerId: string;
  tableId: string;
  tableStakes: string;
  bigBlind: number;
  handId: string;
}

export interface AwardPointsResult {
  earnedPoints: number;
  basePoints: number;
  multiplier: number;
  newMonthlyTotal: number;
  currentTier: Tier;
  tierUpgrade: TierChangeEvent | null;
  milestonesReached: number[];
}

export interface AdminAdjustInput {
  playerId: string;
  points: number;
  reason: string;
}

export interface TierChangeEvent {
  previousTier: Tier;
  newTier: Tier;
}
