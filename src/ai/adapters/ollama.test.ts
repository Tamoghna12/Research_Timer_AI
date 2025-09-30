import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { OllamaAdapter } from './ollama'
import type { AiSettings } from '../../data/types'

// Mock fetch
global.fetch = vi.fn()
const mockFetch = vi.mocked(fetch)

describe('Ollama Adapter', () => {
  let adapter: OllamaAdapter

  beforeEach(() => {
    adapter = new OllamaAdapter()
    mockFetch.mockClear()
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should successfully generate text with happy path', async () => {
    const mockResponse = {
      model: 'llama3',
      created_at: '2024-01-01T00:00:00Z',
      response: '• Key insight from the session\n• Another important point\n• Final takeaway',
      done: true,
      prompt_eval_count: 150,
      eval_count: 45
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as Response)

    const result = await adapter.summarize('Test prompt', {
      model: 'llama3',
      baseUrl: 'http://localhost:11434'
    })

    expect(result.text).toBe('• Key insight from the session\n• Another important point\n• Final takeaway')
    expect(result.tokensIn).toBe(150)
    expect(result.tokensOut).toBe(45)

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3',
          prompt: 'Test prompt',
          stream: false,
          options: {
            temperature: 0.2,
            num_predict: 200
          }
        }),
        signal: undefined
      })
    )
  })

  it('should use default baseUrl when not provided', async () => {
    const settingsWithoutBaseUrl = { model: 'llama3' }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'test', done: true })
    } as Response)

    await adapter.summarize('Test prompt', settingsWithoutBaseUrl)

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.any(Object)
    )
  })

  it('should retry on 429 status code', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Success after retry', done: true })
      } as Response)

    const promise = adapter.summarize('Test prompt', { model: 'llama3' })

    // Fast forward through retry delays
    await vi.advanceTimersByTimeAsync(2000)

    const result = await promise

    expect(result.text).toBe('Success after retry')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('should retry on 500 status code', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Success after retry', done: true })
      } as Response)

    const promise = adapter.summarize('Test prompt', { model: 'llama3' })

    // Fast forward through retry delay
    await vi.advanceTimersByTimeAsync(500)

    const result = await promise

    expect(result.text).toBe('Success after retry')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('should throw error for non-retryable status codes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    } as Response)

    await expect(adapter.summarize('Test prompt', { model: 'llama3' }))
      .rejects.toThrow('Ollama request failed: 401 Unauthorized')
  }, 15000)

  it('should handle aborted request', async () => {
    const abortController = new AbortController()
    abortController.abort()

    await expect(adapter.summarize('Test prompt', { model: 'llama3', signal: abortController.signal }))
      .rejects.toThrow('Request was cancelled')
  })

  it('should handle AbortError during fetch', async () => {
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'

    mockFetch.mockRejectedValueOnce(abortError)

    await expect(adapter.summarize('Test prompt', { model: 'llama3' }))
      .rejects.toThrow('The operation was aborted')
  })

  it('should throw error for malformed response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ model: 'llama3', done: true }) // missing response field
    } as Response)

    await expect(adapter.summarize('Test prompt', { model: 'llama3' }))
      .rejects.toThrow('Invalid response from Ollama: missing response text')
  })

  it('should give up after max retries', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error'
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error'
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error'
      } as Response)

    const promise = adapter.summarize('Test prompt', { model: 'llama3' })

    // Fast forward through all retry delays
    await vi.advanceTimersByTimeAsync(3000)

    await expect(promise).rejects.toThrow('Ollama server error: 500')
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })
})