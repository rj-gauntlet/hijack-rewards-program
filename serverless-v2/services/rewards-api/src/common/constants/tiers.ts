export enum Tier {
  BRONZE = 1,
  SILVER = 2,
  GOLD = 3,
  PLATINUM = 4,
}

export const TIER_NAMES: Record<Tier, string> = {
  [Tier.BRONZE]: 'Bronze',
  [Tier.SILVER]: 'Silver',
  [Tier.GOLD]: 'Gold',
  [Tier.PLATINUM]: 'Platinum',
};

export const TIER_THRESHOLDS: Record<Tier, number> = {
  [Tier.BRONZE]: 0,
  [Tier.SILVER]: 500,
  [Tier.GOLD]: 2000,
  [Tier.PLATINUM]: 10000,
};

export const TIER_MULTIPLIERS: Record<Tier, number> = {
  [Tier.BRONZE]: 1.0,
  [Tier.SILVER]: 1.25,
  [Tier.GOLD]: 1.5,
  [Tier.PLATINUM]: 2.0,
};

export const MIN_TIER = Tier.BRONZE;
export const MAX_TIER = Tier.PLATINUM;

export function getTierForPoints(monthlyPoints: number): Tier {
  if (monthlyPoints >= TIER_THRESHOLDS[Tier.PLATINUM]) return Tier.PLATINUM;
  if (monthlyPoints >= TIER_THRESHOLDS[Tier.GOLD]) return Tier.GOLD;
  if (monthlyPoints >= TIER_THRESHOLDS[Tier.SILVER]) return Tier.SILVER;
  return Tier.BRONZE;
}

export function getNextTier(tier: Tier): Tier | null {
  if (tier >= MAX_TIER) return null;
  return (tier + 1) as Tier;
}

export function getPointsToNextTier(
  currentTier: Tier,
  monthlyPoints: number,
): number | null {
  const next = getNextTier(currentTier);
  if (next === null) return null;
  return Math.max(0, TIER_THRESHOLDS[next] - monthlyPoints);
}

export function getProgressToNextTier(
  currentTier: Tier,
  monthlyPoints: number,
): number {
  const next = getNextTier(currentTier);
  if (next === null) return 100;

  const currentThreshold = TIER_THRESHOLDS[currentTier];
  const nextThreshold = TIER_THRESHOLDS[next];
  const range = nextThreshold - currentThreshold;
  const progress = monthlyPoints - currentThreshold;

  return Math.min(100, Math.round((progress / range) * 100));
}
