import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OllamaAdapter } from './ollama'
import { OpenAiAdapter } from './openai'
import { AnthropicAdapter } from './anthropic'
import { GeminiAdapter } from './gemini'
import type { GenerateOptions } from '../adapter'

// Mock fetch globally
global.fetch = vi.fn()
const mockFetch = vi.mocked(fetch)

describe('AI Adapters', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('OllamaAdapter', () => {
    const adapter = new OllamaAdapter()
    const options: GenerateOptions = {
      model: 'llama3:8b',
      temperature: 0.2,
      maxTokens: 200,
      signal: new AbortController().signal
    }

    it('should test connection successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [{ name: 'llama3:8b' }] })
      } as Response)

      const result = await adapter.testConnection(options)

      expect(result.ok).toBe(true)
      expect(result.message).toContain('Connected to Ollama')
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/tags',
        expect.objectContaining({
          method: 'GET',
          signal: options.signal
        })
      )
    })

    it('should summarize text successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: '• Key insight\n• Another point\n• Final thought',
          done: true,
          prompt_eval_count: 100,
          eval_count: 50
        })
      } as Response)

      const result = await adapter.summarize('Test prompt', options)

      expect(result.text).toBe('• Key insight\n• Another point\n• Final thought')
      expect(result.tokensIn).toBe(100)
      expect(result.tokensOut).toBe(50)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama3:8b',
            prompt: 'Test prompt',
            stream: false,
            options: {
              temperature: 0.2,
              num_predict: 200
            }
          })
        })
      )
    })
  })

  describe('OpenAiAdapter', () => {
    const adapter = new OpenAiAdapter()
    const options: GenerateOptions = {
      model: 'gpt-4o-mini',
      apiKey: 'test-api-key',
      temperature: 0.2,
      maxTokens: 200,
      signal: new AbortController().signal
    }

    it('should test connection successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: 'gpt-4o-mini' },
            { id: 'gpt-3.5-turbo' }
          ]
        })
      } as Response)

      const result = await adapter.testConnection(options)

      expect(result.ok).toBe(true)
      expect(result.message).toContain('Connected to OpenAI')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json'
          }
        })
      )
    })

    it('should require API key', async () => {
      const result = await adapter.testConnection({ ...options, apiKey: undefined })

      expect(result.ok).toBe(false)
      expect(result.message).toBe('OpenAI API key is required')
    })

    it('should summarize text successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '• Research insight\n• Key finding\n• Important conclusion'
            }
          }],
          usage: {
            prompt_tokens: 120,
            completion_tokens: 45
          }
        })
      } as Response)

      const result = await adapter.summarize('Test prompt', options)

      expect(result.text).toBe('• Research insight\n• Key finding\n• Important conclusion')
      expect(result.tokensIn).toBe(120)
      expect(result.tokensOut).toBe(45)
    })
  })

  describe('AnthropicAdapter', () => {
    const adapter = new AnthropicAdapter()
    const options: GenerateOptions = {
      model: 'claude-3-haiku-20240307',
      apiKey: 'test-api-key',
      temperature: 0.2,
      maxTokens: 200,
      signal: new AbortController().signal
    }

    it('should test connection successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Hello' }],
          usage: { input_tokens: 1, output_tokens: 1 }
        })
      } as Response)

      const result = await adapter.testConnection(options)

      expect(result.ok).toBe(true)
      expect(result.message).toBe('Connected to Anthropic Claude successfully')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'x-api-key': 'test-api-key',
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          }
        })
      )
    })

    it('should require API key', async () => {
      const result = await adapter.testConnection({ ...options, apiKey: undefined })

      expect(result.ok).toBe(false)
      expect(result.message).toBe('Anthropic API key is required')
    })

    it('should summarize text successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{
            text: '• Analysis result\n• Key observation\n• Research conclusion'
          }],
          usage: {
            input_tokens: 95,
            output_tokens: 38
          }
        })
      } as Response)

      const result = await adapter.summarize('Test prompt', options)

      expect(result.text).toBe('• Analysis result\n• Key observation\n• Research conclusion')
      expect(result.tokensIn).toBe(95)
      expect(result.tokensOut).toBe(38)
    })
  })

  describe('GeminiAdapter', () => {
    const adapter = new GeminiAdapter()
    const options: GenerateOptions = {
      model: 'gemini-1.5-pro',
      apiKey: 'test-api-key',
      temperature: 0.2,
      maxTokens: 200,
      signal: new AbortController().signal
    }

    it('should test connection successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Hello' }]
            }
          }],
          usageMetadata: {
            promptTokenCount: 1,
            candidatesTokenCount: 1
          }
        })
      } as Response)

      const result = await adapter.testConnection(options)

      expect(result.ok).toBe(true)
      expect(result.message).toBe('Connected to Google Gemini successfully')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=test-api-key',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    it('should require API key', async () => {
      const result = await adapter.testConnection({ ...options, apiKey: undefined })

      expect(result.ok).toBe(false)
      expect(result.message).toBe('Google AI API key is required')
    })

    it('should summarize text successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: '• Gemini insight\n• Research finding\n• Final summary' }]
            }
          }],
          usageMetadata: {
            promptTokenCount: 110,
            candidatesTokenCount: 42
          }
        })
      } as Response)

      const result = await adapter.summarize('Test prompt', options)

      expect(result.text).toBe('• Gemini insight\n• Research finding\n• Final summary')
      expect(result.tokensIn).toBe(110)
      expect(result.tokensOut).toBe(42)
    })
  })

  describe('Error Handling', () => {
    const adapter = new OllamaAdapter()
    const options: GenerateOptions = {
      model: 'llama3:8b',
      signal: new AbortController().signal
    }

    it('should handle network errors with retry', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ response: 'Success after retry', done: true })
        } as Response)

      const result = await adapter.summarize('Test prompt', options)

      expect(result.text).toBe('Success after retry')
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('should handle abort signal', async () => {
      const controller = new AbortController()
      const abortedOptions = { ...options, signal: controller.signal }

      controller.abort()

      await expect(adapter.summarize('Test prompt', abortedOptions))
        .rejects.toThrow('Request was cancelled')
    })
  })
})