import type { AirQuality, Pollen } from './air-quality.ts';
import type { Alert } from './alert.ts';
import type { Coordinates } from './coordinates.ts';
import type { CurrentConditions, DailyForecast, HourlyForecast } from './forecast.ts';

export const WEATHER_DATA_TYPES = ['current', 'hourly', 'daily', 'airQuality', 'pollen', 'alerts'] as const;

export type WeatherDataType = (typeof WEATHER_DATA_TYPES)[number];

export interface BoundingBox {
  readonly south: number;
  readonly west: number;
  readonly north: number;
  readonly east: number;
}

export type Coverage =
  { readonly kind: 'global' } | { readonly kind: 'regions'; readonly regions: readonly BoundingBox[] };

export interface WeatherProviderCapabilities {
  readonly coverage: Coverage;
  readonly dataTypes: readonly WeatherDataType[];
}

export interface WeatherProvider {
  readonly id: string;
  readonly name: string;
  readonly attribution: string;
  readonly capabilities: WeatherProviderCapabilities;
  current(location: Coordinates): Promise<CurrentConditions>;
  hourly(location: Coordinates, hours: number): Promise<HourlyForecast[]>;
  daily(location: Coordinates, days: number): Promise<DailyForecast[]>;
  airQuality?(location: Coordinates): Promise<AirQuality[]>;
  pollen?(location: Coordinates): Promise<Pollen[]>;
  alerts?(location: Coordinates): Promise<Alert[]>;
}
