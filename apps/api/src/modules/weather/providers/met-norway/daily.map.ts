import { ProviderInvalidResponseError, type DailyForecast } from '@zenith/core';
import type { ForecastEntry } from './forecast.schema.ts';
import { MET_NORWAY_ID } from './identity.ts';
import { conditionOf } from './symbols.ts';
import { kmhFromMetersPerSecond, maxOrNull, sumOrNull } from './units.ts';

const FORECAST_DAYS = 7;
const BLOCK_HOURS = new Set([0, 6, 12, 18]);
const MIDDAY_HOUR = 12;

const dateOf = (entry: ForecastEntry) => entry.time.slice(0, 10);
const hourOf = (entry: ForecastEntry) => Number(entry.time.slice(11, 13));

function groupByDate(timeseries: readonly ForecastEntry[]): Map<string, ForecastEntry[]> {
  const days = new Map<string, ForecastEntry[]>();
  for (const entry of timeseries) {
    const date = dateOf(entry);
    const entries = days.get(date) ?? [];
    entries.push(entry);
    days.set(date, entries);
  }
  return days;
}

function mapDay(date: string, entries: readonly ForecastEntry[]): DailyForecast | null {
  const blocks = entries.flatMap((entry) =>
    entry.data.next_6_hours && BLOCK_HOURS.has(hourOf(entry)) ? [{ entry, period: entry.data.next_6_hours }] : [],
  );
  const representative = blocks.find(({ entry }) => hourOf(entry) === MIDDAY_HOUR) ?? blocks[0];
  if (!representative) {
    return null;
  }
  const instants = entries.map((entry) => entry.data.instant.details);
  return {
    date,
    condition: conditionOf(representative.period.summary.symbol_code),
    temperatureMinCelsius: Math.min(...blocks.map(({ period }) => period.details.air_temperature_min)),
    temperatureMaxCelsius: Math.max(...blocks.map(({ period }) => period.details.air_temperature_max)),
    precipitationSumMm: sumOrNull(blocks.map(({ period }) => period.details.precipitation_amount)),
    precipitationProbabilityMaxPercent: maxOrNull(
      blocks.map(({ period }) => period.details.probability_of_precipitation),
    ),
    windSpeedMaxKmh: kmhFromMetersPerSecond(maxOrNull(instants.map((details) => details.wind_speed))),
    windGustMaxKmh: kmhFromMetersPerSecond(maxOrNull(instants.map((details) => details.wind_speed_of_gust))),
    uvIndexMax: maxOrNull(instants.map((details) => details.ultraviolet_index_clear_sky)),
  };
}

export function mapDaily(timeseries: readonly ForecastEntry[]): DailyForecast[] {
  const days: DailyForecast[] = [];
  for (const [date, entries] of groupByDate(timeseries)) {
    const day = mapDay(date, entries);
    if (day) {
      days.push(day);
    }
    if (days.length === FORECAST_DAYS) {
      break;
    }
  }
  if (days.length === 0) {
    throw new ProviderInvalidResponseError(MET_NORWAY_ID, 'no six-hour period in the forecast');
  }
  return days;
}
