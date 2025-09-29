import { describe, it, expect } from 'vitest'
import { buildPromptFromSession } from './buildPrompt'
import type { Session } from '../data/types'

describe('buildPromptFromSession', () => {
  const baseSession: Session = {
    id: 'test-session',
    mode: 'lit',
    plannedMs: 25 * 60 * 1000,
    startedAt: Date.now(),
    endedAt: Date.now() + 25 * 60 * 1000,
    status: 'completed',
    tags: ['#research', '#literature'],
    goal: 'Review recent papers on machine learning',
    notes: 'Found interesting approaches to neural architecture search',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  const mockJournal = {
    kind: 'lit' as const,
    keyClaim: 'Neural architecture search can significantly improve model performance',
    method: 'Systematic review of 50 papers published in 2023-2024',
    limitation: 'Limited to English-language publications'
  }

  it('should build prompt with all available content', () => {
    const session = {
      ...baseSession,
      journal: mockJournal
    }

    const prompt = buildPromptFromSession(session, {
      bullets: 5,
      maxChars: 300,
      includeJournal: true
    })

    expect(prompt).toContain('Please summarize this lit research session')
    expect(prompt).toContain('Review recent papers on machine learning')
    expect(prompt).toContain('Found interesting approaches to neural architecture search')
    expect(prompt).toContain('Neural architecture search can significantly improve model performance')
    expect(prompt).toContain('exactly 5 concise factual bullets')
    expect(prompt).toContain('≤ 300 characters')
  })

  it('should handle sessions without journal when includeJournal is false', () => {
    const prompt = buildPromptFromSession(baseSession, {
      bullets: 3,
      maxChars: 200,
      includeJournal: false
    })

    expect(prompt).toContain('Please summarize this lit research session')
    expect(prompt).toContain('Review recent papers on machine learning')
    expect(prompt).toContain('Found interesting approaches to neural architecture search')
    expect(prompt).not.toContain('Key Claim')
    expect(prompt).toContain('exactly 3 concise factual bullets')
    expect(prompt).toContain('≤ 200 characters')
  })

  it('should handle different session modes', () => {
    const writingSession = {
      ...baseSession,
      mode: 'writing' as const,
      goal: 'Write introduction section',
      notes: 'Completed first draft of methodology section',
      journal: {
        kind: 'writing' as const,
        wordsAdded: 850,
        sectionsTouched: 'Introduction, Methods - improved flow and clarity'
      }
    }

    const prompt = buildPromptFromSession(writingSession, {
      bullets: 4,
      maxChars: 250,
      includeJournal: true
    })

    expect(prompt).toContain('Please summarize this writing research session')
    expect(prompt).toContain('Write introduction section')
    expect(prompt).toContain('850')
    expect(prompt).toContain('Introduction, Methods')
  })

  it('should handle analysis sessions', () => {
    const analysisSession = {
      ...baseSession,
      mode: 'analysis' as const,
      goal: 'Process survey data',
      notes: 'Found significant correlation between variables',
      journal: {
        kind: 'analysis' as const,
        scriptOrNotebook: 'data_analysis_v2.ipynb',
        datasetRef: 'survey_responses_2024.csv',
        nextStep: 'Run regression analysis on cleaned dataset'
      }
    }

    const prompt = buildPromptFromSession(analysisSession, {
      bullets: 4,
      maxChars: 280,
      includeJournal: true
    })

    expect(prompt).toContain('Please summarize this analysis research session')
    expect(prompt).toContain('data_analysis_v2.ipynb')
    expect(prompt).toContain('survey_responses_2024.csv')
    expect(prompt).toContain('Run regression analysis')
  })

  it('should handle deep work sessions', () => {
    const deepSession = {
      ...baseSession,
      mode: 'deep' as const,
      goal: 'Focus on complex algorithm implementation',
      notes: 'Made breakthrough on optimization problem',
      journal: {
        kind: 'deep' as const,
        whatMoved: 'Discovered efficient solution using dynamic programming approach'
      }
    }

    const prompt = buildPromptFromSession(deepSession, {
      bullets: 5,
      maxChars: 300,
      includeJournal: true
    })

    expect(prompt).toContain('Please summarize this deep research session')
    expect(prompt).toContain('complex algorithm implementation')
    expect(prompt).toContain('dynamic programming approach')
  })

  it('should handle break sessions', () => {
    const breakSession = {
      ...baseSession,
      mode: 'break' as const,
      goal: 'Take a mindful break',
      notes: 'Went for a walk and reflected on the research problem',
      journal: {
        kind: 'break' as const,
        whatMoved: 'Gained new perspective on the research approach after stepping away'
      }
    }

    const prompt = buildPromptFromSession(breakSession, {
      bullets: 3,
      maxChars: 200,
      includeJournal: true
    })

    expect(prompt).toContain('Please summarize this break research session')
    expect(prompt).toContain('mindful break')
    expect(prompt).toContain('new perspective')
  })

  it('should handle minimal sessions gracefully', () => {
    const minimalSession = {
      ...baseSession,
      goal: '',
      notes: '',
      journal: undefined
    }

    const prompt = buildPromptFromSession(minimalSession, {
      bullets: 3,
      maxChars: 150,
      includeJournal: true
    })

    expect(prompt).toContain('Please provide 3 brief factual bullets')
    expect(prompt).toContain('≤ 150 characters')
    expect(prompt).toContain('factual')
  })

  it('should respect different bullet counts and character limits', () => {
    const prompt3Bullets = buildPromptFromSession(baseSession, {
      bullets: 3,
      maxChars: 150,
      includeJournal: false
    })

    const prompt7Bullets = buildPromptFromSession(baseSession, {
      bullets: 7,
      maxChars: 600,
      includeJournal: false
    })

    expect(prompt3Bullets).toContain('exactly 3 concise factual bullets')
    expect(prompt3Bullets).toContain('≤ 150 characters')

    expect(prompt7Bullets).toContain('exactly 7 concise factual bullets')
    expect(prompt7Bullets).toContain('≤ 600 characters')
  })

  it('should include strict formatting requirements', () => {
    const prompt = buildPromptFromSession(baseSession, {
      bullets: 5,
      maxChars: 300,
      includeJournal: true
    })

    expect(prompt).toContain('Requirements:')
    expect(prompt).toContain('"- " format')
    expect(prompt).toContain('Be factual')
    expect(prompt).toContain('concrete outcomes')
  })
})