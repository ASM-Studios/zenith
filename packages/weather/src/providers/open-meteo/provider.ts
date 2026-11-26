import type { WeatherProvider } from '@zenith/core';
import { fetchJson } from '../fetch-json.ts';
import { mapAirQuality, mapPollen } from './air.map.ts';
import { airQualityUrl, pollenUrl } from './air.request.ts';
import { AirQualityResponseSchema, PollenResponseSchema } from './air.schema.ts';
import { mapCurrent, mapDay, mapHour } from './forecast.map.ts';
import { currentUrl, dailyUrl, hourlyUrl } from './forecast.request.ts';
import { CurrentResponseSchema, DailyResponseSchema, HourlyResponseSchema } from './forecast.schema.ts';
import { OPEN_METEO_ATTRIBUTION, OPEN_METEO_ID } from './identity.ts';

export function createOpenMeteoProvider(): WeatherProvider {
  const providerId = OPEN_METEO_ID;
  return {
    id: providerId,
    attribution: OPEN_METEO_ATTRIBUTION,
    capabilities: {
      coverage: { kind: 'global' },
      dataTypes: ['current', 'hourly', 'daily', 'airQuality', 'pollen'],
    },
    getCurrent: async ({ location, signal }) => {
      const url = currentUrl(location);
      const { current } = await fetchJson({ providerId, url, schema: CurrentResponseSchema, signal });
      return mapCurrent(current);
    },
    getHourly: async ({ location, signal }) => {
      const url = hourlyUrl(location);
      const { hourly } = await fetchJson({ providerId, url, schema: HourlyResponseSchema, signal });
      return hourly.map(mapHour);
    },
    getDaily: async ({ location, signal }) => {
      const url = dailyUrl(location);
      const { daily } = await fetchJson({ providerId, url, schema: DailyResponseSchema, signal });
      return daily.map(mapDay);
    },
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
