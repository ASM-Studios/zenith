import type { GeoPoint } from '@zenith/core';
import { CurrentRowSchema, DailyRowSchema, HourlyRowSchema } from './forecast.schema.ts';
import { locationUrl, variablesOf } from './request.ts';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const FORECAST_HOURS = 48;
const FORECAST_DAYS = 7;

export function currentUrl(location: GeoPoint): URL {
  return locationUrl(FORECAST_URL, location, { timezone: 'GMT', current: variablesOf(CurrentRowSchema) });
}

export function hourlyUrl(location: GeoPoint): URL {
  return locationUrl(FORECAST_URL, location, {
    timezone: 'GMT',
    forecast_hours: String(FORECAST_HOURS),
    hourly: variablesOf(HourlyRowSchema),
  });
}

export function dailyUrl(location: GeoPoint): URL {
  return locationUrl(FORECAST_URL, location, {
    timezone: 'auto',
    forecast_days: String(FORECAST_DAYS),
    daily: variablesOf(DailyRowSchema),
  });
}
