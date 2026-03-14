import { detectMilestones } from './milestone-detector';

describe('MilestoneDetector', () => {
  describe('detects single milestones', () => {
    it('detects 500-point milestone', () => {
      expect(detectMilestones(490, 510)).toEqual([500]);
    });

    it('detects 1000-point milestone', () => {
      expect(detectMilestones(990, 1010)).toEqual([1000]);
    });

    it('detects 2500-point milestone', () => {
      expect(detectMilestones(2490, 2510)).toEqual([2500]);
    });

    it('detects 5000-point milestone', () => {
      expect(detectMilestones(4990, 5010)).toEqual([5000]);
    });

    it('detects 10000-point milestone', () => {
      expect(detectMilestones(9990, 10010)).toEqual([10000]);
    });
  });

  describe('detects exact threshold crossing', () => {
    it('detects milestone when landing exactly on threshold', () => {
      expect(detectMilestones(499, 500)).toEqual([500]);
    });

    it('does not detect milestone when already at threshold', () => {
      expect(detectMilestones(500, 510)).toEqual([]);
    });

    it('does not detect milestone when starting above threshold', () => {
      expect(detectMilestones(501, 600)).toEqual([]);
    });
  });

  describe('detects multiple milestones at once', () => {
    it('detects 500 and 1000 when jumping from 400 to 1100', () => {
      expect(detectMilestones(400, 1100)).toEqual([500, 1000]);
    });

    it('detects all milestones when jumping from 0 to 10000', () => {
      expect(detectMilestones(0, 10000)).toEqual([
        500, 1000, 2500, 5000, 10000,
      ]);
    });

    it('detects 2500 and 5000 when jumping from 2000 to 5500', () => {
      expect(detectMilestones(2000, 5500)).toEqual([2500, 5000]);
    });
  });

  describe('returns empty when no milestones crossed', () => {
    it('returns empty for small increment below any threshold', () => {
      expect(detectMilestones(100, 200)).toEqual([]);
    });

    it('returns empty for increment between milestones', () => {
      expect(detectMilestones(600, 900)).toEqual([]);
    });

    it('returns empty when above all milestones', () => {
      expect(detectMilestones(10001, 15000)).toEqual([]);
    });

    it('returns empty for zero change', () => {
      expect(detectMilestones(500, 500)).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('handles starting from 0', () => {
      expect(detectMilestones(0, 499)).toEqual([]);
      expect(detectMilestones(0, 500)).toEqual([500]);
    });

    it('handles very large point values', () => {
      expect(detectMilestones(9999, 1000000)).toEqual([10000]);
    });
  });
});
