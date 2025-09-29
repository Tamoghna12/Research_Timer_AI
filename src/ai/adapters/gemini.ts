import type { AiAdapter, GenerateOptions, GenerateResult, ConnectionTestResult } from '../adapter';
import { retryWithBackoff, cleanError } from '../adapter';

export class GeminiAdapter implements AiAdapter {
  name = 'gemini' as const;

  async testConnection(opts: GenerateOptions): Promise<ConnectionTestResult> {
    if (!opts.apiKey) {
      return {
        ok: false,
        message: 'Google AI API key is required'
      };
    }

    try {
      const modelName = opts.model || 'gemini-1.5-pro';

      // Test with a minimal generation request
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${opts.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Hi'
                  }
                ]
              }
            ],
            generationConfig: {
              maxOutputTokens: 10
            }
          }),
          signal: opts.signal
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return {
            ok: false,
            message: 'Invalid Google AI API key or permission denied'
          };
        }
        if (response.status === 404) {
          return {
            ok: false,
            message: `Model "${modelName}" not found`
          };
        }
        return {
          ok: false,
          message: `Google AI API responded with ${response.status}`
        };
      }

      return {
        ok: true,
        message: 'Connected to Google Gemini successfully'
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
      throw new Error('Google AI API key is required');
    }

    return retryWithBackoff(async () => {
      const modelName = opts.model || 'gemini-1.5-pro';

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${opts.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: opts.temperature || 0.2,
              maxOutputTokens: opts.maxTokens || 200
            }
          }),
          signal: opts.signal
        }
      );

      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          throw new Error(`Google AI server error: ${response.status}`);
        }
        throw new Error(`Google AI request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0 ||
          !data.candidates[0].content || !data.candidates[0].content.parts ||
          data.candidates[0].content.parts.length === 0 ||
          !data.candidates[0].content.parts[0].text) {
        throw new Error('Invalid response from Google AI: missing content');
      }

      return {
        text: data.candidates[0].content.parts[0].text.trim(),
        tokensIn: data.usageMetadata?.promptTokenCount,
        tokensOut: data.usageMetadata?.candidatesTokenCount
      };
    }, 3, opts.signal);
  }
}