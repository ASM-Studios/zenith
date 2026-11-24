import { z } from 'zod';
import { WeatherConditionSchema } from './condition.ts';
import { LocalDateSchema, NonNegativeSchema, PercentSchema } from './scalars.ts';

export const DailyForecastSchema = z
  .object({
    date: LocalDateSchema,
    condition: WeatherConditionSchema,
    temperatureMinCelsius: z.number(),
    temperatureMaxCelsius: z.number(),
    precipitationSumMm: NonNegativeSchema.nullable(),
    precipitationProbabilityMaxPercent: PercentSchema.nullable(),
    windSpeedMaxKmh: NonNegativeSchema.nullable(),
    windGustMaxKmh: NonNegativeSchema.nullable(),
    uvIndexMax: NonNegativeSchema.nullable(),
  })
  .refine((day) => day.temperatureMinCelsius <= day.temperatureMaxCelsius, {
    message: 'temperatureMinCelsius must not exceed temperatureMaxCelsius',
    path: ['temperatureMinCelsius'],
  });

export type DailyForecast = z.infer<typeof DailyForecastSchema>;
