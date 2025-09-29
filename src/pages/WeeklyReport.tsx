import React, { useState, useMemo } from 'react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useSessions } from '../hooks/useSessions';
import { useSettings } from '../hooks/useSettings';
import {
  totalFocusTime,
  sessionsCompleted,
  avgSessionLength,
  completionRate,
  distributionByMode,
  distributionByTag
} from '../analytics/analytics';
import { TIMER_PRESETS } from '../data/types';
import { millisecondsToMinutes } from '../utils/time';
import { format, addWeeks, subWeeks } from 'date-fns';
import { weekBounds, formatRange, getCurrentWeek } from '../utils/weekUtils';
import { getLinkTitle } from '../utils/linkUtils';
import { generateWeeklyReportMD } from '../report/generateWeeklyReport';
import { copyToClipboard, downloadText, generateReportFilename, printPage } from '../utils/downloadHelpers';
import type { Session } from '../data/types';

const WeeklyReport: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getCurrentWeek().start);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');

  const { settings } = useSettings();

  // Calculate week bounds
  const weekRange = useMemo(() => {
    const { start, end } = weekBounds(currentWeekStart);
    return {
      start,
      end,
      display: formatRange(start, end)
    };
  }, [currentWeekStart]);

  // Fetch sessions for the week
  const { sessions, loading } = useSessions({
    dateRange: { from: weekRange.start, to: weekRange.end }
  });

  // Calculate analytics
  const analytics = useMemo(() => {
    const range = { start: weekRange.start, end: weekRange.end };
    const [tagDist, tagOtherMin] = distributionByTag(sessions, range, 10);

    return {
      totalFocusTimeMin: totalFocusTime(sessions, range),
      sessionsCompleted: sessionsCompleted(sessions, range),
      avgSessionLengthMin: avgSessionLength(sessions, range),
      completionRatePct: completionRate(sessions, range),
      modeDist: distributionByMode(sessions, range),
      tagDist,
      tagOtherMin
    };
  }, [sessions, weekRange]);

  // Select highlighted sessions (top 3 with links)
  const highlightedSessions = useMemo(() => {
    const linkedSessions = sessions.filter(s =>
      s.status === 'completed' && s.link && s.link.length > 0
    );

    // Sort by priority: AI summary > journal > notes, then by duration
    linkedSessions.sort((a, b) => {
      const getScore = (session: Session) => {
        let score = 0;
        if (session.aiSummary) score += 1000;
        else if (session.journal) score += 100;
        else if (session.notes) score += 10;

        const duration = session.endedAt ? session.endedAt - session.startedAt : 0;
        score += Math.min(duration / 60000, 90);
        return score;
      };

      return getScore(b) - getScore(a);
    });

    return linkedSessions.slice(0, 3);
  }, [sessions]);

  // Navigate weeks
  const goToPreviousWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getCurrentWeek().start);
  };

  const goToLastWeek = () => {
    setCurrentWeekStart(subWeeks(getCurrentWeek().start, 1));
  };

  // Actions
  const handleCopyMarkdown = async () => {
    setCopyStatus('copying');
    try {
      const markdownReport = generateWeeklyReportMD({
        sessions,
        start: weekRange.start,
        end: weekRange.end,
        analytics,
        researcher: settings?.researcher
      });

      const success = await copyToClipboard(markdownReport);
      setCopyStatus(success ? 'success' : 'error');

      // Reset status after 3 seconds
      setTimeout(() => setCopyStatus('idle'), 3000);
    } catch (err) {
      console.error('Copy failed:', err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 3000);
    }
  };

  const handleDownloadMarkdown = () => {
    try {
      const markdownReport = generateWeeklyReportMD({
        sessions,
        start: weekRange.start,
        end: weekRange.end,
        analytics,
        researcher: settings?.researcher
      });

      const filename = generateReportFilename(weekRange.start, 'md');
      downloadText(filename, markdownReport, 'text/markdown');
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handlePrint = () => {
    printPage();
  };

  // Format hours and minutes
  const formatHoursMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  // Extract bullets from different sources
  const getBullets = (session: Session) => {
    if (session.aiSummary) {
      return session.aiSummary.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
    }

    if (session.journal) {
      const bullets: string[] = [];
      switch (session.journal.kind) {
        case 'lit':
          if (session.journal.keyClaim) bullets.push(`Key Claim: ${session.journal.keyClaim}`);
          if (session.journal.method) bullets.push(`Method: ${session.journal.method}`);
          if (session.journal.limitation) bullets.push(`Limitation: ${session.journal.limitation}`);
          break;
        case 'writing':
          if (session.journal.wordsAdded) bullets.push(`Words Added: ${session.journal.wordsAdded}`);
          if (session.journal.sectionsTouched) bullets.push(`Sections: ${session.journal.sectionsTouched}`);
          break;
        case 'analysis':
          if (session.journal.nextStep) bullets.push(`Next Step: ${session.journal.nextStep}`);
          if (session.journal.scriptOrNotebook) bullets.push(`Script: ${session.journal.scriptOrNotebook}`);
          break;
        case 'deep':
        case 'break':
          if (session.journal.whatMoved) bullets.push(`Progress: ${session.journal.whatMoved}`);
          break;
      }
      return bullets;
    }

    if (session.notes) {
      return session.notes.split('\n').filter(line => line.trim().length > 0).slice(0, 3);
    }

    return [];
  };

  return (
    <div className="transition-all duration-300" role="document">
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
        {/* Week Navigation and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg rounded-xl p-4 border border-gray-200/30 dark:border-gray-700/30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              leftIcon="chevron_left"
              onClick={() => setCurrentWeekStart(subWeeks(currentWeekStart, 1))}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentWeekStart(getCurrentWeek().start)}
            >
              This Week
            </Button>
            <Button
              variant="ghost"
              size="sm"
              rightIcon="chevron_right"
              onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))}
            >
              Next
            </Button>
          </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 sm:mt-0 no-print">
          <Button
            variant="ghost"
            leftIcon="content_copy"
            onClick={handleCopyMarkdown}
            disabled={loading || copyStatus === 'copying'}
            aria-label="Copy report as Markdown to clipboard"
          >
            {copyStatus === 'copying' ? 'Copying...' :
             copyStatus === 'success' ? 'Copied!' :
             copyStatus === 'error' ? 'Failed' : 'Copy Markdown'}
          </Button>
          <Button
            variant="secondary"
            leftIcon="download"
            onClick={handleDownloadMarkdown}
            disabled={loading}
            aria-label="Download report as Markdown file"
          >
            Download .md
          </Button>
          <Button
            variant="secondary"
            leftIcon="print"
            onClick={handlePrint}
            aria-label="Print report to PDF"
          >
            Print
          </Button>
        </div>
      </div>

      {/* Week Controls */}
      <Card className="no-print">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                leftIcon="chevron_left"
                onClick={goToPreviousWeek}
                aria-label="Previous week"
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon="chevron_right"
                onClick={goToNextWeek}
                aria-label="Next week"
              >
                Next
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={goToCurrentWeek}
              >
                This Week
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={goToLastWeek}
              >
                Last Week
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-gray-500 dark:text-gray-400">
              Loading report data...
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary KPIs */}
          <Card>
            <CardHeader>
              <h2 className="font-display text-xl font-medium">Summary</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <div className="text-2xl font-semibold text-blue-600">
                    {formatHoursMinutes(analytics.totalFocusTimeMin)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Focus Time
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-blue-600">
                    {analytics.sessionsCompleted}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Sessions Completed
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-blue-600">
                    {analytics.avgSessionLengthMin.toFixed(1)}m
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Avg Session Length
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-blue-600">
                    {analytics.completionRatePct}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Completion Rate
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Distribution */}
          <Card>
            <CardHeader>
              <h2 className="font-display text-xl font-medium">Time Distribution</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* By Mode */}
              {Object.keys(analytics.modeDist).length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">By Mode</h3>
                  <div className="space-y-2">
                    {Object.entries(analytics.modeDist)
                      .sort((a, b) => b[1] - a[1])
                      .map(([mode, minutes]) => {
                        const preset = TIMER_PRESETS.find(p => p.id === mode);
                        const modeName = preset?.name || mode;
                        return (
                          <div key={mode} className="flex items-center justify-between">
                            <span className="text-sm">{modeName}</span>
                            <span className="text-sm font-mono">{formatHoursMinutes(minutes)}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* By Tags */}
              {Object.keys(analytics.tagDist).length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Top Focus Areas
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(analytics.tagDist)
                      .sort((a, b) => b[1] - a[1])
                      .map(([tag, minutes]) => (
                        <div key={tag} className="flex items-center justify-between">
                          <span className="text-sm">{tag}</span>
                          <span className="text-sm font-mono">{formatHoursMinutes(minutes)}</span>
                        </div>
                      ))}
                    {analytics.tagOtherMin > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Other</span>
                        <span className="text-sm font-mono">{formatHoursMinutes(analytics.tagOtherMin)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Highlights */}
          {highlightedSessions.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="font-display text-xl font-medium">Highlights</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {highlightedSessions.map((session) => {
                    const preset = TIMER_PRESETS.find(p => p.id === session.mode);
                    const modeName = preset?.name || session.mode;
                    const linkTitle = session.link ? getLinkTitle(session.link) : '';
                    const bullets = getBullets(session);
                    const hasAi = !!session.aiSummary;

                    return (
                      <div key={session.id} className="border-l-4 border-blue-600 pl-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">
                            {modeName} - {format(new Date(session.startedAt), 'MMM dd')}
                          </h3>
                          {linkTitle && (
                            <span className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                              {linkTitle}
                            </span>
                          )}
                          {hasAi && (
                            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                              AI
                            </span>
                          )}
                        </div>

                        {session.goal && (
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {session.goal}
                          </div>
                        )}

                        {bullets.length > 0 && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {bullets.map((bullet, bulletIndex) => (
                              <div key={bulletIndex} className="flex items-start gap-2">
                                <span className="text-blue-600 mt-1">•</span>
                                <span>{bullet}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Session Log */}
          <Card>
            <CardHeader>
              <h2 className="font-display text-xl font-medium">Session Log (Appendix)</h2>
            </CardHeader>
            <CardContent>
              {sessions.filter(s => s.status === 'completed').length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300 dark:border-gray-600">
                        <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Date</th>
                        <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Mode</th>
                        <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Goal</th>
                        <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Tags</th>
                        <th className="text-left py-2 font-medium text-gray-700 dark:text-gray-300">Links</th>
                        <th className="text-right py-2 font-medium text-gray-700 dark:text-gray-300">Duration</th>
                        <th className="text-center py-2 font-medium text-gray-700 dark:text-gray-300">Journal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions
                        .filter(s => s.status === 'completed')
                        .sort((a, b) => b.startedAt - a.startedAt)
                        .map(session => {
                          const preset = TIMER_PRESETS.find(p => p.id === session.mode);
                          const modeName = preset?.name || session.mode;
                          const duration = session.endedAt ? millisecondsToMinutes(session.endedAt - session.startedAt) : 0;
                          const journalBadge = session.journal ? (session.aiSummary ? 'AI+Journal' : 'Journal') :
                                              session.aiSummary ? 'AI' : '-';

                          return (
                            <tr key={session.id} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-2 text-gray-600 dark:text-gray-400">
                                {format(new Date(session.startedAt), 'MMM dd')}
                              </td>
                              <td className="py-2">{modeName}</td>
                              <td className="py-2 max-w-xs truncate">
                                {session.goal || '-'}
                              </td>
                              <td className="py-2 max-w-xs truncate">
                                {session.tags.join(', ') || '-'}
                              </td>
                              <td className="py-2 max-w-xs truncate">
                                {session.link ? getLinkTitle(session.link) : '-'}
                              </td>
                              <td className="py-2 text-right font-mono">{duration}m</td>
                              <td className="py-2 text-center text-xs">{journalBadge}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No completed sessions this week.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Week Plan */}
          <Card>
            <CardHeader>
              <h2 className="font-display text-xl font-medium">Next Week Plan</h2>
            </CardHeader>
            <CardContent>
              {/* Extract next steps from analysis sessions and TODO items from notes */}
              {(() => {
                const planItems: string[] = [];

                sessions.forEach(session => {
                  if (session.journal?.kind === 'analysis' && session.journal.nextStep) {
                    planItems.push(session.journal.nextStep);
                  }

                  if (session.notes) {
                    const todoMatches = session.notes.match(/TODO:\s*(.+)/gi);
                    if (todoMatches) {
                      todoMatches.forEach(match => {
                        const todoText = match.replace(/TODO:\s*/i, '').trim();
                        if (todoText) planItems.push(todoText);
                      });
                    }
                  }
                });

                const uniquePlans = [...new Set(planItems)].slice(0, 10);

                return uniquePlans.length > 0 ? (
                  <div className="space-y-2">
                    {uniquePlans.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1"
                          disabled
                          aria-label={`Plan item: ${item}`}
                        />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <p>No specific plans identified from this week's sessions.</p>
                    <p className="text-xs mt-2">
                      Add TODO items in session notes or next steps in analysis journals.
                    </p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </>
      )}
      </div>
    </div>
  );
};

export default WeeklyReport;