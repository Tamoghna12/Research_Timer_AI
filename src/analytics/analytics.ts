import { startOfDay, endOfDay, startOfWeek, addWeeks, differenceInDays, format, isAfter, isBefore } from 'date-fns';
import type { Session } from '../data/types';

export type Range = { start: Date; end: Date };
export type Distribution = Record<string, number>; // minutes per key

/**
 * Check if timestamp is within range (inclusive)
 */
export function inRange(ts: number, range: Range): boolean {
  const date = new Date(ts);
  return !isBefore(date, range.start) && !isAfter(date, range.end);
}

/**
 * Calculate actual duration in milliseconds for a session
 * Returns 0 for incomplete sessions (no endedAt)
 */
export function actualMs(session: Session): number {
  if (!session.endedAt || session.status !== 'completed') {
    return 0;
  }
  return session.endedAt - session.startedAt;
}

/**
 * Filter to focus sessions: non-break sessions with status === 'completed'
 */
export function focusSessions(sessions: Session[]): Session[] {
  return sessions.filter(s => s.mode !== 'break' && s.status === 'completed');
}

/**
 * Total focus time in minutes for completed non-break sessions
 */
export function totalFocusTime(sessions: Session[], range?: Range): number {
  const filtered = focusSessions(sessions)
    .filter(s => !range || inRange(s.startedAt, range));

  const totalMs = filtered.reduce((sum, session) => sum + actualMs(session), 0);
  return Math.round(totalMs / 60000); // Convert ms to minutes, rounded
}

/**
 * Count of completed sessions (all modes) in range
 */
export function sessionsCompleted(sessions: Session[], range?: Range): number {
  return sessions
    .filter(s => s.status === 'completed')
    .filter(s => !range || inRange(s.startedAt, range))
    .length;
}

/**
 * Average session length in minutes for completed non-break sessions
 * Returns 0 if no sessions, otherwise rounded to 1 decimal place
 */
export function avgSessionLength(sessions: Session[], range?: Range): number {
  const filtered = focusSessions(sessions)
    .filter(s => !range || inRange(s.startedAt, range));

  if (filtered.length === 0) return 0;

  const totalMs = filtered.reduce((sum, session) => sum + actualMs(session), 0);
  const avgMs = totalMs / filtered.length;
  return Math.round((avgMs / 60000) * 10) / 10; // Convert to minutes, 1 decimal
}

/**
 * Completion rate: % of completed non-break sessions where actual >= 90% of planned
 * Only considers sessions with status === 'completed'
 */
export function completionRate(sessions: Session[], range?: Range): number {
  const filtered = focusSessions(sessions)
    .filter(s => !range || inRange(s.startedAt, range));

  if (filtered.length === 0) return 0;

  const wellCompleted = filtered.filter(session => {
    const actual = actualMs(session);
    const planned = session.plannedMs;
    return actual >= 0.9 * planned;
  });

  return Math.round((wellCompleted.length / filtered.length) * 100);
}

/**
 * Distribution of focus time by mode in minutes
 */
export function distributionByMode(sessions: Session[], range?: Range): Distribution {
  const filtered = focusSessions(sessions)
    .filter(s => !range || inRange(s.startedAt, range));

  const distribution: Distribution = {};

  filtered.forEach(session => {
    const minutes = Math.round(actualMs(session) / 60000);
    distribution[session.mode] = (distribution[session.mode] || 0) + minutes;
  });

  return distribution;
}

/**
 * Distribution of focus time by tag in minutes
 * Returns [topTags, otherMinutes] where topTags has <= topN keys
 * Attribution rule: Full minutes attributed to each tag (session minutes counted once per tag)
 */
export function distributionByTag(sessions: Session[], range?: Range, topN = 10): [Distribution, number] {
  const filtered = focusSessions(sessions)
    .filter(s => !range || inRange(s.startedAt, range));

  const distribution: Distribution = {};

  filtered.forEach(session => {
    const minutes = Math.round(actualMs(session) / 60000);
    session.tags.forEach(tag => {
      distribution[tag] = (distribution[tag] || 0) + minutes;
    });
  });

  // Sort by minutes descending and take top N
  const sorted = Object.entries(distribution).sort((a, b) => b[1] - a[1]);
  const topTags: Distribution = {};
  let otherMinutes = 0;

  sorted.forEach(([tag, minutes], index) => {
    if (index < topN) {
      topTags[tag] = minutes;
    } else {
      otherMinutes += minutes;
    }
  });

  return [topTags, otherMinutes];
}

/**
 * Weekly heatmap: Matrix 7 x weeks (Monday-Sunday rows)
 * Values = minutes focused per day, last column = current week
 * Uses Monday as week start (ISO week)
 */
export function weeklyHeatmap(sessions: Session[], weeks: number): number[][] {
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday start

  // Create matrix: 7 rows (Mon-Sun), weeks columns
  const matrix: number[][] = Array(7).fill(null).map(() => Array(weeks).fill(0));

  // Get focus sessions
  const filtered = focusSessions(sessions);

  filtered.forEach(session => {
    const sessionDate = new Date(session.startedAt);
    const dayOfWeek = (sessionDate.getDay() + 6) % 7; // Convert to Mon=0, Tue=1, ..., Sun=6

    // Find which week column this session belongs to
    for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
      const weekStart = startOfWeek(addWeeks(startOfCurrentWeek, -(weeks - 1 - weekIndex)), { weekStartsOn: 1 });
      const weekEnd = endOfDay(addWeeks(weekStart, 1));

      if (sessionDate >= weekStart && sessionDate < weekEnd) {
        const minutes = Math.round(actualMs(session) / 60000);
        matrix[dayOfWeek][weekIndex] += minutes;
        break;
      }
    }
  });

  return matrix;
}

/**
 * Calculate current and longest streaks
 * Streak = consecutive calendar days with >= 1 completed non-break session
 * Current counts back from today; longest over entire history
 */
export function streaks(sessions: Session[]): { current: number; longest: number } {
  const filtered = focusSessions(sessions);

  if (filtered.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Get unique days with sessions (using local dates)
  const daysWithSessions = new Set<string>();
  filtered.forEach(session => {
    const dateStr = format(startOfDay(new Date(session.startedAt)), 'yyyy-MM-dd');
    daysWithSessions.add(dateStr);
  });

  // Calculate current streak counting back from today
  let current = 0;
  const today = startOfDay(new Date());
  let checkDate = today;

  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd');
    if (daysWithSessions.has(dateStr)) {
      current++;
      checkDate = new Date(checkDate);
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak in history
  const sortedDays = Array.from(daysWithSessions).sort();
  let longest = 0;
  let currentStreak = 0;

  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      currentStreak = 1;
    } else {
      const prevDate = new Date(sortedDays[i - 1]);
      const currDate = new Date(sortedDays[i]);
      const daysDiff = differenceInDays(currDate, prevDate);

      if (daysDiff === 1) {
        currentStreak++;
      } else {
        longest = Math.max(longest, currentStreak);
        currentStreak = 1;
      }
    }
  }
  longest = Math.max(longest, currentStreak);

  return { current, longest };
}