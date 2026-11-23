import type {
  Coordinates,
  CurrentConditions,
  DailyForecast,
  HourlyForecast,
  WeatherProvider,
  WeatherProviderCapabilities,
} from '../src/index.ts';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const START = Date.UTC(2026, 0, 1);

function hourAt(index: number): HourlyForecast {
  return {
    time: new Date(START + index * HOUR_MS).toISOString(),
    temperatureC: 4,
    precipitationMm: 0,
    wind: { speedMs: 3 },
    cloudCover: { total: 0.2, low: 0.1, mid: 0, high: 0.1 },
  };
}

function dayAt(index: number): DailyForecast {
  return {
    date: new Date(START + index * DAY_MS).toISOString().slice(0, 10),
    temperatureMinC: -1,
    temperatureMaxC: 7,
    precipitationMm: 0,
  };
}

export function stubWeatherProvider(id: string, capabilities: WeatherProviderCapabilities): WeatherProvider {
  return {
    id,
    name: `Stub ${id}`,
    attribution: 'Stub data',
    capabilities,
    current: async (_location: Coordinates): Promise<CurrentConditions> => ({
      time: new Date(START).toISOString(),
      temperatureC: 4,
      wind: { speedMs: 3 },
      cloudCover: { total: 0.2 },
    }),
    hourly: async (_location, hours) => Array.from({ length: hours }, (_, index) => hourAt(index)),
    daily: async (_location, days) => Array.from({ length: days }, (_, index) => dayAt(index)),
  };
}
