import React, { useState } from 'react'
import Card, { CardContent, CardHeader } from '../components/ui/Card'

const Analytics: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState('30days')

  // TODO: Connect to analytics helpers and data
  const kpis = [
    { label: 'Total Focus Time', value: '24.5h', icon: 'schedule' },
    { label: 'Sessions Completed', value: '18', icon: 'check_circle' },
    { label: 'Average Session', value: '42min', icon: 'trending_up' },
    { label: 'Completion Rate', value: '85%', icon: 'percent' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-semibold text-gray-800 dark:text-gray-200">
          Analytics
        </h1>

        <div className="flex gap-2">
          {['7days', '30days', '90days'].map((range) => (
            <button
              key={range}
              onClick={() => setSelectedRange(range)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {range === '7days' && 'Last 7 Days'}
              {range === '30days' && 'Last 30 Days'}
              {range === '90days' && 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="py-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {kpi.label}
                  </div>
                  <div className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-1">
                    {kpi.value}
                  </div>
                </div>
                <div className="ml-4">
                  <span
                    className="material-icons text-blue-600 text-2xl"
                    title={kpi.label}
                  >
                    {kpi.icon}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribution by Mode */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl font-medium">Distribution by Mode</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* TODO: Connect to chart components and helpers */}
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <span className="material-icons text-4xl mb-2 block">
                  bar_chart
                </span>
                <div>Bar chart visualization placeholder</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Tags */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl font-medium">Top Tags</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* TODO: Connect to data and tag analytics */}
            <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <span className="material-icons text-4xl mb-2 block">
                  label
                </span>
                <div>Tag frequency visualization placeholder</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Focus Heatmap */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl font-medium">Weekly Focus Heatmap</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* TODO: Connect to heatmap component and data */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }, (_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-sm bg-gray-100 dark:bg-gray-800"
                  title={`Day ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Less</span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm ${
                      i === 0 ? 'bg-gray-200 dark:bg-gray-700' :
                      i === 1 ? 'bg-blue-600/30' :
                      i === 2 ? 'bg-blue-600/50' :
                      i === 3 ? 'bg-blue-600/75' :
                      'bg-blue-600'
                    }`}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Analytics