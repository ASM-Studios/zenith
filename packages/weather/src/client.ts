import { ProviderAttributionSchema, type GeoPoint, type WeatherDataType } from '@zenith/core';
import { z } from 'zod';
import type { WeatherReading } from './reading.ts';
import { WEATHER_ROUTE_PATHS } from './routes.ts';
import type { WeatherService } from './service.ts';

export type WeatherFetch = (input: string) => Promise<Response>;

export interface WeatherClientOptions {
  apiBaseUrl: string;
  direct: WeatherService;
  fetch?: WeatherFetch;
}

export interface WeatherClient {
  get(dataType: WeatherDataType, location: GeoPoint, preferredIds?: readonly string[]): Promise<WeatherReading>;
}

const apiReadingSchema = z.object({
  data: z.unknown(),
  provider: z.object({ id: z.string().min(1), attribution: ProviderAttributionSchema }),
  updatedAt: z.iso.datetime().transform((iso) => new Date(iso)),
  status: z.enum(['fresh', 'stale']),
});

const defaultFetch: WeatherFetch = (input) => globalThis.fetch(input);

function apiUrl(baseUrl: string, dataType: WeatherDataType, location: GeoPoint, preferredIds: readonly string[]) {
  const query = new URLSearchParams({ latitude: String(location.latitude), longitude: String(location.longitude) });
  if (preferredIds[0] !== undefined) {
    query.set('provider', preferredIds[0]);
  }
  return `${baseUrl}${WEATHER_ROUTE_PATHS[dataType]}?${query.toString()}`;
}

async function readFromApi(fetch: WeatherFetch, url: string): Promise<WeatherReading | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return apiReadingSchema.parse(await response.json());
  } catch {
    return null;
  }
}

export function createWeatherClient({ apiBaseUrl, direct, fetch = defaultFetch }: WeatherClientOptions): WeatherClient {
  return {
    async get(dataType, location, preferredIds = []) {
      const fromApi = await readFromApi(fetch, apiUrl(apiBaseUrl, dataType, location, preferredIds));
      return fromApi ?? direct.get(dataType, location, preferredIds);
    },
  };
}
