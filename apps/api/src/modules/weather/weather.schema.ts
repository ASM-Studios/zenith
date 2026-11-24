import type { WeatherDataType } from '@zenith/core';
import { z } from 'zod';

export const WEATHER_ROUTE_PATHS: Record<WeatherDataType, string> = {
  current: '/api/weather/current',
  hourly: '/api/weather/hourly',
  daily: '/api/weather/daily',
  airQuality: '/api/weather/air-quality',
  pollen: '/api/weather/pollen',
  alerts: '/api/weather/alerts',
};

function coordinate(min: number, max: number) {
  return z.string().trim().min(1).transform(Number).pipe(z.number().min(min).max(max));
}

export const weatherQuery = z.object({
  latitude: coordinate(-90, 90),
  longitude: coordinate(-180, 180),
  provider: z.string().min(1).max(64).optional(),
});

export function describeIssues(issues: readonly z.core.$ZodIssue[]): string {
  return issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
}
