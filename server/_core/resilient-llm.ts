/**
 * Resilient LLM Wrapper
 * Provides retry logic, circuit breaker protection, and fallback mechanisms for LLM calls
 */

import { invokeGemini, type GeminiParams as InvokeParams, type GeminiResult as InvokeResult } from './gemini';
import { RetryManager } from './self-healing/retry-manager';
import { CircuitBreakerRegistry } from './self-healing/circuit-breaker';
import { GlobalErrorHandler } from './self-healing/global-error-handler';

export interface ResilientLLMOptions {
  retries?: number;
  circuitBreaker?: string;
  timeout?: number;
  fallback?: () => Promise<InvokeResult>;
  validateResponse?: (result: InvokeResult) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface LLMCallContext {
  operation: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

/**
 * Invoke LLM with full resilience: retry, circuit breaker, timeout, validation
 */
export async function invokeResilientLLM(
  params: InvokeParams,
  context: LLMCallContext,
  options: ResilientLLMOptions = {}
): Promise<InvokeResult> {
  const {
    retries = 3,
    circuitBreaker = `llm:${context.operation}`,
    timeout = 30000,
    fallback,
    validateResponse,
    onRetry,
  } = options;

  // Get or create circuit breaker for this operation
  const breaker = CircuitBreakerRegistry.getInstance().getOrCreate(circuitBreaker, {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: timeout,
    resetTimeout: 60000,
  });

  try {
    // Execute with retry + circuit breaker + timeout
    const result = await RetryManager.executeWithRetry(
      async () => {
        // Circuit breaker protection
        return await breaker.execute(async () => {
          // Timeout protection
          const response = await Promise.race([
            invokeGemini(params),
            timeoutPromise<InvokeResult>(timeout),
          ]);

          // Validate response structure
          validateLLMResponse(response);

          // Custom validation if provided
          if (validateResponse && !validateResponse(response)) {
            throw new Error('LLM response failed custom validation');
          }

          return response;
        });
      },
      {
        maxAttempts: retries,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        exponentialBase: 2,
        jitter: true,
        retryableErrors: [
          'timeout',
          'rate limit',
          '503',
          'ECONNRESET',
          'ECONNREFUSED',
          'ETIMEDOUT',
          'network',
          'temporarily unavailable',
        ],
        onRetry: (attempt, error) => {
          // Log retry attempt
          console.warn(
            `[ResilientLLM] Retry ${attempt}/${retries} for ${context.operation}:`,
            error.message
          );

          // Report to global error handler
          GlobalErrorHandler.getInstance().handleError({
            errorId: `retry-${Date.now()}`,
            timestamp: new Date(),
            error: error as Error,
            errorType: 'llm_retry',
            severity: 'medium',
            source: `llm:${context.operation}`,
            userId: context.userId,
            requestId: context.requestId,
            context: {
              attempt,
              maxAttempts: retries,
              ...context.metadata,
            },
          });

          // Custom retry callback
          if (onRetry) {
            onRetry(attempt, error);
          }
        },
      }
    );

    if (!result.success) {
      throw result.error || new Error('LLM call failed after all retries');
    }

    return result.result!;
  } catch (error) {
    // All retries failed or circuit is open
    console.error(
      `[ResilientLLM] All attempts failed for ${context.operation}:`,
      error
    );

    // Report final failure
    const errorToReport = error instanceof Error ? error : new Error(String(error));
    GlobalErrorHandler.getInstance().handleError({
      errorId: `final-failure-${Date.now()}`,
      timestamp: new Date(),
      error: errorToReport,
      errorType: 'llm_final_failure',
      severity: 'high',
      source: `llm:${context.operation}`,
      userId: context.userId,
      requestId: context.requestId,
      context: {
        finalFailure: true,
        ...context.metadata,
      },
    });

    // Try fallback if provided
    if (fallback) {
      console.warn(`[ResilientLLM] Using fallback for ${context.operation}`);
      try {
        return await fallback();
      } catch (fallbackError) {
        console.error(
          `[ResilientLLM] Fallback also failed for ${context.operation}:`,
          fallbackError
        );
        throw error; // Throw original error, not fallback error
      }
    }

    throw error;
  }
}

/**
 * Validate LLM response structure
 */
function validateLLMResponse(response: InvokeResult): void {
  if (!response) {
    throw new Error('LLM response is null or undefined');
  }

  if (!response.choices || !Array.isArray(response.choices)) {
    throw new Error('LLM response missing choices array');
  }

  if (response.choices.length === 0) {
    throw new Error('LLM response has empty choices array');
  }

  const firstChoice = response.choices[0];
  if (!firstChoice.message) {
    throw new Error('LLM response missing message in first choice');
  }

  if (firstChoice.message.content === null || firstChoice.message.content === undefined) {
    throw new Error('LLM response has null or undefined content');
  }
}

/**
 * Create timeout promise
 */
function timeoutPromise<T>(ms: number): Promise<T> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`LLM call timeout after ${ms}ms`)), ms)
  );
}

/**
 * Create a simple fallback response
 */
export function createFallbackResponse(message: string): InvokeResult {
  return {
    id: 'fallback-' + Date.now(),
    created: Date.now(),
    model: 'fallback',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: message,
        },
        finish_reason: 'stop',
      },
    ],
  };
}

/**
 * Batch multiple LLM calls with shared circuit breaker
 */
export async function batchLLMCalls<T>(
  calls: Array<{
    params: InvokeParams;
    context: LLMCallContext;
    options?: ResilientLLMOptions;
  }>,
  options?: {
    concurrency?: number;
    stopOnError?: boolean;
  }
): Promise<Array<{ success: boolean; result?: InvokeResult; error?: Error }>> {
  const { concurrency = 5, stopOnError = false } = options || {};
  const results: Array<{ success: boolean; result?: InvokeResult; error?: Error }> = [];

  // Process in batches
  for (let i = 0; i < calls.length; i += concurrency) {
    const batch = calls.slice(i, i + concurrency);

    const batchResults = await Promise.allSettled(
      batch.map((call) =>
        invokeResilientLLM(call.params, call.context, call.options)
      )
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push({ success: true, result: result.value });
      } else {
        results.push({ success: false, error: result.reason });
        if (stopOnError) {
          throw result.reason;
        }
      }
    }
  }

  return results;
}

/**
 * Get circuit breaker status for an operation
 */
export function getLLMCircuitStatus(operation: string) {
  const breaker = CircuitBreakerRegistry.getInstance().get(`llm:${operation}`);
  return breaker?.getState() || null;
}

/**
 * Reset circuit breaker for an operation
 */
export async function resetLLMCircuit(operation: string): Promise<void> {
  const breaker = CircuitBreakerRegistry.getInstance().get(`llm:${operation}`);
  if (breaker) {
    await breaker.reset();
    console.log(`[ResilientLLM] Circuit breaker reset for ${operation}`);
  }
}
