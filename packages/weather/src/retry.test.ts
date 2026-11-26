import {
  ProviderInvalidResponseError,
  ProviderQuotaError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  ProviderUnsupportedError,
} from '@zenith/core';
import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_RETRY, withRetries, type RetryOptions } from './retry.ts';

function options(retries = 2): RetryOptions & { sleep: ReturnType<typeof vi.fn<(ms: number) => Promise<void>>> } {
  return { retries, baseDelayMs: 100, sleep: vi.fn<(ms: number) => Promise<void>>(() => Promise.resolve()) };
}

function failingTimes(count: number, error: Error) {
  let calls = 0;
  return vi.fn<() => Promise<string>>(() => {
    calls += 1;
    return calls <= count ? Promise.reject(error) : Promise.resolve('ok');
  });
}

describe('withRetries', () => {
  it('returns the first result without sleeping', async () => {
    const retry = options();

    await expect(withRetries(() => Promise.resolve('ok'), retry)).resolves.toBe('ok');
    expect(retry.sleep).not.toHaveBeenCalled();
  });

  it.each([
    ['timeout', new ProviderTimeoutError('stub', 'timed out')],
    ['unavailable', new ProviderUnavailableError('stub', 'HTTP 503')],
  ])('retries a %s error until the call succeeds', async (_kind, error) => {
    const attempt = failingTimes(2, error);

    await expect(withRetries(attempt, options())).resolves.toBe('ok');
    expect(attempt).toHaveBeenCalledTimes(3);
  });

  it('doubles the delay after each failure', async () => {
    const retry = options();

    await withRetries(failingTimes(2, new ProviderTimeoutError('stub', 'timed out')), retry);

    expect(retry.sleep.mock.calls).toEqual([[100], [200]]);
  });

  it('gives up after the configured retries and throws the last error', async () => {
    const error = new ProviderUnavailableError('stub', 'HTTP 503');
    const attempt = failingTimes(10, error);

    await expect(withRetries(attempt, options(2))).rejects.toBe(error);
    expect(attempt).toHaveBeenCalledTimes(3);
  });

  it('waits on a real timer by default', async () => {
    vi.useFakeTimers();
    const attempt = failingTimes(1, new ProviderTimeoutError('stub', 'timed out'));

    const result = withRetries(attempt, DEFAULT_RETRY);
    await vi.advanceTimersByTimeAsync(DEFAULT_RETRY.baseDelayMs);
    vi.useRealTimers();

    await expect(result).resolves.toBe('ok');
  });

  it('does not retry when retries is zero', async () => {
    const attempt = failingTimes(1, new ProviderTimeoutError('stub', 'timed out'));

    await expect(withRetries(attempt, options(0))).rejects.toBeInstanceOf(ProviderTimeoutError);
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['quota', new ProviderQuotaError('stub', 'HTTP 429')],
    ['invalid-response', new ProviderInvalidResponseError('stub', 'not JSON')],
    ['unsupported', new ProviderUnsupportedError('stub', 'outside coverage')],
    ['unknown', new TypeError('bug')],
  ])('does not retry a %s error', async (_kind, error) => {
    const attempt = failingTimes(1, error);

    await expect(withRetries(attempt, options())).rejects.toBe(error);
    expect(attempt).toHaveBeenCalledTimes(1);
  });
});
