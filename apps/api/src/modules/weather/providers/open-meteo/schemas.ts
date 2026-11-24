import { z } from 'zod';

const optionalNumber = z.number().nullish();

const measurementShape = {
  time: z.number(),
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
};

const CurrentSchema = z.object({ ...measurementShape, is_day: optionalNumber });

const HourlyRowSchema = z.object({
  ...measurementShape,
  precipitation_probability: optionalNumber,
  cloud_cover_low: optionalNumber,
  cloud_cover_mid: optionalNumber,
  cloud_cover_high: optionalNumber,
});

const DailyRowSchema = z.object({
  time: z.number(),
  weather_code: z.number(),
  temperature_2m_max: z.number(),
  temperature_2m_min: z.number(),
  precipitation_sum: optionalNumber,
  precipitation_probability_max: optionalNumber,
  wind_speed_10m_max: optionalNumber,
  wind_gusts_10m_max: optionalNumber,
  uv_index_max: optionalNumber,
});

const AirQualityCurrentSchema = z.object({
  time: z.number(),
  european_aqi: optionalNumber,
  us_aqi: optionalNumber,
  pm2_5: optionalNumber,
  pm10: optionalNumber,
  ozone: optionalNumber,
  nitrogen_dioxide: optionalNumber,
  sulphur_dioxide: optionalNumber,
  carbon_monoxide: optionalNumber,
  alder_pollen: optionalNumber,
  birch_pollen: optionalNumber,
  grass_pollen: optionalNumber,
  mugwort_pollen: optionalNumber,
  olive_pollen: optionalNumber,
  ragweed_pollen: optionalNumber,
});

const ColumnsSchema = z
  .object({ time: z.array(z.number()).min(1) })
  .catchall(z.array(optionalNumber))
  .transform((columns) =>
    columns.time.map((_, index) =>
      Object.fromEntries(Object.entries(columns).map(([name, column]) => [name, column[index]])),
    ),
  );

export const CurrentResponseSchema = z.object({ current: CurrentSchema });
export const HourlyResponseSchema = z.object({ hourly: ColumnsSchema.pipe(z.array(HourlyRowSchema)) });
export const DailyResponseSchema = z.object({
  utc_offset_seconds: z.number(),
  daily: ColumnsSchema.pipe(z.array(DailyRowSchema)),
});
export const AirQualityResponseSchema = z.object({ current: AirQualityCurrentSchema });

export type OpenMeteoCurrent = z.infer<typeof CurrentSchema>;
export type OpenMeteoHourlyRow = z.infer<typeof HourlyRowSchema>;
export type OpenMeteoDailyRow = z.infer<typeof DailyRowSchema>;
export type OpenMeteoAirQuality = z.infer<typeof AirQualityCurrentSchema>;
export type OpenMeteoDailyResponse = z.infer<typeof DailyResponseSchema>;
