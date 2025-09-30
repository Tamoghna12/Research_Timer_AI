/**
 * Database retry utility with exponential backoff for transient failures
 */
export async function retryDbOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 100
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry for certain types of errors
      const errorStr = lastError.message.toLowerCase();
      const isRetryable = !errorStr.includes('constraint') &&
                         !errorStr.includes('unique') &&
                         !errorStr.includes('foreign key') &&
                         !errorStr.includes('not found') &&
                         !errorStr.includes('invalid');

      // If not retryable or last attempt, throw
      if (!isRetryable || attempt === maxRetries - 1) {
        throw lastError;
      }

      // Wait with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Clean database error messages for user display
 */
export function cleanDbError(error: unknown): string {
  const message = (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string')
    ? error.message
    : String(error);

  if (message.includes('constraint') || message.includes('unique')) {
    return 'Data conflict - please refresh and try again';
  }

  if (message.includes('foreign key')) {
    return 'Data integrity error - please refresh and try again';
  }

  if (message.includes('not found')) {
    return 'Item not found - it may have been deleted';
  }

  if (message.includes('quota') || message.includes('storage')) {
    return 'Storage limit reached - please clear some data';
  }

  return 'Database error - please try again';
}