import React from 'react';
import { formatMinutes } from '../../utils/formatting';

interface BarListProps {
  data: Array<{ label: string; value: number }>;
  ariaLabel: string;
}

const BarList: React.FC<BarListProps> = ({ data, ariaLabel }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  // Find max value for percentage calculations
  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <div role="img" aria-label={ariaLabel} className="space-y-3">
      {/* Screen reader summary */}
      <div className="sr-only">
        Distribution showing {data.length} items.
        {data.map((item, index) => (
          `${item.label}: ${formatMinutes(item.value)}${index < data.length - 1 ? ', ' : ''}`
        )).join('')}
      </div>

      {data.map((item, index) => {
        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;

        return (
          <div key={`${item.label}-${index}`} className="flex items-center space-x-3">
            {/* Label */}
            <div className="w-20 text-sm text-gray-600 dark:text-gray-400 text-right flex-shrink-0">
              {item.label}
            </div>

            {/* Bar container */}
            <div className="flex-1 relative">
              <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${percentage}%` }}
                  role="progressbar"
                  aria-valuenow={item.value}
                  aria-valuemax={maxValue}
                  aria-label={`${item.label}: ${formatMinutes(item.value)}`}
                />
              </div>

              {/* Value label overlaid on bar */}
              <div className="absolute inset-0 flex items-center px-3">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {formatMinutes(item.value)}
                </span>
              </div>
            </div>

            {/* Percentage */}
            <div className="w-12 text-xs text-gray-500 dark:text-gray-400 text-right flex-shrink-0">
              {maxValue > 0 ? Math.round(percentage) : 0}%
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BarList;