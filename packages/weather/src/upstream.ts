import { ProviderQuotaError, type GeoPoint, type WeatherDataType, type WeatherProvider } from '@zenith/core';
import { fetchWeatherData } from './fetch.ts';
import type { QuotaGuard } from './quota.ts';
import { withRetries, type RetryOptions } from './retry.ts';

export interface UpstreamOptions {
  quota: QuotaGuard;
  timeoutMs: number;
  retry: RetryOptions;
}

export interface Upstream {
  fetch(provider: WeatherProvider, dataType: WeatherDataType, location: GeoPoint): Promise<unknown>;
}

export function createUpstream({ quota, timeoutMs, retry }: UpstreamOptions): Upstream {
  return {
    async fetch(provider, dataType, location) {
      const blockedFor = await quota.blockedFor(provider.id);
      if (blockedFor !== null) {
        throw new ProviderQuotaError(provider.id, 'provider is blocked after a quota error', {
          retryAfterSeconds: blockedFor,
        });
      }
      try {
        return await withRetries(async () => {
          await quota.recordCall(provider.id);
          return fetchWeatherData(provider, dataType, { location, signal: AbortSignal.timeout(timeoutMs) });
        }, retry);
      } catch (error) {
        if (error instanceof ProviderQuotaError) {
          await quota.block(provider.id, error.retryAfterSeconds);
        }
        throw error;
      }
    },
  };
}
