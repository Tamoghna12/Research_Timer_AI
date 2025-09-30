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
 * Common retry logic for API calls with exponential backoff and jitter
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  signal?: AbortSignal
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Check if aborted before each attempt
      if (signal?.aborted) {
        throw new Error('Request was cancelled');
      }

      if (attempt > 0) {
        // Exponential backoff with jitter: base delay * 2^(attempt-1) + random jitter
        const baseDelay = 500; // 500ms base delay
        const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 200; // 0-200ms random jitter
        const delay = Math.min(exponentialDelay + jitter, 10000); // Cap at 10 seconds

        await new Promise(resolve => setTimeout(resolve, delay));

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

      // Check if it's a retryable error - more comprehensive error detection
      const errorStr = lastError.message.toLowerCase();
      const isRetryable = errorStr.includes('429') ||      // Rate limit
                         errorStr.includes('502') ||       // Bad gateway
                         errorStr.includes('503') ||       // Service unavailable
                         errorStr.includes('504') ||       // Gateway timeout
                         errorStr.includes('500') ||       // Internal server error
                         errorStr.includes('timeout') ||   // Request timeout
                         errorStr.includes('network') ||   // Network error
                         errorStr.includes('connection') || // Connection error
                         errorStr.includes('fetch');       // Fetch error

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