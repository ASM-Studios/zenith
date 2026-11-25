import type { WeatherProvider } from '@zenith/core';
import { createForecastMethods } from '../open-meteo/forecast.methods.ts';
import { METEO_FRANCE_COVERAGE } from './coverage.ts';
import { METEO_FRANCE_ATTRIBUTION, METEO_FRANCE_FORECAST_URL, METEO_FRANCE_ID } from './identity.ts';

export function createMeteoFranceProvider(): WeatherProvider {
  return {
    id: METEO_FRANCE_ID,
    attribution: METEO_FRANCE_ATTRIBUTION,
    capabilities: { coverage: METEO_FRANCE_COVERAGE, dataTypes: ['current', 'hourly', 'daily'] },
    ...createForecastMethods({ providerId: METEO_FRANCE_ID, baseUrl: METEO_FRANCE_FORECAST_URL }),
  };
}
