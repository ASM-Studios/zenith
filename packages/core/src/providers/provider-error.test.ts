import { describe, expect, it } from 'vitest';
import { isProviderError, ProviderQuotaError, ProviderTimeoutError, ProviderUnavailableError } from '../index.ts';

describe('provider errors', () => {
  it('tags a timeout with its kind, provider and delay', () => {
    const error = new ProviderTimeoutError('open-meteo', 5000);

    expect(error).toMatchObject({ kind: 'timeout', providerId: 'open-meteo', timeoutMs: 5000 });
    expect(error.name).toBe('ProviderTimeoutError');
    expect(error.message).toBe('open-meteo did not answer within 5000 ms');
  });

  it('reports the status of an unavailable provider when it answered', () => {
    const error = new ProviderUnavailableError('met-norway', 503);

    expect(error).toMatchObject({ kind: 'unavailable', status: 503 });
    expect(error.message).toBe('met-norway is unavailable: answered with status 503');
  });

  it('reports an unreachable provider when there is no status', () => {
    const error = new ProviderUnavailableError('met-norway');

    expect(error.status).toBeUndefined();
    expect(error.message).toBe('met-norway is unavailable: unreachable');
  });

  it('keeps the retry delay of a quota error', () => {
    const error = new ProviderQuotaError('meteo-france', 60);

    expect(error).toMatchObject({ kind: 'quota', retryAfterSeconds: 60 });
    expect(error.message).toBe('meteo-france quota exceeded');
  });

  it('keeps the original failure as the cause', () => {
    const cause = new Error('socket hang up');

    expect(new ProviderUnavailableError('open-meteo', undefined, { cause }).cause).toBe(cause);
  });

  it('recognises provider errors and rejects other errors', () => {
    expect(isProviderError(new ProviderQuotaError('open-meteo'))).toBe(true);
    expect(isProviderError(new Error('boom'))).toBe(false);
    expect(isProviderError('timeout')).toBe(false);
  });
});
