import { ProviderError, type ProviderErrorKind } from '@zenith/core';

export const RETRIED_ON: ReadonlySet<ProviderErrorKind> = new Set(['timeout', 'unavailable']);

export interface RetryOptions {
  retries: number;
  baseDelayMs: number;
  sleep: (milliseconds: number) => Promise<void>;
}

export const DEFAULT_RETRY: RetryOptions = {
  retries: 2,
  baseDelayMs: 200,
  sleep: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
};

export async function withRetries<T>(attempt: () => Promise<T>, options: RetryOptions, failures = 0): Promise<T> {
  try {
    return await attempt();
  } catch (error) {
    const retryable = error instanceof ProviderError && RETRIED_ON.has(error.kind);
    if (!retryable || failures >= options.retries) {
      throw error;
    }
    await options.sleep(options.baseDelayMs * 2 ** failures);
    return withRetries(attempt, options, failures + 1);
  }
}
