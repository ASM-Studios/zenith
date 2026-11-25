import type { WeatherProvider } from '@zenith/core';
import { fetchJson } from '../fetch-json.ts';
import { mapAirQuality, mapPollen } from './air.map.ts';
import { airQualityUrl, pollenUrl } from './air.request.ts';
import { AirQualityResponseSchema, PollenResponseSchema } from './air.schema.ts';
import { createForecastMethods } from './forecast.methods.ts';
import { OPEN_METEO_ATTRIBUTION, OPEN_METEO_FORECAST_URL, OPEN_METEO_ID } from './identity.ts';

export function createOpenMeteoProvider(): WeatherProvider {
  const providerId = OPEN_METEO_ID;
  return {
    id: providerId,
    attribution: OPEN_METEO_ATTRIBUTION,
    capabilities: {
      coverage: { kind: 'global' },
      dataTypes: ['current', 'hourly', 'daily', 'airQuality', 'pollen'],
    },
    ...createForecastMethods({ providerId, baseUrl: OPEN_METEO_FORECAST_URL }),
    getAirQuality: async ({ location, signal }) => {
      const url = airQualityUrl(location);
      const { current } = await fetchJson({ providerId, url, schema: AirQualityResponseSchema, signal });
      return mapAirQuality(current);
    },
    getPollen: async ({ location, signal }) => {
      const url = pollenUrl(location);
      const { current } = await fetchJson({ providerId, url, schema: PollenResponseSchema, signal });
      return mapPollen(current);
    },
  };
}
