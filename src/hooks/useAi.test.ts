import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAi } from './useAi'
import type { Session, AiSettings } from '../data/types'

// Mock Dexie
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn()
}))

// Mock the AI adapters
vi.mock('../ai', () => ({
  getAdapter: vi.fn()
}))

import { useLiveQuery } from 'dexie-react-hooks'
import { getAdapter } from '../ai'
const mockUseLiveQuery = vi.mocked(useLiveQuery)
const mockGetAdapter = vi.mocked(getAdapter)

describe('useAi', () => {
  const settings: AiSettings = {
    enabled: true,
    provider: 'ollama',
    model: 'llama3'
  }

  const mockSession: Session = {
    id: 'test-session',
    mode: 'lit',
    plannedMs: 25 * 60 * 1000,
    startedAt: Date.now(),
    endedAt: Date.now() + 25 * 60 * 1000,
    status: 'completed',
    tags: ['#test'],
    goal: 'Test session',
    notes: 'Some test notes',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  const mockAdapter = {
    name: 'ollama' as const,
    testConnection: vi.fn(),
    summarize: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseLiveQuery.mockReturnValue(settings)
    mockGetAdapter.mockReturnValue(mockAdapter as any)
  })

  it('should start in idle state', () => {
    const { result } = renderHook(() => useAi())

    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBeNull()
    expect(result.current.result).toBeNull()
  })

  it('should transition to loading state when generate is called', async () => {
    mockAdapter.summarize.mockImplementation(() => new Promise(() => {})) // Never resolves

    const { result } = renderHook(() => useAi())

    act(() => {
      result.current.generateSummary(mockSession)
    })

    expect(result.current.status).toBe('loading')
    expect(result.current.error).toBeNull()
    expect(result.current.result).toBeNull()
  })

  it('should transition to success state on successful generation', async () => {
    const mockResult = {
      text: '• Generated summary point 1\n• Generated summary point 2',
      tokensIn: 100,
      tokensOut: 50
    }

    mockAdapter.summarize.mockResolvedValueOnce(mockResult)

    const { result } = renderHook(() => useAi())

    await act(async () => {
      const genResult = await result.current.generateSummary(mockSession)
      expect(genResult).toEqual(mockResult)
    })

    await waitFor(() => {
      expect(result.current.status).toBe('success')
      expect(result.current.error).toBeNull()
      expect(result.current.result).toBe(mockResult.text)
    })
  })

  it('should transition to error state on generation failure', async () => {
    const errorMessage = 'AI generation failed'
    mockAdapter.summarize.mockRejectedValueOnce(new Error(errorMessage))

    const { result } = renderHook(() => useAi())

    await act(async () => {
      const genResult = await result.current.generateSummary(mockSession)
      expect(genResult).toBeNull()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
      expect(result.current.error).toBe(errorMessage)
      expect(result.current.result).toBeNull()
    })
  })

  it('should handle cancellation', async () => {
    const controller = new AbortController()
    mockAdapter.summarize.mockImplementation(async () => {
      return new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request was cancelled'))
        }, 100)
      })
    })

    const { result } = renderHook(() => useAi())

    act(() => {
      result.current.generateSummary(mockSession)
    })

    expect(result.current.status).toBe('loading')

    act(() => {
      result.current.cancel()
    })

    await waitFor(() => {
      expect(result.current.status).toBe('idle')
      expect(result.current.error).toBeNull()
    })
  })

  it('should reset all state when settings change', async () => {
    const mockResult = {
      text: '• Generated summary',
      tokensIn: 100,
      tokensOut: 50
    }

    mockAdapter.summarize.mockResolvedValueOnce(mockResult)

    const { result, rerender } = renderHook(() => useAi())

    // Generate a result first
    await act(async () => {
      await result.current.generateSummary(mockSession)
    })

    await waitFor(() => {
      expect(result.current.status).toBe('success')
      expect(result.current.result).toBe(mockResult.text)
    })

    // Simulate settings change
    const newSettings = { ...settings, model: 'different-model' }
    mockUseLiveQuery.mockReturnValue(newSettings)
    rerender()

    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBeNull()
    expect(result.current.result).toBeNull()
  })

  it('should handle generation with no error message', async () => {
    mockAdapter.summarize.mockRejectedValueOnce(new Error())

    const { result } = renderHook(() => useAi())

    await act(async () => {
      await result.current.generateSummary(mockSession)
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
      expect(result.current.error).toBe('')
    })
  })

  it('should clear error when starting new generation', async () => {
    // First, cause an error
    mockAdapter.summarize.mockRejectedValueOnce(new Error('First error'))

    const { result } = renderHook(() => useAi())

    await act(async () => {
      await result.current.generateSummary(mockSession)
    })

    await waitFor(() => {
      expect(result.current.status).toBe('error')
      expect(result.current.error).toBe('First error')
    })

    // Then start a new generation
    mockAdapter.summarize.mockImplementation(() => new Promise(() => {})) // Never resolves

    act(() => {
      result.current.generateSummary(mockSession)
    })

    expect(result.current.status).toBe('loading')
    expect(result.current.error).toBeNull()
    expect(result.current.result).toBeNull()
  })
})