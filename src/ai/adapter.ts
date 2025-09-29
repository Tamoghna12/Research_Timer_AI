import type { AiProvider } from '../data/types';

export interface GenerateOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  baseUrl?: string;
  apiKey?: string;
}

export interface GenerateResult {
  text: string;
  tokensIn?: number;
  tokensOut?: number;
}

export interface ConnectionTestResult {
  ok: boolean;
  message?: string;
}

export interface AiAdapter {
  name: AiProvider;
  testConnection(opts: GenerateOptions): Promise<ConnectionTestResult>;
  summarize(prompt: string, opts: GenerateOptions): Promise<GenerateResult>;
}

/**
 * Common retry logic for API calls
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  signal?: AbortSignal
): Promise<T> {
  const delays = [0, 500, 1500]; // 0ms, 500ms, 1.5s backoff
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Check if aborted before each attempt
      if (signal?.aborted) {
        throw new Error('Request was cancelled');
      }

      if (attempt > 0) {
        // Wait for backoff delay
        await new Promise(resolve => setTimeout(resolve, delays[attempt - 1]));

        // Check again after delay
        if (signal?.aborted) {
          throw new Error('Request was cancelled');
        }
      }

      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if aborted
      if (signal?.aborted || lastError.message.includes('cancelled')) {
        throw lastError;
      }

      // Check if it's a retryable error
      const isRetryable = lastError.message.includes('429') ||
                         lastError.message.includes('5') ||
                         lastError.message.includes('timeout') ||
                         lastError.message.includes('network');

      // If not retryable or last attempt, throw
      if (!isRetryable || attempt === maxRetries - 1) {
        throw lastError;
      }
    }
  }

  throw lastError!;
}

/**
 * Clean error messages for user display
 */
export function cleanError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError' || String(error).includes('cancelled')) {
    return 'Request was cancelled';
  }

  if (String(error).includes('NetworkError') || String(error).includes('fetch')) {
    return 'Network connection failed';
  }

  if (String(error).includes('401') || String(error).includes('Unauthorized')) {
    return 'Invalid API key or unauthorized';
  }

  if (String(error).includes('429')) {
    return 'Rate limit exceeded - please try again later';
  }

  if (String(error).includes('500') || String(error).includes('502') || String(error).includes('503')) {
    return 'Server temporarily unavailable';
  }

  if (String(error).includes('timeout')) {
    return 'Request timed out';
  }

  // Return clean message for other errors
  const message = (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string')
    ? error.message
    : String(error);
  return message.length > 100 ? message.substring(0, 97) + '...' : message;
}