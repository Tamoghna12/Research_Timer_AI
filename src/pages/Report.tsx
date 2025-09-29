import React, { useMemo } from 'react'
import Card, { CardContent, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useSessions } from '../hooks/useSessions'
import { totalFocusTime, sessionsCompleted, completionRate, distributionByTag } from '../analytics/analytics'
import { TIMER_PRESETS } from '../data/types'
import { millisecondsToMinutes } from '../utils/time'
import { startOfWeek, endOfWeek, format } from 'date-fns'

const Report: React.FC = () => {
  // Get current week range
  const weekRange = useMemo(() => {
    const now = new Date()
    const start = startOfWeek(now, { weekStartsOn: 1 }) // Monday start
    const end = endOfWeek(now, { weekStartsOn: 1 })
    return {
      from: start,
      to: end,
      display: `${format(start, 'EEE dd MMM')} — ${format(end, 'EEE dd MMM')}`
    }
  }, [])

  const { sessions, loading } = useSessions({
    dateRange: { from: weekRange.from, to: weekRange.to }
  })

  // Calculate analytics for this week
  const analytics = useMemo(() => {
    const range = { start: weekRange.from, end: weekRange.to }
    return {
      sessionCount: sessionsCompleted(sessions, range),
      focusTime: totalFocusTime(sessions, range),
      completionRate: completionRate(sessions, range),
      topTags: distributionByTag(sessions, range, 3)[0]
    }
  }, [sessions, weekRange])

  // Sessions with AI summaries or highlights
  const highlightedSessions = useMemo(() => {
    return sessions
      .filter(s => s.status === 'completed')
      .filter(s => s.aiSummary || s.journal || s.notes)
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, 10) // Top 10 sessions
  }, [sessions])

  const generateMarkdownReport = () => {
    const topFocusAreas = Object.entries(analytics.topTags)
      .map(([tag, minutes]) => `- ${tag}: ${(minutes / 60).toFixed(1)}h`)
      .join('\n')

    const sessionHighlights = highlightedSessions.map(session => {
      const preset = TIMER_PRESETS.find(p => p.id === session.mode)

      let content = `### ${preset?.name || session.mode} - ${format(new Date(session.startedAt), 'MMM dd')}\n\n`
      content += `**Goal:** ${session.goal || 'No goal specified'}\n\n`

      if (session.aiSummary) {
        content += `**AI Summary:**\n${session.aiSummary}\n\n`
      } else if (session.notes) {
        content += `**Notes:**\n${session.notes}\n\n`
      }

      return content
    }).join('\n')

    const report = `# Weekly Research Report

**Week:** ${weekRange.display}

## Summary

- **Sessions Completed:** ${analytics.sessionCount}
- **Total Focus Time:** ${(analytics.focusTime / 60).toFixed(1)} hours
- **Completion Rate:** ${analytics.completionRate}%

## Top Focus Areas

${topFocusAreas}

## Session Highlights

${sessionHighlights}
`

    return report
  }

  const handleCopyMarkdown = async () => {
    const markdown = generateMarkdownReport()
    try {
      await navigator.clipboard.writeText(markdown)
      // Could show a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const handleDownloadMarkdown = () => {
    const markdown = generateMarkdownReport()
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `weekly-report-${format(weekRange.from, 'yyyy-MM-dd')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="transition-all duration-300">
      {/* Hero Section */}
      <div className="text-center space-y-4 p-6 pb-8">
        <h1 className="font-display text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
          Weekly Report
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {weekRange.display}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Actions */}
        <div className="flex justify-center">
          <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30 flex gap-2">
          <Button
            variant="ghost"
            leftIcon="content_copy"
            onClick={handleCopyMarkdown}
          >
            Copy Markdown
          </Button>
          <Button
            variant="secondary"
            leftIcon="download"
            onClick={handleDownloadMarkdown}
          >
            Download .md
          </Button>
          <Button
            variant="secondary"
            leftIcon="print"
            onClick={handlePrint}
          >
            Print
          </Button>
          </div>
        </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Summary</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              Loading analytics...
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl font-semibold text-blue-600">{analytics.sessionCount}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Sessions</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-blue-600">{(analytics.focusTime / 60).toFixed(1)}h</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Focus Time</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-blue-600">{analytics.completionRate}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Highlights */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Highlights</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              Loading highlights...
            </div>
          ) : highlightedSessions.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No completed sessions this week yet.
            </div>
          ) : (
            <div className="space-y-4">
              {highlightedSessions.slice(0, 5).map(session => {
                const preset = TIMER_PRESETS.find(p => p.id === session.mode)
                const duration = session.endedAt ? millisecondsToMinutes(session.endedAt - session.startedAt) : 0

                return (
                  <div key={session.id} className="border-l-4 border-blue-600 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium">
                        {preset?.name || session.mode} - {format(new Date(session.startedAt), 'MMM dd')}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {duration}m
                      </div>
                      {session.aiSummary && (
                        <div className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          AI-assisted
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {session.goal || 'No goal specified'}
                    </div>
                    {session.aiSummary ? (
                      <div className="text-sm text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert prose-p:my-0 prose-ul:my-0 prose-li:my-0">
                        {session.aiSummary.split('\n').map((line: string, i: number) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    ) : session.notes ? (
                      <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {session.notes}
                      </div>
                    ) : null}
                  </div>
                )
              })}

              {Object.keys(analytics.topTags).length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">Top Focus Areas</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(analytics.topTags).map(([tag, minutes]) => (
                      <div key={tag} className="px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {tag}: {(minutes / 60).toFixed(1)}h
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Log */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Session Log</h2>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No sessions completed this week yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-gray-600">
                    <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Date</th>
                    <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Mode</th>
                    <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Goal</th>
                    <th className="text-right py-2 font-medium text-gray-700 dark:text-gray-300">Duration</th>
                    <th className="text-center py-2 font-medium text-gray-700 dark:text-gray-300">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions
                    .filter(s => s.status === 'completed')
                    .sort((a, b) => b.startedAt - a.startedAt)
                    .map(session => {
                      const preset = TIMER_PRESETS.find(p => p.id === session.mode)
                      const duration = session.endedAt ? millisecondsToMinutes(session.endedAt - session.startedAt) : 0

                      return (
                        <tr key={session.id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2 text-gray-600 dark:text-gray-400">
                            {format(new Date(session.startedAt), 'MMM dd')}
                          </td>
                          <td className="py-2">{preset?.name || session.mode}</td>
                          <td className="py-2 max-w-xs truncate">
                            {session.goal || 'No goal specified'}
                          </td>
                          <td className="py-2 text-right font-mono">{duration}m</td>
                          <td className="py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {session.link && (
                                <span className="material-icons text-xs text-gray-400" title="Has link">
                                  link
                                </span>
                              )}
                              {session.aiSummary && (
                                <span className="material-icons text-xs text-blue-500" title="AI Summary">
                                  auto_awesome
                                </span>
                              )}
                              {session.journal && (
                                <span className="material-icons text-xs text-purple-500" title="Journaled">
                                  edit_note
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Week Plan */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Next Week Plan</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Based on your focus areas this week, here are some suggested goals for next week:
            </div>

            {Object.keys(analytics.topTags).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(analytics.topTags).slice(0, 3).map(([tag, minutes], index) => (
                  <div key={tag} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={`plan-${index}`}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor={`plan-${index}`} className="flex-1">
                      Continue focusing on {tag} (this week: {(minutes / 60).toFixed(1)}h)
                    </label>
                  </div>
                ))}
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="plan-review"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="plan-review" className="flex-1">
                    Review and organize notes from this week's sessions
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="plan1"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="plan1" className="flex-1">
                    Set clear goals for each focus session
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="plan2"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="plan2" className="flex-1">
                    Complete at least 3 focused work sessions
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="plan3"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="plan3" className="flex-1">
                    Try using AI summaries to capture key insights
                  </label>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

export default Report