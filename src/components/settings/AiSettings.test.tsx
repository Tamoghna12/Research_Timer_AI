import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import AiSettings from './AiSettings'
import type { AiSettings as AiSettingsType } from '../../data/types'

// Mock Dexie and hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn()
}))

vi.mock('../../hooks/useAi', () => ({
  useAi: vi.fn()
}))

vi.mock('../../data/database', () => ({
  db: {
    settings: {
      get: vi.fn(),
      add: vi.fn(),
      update: vi.fn()
    }
  }
}))

import { useLiveQuery } from 'dexie-react-hooks'
import { useAi } from '../../hooks/useAi'

const mockUseLiveQuery = vi.mocked(useLiveQuery)
const mockUseAi = vi.mocked(useAi)

describe('AiSettings', () => {
  const mockSettings: AiSettingsType = {
    enabled: false,
    provider: 'ollama',
    model: 'llama3:8b',
    bullets: 5,
    maxChars: 300,
    temperature: 0.2,
    includeJournal: true
  }

  const mockUseAiResult = {
    enabled: false,
    isConfigured: false,
    status: 'idle' as const,
    error: null,
    result: null,
    testConnection: vi.fn(),
    generateSummary: vi.fn(),
    cancel: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLiveQuery.mockReturnValue(mockSettings)
    mockUseAi.mockReturnValue(mockUseAiResult)
  })

  it('should render AI settings with master enable switch', () => {
    render(<AiSettings />)

    expect(screen.getByText('Enable AI Summarization (opt-in)')).toBeInTheDocument()
    expect(screen.getByText('Generate concise summaries of your research sessions using AI. All settings are stored locally.')).toBeInTheDocument()
  })

  it('should show configuration panel when AI is enabled', () => {
    const enabledSettings = { ...mockSettings, enabled: true }
    mockUseLiveQuery.mockReturnValue(enabledSettings)

    render(<AiSettings />)

    expect(screen.getByLabelText('AI Provider')).toBeInTheDocument()
    expect(screen.getByLabelText('Model')).toBeInTheDocument()
    expect(screen.getByText('Test Connection')).toBeInTheDocument()
  })

  it('should hide configuration panel when AI is disabled', () => {
    render(<AiSettings />)

    expect(screen.queryByLabelText('AI Provider')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Model')).not.toBeInTheDocument()
  })

  it('should show API key field for remote providers', () => {
    const enabledSettings = { ...mockSettings, enabled: true, provider: 'openai' as const }
    mockUseLiveQuery.mockReturnValue(enabledSettings)

    render(<AiSettings />)

    expect(screen.getByLabelText('API Key')).toBeInTheDocument()
    expect(screen.getByText('Your API key will be stored locally and never shared')).toBeInTheDocument()
  })

  it('should show base URL field for Ollama provider', () => {
    const enabledSettings = { ...mockSettings, enabled: true, provider: 'ollama' }
    mockUseLiveQuery.mockReturnValue(enabledSettings)

    render(<AiSettings />)

    expect(screen.getByLabelText('Base URL')).toBeInTheDocument()
    expect(screen.getByText('Ollama server URL (default: http://localhost:11434)')).toBeInTheDocument()
  })
})