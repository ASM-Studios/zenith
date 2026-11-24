import {
  ProviderInvalidResponseError,
  type CurrentConditions,
  type DailyForecast,
  type HourlyForecast,
  type WeatherCondition,
  type WeatherMeasurements,
} from '@zenith/core';
import type { CurrentRow, DailyRow, HourlyRow, MeasurementsRow } from './forecast.schema.ts';
import { OPEN_METEO_ID } from './identity.ts';
import { conditionFromWmoCode } from './wmo.ts';

function conditionOf(code: number): WeatherCondition {
  const condition = conditionFromWmoCode(code);
  if (condition === null) {
    throw new ProviderInvalidResponseError(OPEN_METEO_ID, `unknown WMO code ${code}`);
  }
  return condition;
}

function mapMeasurements(row: MeasurementsRow): WeatherMeasurements {
  return {
    time: row.time,
    condition: conditionOf(row.weather_code),
    temperatureCelsius: row.temperature_2m,
    apparentTemperatureCelsius: row.apparent_temperature,
    relativeHumidityPercent: row.relative_humidity_2m,
    dewPointCelsius: row.dew_point_2m,
    pressureHpa: row.pressure_msl,
    windSpeedKmh: row.wind_speed_10m,
    windGustKmh: row.wind_gusts_10m,
    windDirectionDegrees: row.wind_direction_10m,
    precipitationMm: row.precipitation,
    cloudCoverPercent: row.cloud_cover,
    visibilityMeters: row.visibility,
    uvIndex: row.uv_index,
  };
}

export function mapCurrent(row: CurrentRow): CurrentConditions {
  return { ...mapMeasurements(row), isDay: row.is_day === null ? null : row.is_day === 1 };
}

export function mapHour(row: HourlyRow): HourlyForecast {
  return {
    ...mapMeasurements(row),
    precipitationProbabilityPercent: row.precipitation_probability,
    cloudCoverLowPercent: row.cloud_cover_low,
    cloudCoverMidPercent: row.cloud_cover_mid,
    cloudCoverHighPercent: row.cloud_cover_high,
  };
}

export function mapDay(row: DailyRow): DailyForecast {
  return {
    date: row.time,
    condition: conditionOf(row.weather_code),
    temperatureMinCelsius: row.temperature_2m_min,
    temperatureMaxCelsius: row.temperature_2m_max,
    precipitationSumMm: row.precipitation_sum,
    precipitationProbabilityMaxPercent: row.precipitation_probability_max,
    windSpeedMaxKmh: row.wind_speed_10m_max,
    windGustMaxKmh: row.wind_gusts_10m_max,
    uvIndexMax: row.uv_index_max,
  };
}
