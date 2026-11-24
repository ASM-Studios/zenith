import { z } from 'zod';
import { GmtMinuteSchema, optionalNumber } from './scalars.ts';

export const AirQualityRowSchema = z.object({
  time: GmtMinuteSchema,
  european_aqi: optionalNumber,
  us_aqi: optionalNumber,
  pm2_5: optionalNumber,
  pm10: optionalNumber,
  ozone: optionalNumber,
  nitrogen_dioxide: optionalNumber,
  sulphur_dioxide: optionalNumber,
  carbon_monoxide: optionalNumber,
});

export const PollenRowSchema = z.object({
  time: GmtMinuteSchema,
  alder_pollen: optionalNumber,
  birch_pollen: optionalNumber,
  grass_pollen: optionalNumber,
  mugwort_pollen: optionalNumber,
  olive_pollen: optionalNumber,
  ragweed_pollen: optionalNumber,
});

export const AirQualityResponseSchema = z.object({ current: AirQualityRowSchema });
export const PollenResponseSchema = z.object({ current: PollenRowSchema });

export type AirQualityRow = z.output<typeof AirQualityRowSchema>;
export type PollenRow = z.output<typeof PollenRowSchema>;
