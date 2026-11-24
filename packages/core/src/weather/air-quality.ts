import { z } from 'zod';
import { InstantSchema, NonNegativeSchema } from './scalars.ts';

export const AIR_QUALITY_SCALES = ['european', 'us'] as const;

export const AirQualityIndexSchema = z.object({
  scale: z.enum(AIR_QUALITY_SCALES),
  value: NonNegativeSchema,
});

export const PollutantConcentrationsSchema = z.object({
  pm25: NonNegativeSchema.nullable(),
  pm10: NonNegativeSchema.nullable(),
  ozone: NonNegativeSchema.nullable(),
  nitrogenDioxide: NonNegativeSchema.nullable(),
  sulphurDioxide: NonNegativeSchema.nullable(),
  carbonMonoxide: NonNegativeSchema.nullable(),
});

export const AirQualitySchema = z.object({
  time: InstantSchema,
  index: AirQualityIndexSchema.nullable(),
  concentrationsMicrogramsPerCubicMeter: PollutantConcentrationsSchema,
});

export type AirQualityIndex = z.infer<typeof AirQualityIndexSchema>;
export type AirQuality = z.infer<typeof AirQualitySchema>;
