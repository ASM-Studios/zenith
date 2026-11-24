import type { WeatherCondition } from '@zenith/core';
import { ProviderInvalidResponseError } from '@zenith/core';

const WMO_CONDITIONS: Record<number, WeatherCondition> = {
  0: 'clear',
  1: 'mostly-clear',
  2: 'partly-cloudy',
  3: 'cloudy',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  56: 'freezing-rain',
  57: 'freezing-rain',
  61: 'rain',
  63: 'rain',
  65: 'heavy-rain',
  66: 'freezing-rain',
  67: 'freezing-rain',
  71: 'snow',
  73: 'snow',
  75: 'snow',
  77: 'snow',
  80: 'rain-showers',
  81: 'rain-showers',
  82: 'rain-showers',
  85: 'snow-showers',
  86: 'snow-showers',
  95: 'thunderstorm',
  96: 'thunderstorm',
  99: 'thunderstorm',
};

export function mapWeatherCode(providerId: string, code: number): WeatherCondition {
  const condition = WMO_CONDITIONS[code];
  if (condition === undefined) {
    throw new ProviderInvalidResponseError(providerId, `unknown WMO weather code ${code}`);
  }
  return condition;
}
