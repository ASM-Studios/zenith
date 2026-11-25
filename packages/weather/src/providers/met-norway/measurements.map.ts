import type { WeatherMeasurements } from '@zenith/core';
import type { ForecastEntry, OneHourPeriod } from './forecast.schema.ts';
import { conditionOf } from './symbols.ts';
import { kmhFromMetersPerSecond } from './units.ts';

export function mapMeasurements(entry: ForecastEntry, period: OneHourPeriod): WeatherMeasurements {
  const instant = entry.data.instant.details;
  return {
    time: entry.time,
    condition: conditionOf(period.summary.symbol_code),
    temperatureCelsius: instant.air_temperature,
    apparentTemperatureCelsius: null,
    relativeHumidityPercent: instant.relative_humidity,
    dewPointCelsius: instant.dew_point_temperature,
    pressureHpa: instant.air_pressure_at_sea_level,
    windSpeedKmh: kmhFromMetersPerSecond(instant.wind_speed),
    windGustKmh: kmhFromMetersPerSecond(instant.wind_speed_of_gust),
    windDirectionDegrees: instant.wind_from_direction,
    precipitationMm: period.details.precipitation_amount,
    cloudCoverPercent: instant.cloud_area_fraction,
    visibilityMeters: null,
    uvIndex: instant.ultraviolet_index_clear_sky,
  };
}
