import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GroqAdapter } from './groq';

// Mock fetch
global.fetch = vi.fn();

describe('GroqAdapter', () => {
  let adapter: GroqAdapter;

  beforeEach(() => {
    adapter = new GroqAdapter();
    vi.clearAllMocks();
  });

  describe('testConnection', () => {
    it('should return error if no API key provided', async () => {
      const result = await adapter.testConnection({
        model: 'llama-3.1-70b-versatile',
        signal: new AbortController().signal
      });

      expect(result.ok).toBe(false);
      expect(result.message).toBe('Groq API key is required');
    });

    it('should return success when API key is valid', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [
            { id: 'llama-3.1-70b-versatile', object: 'model' },
            { id: 'llama-3.1-8b-instant', object: 'model' }
          ]
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await adapter.testConnection({
        apiKey: 'test-key',
        model: 'llama-3.1-70b-versatile',
        signal: new AbortController().signal
      });

      expect(result.ok).toBe(true);
      expect(result.message).toContain('Connected to Groq');
      expect(fetch).toHaveBeenCalledWith('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-key',
          'Content-Type': 'application/json'
        },
        signal: expect.any(AbortSignal)
      });
    });

    it('should return error for invalid API key', async () => {
      const mockResponse = {
        ok: false,
        status: 401
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await adapter.testConnection({
        apiKey: 'invalid-key',
        model: 'llama-3.1-70b-versatile',
        signal: new AbortController().signal
      });

      expect(result.ok).toBe(false);
      expect(result.message).toBe('Invalid Groq API key');
    });

    it('should return error if model not found', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: [
            { id: 'llama-3.1-70b-versatile', object: 'model' }
          ]
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await adapter.testConnection({
        apiKey: 'test-key',
        model: 'non-existent-model',
        signal: new AbortController().signal
      });

      expect(result.ok).toBe(false);
      expect(result.message).toContain('Model "non-existent-model" not found');
    });
  });

  describe('summarize', () => {
    it('should throw error if no API key provided', async () => {
      await expect(adapter.summarize('test prompt', {
        model: 'llama-3.1-70b-versatile',
        signal: new AbortController().signal
      })).rejects.toThrow('Groq API key is required');
    });

    it('should return summary from Groq API', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: '• Researched quantum computing fundamentals\n• Reviewed 3 academic papers\n• Made progress on literature review'
              }
            }
          ],
          usage: {
            prompt_tokens: 50,
            completion_tokens: 25
          }
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await adapter.summarize('Summarize this research session', {
        apiKey: 'test-key',
        model: 'llama-3.1-70b-versatile',
        temperature: 0.2,
        maxTokens: 200,
        signal: new AbortController().signal
      });

      expect(result.text).toBe('• Researched quantum computing fundamentals\n• Reviewed 3 academic papers\n• Made progress on literature review');
      expect(result.tokensIn).toBe(50);
      expect(result.tokensOut).toBe(25);

      expect(fetch).toHaveBeenCalledWith('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-key',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that creates concise, factual summaries of research sessions. Follow the format and length requirements exactly.'
            },
            {
              role: 'user',
              content: 'Summarize this research session'
            }
          ],
          temperature: 0.2,
          max_tokens: 200,
          stream: false
        }),
        signal: expect.any(AbortSignal)
      });
    });

    it('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(adapter.summarize('test prompt', {
        apiKey: 'test-key',
        model: 'llama-3.1-70b-versatile',
        signal: new AbortController().signal
      })).rejects.toThrow('Groq server error: 429');
    });

    it('should handle invalid response format', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: []
        })
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(adapter.summarize('test prompt', {
        apiKey: 'test-key',
        model: 'llama-3.1-70b-versatile',
        signal: new AbortController().signal
      })).rejects.toThrow('Invalid response from Groq: missing content');
    });
  });
});