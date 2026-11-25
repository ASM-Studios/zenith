import type { GeoPoint } from '@zenith/core';
import { CurrentRowSchema, DailyRowSchema, HourlyRowSchema } from './forecast.schema.ts';
import { locationUrl, variablesOf } from './request.ts';

const FORECAST_HOURS = 48;
const FORECAST_DAYS = 7;

export function currentUrl(baseUrl: string, location: GeoPoint): URL {
  return locationUrl(baseUrl, location, { timezone: 'GMT', current: variablesOf(CurrentRowSchema) });
}

export function hourlyUrl(baseUrl: string, location: GeoPoint): URL {
  return locationUrl(baseUrl, location, {
    timezone: 'GMT',
    forecast_hours: String(FORECAST_HOURS),
    hourly: variablesOf(HourlyRowSchema),
  });
}

export function dailyUrl(baseUrl: string, location: GeoPoint): URL {
  return locationUrl(baseUrl, location, {
    timezone: 'auto',
    forecast_days: String(FORECAST_DAYS),
    daily: variablesOf(DailyRowSchema),
  });
}
