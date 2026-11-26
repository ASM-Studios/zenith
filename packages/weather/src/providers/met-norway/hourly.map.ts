import { ProviderInvalidResponseError, type HourlyForecast } from '@zenith/core';
import type { ForecastEntry, OneHourPeriod } from './forecast.schema.ts';
import { MET_NORWAY_ID } from './identity.ts';
import { mapMeasurements } from './measurements.map.ts';

const FORECAST_HOURS = 48;

function mapHour(entry: ForecastEntry, period: OneHourPeriod): HourlyForecast {
  const instant = entry.data.instant.details;
  return {
    ...mapMeasurements(entry, period),
    precipitationProbabilityPercent: period.details.probability_of_precipitation,
    cloudCoverLowPercent: instant.cloud_area_fraction_low,
    cloudCoverMidPercent: instant.cloud_area_fraction_medium,
    cloudCoverHighPercent: instant.cloud_area_fraction_high,
  };
}

export function mapHourly(timeseries: readonly ForecastEntry[]): HourlyForecast[] {
  const hours: HourlyForecast[] = [];
  for (const entry of timeseries) {
    const period = entry.data.next_1_hours;
    if (period) {
      hours.push(mapHour(entry, period));
    }
    if (hours.length === FORECAST_HOURS) {
      break;
    }
  }
  if (hours.length === 0) {
    throw new ProviderInvalidResponseError(MET_NORWAY_ID, 'no hourly period in the forecast');
  }
  return hours;
}
