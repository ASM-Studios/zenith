import { ProviderInvalidResponseError, type CurrentConditions } from '@zenith/core';
import type { ForecastEntry } from './forecast.schema.ts';
import { MET_NORWAY_ID } from './identity.ts';
import { mapMeasurements } from './measurements.map.ts';
import { symbolParts } from './symbols.ts';

export function mapCurrent(timeseries: readonly ForecastEntry[]): CurrentConditions {
  const [entry] = timeseries;
  const period = entry?.data.next_1_hours;
  if (!entry || !period) {
    throw new ProviderInvalidResponseError(MET_NORWAY_ID, 'no hourly period at the start of the forecast');
  }
  return { ...mapMeasurements(entry, period), isDay: symbolParts(period.summary.symbol_code).isDay };
}
