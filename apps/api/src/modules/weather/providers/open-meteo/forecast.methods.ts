import type { WeatherProvider } from '@zenith/core';
import { fetchJson } from '../fetch-json.ts';
import { mapCurrent, mapDay, mapHour } from './forecast.map.ts';
import { currentUrl, dailyUrl, hourlyUrl } from './forecast.request.ts';
import { CurrentResponseSchema, DailyResponseSchema, HourlyResponseSchema } from './forecast.schema.ts';

interface ForecastSource {
  providerId: string;
  baseUrl: string;
}

type ForecastMethods = Required<Pick<WeatherProvider, 'getCurrent' | 'getHourly' | 'getDaily'>>;

export function createForecastMethods({ providerId, baseUrl }: ForecastSource): ForecastMethods {
  return {
    getCurrent: async ({ location, signal }) => {
      const url = currentUrl(baseUrl, location);
      const { current } = await fetchJson({ providerId, url, schema: CurrentResponseSchema, signal });
      return mapCurrent(providerId, current);
    },
    getHourly: async ({ location, signal }) => {
      const url = hourlyUrl(baseUrl, location);
      const { hourly } = await fetchJson({ providerId, url, schema: HourlyResponseSchema, signal });
      return hourly.map((row) => mapHour(providerId, row));
    },
    getDaily: async ({ location, signal }) => {
      const url = dailyUrl(baseUrl, location);
      const { daily } = await fetchJson({ providerId, url, schema: DailyResponseSchema, signal });
      return daily.map((row) => mapDay(providerId, row));
    },
  };
}
