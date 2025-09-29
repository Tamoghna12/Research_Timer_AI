import type { AiAdapter, GenerateOptions, GenerateResult, ConnectionTestResult } from '../adapter';
import { retryWithBackoff, cleanError } from '../adapter';

export class GroqAdapter implements AiAdapter {
  name = 'groq' as const;

  async testConnection(opts: GenerateOptions): Promise<ConnectionTestResult> {
    if (!opts.apiKey) {
      return {
        ok: false,
        message: 'Groq API key is required'
      };
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${opts.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: opts.signal
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            ok: false,
            message: 'Invalid Groq API key'
          };
        }
        return {
          ok: false,
          message: `Groq API responded with ${response.status}`
        };
      }

      const data = await response.json();
      const models = data.data || [];

      // Check if the specified model exists
      if (opts.model) {
        const modelExists = models.some((m: any) => m.id === opts.model);
        if (!modelExists) {
          return {
            ok: false,
            message: `Model "${opts.model}" not found or not accessible with your API key`
          };
        }
      }

      return {
        ok: true,
        message: `Connected to Groq. ${models.length} model(s) available.`
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
      throw new Error('Groq API key is required');
    }

    return retryWithBackoff(async () => {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${opts.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: opts.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that creates concise, factual summaries of research sessions. Follow the format and length requirements exactly.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: opts.temperature || 0.2,
          max_tokens: opts.maxTokens || 200,
          stream: false
        }),
        signal: opts.signal
      });

      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          throw new Error(`Groq server error: ${response.status}`);
        }
        throw new Error(`Groq request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0 || !data.choices[0].message?.content) {
        throw new Error('Invalid response from Groq: missing content');
      }

      return {
        text: data.choices[0].message.content.trim(),
        tokensIn: data.usage?.prompt_tokens,
        tokensOut: data.usage?.completion_tokens
      };
    }, 3, opts.signal);
  }
}