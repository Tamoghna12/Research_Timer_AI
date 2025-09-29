import { startOfWeek, endOfWeek, format, addWeeks, subWeeks } from 'date-fns';

/**
 * Get the start and end of an ISO week (Monday-Sunday) for a given date
 * Uses local time consistently to avoid timezone issues
 */
export function weekBounds(date: Date): { start: Date; end: Date } {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday = 1
  const end = endOfWeek(date, { weekStartsOn: 1 });

  // Ensure end is at 23:59:59.999
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Format a date range in a readable format
 * e.g., "Mon 15 Sep 2025 – Sun 21 Sep 2025"
 */
export function formatRange(start: Date, end: Date): string {
  const startStr = format(start, 'EEE dd MMM yyyy');
  const endStr = format(end, 'EEE dd MMM yyyy');
  return `${startStr} – ${endStr}`;
}

/**
 * Get the current week bounds
 */
export function getCurrentWeek(): { start: Date; end: Date } {
  return weekBounds(new Date());
}

/**
 * Get the previous week bounds
 */
export function getPreviousWeek(currentStart: Date): { start: Date; end: Date } {
  return weekBounds(subWeeks(currentStart, 1));
}

/**
 * Get the next week bounds
 */
export function getNextWeek(currentStart: Date): { start: Date; end: Date } {
  return weekBounds(addWeeks(currentStart, 1));
}

/**
 * Check if a date is within the current week
 */
export function isCurrentWeek(date: Date): boolean {
  const current = getCurrentWeek();
  return date >= current.start && date <= current.end;
}

/**
 * Format just the week start date for display
 */
export function formatWeekStart(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}