import { Tier, TIER_MULTIPLIERS } from '../common/constants/tiers';
import { getBasePointsForStakes } from '../common/constants/stakes';

export interface PointsCalculation {
  basePoints: number;
  multiplier: number;
  earnedPoints: number;
}

export function calculatePoints(
  bigBlind: number,
  playerTier: Tier,
): PointsCalculation {
  const basePoints = getBasePointsForStakes(bigBlind);
  const multiplier = TIER_MULTIPLIERS[playerTier];
  const earnedPoints = Math.floor(basePoints * multiplier);

  return { basePoints, multiplier, earnedPoints };
}
