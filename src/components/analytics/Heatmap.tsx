import React from 'react';
import { formatMinutes } from '../../utils/formatting';

interface HeatmapProps {
  matrix: number[][]; // 7 x N matrix (rows = days, cols = weeks)
  rowLabels: string[]; // Day labels (Mon, Tue, etc.)
  colLabels: string[]; // Week start dates
}

const Heatmap: React.FC<HeatmapProps> = ({ matrix, rowLabels, colLabels }) => {
  if (matrix.length === 0 || matrix[0].length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No data available for heatmap
      </div>
    );
  }

  // Find max value for color intensity
  const maxValue = Math.max(...matrix.flat());

  // Get color intensity class based on value
  const getIntensityClass = (value: number): string => {
    if (value === 0) return 'bg-gray-100 dark:bg-gray-800';

    const intensity = maxValue > 0 ? value / maxValue : 0;
    if (intensity <= 0.2) return 'bg-blue-600/20';
    if (intensity <= 0.4) return 'bg-blue-600/40';
    if (intensity <= 0.6) return 'bg-blue-600/60';
    if (intensity <= 0.8) return 'bg-blue-600/80';
    return 'bg-blue-600';
  };

  // Generate screen reader summary
  const totalMinutes = matrix.flat().reduce((sum, val) => sum + val, 0);
  const activeDays = matrix.flat().filter(val => val > 0).length;

  return (
    <div role="img" aria-label="Weekly focus time heatmap" className="w-full">
      {/* Screen reader summary */}
      <div className="sr-only">
        Heatmap showing {colLabels.length} weeks of focus time data.
        Total focus time: {formatMinutes(totalMinutes)} across {activeDays} active days.
        Each cell shows minutes focused on that day.
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Focus time per day
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Less</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded bg-blue-600/20" />
            <div className="w-3 h-3 rounded bg-blue-600/40" />
            <div className="w-3 h-3 rounded bg-blue-600/60" />
            <div className="w-3 h-3 rounded bg-blue-600/80" />
            <div className="w-3 h-3 rounded bg-blue-600" />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">More</span>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Column headers (week dates) */}
          <div className="flex mb-1">
            <div className="w-12" /> {/* Space for row labels */}
            {colLabels.map((label, index) => (
              <div key={index} className="flex-1 min-w-[40px] text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 transform -rotate-45 origin-bottom-left">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Heatmap rows */}
          {matrix.map((row, dayIndex) => (
            <div key={dayIndex} className="flex items-center mb-1">
              {/* Row label (day name) */}
              <div className="w-12 text-xs text-gray-500 dark:text-gray-400 text-right pr-2">
                {rowLabels[dayIndex]}
              </div>

              {/* Day cells */}
              {row.map((value, weekIndex) => (
                <div key={weekIndex} className="flex-1 min-w-[40px] px-0.5">
                  <div
                    className={`
                      w-full h-8 rounded border border-gray-200 dark:border-gray-700
                      ${getIntensityClass(value)}
                      flex items-center justify-center cursor-help
                      hover:ring-2 hover:ring-blue-500 hover:ring-opacity-50
                      transition-all duration-200
                    `}
                    title={`${rowLabels[dayIndex]}, ${colLabels[weekIndex]}: ${formatMinutes(value)}`}
                    role="gridcell"
                    aria-label={`${rowLabels[dayIndex]}, ${colLabels[weekIndex]}: ${formatMinutes(value)} focused`}
                  >
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {value > 0 ? value : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <span className="font-medium">Total:</span> {formatMinutes(totalMinutes)}
        </div>
        <div>
          <span className="font-medium">Active days:</span> {activeDays}
        </div>
        <div>
          <span className="font-medium">Best day:</span> {formatMinutes(maxValue)}
        </div>
      </div>
    </div>
  );
};

export default Heatmap;