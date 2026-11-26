import {
  AirQualitySchema,
  AlertSchema,
  CurrentConditionsSchema,
  DailyForecastSchema,
  HourlyForecastSchema,
  PollenSchema,
  type WeatherDataType,
} from '@zenith/core';
import { z } from 'zod';

export const weatherDataSchemas: Record<WeatherDataType, z.ZodType> = {
  current: CurrentConditionsSchema,
  hourly: z.array(HourlyForecastSchema),
  daily: z.array(DailyForecastSchema),
  airQuality: AirQualitySchema,
  pollen: PollenSchema,
  alerts: z.array(AlertSchema),
};
