import { z } from 'zod';
import { GmtMinuteSchema, optionalNumber } from './scalars.ts';

const MeasurementsRowSchema = z.object({
  time: GmtMinuteSchema,
  temperature_2m: z.number(),
  weather_code: z.number(),
  apparent_temperature: optionalNumber,
  relative_humidity_2m: optionalNumber,
  dew_point_2m: optionalNumber,
  pressure_msl: optionalNumber,
  wind_speed_10m: optionalNumber,
  wind_gusts_10m: optionalNumber,
  wind_direction_10m: optionalNumber,
  precipitation: optionalNumber,
  cloud_cover: optionalNumber,
  visibility: optionalNumber,
  uv_index: optionalNumber,
});

export const CurrentRowSchema = MeasurementsRowSchema.extend({ is_day: optionalNumber });

export const HourlyRowSchema = MeasurementsRowSchema.extend({
  precipitation_probability: optionalNumber,
  cloud_cover_low: optionalNumber,
  cloud_cover_mid: optionalNumber,
  cloud_cover_high: optionalNumber,
});

export const DailyRowSchema = z.object({
  time: z.iso.date(),
  weather_code: z.number(),
  temperature_2m_min: z.number(),
  temperature_2m_max: z.number(),
  precipitation_sum: optionalNumber,
  precipitation_probability_max: optionalNumber,
  wind_speed_10m_max: optionalNumber,
  wind_gusts_10m_max: optionalNumber,
  uv_index_max: optionalNumber,
});

const ColumnsSchema = z.object({ time: z.array(z.unknown()) }).catchall(z.array(z.unknown()));

function rowsOf<Row extends z.ZodType>(row: Row) {
  return ColumnsSchema.transform((columns) =>
    columns.time.map((_, index): unknown =>
      Object.fromEntries(Object.entries(columns).map(([name, values]) => [name, values[index]])),
    ),
  ).pipe(z.array(row).min(1));
}

export const CurrentResponseSchema = z.object({ current: CurrentRowSchema });
export const HourlyResponseSchema = z.object({ hourly: rowsOf(HourlyRowSchema) });
export const DailyResponseSchema = z.object({ daily: rowsOf(DailyRowSchema) });

export type MeasurementsRow = z.output<typeof MeasurementsRowSchema>;
export type CurrentRow = z.output<typeof CurrentRowSchema>;
export type HourlyRow = z.output<typeof HourlyRowSchema>;
export type DailyRow = z.output<typeof DailyRowSchema>;
