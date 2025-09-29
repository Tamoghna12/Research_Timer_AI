import { describe, it, expect } from 'vitest';
import { addDays, subDays, startOfDay } from 'date-fns';
import {
  inRange,
  actualMs,
  focusSessions,
  totalFocusTime,
  sessionsCompleted,
  avgSessionLength,
  completionRate,
  distributionByMode,
  distributionByTag,
  weeklyHeatmap,
  streaks,
  type Range
} from './analytics';
import type { Session } from '../data/types';

// Helper to create test sessions
function createSession(overrides: Partial<Session>): Session {
  const baseSession: Session = {
    id: 'test-id',
    mode: 'deep',
    plannedMs: 25 * 60 * 1000, // 25 minutes
    startedAt: Date.now(),
    endedAt: Date.now() + 25 * 60 * 1000,
    status: 'completed',
    goal: 'Test goal',
    notes: 'Test notes',
    tags: [],
    link: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  return { ...baseSession, ...overrides };
}

describe('Analytics Functions', () => {
  describe('inRange', () => {
    it('returns true for timestamps within range', () => {
      const range: Range = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      expect(inRange(new Date('2024-01-15').getTime(), range)).toBe(true);
      expect(inRange(new Date('2024-01-01').getTime(), range)).toBe(true); // inclusive start
      expect(inRange(new Date('2024-01-31').getTime(), range)).toBe(true); // inclusive end
    });

    it('returns false for timestamps outside range', () => {
      const range: Range = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      expect(inRange(new Date('2023-12-31').getTime(), range)).toBe(false);
      expect(inRange(new Date('2024-02-01').getTime(), range)).toBe(false);
    });
  });

  describe('actualMs', () => {
    it('calculates actual duration for completed sessions', () => {
      const session = createSession({
        startedAt: 1000000,
        endedAt: 1030000, // 30 seconds
        status: 'completed'
      });

      expect(actualMs(session)).toBe(30000);
    });

    it('returns 0 for incomplete sessions', () => {
      const session = createSession({
        startedAt: 1000000,
        endedAt: undefined,
        status: 'running'
      });

      expect(actualMs(session)).toBe(0);
    });

    it('returns 0 for cancelled sessions even with endedAt', () => {
      const session = createSession({
        startedAt: 1000000,
        endedAt: 1030000,
        status: 'cancelled'
      });

      expect(actualMs(session)).toBe(0);
    });
  });

  describe('focusSessions', () => {
    it('filters to non-break completed sessions', () => {
      const sessions = [
        createSession({ mode: 'deep', status: 'completed' }),
        createSession({ mode: 'break', status: 'completed' }), // excluded: break
        createSession({ mode: 'lit', status: 'cancelled' }), // excluded: not completed
        createSession({ mode: 'writing', status: 'completed' }),
        createSession({ mode: 'analysis', status: 'running' }) // excluded: not completed
      ];

      const filtered = focusSessions(sessions);
      expect(filtered).toHaveLength(2);
      expect(filtered[0].mode).toBe('deep');
      expect(filtered[1].mode).toBe('writing');
    });
  });

  describe('totalFocusTime', () => {
    it('sums minutes for completed non-break sessions', () => {
      const sessions = [
        createSession({
          mode: 'deep',
          startedAt: 0,
          endedAt: 25 * 60 * 1000, // 25 minutes
          status: 'completed'
        }),
        createSession({
          mode: 'lit',
          startedAt: 0,
          endedAt: 30 * 60 * 1000, // 30 minutes
          status: 'completed'
        }),
        createSession({
          mode: 'break', // excluded
          startedAt: 0,
          endedAt: 15 * 60 * 1000,
          status: 'completed'
        })
      ];

      expect(totalFocusTime(sessions)).toBe(55); // 25 + 30 minutes
    });

    it('respects date range filter', () => {
      const sessions = [
        createSession({
          startedAt: new Date('2024-01-15').getTime(),
          endedAt: new Date('2024-01-15').getTime() + 25 * 60 * 1000,
          status: 'completed'
        }),
        createSession({
          startedAt: new Date('2024-02-15').getTime(), // outside range
          endedAt: new Date('2024-02-15').getTime() + 30 * 60 * 1000,
          status: 'completed'
        })
      ];

      const range: Range = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      expect(totalFocusTime(sessions, range)).toBe(25);
    });

    it('rounds milliseconds to whole minutes', () => {
      const sessions = [
        createSession({
          startedAt: 0,
          endedAt: 25.7 * 60 * 1000, // 25.7 minutes
          status: 'completed'
        })
      ];

      expect(totalFocusTime(sessions)).toBe(26); // rounded up
    });
  });

  describe('sessionsCompleted', () => {
    it('counts all completed sessions including breaks', () => {
      const sessions = [
        createSession({ status: 'completed', mode: 'deep' }),
        createSession({ status: 'completed', mode: 'break' }),
        createSession({ status: 'cancelled', mode: 'lit' }),
        createSession({ status: 'running', mode: 'writing' })
      ];

      expect(sessionsCompleted(sessions)).toBe(2);
    });

    it('respects date range filter', () => {
      const sessions = [
        createSession({
          startedAt: new Date('2024-01-15').getTime(),
          status: 'completed'
        }),
        createSession({
          startedAt: new Date('2024-02-15').getTime(),
          status: 'completed'
        })
      ];

      const range: Range = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      expect(sessionsCompleted(sessions, range)).toBe(1);
    });
  });

  describe('avgSessionLength', () => {
    it('calculates average for focus sessions', () => {
      const sessions = [
        createSession({
          startedAt: 0,
          endedAt: 20 * 60 * 1000, // 20 minutes
          status: 'completed',
          mode: 'deep'
        }),
        createSession({
          startedAt: 0,
          endedAt: 30 * 60 * 1000, // 30 minutes
          status: 'completed',
          mode: 'lit'
        })
      ];

      expect(avgSessionLength(sessions)).toBe(25.0); // (20 + 30) / 2
    });

    it('returns 0 for empty dataset', () => {
      expect(avgSessionLength([])).toBe(0);
    });

    it('excludes break sessions', () => {
      const sessions = [
        createSession({
          startedAt: 0,
          endedAt: 20 * 60 * 1000,
          status: 'completed',
          mode: 'deep'
        }),
        createSession({
          startedAt: 0,
          endedAt: 60 * 60 * 1000, // excluded break
          status: 'completed',
          mode: 'break'
        })
      ];

      expect(avgSessionLength(sessions)).toBe(20.0);
    });

    it('rounds to 1 decimal place', () => {
      const sessions = [
        createSession({
          startedAt: 0,
          endedAt: 25.33 * 60 * 1000,
          status: 'completed'
        })
      ];

      expect(avgSessionLength(sessions)).toBe(25.3);
    });
  });

  describe('completionRate', () => {
    it('calculates percentage of well-completed sessions', () => {
      const sessions = [
        createSession({
          plannedMs: 25 * 60 * 1000,
          startedAt: 0,
          endedAt: 25 * 60 * 1000, // exactly planned (100%)
          status: 'completed'
        }),
        createSession({
          plannedMs: 25 * 60 * 1000,
          startedAt: 0,
          endedAt: 23 * 60 * 1000, // 92% - above threshold
          status: 'completed'
        }),
        createSession({
          plannedMs: 25 * 60 * 1000,
          startedAt: 0,
          endedAt: 22 * 60 * 1000, // 88% - below threshold
          status: 'completed'
        })
      ];

      expect(completionRate(sessions)).toBe(67); // 2/3 = 66.67% rounded to 67%
    });

    it('tests exact 90% threshold', () => {
      const sessions = [
        createSession({
          plannedMs: 25 * 60 * 1000,
          startedAt: 0,
          endedAt: 22.5 * 60 * 1000, // exactly 90%
          status: 'completed'
        })
      ];

      expect(completionRate(sessions)).toBe(100);
    });

    it('tests 89.9% below threshold', () => {
      const sessions = [
        createSession({
          plannedMs: 25 * 60 * 1000,
          startedAt: 0,
          endedAt: 22.475 * 60 * 1000, // 89.9%
          status: 'completed'
        })
      ];

      expect(completionRate(sessions)).toBe(0);
    });

    it('returns 0 for empty dataset', () => {
      expect(completionRate([])).toBe(0);
    });
  });

  describe('distributionByMode', () => {
    it('groups minutes by mode', () => {
      const sessions = [
        createSession({
          mode: 'lit',
          startedAt: 0,
          endedAt: 25 * 60 * 1000,
          status: 'completed'
        }),
        createSession({
          mode: 'lit',
          startedAt: 0,
          endedAt: 30 * 60 * 1000,
          status: 'completed'
        }),
        createSession({
          mode: 'deep',
          startedAt: 0,
          endedAt: 45 * 60 * 1000,
          status: 'completed'
        })
      ];

      const distribution = distributionByMode(sessions);
      expect(distribution).toEqual({
        lit: 55, // 25 + 30
        deep: 45
      });
    });

    it('excludes break sessions', () => {
      const sessions = [
        createSession({
          mode: 'lit',
          startedAt: 0,
          endedAt: 25 * 60 * 1000,
          status: 'completed'
        }),
        createSession({
          mode: 'break',
          startedAt: 0,
          endedAt: 15 * 60 * 1000,
          status: 'completed'
        })
      ];

      const distribution = distributionByMode(sessions);
      expect(distribution).toEqual({ lit: 25 });
    });
  });

  describe('distributionByTag', () => {
    it('attributes full minutes to each tag', () => {
      const sessions = [
        createSession({
          tags: ['#research', '#analysis'],
          startedAt: 0,
          endedAt: 30 * 60 * 1000, // 30 minutes
          status: 'completed'
        }),
        createSession({
          tags: ['#research'],
          startedAt: 0,
          endedAt: 20 * 60 * 1000, // 20 minutes
          status: 'completed'
        })
      ];

      const [distribution, other] = distributionByTag(sessions);
      expect(distribution).toEqual({
        '#research': 50, // 30 + 20 (attributed to both sessions)
        '#analysis': 30  // 30 (attributed to first session)
      });
      expect(other).toBe(0);
    });

    it('handles top N limiting and other aggregation', () => {
      const sessions = Array.from({ length: 15 }, (_, i) =>
        createSession({
          tags: [`#tag${i}`],
          startedAt: 0,
          endedAt: (i + 1) * 60 * 1000, // varying minutes
          status: 'completed'
        })
      );

      const [topTags, otherMinutes] = distributionByTag(sessions, undefined, 5);
      expect(Object.keys(topTags)).toHaveLength(5);
      expect(otherMinutes).toBeGreaterThan(0);

      // Top tags should be the ones with most minutes (tag14, tag13, etc.)
      expect(topTags['#tag14']).toBe(15);
      expect(topTags['#tag13']).toBe(14);
    });
  });

  describe('weeklyHeatmap', () => {
    it('creates 7xN matrix with correct day positioning', () => {
      const today = startOfDay(new Date());
      const sessions = [
        createSession({
          startedAt: today.getTime(),
          endedAt: today.getTime() + 30 * 60 * 1000, // 30 minutes today
          status: 'completed'
        }),
        createSession({
          startedAt: subDays(today, 1).getTime(),
          endedAt: subDays(today, 1).getTime() + 45 * 60 * 1000, // 45 minutes yesterday
          status: 'completed'
        })
      ];

      const matrix = weeklyHeatmap(sessions, 2);
      expect(matrix).toHaveLength(7); // 7 days
      expect(matrix[0]).toHaveLength(2); // 2 weeks

      // Should have non-zero values for days with sessions
      const flatValues = matrix.flat();
      const totalMinutes = flatValues.reduce((sum, val) => sum + val, 0);
      expect(totalMinutes).toBe(75); // 30 + 45
    });

    it('excludes break sessions', () => {
      const today = startOfDay(new Date());
      const sessions = [
        createSession({
          mode: 'break',
          startedAt: today.getTime(),
          endedAt: today.getTime() + 30 * 60 * 1000,
          status: 'completed'
        })
      ];

      const matrix = weeklyHeatmap(sessions, 1);
      const totalMinutes = matrix.flat().reduce((sum, val) => sum + val, 0);
      expect(totalMinutes).toBe(0);
    });
  });

  describe('streaks', () => {
    it('calculates current streak counting back from today', () => {
      const today = startOfDay(new Date());
      const sessions = [
        createSession({
          startedAt: today.getTime(),
          status: 'completed'
        }),
        createSession({
          startedAt: subDays(today, 1).getTime(),
          status: 'completed'
        }),
        createSession({
          startedAt: subDays(today, 2).getTime(),
          status: 'completed'
        }),
        // Gap here
        createSession({
          startedAt: subDays(today, 4).getTime(),
          status: 'completed'
        })
      ];

      const { current } = streaks(sessions);
      expect(current).toBe(3); // Today, yesterday, day before yesterday
    });

    it('calculates longest streak in history', () => {
      const baseDate = startOfDay(new Date('2024-01-01'));
      const sessions = [
        // First streak: 3 days
        createSession({ startedAt: baseDate.getTime(), status: 'completed' }),
        createSession({ startedAt: addDays(baseDate, 1).getTime(), status: 'completed' }),
        createSession({ startedAt: addDays(baseDate, 2).getTime(), status: 'completed' }),

        // Gap

        // Second streak: 4 days (longer)
        createSession({ startedAt: addDays(baseDate, 5).getTime(), status: 'completed' }),
        createSession({ startedAt: addDays(baseDate, 6).getTime(), status: 'completed' }),
        createSession({ startedAt: addDays(baseDate, 7).getTime(), status: 'completed' }),
        createSession({ startedAt: addDays(baseDate, 8).getTime(), status: 'completed' })
      ];

      const result = streaks(sessions);
      expect(result.longest).toBe(4);
    });

    it('returns zeros for no sessions', () => {
      const { current, longest } = streaks([]);
      expect(current).toBe(0);
      expect(longest).toBe(0);
    });

    it('excludes break sessions from streaks', () => {
      const today = startOfDay(new Date());
      const sessions = [
        createSession({
          mode: 'break',
          startedAt: today.getTime(),
          status: 'completed'
        })
      ];

      const { current, longest } = streaks(sessions);
      expect(current).toBe(0);
      expect(longest).toBe(0);
    });

    it('handles multiple sessions on same day', () => {
      const today = startOfDay(new Date());
      const sessions = [
        createSession({
          startedAt: today.getTime(),
          status: 'completed'
        }),
        createSession({
          startedAt: today.getTime() + 60 * 60 * 1000, // 1 hour later same day
          status: 'completed'
        })
      ];

      const { current, longest } = streaks(sessions);
      expect(current).toBe(1); // Same day counts as 1 day streak
      expect(longest).toBe(1);
    });
  });
});