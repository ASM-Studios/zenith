import { z } from 'zod';

export const WEATHER_CONDITIONS = [
  'clear',
  'mostly-clear',
  'partly-cloudy',
  'cloudy',
  'fog',
  'drizzle',
  'rain',
  'heavy-rain',
  'freezing-rain',
  'sleet',
  'snow',
  'rain-showers',
  'snow-showers',
  'thunderstorm',
] as const;

export const WeatherConditionSchema = z.enum(WEATHER_CONDITIONS);

export type WeatherCondition = z.infer<typeof WeatherConditionSchema>;
