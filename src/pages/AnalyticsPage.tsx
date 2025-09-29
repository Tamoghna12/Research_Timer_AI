import React, { useState, useMemo } from 'react';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Field from '../components/ui/Field';
import MetricCard from '../components/analytics/MetricCard';
import BarList from '../components/analytics/BarList';
import Heatmap from '../components/analytics/Heatmap';
import { useAnalytics } from '../hooks/useAnalytics';
import { formatMinutesToHHMM, toPercent } from '../utils/formatting';
import type { Range } from '../analytics/analytics';

type RangePreset = 'last7' | 'last30' | 'last90' | 'custom';

const AnalyticsPage: React.FC = () => {
  const [rangePreset, setRangePreset] = useState<RangePreset>('last30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Calculate date range based on preset
  const dateRange = useMemo((): Range | undefined => {
    const today = new Date();

    switch (rangePreset) {
      case 'last7':
        return {
          start: startOfDay(subDays(today, 6)),
          end: endOfDay(today)
        };
      case 'last30':
        return {
          start: startOfDay(subDays(today, 29)),
          end: endOfDay(today)
        };
      case 'last90':
        return {
          start: startOfDay(subDays(today, 89)),
          end: endOfDay(today)
        };
      case 'custom':
        if (customStart && customEnd) {
          return {
            start: startOfDay(new Date(customStart)),
            end: endOfDay(new Date(customEnd))
          };
        }
        return undefined;
      default:
        return undefined;
    }
  }, [rangePreset, customStart, customEnd]);

  const analytics = useAnalytics(dateRange);

  // Tooltip texts for metrics
  const tooltips = {
    totalFocusTime: 'Total Focus Time = sum of (actual minutes) for completed non-break sessions in range.',
    sessionsCompleted: 'Sessions Completed = count of sessions with status=completed (all modes).',
    avgSessionLength: 'Average Session Length = mean of actual minutes for completed non-break sessions.',
    completionRate: 'Completion Rate = % of completed non-break sessions where actual ≥ 90% of planned.'
  };

  const handleRangePresetChange = (preset: RangePreset) => {
    setRangePreset(preset);
    if (preset !== 'custom') {
      setCustomStart('');
      setCustomEnd('');
    }
  };

  return (
    <div className="transition-all duration-300">
      {/* Hero Section */}
      <div className="text-center space-y-4 p-6 pb-8">
        <h1 className="font-display text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
          Analytics
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Transparent insights from your research sessions
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Range Picker */}
        <div className="flex justify-center">
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30">
          <Field label="Time Range" htmlFor="range-select" className="w-auto">
            <div className="flex flex-wrap gap-2">
              <select
                id="range-select"
                value={rangePreset}
                onChange={(e) => handleRangePresetChange(e.target.value as RangePreset)}
                className="min-w-[140px]"
              >
                <option value="last7">Last 7 days</option>
                <option value="last30">Last 30 days</option>
                <option value="last90">Last 90 days</option>
                <option value="custom">Custom range</option>
              </select>

              {rangePreset === 'custom' && (
                <>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-36"
                    aria-label="Start date"
                  />
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-36"
                    aria-label="End date"
                  />
                </>
              )}
            </div>
          </Field>
          </div>
        </div>

      {analytics.loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              Loading analytics...
            </div>
          </CardContent>
        </Card>
      )}

      {analytics.error && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-red-600 dark:text-red-400">
              Error: {analytics.error}
            </div>
          </CardContent>
        </Card>
      )}

      {!analytics.loading && !analytics.error && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              label="Total Focus Time"
              value={formatMinutesToHHMM(analytics.totalFocusTime)}
              tooltip={tooltips.totalFocusTime}
            />
            <MetricCard
              label="Sessions Completed"
              value={analytics.sessionsCompleted}
              tooltip={tooltips.sessionsCompleted}
            />
            <MetricCard
              label="Average Session Length"
              value={`${analytics.avgSessionLength} min`}
              tooltip={tooltips.avgSessionLength}
            />
            <MetricCard
              label="Completion Rate"
              value={toPercent(analytics.completionRate)}
              tooltip={tooltips.completionRate}
            />
          </div>

          {/* Distribution Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribution by Mode */}
            <Card>
              <CardHeader>
                <h2 className="font-display text-xl font-medium">Focus Time by Mode</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Minutes spent in each focus mode
                </p>
              </CardHeader>
              <CardContent>
                <BarList
                  data={analytics.modeDistribution}
                  ariaLabel="Distribution of focus time by session mode"
                />
              </CardContent>
            </Card>

            {/* Distribution by Tag */}
            <Card>
              <CardHeader>
                <h2 className="font-display text-xl font-medium">Focus Time by Tag</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Top tags by focus time
                  <span className="block text-xs mt-1">
                    Note: Full session minutes attributed to each tag
                  </span>
                </p>
              </CardHeader>
              <CardContent>
                <BarList
                  data={analytics.tagDistribution}
                  ariaLabel="Distribution of focus time by tag"
                />
              </CardContent>
            </Card>
          </div>

          {/* Weekly Heatmap */}
          <Card>
            <CardHeader>
              <h2 className="font-display text-xl font-medium">Weekly Focus Heatmap</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Daily focus time over the last 6 weeks (Monday start)
              </p>
            </CardHeader>
            <CardContent>
              <Heatmap
                matrix={analytics.heatmapMatrix}
                rowLabels={analytics.heatmapRowLabels}
                colLabels={analytics.heatmapColLabels}
              />
            </CardContent>
          </Card>

          {/* Streaks */}
          <Card>
            <CardHeader>
              <h2 className="font-display text-xl font-medium">Focus Streaks</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Consecutive days with completed focus sessions
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {analytics.currentStreak}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Current streak
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    days in a row
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-secondary mb-2">
                    {analytics.longestStreak}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Longest streak
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    personal record
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      </div>
    </div>
  );
};

export default AnalyticsPage;