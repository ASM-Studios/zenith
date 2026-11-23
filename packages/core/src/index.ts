export const VERSION = '1.0.0';

export type { AirQuality, Pollen, PollenSpecies } from './types/air-quality.ts';
export { POLLEN_SPECIES } from './types/air-quality.ts';
export type { Alert, AlertHazard, AlertSeverity } from './types/alert.ts';
export { ALERT_HAZARDS, ALERT_SEVERITIES } from './types/alert.ts';
export type { Coordinates } from './types/coordinates.ts';
export type { CloudCover, CurrentConditions, DailyForecast, HourlyForecast, Wind } from './types/forecast.ts';
export type {
  BoundingBox,
  Coverage,
  WeatherDataType,
  WeatherProvider,
  WeatherProviderCapabilities,
} from './types/weather-provider.ts';
export { WEATHER_DATA_TYPES } from './types/weather-provider.ts';
export type { ProviderErrorKind } from './providers/provider-error.ts';
export {
  isProviderError,
  ProviderError,
  ProviderQuotaError,
  ProviderTimeoutError,
  ProviderUnavailableError,
} from './providers/provider-error.ts';
export { isCovered, isInBoundingBox } from './providers/coverage.ts';
export { offersAt, providersOffering, providesDataType } from './providers/provider-offer.ts';
