import { z } from 'zod';
import { WeatherMeasurementsSchema } from './measurements.ts';

export const CurrentConditionsSchema = WeatherMeasurementsSchema.extend({
  isDay: z.boolean().nullable(),
});

export type CurrentConditions = z.infer<typeof CurrentConditionsSchema>;
