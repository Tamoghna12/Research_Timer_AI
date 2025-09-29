import { useMemo } from 'react';
import { startOfWeek, addWeeks, format } from 'date-fns';
import { useSessions } from './useSessions';
import {
  totalFocusTime,
  sessionsCompleted,
  avgSessionLength,
  completionRate,
  distributionByMode,
  distributionByTag,
  weeklyHeatmap,
  streaks,
  type Range
} from '../analytics/analytics';

export interface AnalyticsData {
  // KPIs
  totalFocusTime: number;
  sessionsCompleted: number;
  avgSessionLength: number;
  completionRate: number;

  // Distributions
  modeDistribution: Array<{ label: string; value: number }>;
  tagDistribution: Array<{ label: string; value: number }>;

  // Heatmap data
  heatmapMatrix: number[][];
  heatmapRowLabels: string[];
  heatmapColLabels: string[];

  // Streaks
  currentStreak: number;
  longestStreak: number;

  // Meta
  loading: boolean;
  error: string | null;
}

export function useAnalytics(range?: Range): AnalyticsData {
  const { sessions, loading, error } = useSessions({});

  // Memoize calculations to prevent unnecessary recalculations
  const analyticsData = useMemo(() => {
    if (loading || error || !sessions) {
      return {
        totalFocusTime: 0,
        sessionsCompleted: 0,
        avgSessionLength: 0,
        completionRate: 0,
        modeDistribution: [],
        tagDistribution: [],
        heatmapMatrix: [],
        heatmapRowLabels: [],
        heatmapColLabels: [],
        currentStreak: 0,
        longestStreak: 0
      };
    }

    // Calculate KPIs
    const focusTime = totalFocusTime(sessions, range);
    const completedSessions = sessionsCompleted(sessions, range);
    const avgLength = avgSessionLength(sessions, range);
    const completion = completionRate(sessions, range);

    // Calculate distributions
    const modeDistrib = distributionByMode(sessions, range);
    const modeData = Object.entries(modeDistrib)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    const [topTags, otherMinutes] = distributionByTag(sessions, range, 10);
    const tagData = Object.entries(topTags)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    // Add "Other" if there are aggregated minutes
    if (otherMinutes > 0) {
      tagData.push({ label: 'Other', value: otherMinutes });
    }

    // Calculate heatmap data (6 weeks)
    const weeks = 6;
    const matrix = weeklyHeatmap(sessions, weeks);
    const rowLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Generate column labels (week start dates)
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
    const colLabels = Array.from({ length: weeks }, (_, i) => {
      const weekStart = addWeeks(startOfCurrentWeek, -(weeks - 1 - i));
      return format(weekStart, 'M/d');
    });

    // Calculate streaks
    const { current: currentStreak, longest: longestStreak } = streaks(sessions);

    return {
      totalFocusTime: focusTime,
      sessionsCompleted: completedSessions,
      avgSessionLength: avgLength,
      completionRate: completion,
      modeDistribution: modeData,
      tagDistribution: tagData,
      heatmapMatrix: matrix,
      heatmapRowLabels: rowLabels,
      heatmapColLabels: colLabels,
      currentStreak,
      longestStreak
    };
  }, [sessions, range, loading, error]);

  return {
    ...analyticsData,
    loading,
    error
  };
}