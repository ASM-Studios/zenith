import type { Coordinates } from '../types/coordinates.ts';
import type { WeatherDataType, WeatherProvider } from '../types/weather-provider.ts';
import { isCovered } from './coverage.ts';

export function providesDataType(provider: WeatherProvider, dataType: WeatherDataType): boolean {
  return provider.capabilities.dataTypes.includes(dataType) && typeof provider[dataType] === 'function';
}

export function offersAt(provider: WeatherProvider, location: Coordinates, dataType: WeatherDataType): boolean {
  return providesDataType(provider, dataType) && isCovered(provider.capabilities.coverage, location);
}

export function providersOffering(
  providers: readonly WeatherProvider[],
  location: Coordinates,
  dataType: WeatherDataType,
): WeatherProvider[] {
  return providers.filter((provider) => offersAt(provider, location, dataType));
}
