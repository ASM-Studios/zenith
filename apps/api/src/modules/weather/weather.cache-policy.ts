import type { GeoPoint, WeatherDataType } from '@zenith/core';

const COORDINATE_DECIMALS = 2;
const COORDINATE_FACTOR = 10 ** COORDINATE_DECIMALS;
const MINUTE = 60;
const HOUR = 60 * MINUTE;

export const STALE_RETENTION_SECONDS = 24 * HOUR;

export const FRESH_TTL_SECONDS: Record<WeatherDataType, number> = {
  current: 10 * MINUTE,
  hourly: 30 * MINUTE,
  daily: 3 * HOUR,
  airQuality: HOUR,
  pollen: 3 * HOUR,
  alerts: 5 * MINUTE,
};

function roundCoordinate(value: number): number {
  return Math.round(value * COORDINATE_FACTOR) / COORDINATE_FACTOR + 0;
}

export function roundLocation(location: GeoPoint): GeoPoint {
  return { latitude: roundCoordinate(location.latitude), longitude: roundCoordinate(location.longitude) };
}

export function weatherCacheKey(providerId: string, dataType: WeatherDataType, location: GeoPoint): string {
  const { latitude, longitude } = roundLocation(location);
  return `weather:${providerId}:${dataType}:${latitude.toFixed(COORDINATE_DECIMALS)}:${longitude.toFixed(COORDINATE_DECIMALS)}`;
}

export function retentionSeconds(dataType: WeatherDataType): number {
  return FRESH_TTL_SECONDS[dataType] + STALE_RETENTION_SECONDS;
}

export function isFresh(dataType: WeatherDataType, updatedAt: Date, now: Date): boolean {
  return now.getTime() - updatedAt.getTime() < FRESH_TTL_SECONDS[dataType] * 1000;
}
