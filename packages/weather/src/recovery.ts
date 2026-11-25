import { ProviderError, ProviderQuotaError, type ProviderErrorKind, type WeatherProvider } from '@zenith/core';
import type { CacheEntry } from './cache.ts';
import { WeatherSourceError } from './errors.ts';
import { toWeatherReading, type WeatherReading } from './reading.ts';

export const STALE_SERVED_ON: ReadonlySet<ProviderErrorKind> = new Set([
  'timeout',
  'unavailable',
  'quota',
  'invalid-response',
]);

function retryAfterSeconds(error: ProviderError): number | null {
  return error instanceof ProviderQuotaError ? error.retryAfterSeconds : null;
}

export function recoverFromProviderError(
  error: unknown,
  provider: WeatherProvider,
  cached: CacheEntry<unknown> | null,
): WeatherReading {
  if (!(error instanceof ProviderError)) {
    throw error;
  }
  if (cached && STALE_SERVED_ON.has(error.kind)) {
    return toWeatherReading(provider, cached, 'stale');
  }
  throw new WeatherSourceError(provider.id, error.kind, retryAfterSeconds(error), error);
}
