import React, { useState, useMemo } from 'react'
import Card, { CardContent, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Field from '../components/ui/Field'
import JournalModal from '../components/JournalModal'
import { LinkChipList } from '../components/ui/LinkChipList'
import { useSessions } from '../hooks/useSessions'
import { useJournal } from '../hooks/useJournal'
import { TIMER_PRESETS } from '../data/types'
import type { SessionMode, SessionJournal, AiSummaryMeta, Session, LinkRef } from '../data/types'
import { formatDuration, millisecondsToMinutes } from '../utils/time'

const Timeline: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<SessionMode | 'all'>('all')
  const [tagFilter, setTagFilter] = useState('')
  const [selectedRange, setSelectedRange] = useState('all')
  const [journalModalOpen, setJournalModalOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  // Calculate date range filter
  const dateRange = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (selectedRange) {
      case 'today':
        return {
          from: today,
          to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
        }
      case 'week': {
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay())
        return {
          from: startOfWeek,
          to: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
        }
      }
      case '7days':
        return {
          from: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          to: now
        }
      case '30days':
        return {
          from: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
          to: now
        }
      default:
        return undefined
    }
  }, [selectedRange])

  const { sessions, allTags, loading, error } = useSessions({
    mode: selectedMode,
    tag: tagFilter,
    dateRange
  })

  // Get journal data for selected session
  const selectedSession = sessions.find(s => s.id === selectedSessionId)
  const journalHook = useJournal(selectedSessionId || '')

  const handleExportMarkdown = () => {
    const markdown = generateMarkdownExport(sessions)
    downloadFile(markdown, `sessions-${new Date().toISOString().split('T')[0]}.md`, 'text/markdown')
  }

  const handleExportCSV = () => {
    const csv = generateCSVExport(sessions)
    downloadFile(csv, `sessions-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
  }

  const handleAddJournal = (sessionId: string) => {
    setSelectedSessionId(sessionId)
    setJournalModalOpen(true)
  }

  const handleJournalSave = async (journal: SessionJournal, aiSummary?: string, aiSummaryMeta?: AiSummaryMeta) => {
    if (!selectedSessionId) return

    try {
      await journalHook.save(journal, aiSummary, aiSummaryMeta)
      setJournalModalOpen(false)
      setSelectedSessionId(null)
    } catch (error) {
      console.error('Failed to save journal:', error)
    }
  }

  const handleJournalSkip = () => {
    setJournalModalOpen(false)
    setSelectedSessionId(null)
  }

  const handleJournalCancel = () => {
    setJournalModalOpen(false)
    setSelectedSessionId(null)
  }

  const generateMarkdownExport = (sessions: Session[]) => {
    const header = `# Research Sessions Export\n\nExported: ${new Date().toLocaleString()}\nTotal Sessions: ${sessions.length}\n\n`

    const sessionMarkdown = sessions.map(session => {
      const preset = TIMER_PRESETS.find(p => p.id === session.mode)
      const duration = session.endedAt
        ? millisecondsToMinutes(session.endedAt - session.startedAt)
        : millisecondsToMinutes(session.plannedMs)

      let journalSection = ''
      if (session.journal) {
        journalSection = `\n**Journal:**\n`

        switch (session.journal.kind) {
          case 'lit':
            journalSection += `- **Key Claim:** ${session.journal.keyClaim || 'None'}\n`
            journalSection += `- **Method:** ${session.journal.method || 'None'}\n`
            journalSection += `- **Limitation:** ${session.journal.limitation || 'None'}\n`
            break
          case 'writing':
            journalSection += `- **Words Added:** ${session.journal.wordsAdded ?? 'Not specified'}\n`
            journalSection += `- **Sections Touched:** ${session.journal.sectionsTouched || 'None'}\n`
            break
          case 'analysis':
            journalSection += `- **Script/Notebook:** ${session.journal.scriptOrNotebook || 'None'}\n`
            journalSection += `- **Dataset Reference:** ${session.journal.datasetRef || 'None'}\n`
            journalSection += `- **Next Step:** ${session.journal.nextStep || 'None'}\n`
            break
          case 'deep':
          case 'break':
            journalSection += `- **What Moved Forward:** ${session.journal.whatMoved || 'None'}\n`
            break
        }
      }

      return `## ${preset?.name || session.mode} - ${new Date(session.startedAt).toLocaleDateString()}

**Time:** ${new Date(session.startedAt).toLocaleTimeString()}
**Duration:** ${duration} minutes
**Status:** ${session.status}

**Goal:** ${session.goal || 'No goal specified'}

**Notes:**
${session.notes || 'No notes'}

**Tags:** ${(session.tags || []).length > 0 ? (session.tags || []).join(', ') : 'None'}

**Links:** ${session.links && session.links.length > 0 ? session.links.map((link: LinkRef) => `${link.title || link.url}${link.description ? ' (' + link.description + ')' : ''}`).join(', ') : (session.link || 'None')}${journalSection}

---

`
    }).join('')

    return header + sessionMarkdown
  }

  const generateCSVExport = (sessions: Session[]) => {
    const headers = ['Date', 'Time', 'Mode', 'Duration (min)', 'Status', 'Goal', 'Notes', 'Tags', 'Links', 'Journal']
    const rows = sessions.map(session => {
      const preset = TIMER_PRESETS.find(p => p.id === session.mode)
      const duration = session.endedAt
        ? millisecondsToMinutes(session.endedAt - session.startedAt)
        : millisecondsToMinutes(session.plannedMs)

      let journalData = ''
      if (session.journal) {
        switch (session.journal.kind) {
          case 'lit':
            journalData = `Key Claim: ${session.journal.keyClaim || ''} | Method: ${session.journal.method || ''} | Limitation: ${session.journal.limitation || ''}`
            break
          case 'writing':
            journalData = `Words Added: ${session.journal.wordsAdded ?? ''} | Sections Touched: ${session.journal.sectionsTouched || ''}`
            break
          case 'analysis':
            journalData = `Script/Notebook: ${session.journal.scriptOrNotebook || ''} | Dataset: ${session.journal.datasetRef || ''} | Next Step: ${session.journal.nextStep || ''}`
            break
          case 'deep':
          case 'break':
            journalData = `What Moved Forward: ${session.journal.whatMoved || ''}`
            break
        }
      }

      return [
        new Date(session.startedAt).toLocaleDateString(),
        new Date(session.startedAt).toLocaleTimeString(),
        preset?.name || session.mode,
        duration.toString(),
        session.status,
        `"${(session.goal || '').replace(/"/g, '""')}"`,
        `"${(session.notes || '').replace(/"/g, '""')}"`,
        `"${(session.tags || []).join(', ')}"`,
        session.links && session.links.length > 0 ? `"${session.links.map((link: LinkRef) => link.title || link.url).join(', ')}"` : `"${session.link || ''}"`,
        `"${journalData.replace(/"/g, '""')}"`
      ]
    })

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="transition-all duration-300">
      {/* Hero Section */}
      <div className="text-center space-y-4 p-6 pb-8">
        <h1 className="font-display text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-lg">
          Timeline
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          {loading && ' (loading...)'}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <h2 className="font-display text-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Filters
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range Filter */}
            <Field label="Date Range" htmlFor="date-range">
              <select
                id="date-range"
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value)}
                className="w-full"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </Field>

            {/* Mode Filter */}
            <Field label="Focus Mode" htmlFor="mode-filter">
              <select
                id="mode-filter"
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value as SessionMode | 'all')}
                className="w-full"
              >
                <option value="all">All Modes</option>
                {TIMER_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </Field>

            {/* Tag Filter */}
            <Field label="Filter by Tag" htmlFor="tag-filter">
              <input
                id="tag-filter"
                type="text"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-full"
                placeholder="Type to filter tags..."
                list="tag-suggestions"
              />
              <datalist id="tag-suggestions">
                {allTags.map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Export Controls */}
      <Card>
        <CardHeader>
          <h2 className="font-display text-xl font-medium">Export Sessions</h2>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              leftIcon="description"
              onClick={handleExportMarkdown}
              disabled={sessions.length === 0}
            >
              Export as Markdown
            </Button>
            <Button
              variant="secondary"
              leftIcon="table_chart"
              onClick={handleExportCSV}
              disabled={sessions.length === 0}
            >
              Export as CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <div className="space-y-4">
        {loading && (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                Loading sessions...
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card>
            <CardContent className="py-8 text-center">
              <div className="text-red-600 dark:text-red-400">
                Error: {error}
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && !error && sessions.length > 0 ? (
          sessions.map((session) => {
            const preset = TIMER_PRESETS.find(p => p.id === session.mode)
            const duration = session.endedAt
              ? millisecondsToMinutes(session.endedAt - session.startedAt)
              : millisecondsToMinutes(session.plannedMs)

            return (
              <Card key={session.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      {/* Header with time and mode */}
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(session.startedAt).toLocaleDateString()} at{' '}
                          {new Date(session.startedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          {preset?.name || session.mode}
                        </div>
                        <div
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            session.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : session.status === 'cancelled'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}
                        >
                          {session.status}
                        </div>
                        {session.journal && (
                          <div className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            <span className="material-icons text-xs mr-1">edit_note</span>
                            Journaled
                          </div>
                        )}
                        {session.aiSummary && (
                          <div className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            <span className="material-icons text-xs mr-1">auto_awesome</span>
                            AI
                          </div>
                        )}
                      </div>

                      {/* Goal */}
                      <div className="text-base font-medium text-gray-800 dark:text-gray-200">
                        {session.goal || 'No goal specified'}
                      </div>

                      {/* Notes preview or AI summary */}
                      {session.aiSummary ? (
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                          <div className="font-medium text-blue-600 dark:text-blue-400 mb-1">AI Summary:</div>
                          <div className="prose prose-sm dark:prose-invert prose-p:my-0 prose-ul:my-0 prose-li:my-0">
                            {session.aiSummary.split('\n').map((line: string, i: number) => (
                              <div key={i}>{line}</div>
                            ))}
                          </div>
                        </div>
                      ) : session.notes ? (
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {session.notes}
                        </div>
                      ) : null}

                      {/* Tags and Link */}
                      <div className="flex flex-wrap items-center gap-2">
                        {session.tags.map((tag) => (
                          <span
                            key={tag}
                            onClick={() => setTagFilter(tag)}
                            role="button"
                            tabIndex={0}
                            className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            title={`Click to filter by ${tag}`}
                          >
                            {tag}
                          </span>
                        ))}
                        {/* Display new link chips or legacy link */}
                        {session.links && session.links.length > 0 ? (
                          <LinkChipList
                            links={session.links}
                            size="sm"
                            maxVisible={3}
                          />
                        ) : session.link && (
                          <a
                            href={session.link.startsWith('doi:')
                              ? `https://doi.org/${session.link.replace('doi:', '')}`
                              : session.link
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-600/80 inline-flex items-center"
                          >
                            <span className="material-icons text-sm mr-1">link</span>
                            {session.link.length > 30
                              ? `${session.link.substring(0, 30)}...`
                              : session.link
                            }
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3 ml-4">
                      <div className="text-right">
                        <div className="text-lg font-mono font-medium text-gray-800 dark:text-gray-200">
                          {duration}m
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDuration(session.plannedMs)} planned
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon="edit_note"
                        onClick={() => handleAddJournal(session.id)}
                      >
                        {session.journal ? 'Edit Journal' : 'Add Journal'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : !loading && !error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-500 dark:text-gray-400">
                <span className="material-icons text-4xl mb-4 block">
                  timeline
                </span>
                <div className="text-lg font-medium mb-2">
                  {selectedMode !== 'all' || tagFilter || selectedRange !== 'all'
                    ? 'No sessions match your filters'
                    : 'No sessions yet'
                  }
                </div>
                <div className="text-sm">
                  {selectedMode !== 'all' || tagFilter || selectedRange !== 'all' ? (
                    <button
                      onClick={() => {
                        setSelectedMode('all')
                        setTagFilter('')
                        setSelectedRange('all')
                      }}
                      className="text-blue-600 hover:text-blue-600/80"
                    >
                      Clear filters
                    </button>
                  ) : (
                    'Start your first focus session to see it here'
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>

      {/* Journal Modal */}
      {selectedSession && (
        <JournalModal
          open={journalModalOpen}
          mode={selectedSession.mode}
          sessionId={selectedSessionId || ''}
          session={selectedSession}
          onSave={handleJournalSave}
          onSkip={handleJournalSkip}
          onCancel={handleJournalCancel}
        />
      )}
    </div>
  )
}

export default Timeline