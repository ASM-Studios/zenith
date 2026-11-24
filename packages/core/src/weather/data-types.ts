import { z } from 'zod';

export const WEATHER_DATA_TYPES = ['current', 'hourly', 'daily', 'airQuality', 'pollen', 'alerts'] as const;

export const WeatherDataTypeSchema = z.enum(WEATHER_DATA_TYPES);

export type WeatherDataType = z.infer<typeof WeatherDataTypeSchema>;
