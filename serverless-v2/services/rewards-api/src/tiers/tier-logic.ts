import {
  Tier,
  TIER_THRESHOLDS,
  TIER_NAMES,
  MIN_TIER,
  getTierForPoints,
} from '../common/constants/tiers';
import type { TierChangeEvent } from '../common/types/points.types';

/**
 * Check if a player should be upgraded based on their new monthly points total.
 * Upgrades are immediate and one-directional within a month.
 * Returns a TierChangeEvent if an upgrade occurred, null otherwise.
 */
export function checkTierUpgrade(
  currentTier: Tier,
  monthlyPoints: number,
): TierChangeEvent | null {
  const earnedTier = getTierForPoints(monthlyPoints);

  if (earnedTier > currentTier) {
    return {
      previousTier: currentTier,
      newTier: earnedTier,
    };
  }

  return null;
}

/**
 * Calculate a player's new tier after monthly reset.
 * Floor protection: can only drop one tier at most.
 *
 * Logic: if the player didn't earn enough points to maintain their
 * current tier, drop by exactly one tier level.
 */
export function calculateTierAfterReset(
  currentTier: Tier,
  monthlyPoints: number,
): TierChangeEvent | null {
  const requiredPoints = TIER_THRESHOLDS[currentTier];

  if (monthlyPoints >= requiredPoints) {
    return null;
  }

  const newTier = Math.max(MIN_TIER, currentTier - 1) as Tier;

  if (newTier === currentTier) {
    return null;
  }

  return {
    previousTier: currentTier,
    newTier,
  };
}

export function getTierUpgradeMessage(_previousTier: Tier, newTier: Tier): string {
  return `Congratulations! You've reached ${TIER_NAMES[newTier]} tier!`;
}

export function getTierDowngradeMessage(_previousTier: Tier, newTier: Tier): string {
  return `Your tier has been adjusted to ${TIER_NAMES[newTier]} for this month. Keep playing to climb back up!`;
}
