import { checkTierUpgrade, calculateTierAfterReset } from './tier-logic';
import { Tier } from '../common/constants/tiers';

describe('Tier Logic', () => {
  describe('checkTierUpgrade', () => {
    describe('upgrades when threshold is reached', () => {
      it('upgrades Bronze → Silver at 500 points', () => {
        const result = checkTierUpgrade(Tier.BRONZE, 500);
        expect(result).toEqual({
          previousTier: Tier.BRONZE,
          newTier: Tier.SILVER,
        });
      });

      it('upgrades Bronze → Gold at 2000 points (skips Silver)', () => {
        const result = checkTierUpgrade(Tier.BRONZE, 2000);
        expect(result).toEqual({
          previousTier: Tier.BRONZE,
          newTier: Tier.GOLD,
        });
      });

      it('upgrades Bronze → Platinum at 10000 points (skips Silver and Gold)', () => {
        const result = checkTierUpgrade(Tier.BRONZE, 10000);
        expect(result).toEqual({
          previousTier: Tier.BRONZE,
          newTier: Tier.PLATINUM,
        });
      });

      it('upgrades Silver → Gold at 2000 points', () => {
        const result = checkTierUpgrade(Tier.SILVER, 2000);
        expect(result).toEqual({
          previousTier: Tier.SILVER,
          newTier: Tier.GOLD,
        });
      });

      it('upgrades Silver → Platinum at 10000 points', () => {
        const result = checkTierUpgrade(Tier.SILVER, 10000);
        expect(result).toEqual({
          previousTier: Tier.SILVER,
          newTier: Tier.PLATINUM,
        });
      });

      it('upgrades Gold → Platinum at 10000 points', () => {
        const result = checkTierUpgrade(Tier.GOLD, 10000);
        expect(result).toEqual({
          previousTier: Tier.GOLD,
          newTier: Tier.PLATINUM,
        });
      });
    });

    describe('no upgrade when threshold not reached', () => {
      it('returns null for Bronze with 499 points', () => {
        expect(checkTierUpgrade(Tier.BRONZE, 499)).toBeNull();
      });

      it('returns null for Silver with 1999 points', () => {
        expect(checkTierUpgrade(Tier.SILVER, 1999)).toBeNull();
      });

      it('returns null for Gold with 9999 points', () => {
        expect(checkTierUpgrade(Tier.GOLD, 9999)).toBeNull();
      });

      it('returns null for Platinum with any points (already max)', () => {
        expect(checkTierUpgrade(Tier.PLATINUM, 50000)).toBeNull();
      });
    });

    describe('no upgrade when already at correct tier', () => {
      it('returns null for Silver with exactly 500 points', () => {
        expect(checkTierUpgrade(Tier.SILVER, 500)).toBeNull();
      });

      it('returns null for Gold with exactly 2000 points', () => {
        expect(checkTierUpgrade(Tier.GOLD, 2000)).toBeNull();
      });

      it('returns null for Platinum with exactly 10000 points', () => {
        expect(checkTierUpgrade(Tier.PLATINUM, 10000)).toBeNull();
      });
    });

    describe('edge cases', () => {
      it('returns null for Bronze with 0 points', () => {
        expect(checkTierUpgrade(Tier.BRONZE, 0)).toBeNull();
      });

      it('handles points well above threshold', () => {
        const result = checkTierUpgrade(Tier.BRONZE, 100000);
        expect(result).toEqual({
          previousTier: Tier.BRONZE,
          newTier: Tier.PLATINUM,
        });
      });
    });
  });

  describe('calculateTierAfterReset', () => {
    describe('drops by one tier when threshold not met', () => {
      it('drops Platinum → Gold with 0 points', () => {
        const result = calculateTierAfterReset(Tier.PLATINUM, 0);
        expect(result).toEqual({
          previousTier: Tier.PLATINUM,
          newTier: Tier.GOLD,
        });
      });

      it('drops Platinum → Gold with 9999 points', () => {
        const result = calculateTierAfterReset(Tier.PLATINUM, 9999);
        expect(result).toEqual({
          previousTier: Tier.PLATINUM,
          newTier: Tier.GOLD,
        });
      });

      it('drops Gold → Silver with 1999 points', () => {
        const result = calculateTierAfterReset(Tier.GOLD, 1999);
        expect(result).toEqual({
          previousTier: Tier.GOLD,
          newTier: Tier.SILVER,
        });
      });

      it('drops Silver → Bronze with 499 points', () => {
        const result = calculateTierAfterReset(Tier.SILVER, 499);
        expect(result).toEqual({
          previousTier: Tier.SILVER,
          newTier: Tier.BRONZE,
        });
      });
    });

    describe('floor protection — never drops more than one tier', () => {
      it('Platinum with 0 points drops only to Gold (not Bronze)', () => {
        const result = calculateTierAfterReset(Tier.PLATINUM, 0);
        expect(result!.newTier).toBe(Tier.GOLD);
      });

      it('Gold with 0 points drops only to Silver (not Bronze)', () => {
        const result = calculateTierAfterReset(Tier.GOLD, 0);
        expect(result!.newTier).toBe(Tier.SILVER);
      });
    });

    describe('no drop when threshold is met', () => {
      it('Platinum stays with 10000 points', () => {
        expect(calculateTierAfterReset(Tier.PLATINUM, 10000)).toBeNull();
      });

      it('Gold stays with 2000 points', () => {
        expect(calculateTierAfterReset(Tier.GOLD, 2000)).toBeNull();
      });

      it('Silver stays with 500 points', () => {
        expect(calculateTierAfterReset(Tier.SILVER, 500)).toBeNull();
      });

      it('Bronze never drops (already minimum)', () => {
        expect(calculateTierAfterReset(Tier.BRONZE, 0)).toBeNull();
      });
    });

    describe('no drop when points exceed threshold', () => {
      it('Platinum stays with 50000 points', () => {
        expect(calculateTierAfterReset(Tier.PLATINUM, 50000)).toBeNull();
      });

      it('Gold stays with 9999 points', () => {
        expect(calculateTierAfterReset(Tier.GOLD, 9999)).toBeNull();
      });
    });

    describe('Bronze floor — cannot drop below Bronze', () => {
      it('Bronze with 0 points stays Bronze', () => {
        expect(calculateTierAfterReset(Tier.BRONZE, 0)).toBeNull();
      });
    });

    describe('cumulative reset scenario (multiple months)', () => {
      it('Platinum → Gold → Silver → Bronze over 3 resets with 0 points', () => {
        const reset1 = calculateTierAfterReset(Tier.PLATINUM, 0);
        expect(reset1!.newTier).toBe(Tier.GOLD);

        const reset2 = calculateTierAfterReset(reset1!.newTier, 0);
        expect(reset2!.newTier).toBe(Tier.SILVER);

        const reset3 = calculateTierAfterReset(reset2!.newTier, 0);
        expect(reset3!.newTier).toBe(Tier.BRONZE);

        const reset4 = calculateTierAfterReset(reset3!.newTier, 0);
        expect(reset4).toBeNull();
      });
    });
  });
});
