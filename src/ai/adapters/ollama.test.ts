import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { generate } from './ollama'
import type { AiSettings } from '../../data/types'

// Mock fetch
global.fetch = vi.fn()
const mockFetch = vi.mocked(fetch)

describe('Ollama Adapter', () => {
  const settings: AiSettings = {
    enabled: true,
    provider: 'ollama',
    model: 'llama3',
    baseUrl: 'http://localhost:11434'
  }

  beforeEach(() => {
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

    const controller = new AbortController()
    const result = await generate('Test prompt', settings, controller.signal)

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
          stream: false
        }),
        signal: controller.signal
      })
    )
  })

  it('should use default baseUrl when not provided', async () => {
    const settingsWithoutBaseUrl = { ...settings, baseUrl: undefined }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: 'test', done: true })
    } as Response)

    const controller = new AbortController()
    await generate('Test prompt', settingsWithoutBaseUrl, controller.signal)

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.any(Object)
    )
  })

  it('should retry on 429 status code', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'Success after retry', done: true })
      } as Response)

    const controller = new AbortController()

    const promise = generate('Test prompt', settings, controller.signal)

    // Fast forward through retry delays
    await vi.advanceTimersByTimeAsync(2000)

    const result = await promise

    expect(result.text).toBe('Success after retry')
    expect(mockFetch).toHaveBeenCalledTimes(3)
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

    const controller = new AbortController()

    const promise = generate('Test prompt', settings, controller.signal)

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

    const controller = new AbortController()

    await expect(generate('Test prompt', settings, controller.signal))
      .rejects.toThrow('Ollama API error: 401 Unauthorized')
  })

  it('should handle aborted request', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(generate('Test prompt', settings, controller.signal))
      .rejects.toThrow('Request was cancelled')
  })

  it('should handle AbortError during fetch', async () => {
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'

    mockFetch.mockRejectedValueOnce(abortError)

    const controller = new AbortController()

    await expect(generate('Test prompt', settings, controller.signal))
      .rejects.toThrow('Request was cancelled')
  })

  it('should throw error for malformed response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ model: 'llama3', done: true }) // missing response field
    } as Response)

    const controller = new AbortController()

    await expect(generate('Test prompt', settings, controller.signal))
      .rejects.toThrow('Invalid response from Ollama: missing response field')
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

    const controller = new AbortController()

    const promise = generate('Test prompt', settings, controller.signal)

    // Fast forward through all retry delays
    await vi.advanceTimersByTimeAsync(3000)

    await expect(promise).rejects.toThrow('Ollama server error: 500 Server Error')
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })
})