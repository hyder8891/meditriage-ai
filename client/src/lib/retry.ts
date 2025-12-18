/**
 * Retry utility for API calls with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR'],
};

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1);
  return Math.min(delay, options.maxDelay);
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, retryableErrors: string[]): boolean {
  if (!error) return false;
  
  // Check error code
  if (error.code && retryableErrors.includes(error.code)) {
    return true;
  }
  
  // Check error message
  const errorMessage = error.message?.toLowerCase() || '';
  const retryablePatterns = [
    'network',
    'timeout',
    'econnrefused',
    'enotfound',
    'etimedout',
    'fetch failed',
    '503',
    '504',
    '429', // Rate limit
  ];
  
  return retryablePatterns.some(pattern => errorMessage.includes(pattern));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if this is the last attempt
      if (attempt === opts.maxAttempts) {
        break;
      }
      
      // Don't retry if error is not retryable
      if (!isRetryableError(error, opts.retryableErrors)) {
        throw error;
      }
      
      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts);
      console.warn(
        `Attempt ${attempt} failed, retrying in ${delay}ms...`,
        error
      );
      
      await sleep(delay);
    }
  }

  // All attempts failed
  throw lastError;
}

/**
 * Wrap a tRPC mutation with retry logic
 */
export function withRetry<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>,
  options?: RetryOptions
) {
  return (input: TInput) => retryWithBackoff(() => mutationFn(input), options);
}

/**
 * Wrap a tRPC query with retry logic
 */
export function withQueryRetry<TOutput>(
  queryFn: () => Promise<TOutput>,
  options?: RetryOptions
) {
  return () => retryWithBackoff(queryFn, options);
}
