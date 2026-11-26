import type { ProviderAttribution, WeatherProvider } from '@zenith/core';
import type { CacheEntry } from './cache.ts';

export interface WeatherReading {
  data: unknown;
  provider: { id: string; attribution: ProviderAttribution };
  updatedAt: Date;
  stale: boolean;
}

export function toWeatherReading(
  provider: WeatherProvider,
  entry: CacheEntry<unknown>,
  stale: boolean,
): WeatherReading {
  return {
    data: entry.value,
    provider: { id: provider.id, attribution: provider.attribution },
    updatedAt: entry.updatedAt,
    stale,
  };
}
