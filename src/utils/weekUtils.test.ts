import { describe, it, expect } from 'vitest';
import {
  weekBounds,
  formatRange,
  getCurrentWeek,
  getPreviousWeek,
  getNextWeek,
  isCurrentWeek
} from './weekUtils';

describe('weekUtils', () => {
  describe('weekBounds', () => {
    it('should return Monday 00:00 to Sunday 23:59:59.999 for any date', () => {
      const wednesday = new Date('2024-01-10T15:30:00'); // Wednesday
      const { start, end } = weekBounds(wednesday);

      // Should be Monday of that week
      expect(start.getDay()).toBe(1); // Monday = 1
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
      expect(start.getMilliseconds()).toBe(0);

      // Should be Sunday of that week
      expect(end.getDay()).toBe(0); // Sunday = 0
      expect(end.getHours()).toBe(23);
      expect(end.getMinutes()).toBe(59);
      expect(end.getSeconds()).toBe(59);
      expect(end.getMilliseconds()).toBe(999);

      // Start should be January 8, 2024 (Monday)
      expect(start.getDate()).toBe(8);
      expect(start.getMonth()).toBe(0); // January = 0

      // End should be January 14, 2024 (Sunday)
      expect(end.getDate()).toBe(14);
      expect(end.getMonth()).toBe(0);
    });

    it('should handle Monday dates correctly', () => {
      const monday = new Date('2024-01-08T10:00:00'); // Monday
      const { start, end } = weekBounds(monday);

      expect(start.getDate()).toBe(8);
      expect(start.getDay()).toBe(1);
      expect(end.getDate()).toBe(14);
      expect(end.getDay()).toBe(0);
    });

    it('should handle Sunday dates correctly', () => {
      const sunday = new Date('2024-01-14T10:00:00'); // Sunday
      const { start, end } = weekBounds(sunday);

      expect(start.getDate()).toBe(8);
      expect(start.getDay()).toBe(1);
      expect(end.getDate()).toBe(14);
      expect(end.getDay()).toBe(0);
    });

    it('should handle year boundaries correctly', () => {
      const newYearWeek = new Date('2024-01-01T10:00:00'); // Monday
      const { start, end } = weekBounds(newYearWeek);

      expect(start.getFullYear()).toBe(2024);
      expect(start.getMonth()).toBe(0);
      expect(start.getDate()).toBe(1);

      expect(end.getFullYear()).toBe(2024);
      expect(end.getMonth()).toBe(0);
      expect(end.getDate()).toBe(7);
    });
  });

  describe('formatRange', () => {
    it('should format date range in readable format', () => {
      const start = new Date('2024-01-08T00:00:00');
      const end = new Date('2024-01-14T23:59:59');
      const formatted = formatRange(start, end);

      expect(formatted).toBe('Mon 08 Jan 2024 – Sun 14 Jan 2024');
    });

    it('should handle cross-month ranges', () => {
      const start = new Date('2024-01-29T00:00:00');
      const end = new Date('2024-02-04T23:59:59');
      const formatted = formatRange(start, end);

      expect(formatted).toBe('Mon 29 Jan 2024 – Sun 04 Feb 2024');
    });

    it('should handle cross-year ranges', () => {
      const start = new Date('2023-12-25T00:00:00');
      const end = new Date('2023-12-31T23:59:59');
      const formatted = formatRange(start, end);

      expect(formatted).toBe('Mon 25 Dec 2023 – Sun 31 Dec 2023');
    });
  });

  describe('getCurrentWeek', () => {
    it('should return current week bounds', () => {
      const { start, end } = getCurrentWeek();

      expect(start).toBeInstanceOf(Date);
      expect(end).toBeInstanceOf(Date);
      expect(start.getDay()).toBe(1); // Monday
      expect(end.getDay()).toBe(0); // Sunday
      expect(start < end).toBe(true);
    });
  });

  describe('getPreviousWeek', () => {
    it('should return previous week bounds', () => {
      const currentStart = new Date('2024-01-08T00:00:00'); // Monday
      const { start, end } = getPreviousWeek(currentStart);

      expect(start.getDate()).toBe(1); // Previous Monday
      expect(start.getMonth()).toBe(0); // January
      expect(start.getDay()).toBe(1); // Monday

      expect(end.getDate()).toBe(7); // Previous Sunday
      expect(end.getDay()).toBe(0); // Sunday
    });
  });

  describe('getNextWeek', () => {
    it('should return next week bounds', () => {
      const currentStart = new Date('2024-01-08T00:00:00'); // Monday
      const { start, end } = getNextWeek(currentStart);

      expect(start.getDate()).toBe(15); // Next Monday
      expect(start.getMonth()).toBe(0); // January
      expect(start.getDay()).toBe(1); // Monday

      expect(end.getDate()).toBe(21); // Next Sunday
      expect(end.getDay()).toBe(0); // Sunday
    });
  });

  describe('isCurrentWeek', () => {
    it('should correctly identify dates in current week', () => {
      const now = new Date();
      const currentWeek = getCurrentWeek();

      // Test with current time
      expect(isCurrentWeek(now)).toBe(true);

      // Test with start of current week
      expect(isCurrentWeek(currentWeek.start)).toBe(true);

      // Test with end of current week
      expect(isCurrentWeek(currentWeek.end)).toBe(true);

      // Test with date from previous week
      const previousWeekDate = new Date(currentWeek.start);
      previousWeekDate.setDate(previousWeekDate.getDate() - 7);
      expect(isCurrentWeek(previousWeekDate)).toBe(false);

      // Test with date from next week
      const nextWeekDate = new Date(currentWeek.start);
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      expect(isCurrentWeek(nextWeekDate)).toBe(false);
    });
  });

  describe('ISO week behavior', () => {
    it('should handle ISO week correctly across different years', () => {
      // Test a date that might be tricky for ISO weeks
      const testDate = new Date('2024-12-30T10:00:00'); // Monday
      const { start, end } = weekBounds(testDate);

      expect(start.getDay()).toBe(1); // Should be Monday
      expect(end.getDay()).toBe(0); // Should be Sunday
      expect(start.getDate()).toBe(30);
      expect(end.getDate()).toBe(5); // Next week's Sunday in January
      expect(end.getMonth()).toBe(0); // January of next year
      expect(end.getFullYear()).toBe(2025);
    });
  });

  describe('DST transitions', () => {
    it('should handle DST transitions correctly', () => {
      // Test around DST transition (varies by location, but test general behavior)
      const springForward = new Date('2024-03-11T10:00:00'); // Around DST in US
      const { start, end } = weekBounds(springForward);

      expect(start.getDay()).toBe(1); // Should still be Monday
      expect(end.getDay()).toBe(0); // Should still be Sunday
      expect(start < end).toBe(true); // Start should be before end
    });
  });
});