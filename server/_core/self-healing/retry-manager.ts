/**
 * Retry Manager
 * Provides intelligent retry logic with exponential backoff and jitter
 */

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBase: number;
  jitter: boolean;
  retryableErrors?: string[]; // Error types that should be retried
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDurationMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  exponentialBase: 2,
  jitter: true,
};

/**
 * Retry Manager
 * Handles automatic retries with exponential backoff
 */
export class RetryManager {
  /**
   * Execute a function with automatic retry logic
   */
  static async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const finalConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        const result = await fn();
        return {
          success: true,
          result,
          attempts: attempt,
          totalDurationMs: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if error is retryable
        if (finalConfig.retryableErrors) {
          const isRetryable = finalConfig.retryableErrors.some((retryableError) =>
            lastError!.message.toLowerCase().includes(retryableError.toLowerCase())
          );

          if (!isRetryable) {
            console.log(
              `[RetryManager] Error not retryable: ${lastError.message}`
            );
            return {
              success: false,
              error: lastError,
              attempts: attempt,
              totalDurationMs: Date.now() - startTime,
            };
          }
        }

        // If this was the last attempt, don't retry
        if (attempt === finalConfig.maxAttempts) {
          console.error(
            `[RetryManager] All ${finalConfig.maxAttempts} attempts failed`
          );
          return {
            success: false,
            error: lastError,
            attempts: attempt,
            totalDurationMs: Date.now() - startTime,
          };
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(
          attempt,
          finalConfig.baseDelayMs,
          finalConfig.maxDelayMs,
          finalConfig.exponentialBase,
          finalConfig.jitter
        );

        console.log(
          `[RetryManager] Attempt ${attempt}/${finalConfig.maxAttempts} failed: ${lastError.message}. Retrying in ${delay}ms...`
        );

        // Call onRetry callback if provided
        if (finalConfig.onRetry) {
          finalConfig.onRetry(attempt, lastError);
        }

        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript requires it
    return {
      success: false,
      error: lastError,
      attempts: finalConfig.maxAttempts,
      totalDurationMs: Date.now() - startTime,
    };
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private static calculateDelay(
    attempt: number,
    baseDelayMs: number,
    maxDelayMs: number,
    exponentialBase: number,
    jitter: boolean
  ): number {
    // Calculate exponential delay
    const exponentialDelay = baseDelayMs * Math.pow(exponentialBase, attempt - 1);

    // Cap at max delay
    let delay = Math.min(exponentialDelay, maxDelayMs);

    // Add jitter to prevent thundering herd
    if (jitter) {
      const jitterAmount = delay * 0.2; // 20% jitter
      delay = delay + (Math.random() * jitterAmount * 2 - jitterAmount);
    }

    return Math.floor(delay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if an error is retryable based on common patterns
   */
  static isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Network errors
    if (
      message.includes("timeout") ||
      message.includes("econnrefused") ||
      message.includes("econnreset") ||
      message.includes("etimedout") ||
      message.includes("network") ||
      message.includes("socket hang up")
    ) {
      return true;
    }

    // Rate limiting
    if (message.includes("rate limit") || message.includes("too many requests")) {
      return true;
    }

    // Temporary service unavailability
    if (
      message.includes("service unavailable") ||
      message.includes("temporarily unavailable") ||
      message.includes("503")
    ) {
      return true;
    }

    // Database connection issues
    if (
      message.includes("connection pool") ||
      message.includes("connection lost") ||
      message.includes("deadlock")
    ) {
      return true;
    }

    return false;
  }
}

/**
 * Decorator for automatic retry
 */
export function withRetry(config: Partial<RetryConfig> = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await RetryManager.executeWithRetry(
        () => originalMethod.apply(this, args),
        config
      );

      if (!result.success) {
        throw result.error;
      }

      return result.result;
    };

    return descriptor;
  };
}

/**
 * Wrap a function with retry logic
 */
export function wrapWithRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: Partial<RetryConfig> = {}
): T {
  return (async (...args: any[]) => {
    const result = await RetryManager.executeWithRetry(
      () => fn(...args),
      config
    );

    if (!result.success) {
      throw result.error;
    }

    return result.result;
  }) as T;
}
