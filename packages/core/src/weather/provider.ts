import { z } from 'zod';
import type { AirQuality } from './air-quality.ts';
import type { Alert } from './alert.ts';
import { CoverageSchema } from './coverage.ts';
import type { CurrentConditions } from './current-conditions.ts';
import type { DailyForecast } from './daily-forecast.ts';
import { WeatherDataTypeSchema, type WeatherDataType } from './data-types.ts';
import type { GeoPoint } from './geo-point.ts';
import type { HourlyForecast } from './hourly-forecast.ts';
import type { Pollen } from './pollen.ts';

export const ProviderAttributionSchema = z.object({
  name: z.string().min(1),
  url: z.url(),
  licence: z.string().min(1),
  licenceUrl: z.url(),
});

export const ProviderCapabilitiesSchema = z.object({
  coverage: CoverageSchema,
  dataTypes: z.array(WeatherDataTypeSchema).min(1),
});

export type ProviderAttribution = z.infer<typeof ProviderAttributionSchema>;
export type ProviderCapabilities = z.infer<typeof ProviderCapabilitiesSchema>;

export interface WeatherQuery {
  location: GeoPoint;
  signal?: AbortSignal;
}

export interface WeatherProvider {
  readonly id: string;
  readonly attribution: ProviderAttribution;
  readonly capabilities: ProviderCapabilities;
  readonly getCurrent?: (query: WeatherQuery) => Promise<CurrentConditions>;
  readonly getHourly?: (query: WeatherQuery) => Promise<HourlyForecast[]>;
  readonly getDaily?: (query: WeatherQuery) => Promise<DailyForecast[]>;
  readonly getAirQuality?: (query: WeatherQuery) => Promise<AirQuality>;
  readonly getPollen?: (query: WeatherQuery) => Promise<Pollen>;
  readonly getAlerts?: (query: WeatherQuery) => Promise<Alert[]>;
}

export const WEATHER_DATA_METHODS = {
  current: 'getCurrent',
  hourly: 'getHourly',
  daily: 'getDaily',
  airQuality: 'getAirQuality',
  pollen: 'getPollen',
  alerts: 'getAlerts',
} as const satisfies Record<WeatherDataType, keyof WeatherProvider>;

export type WeatherDataMethod = (typeof WEATHER_DATA_METHODS)[WeatherDataType];
