import type { CurrentConditions, DailyForecast, HourlyForecast, WeatherMeasurements } from '@zenith/core';
import type { OpenMeteoCurrent, OpenMeteoDailyResponse, OpenMeteoHourlyRow } from './schemas.ts';
import { toInstant, toLocalDate } from './time.ts';
import { mapWeatherCode } from './weather-code.ts';

function mapMeasurements(providerId: string, raw: OpenMeteoHourlyRow | OpenMeteoCurrent): WeatherMeasurements {
  return {
    time: toInstant(raw.time),
    condition: mapWeatherCode(providerId, raw.weather_code),
    temperatureCelsius: raw.temperature_2m,
    apparentTemperatureCelsius: raw.apparent_temperature ?? null,
    relativeHumidityPercent: raw.relative_humidity_2m ?? null,
    dewPointCelsius: raw.dew_point_2m ?? null,
    pressureHpa: raw.pressure_msl ?? null,
    windSpeedKmh: raw.wind_speed_10m ?? null,
    windGustKmh: raw.wind_gusts_10m ?? null,
    windDirectionDegrees: raw.wind_direction_10m ?? null,
    precipitationMm: raw.precipitation ?? null,
    cloudCoverPercent: raw.cloud_cover ?? null,
    visibilityMeters: raw.visibility ?? null,
    uvIndex: raw.uv_index ?? null,
  };
}

export function mapCurrent(providerId: string, raw: OpenMeteoCurrent): CurrentConditions {
  return {
    ...mapMeasurements(providerId, raw),
    isDay: raw.is_day === undefined || raw.is_day === null ? null : raw.is_day === 1,
  };
}

export function mapHourly(providerId: string, rows: OpenMeteoHourlyRow[]): HourlyForecast[] {
  return rows.map((row) => ({
    ...mapMeasurements(providerId, row),
    precipitationProbabilityPercent: row.precipitation_probability ?? null,
    cloudCoverLowPercent: row.cloud_cover_low ?? null,
    cloudCoverMidPercent: row.cloud_cover_mid ?? null,
    cloudCoverHighPercent: row.cloud_cover_high ?? null,
  }));
}

export function mapDaily(providerId: string, response: OpenMeteoDailyResponse): DailyForecast[] {
  return response.daily.map((row) => ({
    date: toLocalDate(row.time, response.utc_offset_seconds),
    condition: mapWeatherCode(providerId, row.weather_code),
    temperatureMinCelsius: row.temperature_2m_min,
    temperatureMaxCelsius: row.temperature_2m_max,
    precipitationSumMm: row.precipitation_sum ?? null,
    precipitationProbabilityMaxPercent: row.precipitation_probability_max ?? null,
    windSpeedMaxKmh: row.wind_speed_10m_max ?? null,
    windGustMaxKmh: row.wind_gusts_10m_max ?? null,
    uvIndexMax: row.uv_index_max ?? null,
  }));
}
