import type { AiProvider } from '../data/types';
import type { AiAdapter } from './adapter';
import { OpenAiAdapter } from './adapters/openai';
import { AnthropicAdapter } from './adapters/anthropic';
import { GeminiAdapter } from './adapters/gemini';
import { GroqAdapter } from './adapters/groq';

export function getAdapter(provider: AiProvider): AiAdapter {
  switch (provider) {
    case 'openai':
      return new OpenAiAdapter();
    case 'anthropic':
      return new AnthropicAdapter();
    case 'gemini':
      return new GeminiAdapter();
    case 'groq':
      return new GroqAdapter();
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

export { OpenAiAdapter, AnthropicAdapter, GeminiAdapter, GroqAdapter };
export * from './adapter';
export * from './buildPrompt';