import { z } from 'zod';
import { WeatherConditionSchema } from './condition.ts';
import { CompassDegreesSchema, InstantSchema, NonNegativeSchema, PercentSchema } from './scalars.ts';

export const WeatherMeasurementsSchema = z.object({
  time: InstantSchema,
  condition: WeatherConditionSchema,
  temperatureCelsius: z.number(),
  apparentTemperatureCelsius: z.number().nullable(),
  relativeHumidityPercent: PercentSchema.nullable(),
  dewPointCelsius: z.number().nullable(),
  pressureHpa: z.number().positive().nullable(),
  windSpeedKmh: NonNegativeSchema.nullable(),
  windGustKmh: NonNegativeSchema.nullable(),
  windDirectionDegrees: CompassDegreesSchema.nullable(),
  precipitationMm: NonNegativeSchema.nullable(),
  cloudCoverPercent: PercentSchema.nullable(),
  visibilityMeters: NonNegativeSchema.nullable(),
  uvIndex: NonNegativeSchema.nullable(),
});

export type WeatherMeasurements = z.infer<typeof WeatherMeasurementsSchema>;
