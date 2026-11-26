import type { GeoPoint } from '@zenith/core';
import { AirQualityRowSchema, PollenRowSchema } from './air.schema.ts';
import { locationUrl, variablesOf } from './request.ts';

const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export function airQualityUrl(location: GeoPoint): URL {
  return locationUrl(AIR_QUALITY_URL, location, { timezone: 'GMT', current: variablesOf(AirQualityRowSchema) });
}

export function pollenUrl(location: GeoPoint): URL {
  return locationUrl(AIR_QUALITY_URL, location, { timezone: 'GMT', current: variablesOf(PollenRowSchema) });
}
