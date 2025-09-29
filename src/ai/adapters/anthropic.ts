import type { AiAdapter, GenerateOptions, GenerateResult, ConnectionTestResult } from '../adapter';
import { retryWithBackoff, cleanError } from '../adapter';

export class AnthropicAdapter implements AiAdapter {
  name = 'anthropic' as const;

  async testConnection(opts: GenerateOptions): Promise<ConnectionTestResult> {
    if (!opts.apiKey) {
      return {
        ok: false,
        message: 'Anthropic API key is required'
      };
    }

    try {
      // Anthropic doesn't have a models endpoint, so we test with a minimal message
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': opts.apiKey || '',
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: opts.model || 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: 'Hi'
            }
          ]
        }),
        signal: opts.signal
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            ok: false,
            message: 'Invalid Anthropic API key'
          };
        }
        if (response.status === 400) {
          const errorData = await response.json().catch(() => null);
          if (errorData?.error?.message?.includes('model')) {
            return {
              ok: false,
              message: `Model "${opts.model}" not found or not accessible`
            };
          }
        }
        return {
          ok: false,
          message: `Anthropic API responded with ${response.status}`
        };
      }

      return {
        ok: true,
        message: 'Connected to Anthropic Claude successfully'
      };
    } catch (error) {
      return {
        ok: false,
        message: cleanError(error)
      };
    }
  }

  async summarize(prompt: string, opts: GenerateOptions): Promise<GenerateResult> {
    if (!opts.apiKey) {
      throw new Error('Anthropic API key is required');
    }

    return retryWithBackoff(async () => {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': opts.apiKey || '',
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: opts.model,
          max_tokens: opts.maxTokens || 200,
          temperature: opts.temperature || 0.2,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        }),
        signal: opts.signal
      });

      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          throw new Error(`Anthropic server error: ${response.status}`);
        }
        throw new Error(`Anthropic request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.content || data.content.length === 0 || !data.content[0].text) {
        throw new Error('Invalid response from Anthropic: missing content');
      }

      return {
        text: data.content[0].text.trim(),
        tokensIn: data.usage?.input_tokens,
        tokensOut: data.usage?.output_tokens
      };
    }, 3, opts.signal);
  }
}