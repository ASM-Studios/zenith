import type { WeatherProvider } from '@zenith/core';
import { fetchJson } from '../fetch-json.ts';
import { mapCurrent, mapDay, mapHour } from './forecast.map.ts';
import { currentUrl, dailyUrl, hourlyUrl } from './forecast.request.ts';
import { CurrentResponseSchema, DailyResponseSchema, HourlyResponseSchema } from './forecast.schema.ts';
import { OPEN_METEO_ATTRIBUTION, OPEN_METEO_ID } from './identity.ts';

export function createOpenMeteoProvider(): WeatherProvider {
  const providerId = OPEN_METEO_ID;
  return {
    id: providerId,
    attribution: OPEN_METEO_ATTRIBUTION,
    capabilities: { coverage: { kind: 'global' }, dataTypes: ['current', 'hourly', 'daily'] },
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
  };
}
