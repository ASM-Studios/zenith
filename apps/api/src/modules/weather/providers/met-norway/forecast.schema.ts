import { z } from 'zod';

import { optionalNumber } from '../open-meteo/scalars.ts';

const InstantDetailsSchema = z.object({
  air_temperature: z.number(),
  relative_humidity: optionalNumber,
  dew_point_temperature: optionalNumber,
  air_pressure_at_sea_level: optionalNumber,
  wind_speed: optionalNumber,
  wind_speed_of_gust: optionalNumber,
  wind_from_direction: optionalNumber,
  cloud_area_fraction: optionalNumber,
  cloud_area_fraction_low: optionalNumber,
  cloud_area_fraction_medium: optionalNumber,
  cloud_area_fraction_high: optionalNumber,
  ultraviolet_index_clear_sky: optionalNumber,
});

const SymbolSchema = z.object({ symbol_code: z.string().min(1) });

const OneHourSchema = z.object({
  summary: SymbolSchema,
  details: z.object({
    precipitation_amount: optionalNumber,
    probability_of_precipitation: optionalNumber,
  }),
});

const SixHoursSchema = z.object({
  summary: SymbolSchema,
  details: z.object({
    air_temperature_max: z.number(),
    air_temperature_min: z.number(),
    precipitation_amount: optionalNumber,
    probability_of_precipitation: optionalNumber,
  }),
});

const EntrySchema = z.object({
  time: z.iso.datetime(),
  data: z.object({
    instant: z.object({ details: InstantDetailsSchema }),
    next_1_hours: OneHourSchema.optional(),
    next_6_hours: SixHoursSchema.optional(),
  }),
});

export const ForecastResponseSchema = z.object({
  properties: z.object({ timeseries: z.array(EntrySchema).min(1) }),
});

export type ForecastEntry = z.output<typeof EntrySchema>;
export type OneHourPeriod = z.output<typeof OneHourSchema>;
