import {
  formatAccountNumber,
  formatAmount,
  formatCurrency,
  getRelativeTime,
} from '../formatters';

describe('Formatters', () => {
  describe('formatAccountNumber', () => {
    it('formats account number correctly', () => {
      expect(formatAccountNumber('1234567890')).toBe('12-3456-7890');
    });

    it('returns original string if too short', () => {
      expect(formatAccountNumber('12345')).toBe('12345');
    });

    it('handles empty string', () => {
      expect(formatAccountNumber('')).toBe('');
    });
  });

  describe('formatAmount', () => {
    it('formats number with comma separators', () => {
      expect(formatAmount(1000)).toBe('1,000');
      expect(formatAmount(1000000)).toBe('1,000,000');
    });

    it('floors decimal numbers', () => {
      expect(formatAmount(1234.56)).toBe('1,234');
    });

    it('handles string input', () => {
      expect(formatAmount('5000')).toBe('5,000');
    });

    it('returns "0" for falsy values', () => {
      expect(formatAmount(0)).toBe('0');
      expect(formatAmount('')).toBe('0');
    });
  });

  describe('formatCurrency', () => {
    it('formats amount with currency symbol', () => {
      expect(formatCurrency(1000)).toBe('1,000 원');
    });

    it('handles string input', () => {
      expect(formatCurrency('2000')).toBe('2,000 원');
    });
  });

  describe('getRelativeTime', () => {
    it('returns "방금 전" for recent timestamps', () => {
      const now = new Date();
      const recent = new Date(now.getTime() - 30000); // 30 seconds ago
      expect(getRelativeTime(recent)).toBe('방금 전');
    });

    it('returns minutes ago for timestamps within an hour', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      expect(getRelativeTime(fiveMinutesAgo)).toBe('5분 전');
    });

    it('returns hours ago for timestamps within a day', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      expect(getRelativeTime(twoHoursAgo)).toBe('2시간 전');
    });

    it('returns days ago for older timestamps', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      expect(getRelativeTime(threeDaysAgo)).toBe('3일 전');
    });
  });
});
