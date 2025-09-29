import React, { useState } from 'react';
import Card, { CardContent } from '../ui/Card';

interface MetricCardProps {
  label: string;
  value: string | number;
  tooltip: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <Card className="relative">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {label}
            </p>
            <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">
              {value}
            </p>
          </div>
          <div className="relative">
            <button
              className="ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              aria-describedby={`tooltip-${label.replace(/\s+/g, '-').toLowerCase()}`}
            >
              <span className="material-icons text-sm">info</span>
              <span className="sr-only">Show formula for {label}</span>
            </button>

            {showTooltip && (
              <div
                id={`tooltip-${label.replace(/\s+/g, '-').toLowerCase()}`}
                className="absolute right-0 top-8 z-10 w-72 p-3 text-xs bg-gray-900 text-white rounded-lg shadow-lg border border-gray-700"
                role="tooltip"
              >
                <div className="mb-2 font-medium text-gray-200">Formula:</div>
                <div className="text-gray-300 leading-relaxed">{tooltip}</div>
                {/* Arrow pointing up */}
                <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 border-l border-t border-gray-700 transform rotate-45"></div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;