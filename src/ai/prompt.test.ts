import { describe, it, expect } from 'vitest'
import { buildSummaryPrompt } from './prompt'
import type { Session } from '../data/types'

describe('buildSummaryPrompt', () => {
  const baseSession: Session = {
    id: 'test-session',
    mode: 'lit',
    plannedMs: 25 * 60 * 1000,
    startedAt: Date.now(),
    endedAt: Date.now() + 25 * 60 * 1000,
    status: 'completed',
    tags: ['#research'],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  it('should return deterministic string with session data', () => {
    const session: Session = {
      ...baseSession,
      goal: 'Review ML literature',
      notes: 'Found interesting papers on transformers',
      journal: {
        kind: 'lit',
        keyClaim: 'Transformers are powerful',
        method: 'Survey methodology',
        limitation: 'Limited to English papers'
      }
    }

    const prompt = buildSummaryPrompt(session)

    expect(prompt).toContain('Goal: Review ML literature')
    expect(prompt).toContain('Notes: Found interesting papers on transformers')
    expect(prompt).toContain('"keyClaim":"Transformers are powerful"')
    expect(prompt).toContain('"method":"Survey methodology"')
    expect(prompt).toContain('"limitation":"Limited to English papers"')
    expect(prompt).toContain('3–5 concise bullet points')
    expect(prompt).toContain('≤300 characters each')
    expect(prompt).toContain('Output only bullet points in plain text')
  })

  it('should handle session with no goal, notes, or journal', () => {
    const session: Session = {
      ...baseSession
    }

    const prompt = buildSummaryPrompt(session)

    expect(prompt).toContain('Goal: (none)')
    expect(prompt).toContain('Notes: (none)')
    expect(prompt).toContain('Journal: (none)')
  })

  it('should handle session with empty strings', () => {
    const session: Session = {
      ...baseSession,
      goal: '',
      notes: '',
    }

    const prompt = buildSummaryPrompt(session)

    expect(prompt).toContain('Goal: (none)')
    expect(prompt).toContain('Notes: (none)')
    expect(prompt).toContain('Journal: (none)')
  })

  it('should include journal data for different session modes', () => {
    const writingSession: Session = {
      ...baseSession,
      mode: 'writing',
      journal: {
        kind: 'writing',
        wordsAdded: 500,
        sectionsTouched: 'Introduction, Methods'
      }
    }

    const prompt = buildSummaryPrompt(writingSession)

    expect(prompt).toContain('"wordsAdded":500')
    expect(prompt).toContain('"sectionsTouched":"Introduction, Methods"')
  })

  it('should be consistent for same inputs', () => {
    const session: Session = {
      ...baseSession,
      goal: 'Test consistency',
      notes: 'Same input should produce same output'
    }

    const prompt1 = buildSummaryPrompt(session)
    const prompt2 = buildSummaryPrompt(session)

    expect(prompt1).toBe(prompt2)
  })
})