import type { ProviderAttribution, WeatherProvider } from '@zenith/core';
import type { CacheEntry } from './cache.ts';

export type WeatherStatus = 'fresh' | 'stale' | 'unavailable';

export interface WeatherReading {
  data: unknown;
  provider: { id: string; attribution: ProviderAttribution };
  updatedAt: Date;
  status: 'fresh' | 'stale';
}

export function toWeatherReading(
  provider: WeatherProvider,
  entry: CacheEntry<unknown>,
  status: WeatherReading['status'],
): WeatherReading {
  return {
    data: entry.value,
    provider: { id: provider.id, attribution: provider.attribution },
    updatedAt: entry.updatedAt,
    status,
  };
}
