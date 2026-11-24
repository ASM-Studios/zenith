import type { z } from 'zod';
import { WeatherMeasurementsSchema } from './measurements.ts';
import { PercentSchema } from './scalars.ts';

export const HourlyForecastSchema = WeatherMeasurementsSchema.extend({
  precipitationProbabilityPercent: PercentSchema.nullable(),
  cloudCoverLowPercent: PercentSchema.nullable(),
  cloudCoverMidPercent: PercentSchema.nullable(),
  cloudCoverHighPercent: PercentSchema.nullable(),
});

export type HourlyForecast = z.infer<typeof HourlyForecastSchema>;
