import { describe, expect, it } from 'vitest';
import {
  ProviderError,
  ProviderInvalidResponseError,
  ProviderQuotaError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  ProviderUnsupportedError,
} from './errors.ts';

describe('provider errors', () => {
  it.each([
    [ProviderTimeoutError, 'timeout'],
    [ProviderUnavailableError, 'unavailable'],
    [ProviderQuotaError, 'quota'],
    [ProviderInvalidResponseError, 'invalid-response'],
    [ProviderUnsupportedError, 'unsupported'],
  ] as const)('%o carries its kind, provider and message', (ErrorClass, kind) => {
    const error = new ErrorClass('open-meteo', 'request failed');

    expect(error.kind).toBe(kind);
    expect(error.providerId).toBe('open-meteo');
    expect(error.message).toBe('request failed');
    expect(error.name).toBe(ErrorClass.name);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error).toBeInstanceOf(Error);
  });

  it('keeps the original failure as cause', () => {
    const cause = new TypeError('fetch failed');
    expect(new ProviderUnavailableError('met-norway', 'unreachable', { cause }).cause).toBe(cause);
  });

  it('exposes the retry delay of a quota error', () => {
    expect(new ProviderQuotaError('open-meteo', 'rate limited', { retryAfterSeconds: 60 }).retryAfterSeconds).toBe(60);
  });

  it('leaves the retry delay null when the source gives none', () => {
    expect(new ProviderQuotaError('open-meteo', 'rate limited').retryAfterSeconds).toBeNull();
  });
});
