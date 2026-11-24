import type { ProviderAttribution, WeatherDataType } from '@zenith/core';

export const OPEN_METEO_ID = 'open-meteo';

export const OPEN_METEO_ATTRIBUTION: ProviderAttribution = {
  name: 'Open-Meteo',
  url: 'https://open-meteo.com',
  licence: 'CC BY 4.0',
  licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
};

export const OPEN_METEO_DATA_TYPES: WeatherDataType[] = ['current', 'hourly', 'daily', 'airQuality', 'pollen'];

export const DEFAULT_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
export const DEFAULT_AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

export const HOURLY_FORECAST_HOURS = 48;
export const DAILY_FORECAST_DAYS = 7;

const MEASUREMENT_VARIABLES = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'dew_point_2m',
  'weather_code',
  'pressure_msl',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
  'precipitation',
  'cloud_cover',
  'visibility',
  'uv_index',
];

export const CURRENT_VARIABLES = [...MEASUREMENT_VARIABLES, 'is_day'];

export const HOURLY_VARIABLES = [
  ...MEASUREMENT_VARIABLES,
  'precipitation_probability',
  'cloud_cover_low',
  'cloud_cover_mid',
  'cloud_cover_high',
];

export const DAILY_VARIABLES = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
  'wind_gusts_10m_max',
  'uv_index_max',
];

export const AIR_QUALITY_VARIABLES = [
  'european_aqi',
  'us_aqi',
  'pm2_5',
  'pm10',
  'ozone',
  'nitrogen_dioxide',
  'sulphur_dioxide',
  'carbon_monoxide',
  'alder_pollen',
  'birch_pollen',
  'grass_pollen',
  'mugwort_pollen',
  'olive_pollen',
  'ragweed_pollen',
];
