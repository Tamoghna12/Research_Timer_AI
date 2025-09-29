import type { AiAdapter, GenerateOptions, GenerateResult, ConnectionTestResult } from '../adapter';
import { retryWithBackoff, cleanError } from '../adapter';

export class OllamaAdapter implements AiAdapter {
  name = 'ollama' as const;

  async testConnection(opts: GenerateOptions): Promise<ConnectionTestResult> {
    try {
      const baseUrl = opts.baseUrl || 'http://localhost:11434';

      const response = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        signal: opts.signal
      });

      if (!response.ok) {
        return {
          ok: false,
          message: `Ollama server responded with ${response.status}`
        };
      }

      const data = await response.json();
      const models = data.models || [];

      // Check if the specified model exists
      if (opts.model) {
        const modelExists = models.some((m: any) =>
          m.name === opts.model || m.name.startsWith(opts.model.split(':')[0])
        );

        if (!modelExists) {
          return {
            ok: false,
            message: `Model "${opts.model}" not found. Available models: ${models.map((m: any) => m.name).join(', ')}`
          };
        }
      }

      return {
        ok: true,
        message: `Connected to Ollama. ${models.length} model(s) available.`
      };
    } catch (error) {
      return {
        ok: false,
        message: cleanError(error)
      };
    }
  }

  async summarize(prompt: string, opts: GenerateOptions): Promise<GenerateResult> {
    return retryWithBackoff(async () => {
      const baseUrl = opts.baseUrl || 'http://localhost:11434';

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: opts.model,
          prompt,
          stream: false,
          options: {
            temperature: opts.temperature || 0.2,
            num_predict: opts.maxTokens || 200
          }
        }),
        signal: opts.signal
      });

      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          throw new Error(`Ollama server error: ${response.status}`);
        }
        throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error('Invalid response from Ollama: missing response text');
      }

      return {
        text: data.response.trim(),
        tokensIn: data.prompt_eval_count,
        tokensOut: data.eval_count
      };
    }, 3, opts.signal);
  }
}