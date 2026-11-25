import type { WeatherDataType } from '@zenith/core';

export const WEATHER_ROUTE_PATHS: Record<WeatherDataType, string> = {
  current: '/api/weather/current',
  hourly: '/api/weather/hourly',
  daily: '/api/weather/daily',
  airQuality: '/api/weather/air-quality',
  pollen: '/api/weather/pollen',
  alerts: '/api/weather/alerts',
};
