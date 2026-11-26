import type { GeoPoint, WeatherDataType, WeatherProvider } from '@zenith/core';
import type { Cache } from './cache.ts';
import { isFresh, retentionSeconds, roundLocation, weatherCacheKey } from './cache-policy.ts';
import { weatherDataSchemas } from './data.ts';
import { NoWeatherProviderError } from './errors.ts';
import { createQuotaGuard } from './quota.ts';
import { recoverFromProviderError } from './recovery.ts';
import { toWeatherReading, type WeatherReading } from './reading.ts';
import { createWeatherRegistry } from './registry.ts';
import { DEFAULT_RETRY, type RetryOptions } from './retry.ts';
import { createUpstream } from './upstream.ts';

export const DEFAULT_PROVIDER_TIMEOUT_MS = 10_000;

export interface WeatherServiceOptions {
  cache: Cache;
  providers: readonly WeatherProvider[];
  logger: { warn(obj: object, msg: string): void };
  now?: () => Date;
  timeoutMs?: number;
  retry?: Partial<RetryOptions>;
  dailyCallWarning?: number;
}

export interface WeatherService {
  get(dataType: WeatherDataType, location: GeoPoint, preferredIds?: readonly string[]): Promise<WeatherReading>;
}

export function createWeatherService(options: WeatherServiceOptions): WeatherService {
  const { cache, logger, now = () => new Date(), timeoutMs = DEFAULT_PROVIDER_TIMEOUT_MS } = options;
  const registry = createWeatherRegistry(options.providers);
  const quota = createQuotaGuard(cache, { logger, now, dailyCallWarning: options.dailyCallWarning });
  const upstream = createUpstream({ quota, timeoutMs, retry: { ...DEFAULT_RETRY, ...options.retry } });

  return {
    async get(dataType, location, preferredIds = []) {
      const point = roundLocation(location);
      const provider = registry.select(dataType, point, preferredIds);
      if (!provider) {
        throw new NoWeatherProviderError(dataType);
      }
      const key = weatherCacheKey(provider.id, dataType, point);
      const cached = await cache.get(key, weatherDataSchemas[dataType]);
      if (cached && isFresh(dataType, cached.updatedAt, now())) {
        return toWeatherReading(provider, cached, 'fresh');
      }
      try {
        const data = await upstream.fetch(provider, dataType, point);
        return toWeatherReading(provider, await cache.set(key, data, retentionSeconds(dataType)), 'fresh');
      } catch (error) {
        logger.warn({ err: error, providerId: provider.id, dataType }, 'weather provider call failed');
        return recoverFromProviderError(error, provider, cached);
      }
    },
  };
}
