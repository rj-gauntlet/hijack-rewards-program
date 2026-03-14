import {
  getCurrentMonthKey,
  getPreviousMonthKey,
  getNextMonthKey,
  getLastNMonthKeys,
  compareMonthKeys,
  isValidMonthKey,
} from './month-key';

describe('MonthKey Utilities', () => {
  describe('getCurrentMonthKey', () => {
    it('returns YYYY-MM format', () => {
      const result = getCurrentMonthKey();
      expect(result).toMatch(/^\d{4}-\d{2}$/);
    });

    it('uses UTC to avoid timezone issues', () => {
      const jan1 = new Date('2026-01-01T00:00:00Z');
      expect(getCurrentMonthKey(jan1)).toBe('2026-01');
    });

    it('pads single-digit months', () => {
      const march = new Date('2026-03-15T12:00:00Z');
      expect(getCurrentMonthKey(march)).toBe('2026-03');
    });

    it('handles December', () => {
      const dec = new Date('2026-12-31T23:59:59Z');
      expect(getCurrentMonthKey(dec)).toBe('2026-12');
    });
  });

  describe('getPreviousMonthKey', () => {
    it('returns previous month in same year', () => {
      expect(getPreviousMonthKey('2026-03')).toBe('2026-02');
      expect(getPreviousMonthKey('2026-06')).toBe('2026-05');
      expect(getPreviousMonthKey('2026-12')).toBe('2026-11');
    });

    it('wraps to December of previous year from January', () => {
      expect(getPreviousMonthKey('2026-01')).toBe('2025-12');
    });

    it('handles year 2000 boundary', () => {
      expect(getPreviousMonthKey('2000-01')).toBe('1999-12');
    });
  });

  describe('getNextMonthKey', () => {
    it('returns next month in same year', () => {
      expect(getNextMonthKey('2026-03')).toBe('2026-04');
      expect(getNextMonthKey('2026-01')).toBe('2026-02');
      expect(getNextMonthKey('2026-11')).toBe('2026-12');
    });

    it('wraps to January of next year from December', () => {
      expect(getNextMonthKey('2026-12')).toBe('2027-01');
    });
  });

  describe('getLastNMonthKeys', () => {
    it('returns last 6 months in chronological order', () => {
      const result = getLastNMonthKeys('2026-03', 6);
      expect(result).toEqual([
        '2025-10',
        '2025-11',
        '2025-12',
        '2026-01',
        '2026-02',
        '2026-03',
      ]);
    });

    it('returns single month when count is 1', () => {
      expect(getLastNMonthKeys('2026-03', 1)).toEqual(['2026-03']);
    });

    it('handles crossing year boundary', () => {
      const result = getLastNMonthKeys('2026-02', 4);
      expect(result).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
    });

    it('returns empty array for count 0', () => {
      expect(getLastNMonthKeys('2026-03', 0)).toEqual([]);
    });
  });

  describe('compareMonthKeys', () => {
    it('returns negative when a is earlier', () => {
      expect(compareMonthKeys('2026-01', '2026-02')).toBeLessThan(0);
      expect(compareMonthKeys('2025-12', '2026-01')).toBeLessThan(0);
    });

    it('returns 0 when equal', () => {
      expect(compareMonthKeys('2026-03', '2026-03')).toBe(0);
    });

    it('returns positive when a is later', () => {
      expect(compareMonthKeys('2026-03', '2026-02')).toBeGreaterThan(0);
      expect(compareMonthKeys('2027-01', '2026-12')).toBeGreaterThan(0);
    });
  });

  describe('isValidMonthKey', () => {
    it('accepts valid month keys', () => {
      expect(isValidMonthKey('2026-01')).toBe(true);
      expect(isValidMonthKey('2026-06')).toBe(true);
      expect(isValidMonthKey('2026-12')).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(isValidMonthKey('2026-1')).toBe(false);
      expect(isValidMonthKey('2026/03')).toBe(false);
      expect(isValidMonthKey('March 2026')).toBe(false);
      expect(isValidMonthKey('')).toBe(false);
      expect(isValidMonthKey('2026')).toBe(false);
    });

    it('rejects invalid months', () => {
      expect(isValidMonthKey('2026-00')).toBe(false);
      expect(isValidMonthKey('2026-13')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('throws on invalid month key input to getPreviousMonthKey', () => {
      expect(() => getPreviousMonthKey('invalid')).toThrow(/Invalid month key/);
    });

    it('throws on invalid month key input to getNextMonthKey', () => {
      expect(() => getNextMonthKey('bad-format')).toThrow(/Invalid month key/);
    });
  });
});
