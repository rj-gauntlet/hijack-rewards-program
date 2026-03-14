import { calculatePoints } from './points-calculator';
import { Tier } from '../common/constants/tiers';

describe('PointsCalculator', () => {
  describe('base points by stakes bracket', () => {
    it.each([
      { bigBlind: 0.10, expected: 1 },
      { bigBlind: 0.15, expected: 1 },
      { bigBlind: 0.25, expected: 1 },
      { bigBlind: 0.50, expected: 2 },
      { bigBlind: 0.75, expected: 2 },
      { bigBlind: 1.00, expected: 2 },
      { bigBlind: 2.00, expected: 5 },
      { bigBlind: 3.50, expected: 5 },
      { bigBlind: 5.00, expected: 5 },
      { bigBlind: 10.00, expected: 10 },
      { bigBlind: 25.00, expected: 10 },
      { bigBlind: 100.00, expected: 10 },
    ])(
      'awards $expected base points for $bigBlind BB',
      ({ bigBlind, expected }) => {
        const result = calculatePoints(bigBlind, Tier.BRONZE);
        expect(result.basePoints).toBe(expected);
      },
    );
  });

  describe('tier multipliers', () => {
    const bigBlind = 2.00;

    it('applies 1.0x multiplier for Bronze', () => {
      const result = calculatePoints(bigBlind, Tier.BRONZE);
      expect(result.multiplier).toBe(1.0);
      expect(result.earnedPoints).toBe(5);
    });

    it('applies 1.25x multiplier for Silver', () => {
      const result = calculatePoints(bigBlind, Tier.SILVER);
      expect(result.multiplier).toBe(1.25);
      expect(result.earnedPoints).toBe(6);
    });

    it('applies 1.5x multiplier for Gold', () => {
      const result = calculatePoints(bigBlind, Tier.GOLD);
      expect(result.multiplier).toBe(1.5);
      expect(result.earnedPoints).toBe(7);
    });

    it('applies 2.0x multiplier for Platinum', () => {
      const result = calculatePoints(bigBlind, Tier.PLATINUM);
      expect(result.multiplier).toBe(2.0);
      expect(result.earnedPoints).toBe(10);
    });
  });

  describe('all bracket x tier combinations', () => {
    it.each([
      { bigBlind: 0.10, tier: Tier.BRONZE, expected: 1 },
      { bigBlind: 0.10, tier: Tier.SILVER, expected: 1 },
      { bigBlind: 0.10, tier: Tier.GOLD, expected: 1 },
      { bigBlind: 0.10, tier: Tier.PLATINUM, expected: 2 },
      { bigBlind: 0.50, tier: Tier.BRONZE, expected: 2 },
      { bigBlind: 0.50, tier: Tier.SILVER, expected: 2 },
      { bigBlind: 0.50, tier: Tier.GOLD, expected: 3 },
      { bigBlind: 0.50, tier: Tier.PLATINUM, expected: 4 },
      { bigBlind: 2.00, tier: Tier.BRONZE, expected: 5 },
      { bigBlind: 2.00, tier: Tier.SILVER, expected: 6 },
      { bigBlind: 2.00, tier: Tier.GOLD, expected: 7 },
      { bigBlind: 2.00, tier: Tier.PLATINUM, expected: 10 },
      { bigBlind: 10.00, tier: Tier.BRONZE, expected: 10 },
      { bigBlind: 10.00, tier: Tier.SILVER, expected: 12 },
      { bigBlind: 10.00, tier: Tier.GOLD, expected: 15 },
      { bigBlind: 10.00, tier: Tier.PLATINUM, expected: 20 },
    ])(
      'awards $expected pts for $bigBlind BB at tier $tier',
      ({ bigBlind, tier, expected }) => {
        const result = calculatePoints(bigBlind, tier);
        expect(result.earnedPoints).toBe(expected);
      },
    );
  });

  describe('earned points are always floored', () => {
    it('floors fractional results', () => {
      const result = calculatePoints(0.10, Tier.SILVER);
      expect(result.earnedPoints).toBe(1);
      expect(Number.isInteger(result.earnedPoints)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('throws for big blind in gap between brackets ($0.26-$0.49)', () => {
      expect(() => calculatePoints(0.30, Tier.BRONZE)).toThrow(
        /No stakes bracket found/,
      );
    });

    it('throws for big blind in gap between brackets ($1.01-$1.99)', () => {
      expect(() => calculatePoints(1.50, Tier.BRONZE)).toThrow(
        /No stakes bracket found/,
      );
    });

    it('throws for big blind in gap between brackets ($5.01-$9.99)', () => {
      expect(() => calculatePoints(7.00, Tier.BRONZE)).toThrow(
        /No stakes bracket found/,
      );
    });

    it('throws for negative big blind', () => {
      expect(() => calculatePoints(-1, Tier.BRONZE)).toThrow(
        /No stakes bracket found/,
      );
    });

    it('throws for zero big blind', () => {
      expect(() => calculatePoints(0, Tier.BRONZE)).toThrow(
        /No stakes bracket found/,
      );
    });

    it('handles very large big blinds ($10.00+ bracket)', () => {
      const result = calculatePoints(10000, Tier.PLATINUM);
      expect(result.basePoints).toBe(10);
      expect(result.earnedPoints).toBe(20);
    });

    it('handles exact bracket boundaries', () => {
      expect(calculatePoints(0.10, Tier.BRONZE).basePoints).toBe(1);
      expect(calculatePoints(0.50, Tier.BRONZE).basePoints).toBe(2);
      expect(calculatePoints(2.00, Tier.BRONZE).basePoints).toBe(5);
      expect(calculatePoints(10.00, Tier.BRONZE).basePoints).toBe(10);
      expect(calculatePoints(0.25, Tier.BRONZE).basePoints).toBe(1);
      expect(calculatePoints(1.00, Tier.BRONZE).basePoints).toBe(2);
      expect(calculatePoints(5.00, Tier.BRONZE).basePoints).toBe(5);
    });
  });
});
