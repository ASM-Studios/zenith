import type { WeatherProvider, WeatherQuery } from '@zenith/core';
import { requestOpenMeteo } from './client.ts';
import {
  AIR_QUALITY_VARIABLES,
  CURRENT_VARIABLES,
  DAILY_FORECAST_DAYS,
  DAILY_VARIABLES,
  DEFAULT_AIR_QUALITY_URL,
  DEFAULT_FORECAST_URL,
  HOURLY_FORECAST_HOURS,
  HOURLY_VARIABLES,
  OPEN_METEO_ATTRIBUTION,
  OPEN_METEO_DATA_TYPES,
  OPEN_METEO_ID,
} from './constants.ts';
import { mapAirQuality, mapPollen } from './map-air.ts';
import { mapCurrent, mapDaily, mapHourly } from './map-forecast.ts';
import {
  AirQualityResponseSchema,
  CurrentResponseSchema,
  DailyResponseSchema,
  HourlyResponseSchema,
} from './schemas.ts';

export interface OpenMeteoOptions {
  forecastUrl?: string;
  airQualityUrl?: string;
}

export function createOpenMeteoProvider(options: OpenMeteoOptions = {}): WeatherProvider {
  const { forecastUrl = DEFAULT_FORECAST_URL, airQualityUrl = DEFAULT_AIR_QUALITY_URL } = options;

  const fetchAirQuality = async (query: WeatherQuery) =>
    (
      await requestOpenMeteo({
        baseUrl: airQualityUrl,
        query,
        params: { current: AIR_QUALITY_VARIABLES.join(',') },
        schema: AirQualityResponseSchema,
      })
    ).current;

  return {
    id: OPEN_METEO_ID,
    attribution: OPEN_METEO_ATTRIBUTION,
    capabilities: { coverage: { kind: 'global' }, dataTypes: [...OPEN_METEO_DATA_TYPES] },
    getCurrent: async (query) =>
      mapCurrent(
        OPEN_METEO_ID,
        (
          await requestOpenMeteo({
            baseUrl: forecastUrl,
            query,
            params: { current: CURRENT_VARIABLES.join(',') },
            schema: CurrentResponseSchema,
          })
        ).current,
      ),
    getHourly: async (query) =>
      mapHourly(
        OPEN_METEO_ID,
        (
          await requestOpenMeteo({
            baseUrl: forecastUrl,
            query,
            params: { hourly: HOURLY_VARIABLES.join(','), forecast_hours: String(HOURLY_FORECAST_HOURS) },
            schema: HourlyResponseSchema,
          })
        ).hourly,
      ),
    getDaily: async (query) =>
      mapDaily(
        OPEN_METEO_ID,
        await requestOpenMeteo({
          baseUrl: forecastUrl,
          query,
          params: { daily: DAILY_VARIABLES.join(','), forecast_days: String(DAILY_FORECAST_DAYS) },
          schema: DailyResponseSchema,
        }),
      ),
    getAirQuality: async (query) => mapAirQuality(await fetchAirQuality(query)),
    getPollen: async (query) => mapPollen(await fetchAirQuality(query)),
  };
}
