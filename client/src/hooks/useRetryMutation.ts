import { useState } from 'react';
import { retryWithBackoff, RetryOptions } from '@/lib/retry';

interface UseRetryMutationOptions extends RetryOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

/**
 * Hook for mutations with automatic retry logic
 */
export function useRetryMutation<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>,
  options: UseRetryMutationOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TOutput | null>(null);

  const mutate = async (input: TInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await retryWithBackoff(
        () => mutationFn(input),
        {
          maxAttempts: options.maxAttempts,
          initialDelay: options.initialDelay,
          maxDelay: options.maxDelay,
          backoffMultiplier: options.backoffMultiplier,
          retryableErrors: options.retryableErrors,
        }
      );

      setData(result);
      setIsLoading(false);
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (err: any) {
      setError(err);
      setIsLoading(false);
      
      if (options.onError) {
        options.onError(err);
      }

      throw err;
    }
  };

  const reset = () => {
    setIsLoading(false);
    setError(null);
    setData(null);
  };

  return {
    mutate,
    isLoading,
    error,
    data,
    reset,
  };
}
