import { isCovered } from './coverage.ts';
import type { WeatherDataType } from './data-types.ts';
import type { GeoPoint } from './geo-point.ts';
import { WEATHER_DATA_METHODS, type WeatherProvider } from './provider.ts';

export function offersDataType(provider: WeatherProvider, dataType: WeatherDataType, location: GeoPoint): boolean {
  return (
    provider.capabilities.dataTypes.includes(dataType) &&
    provider[WEATHER_DATA_METHODS[dataType]] !== undefined &&
    isCovered(provider.capabilities.coverage, location)
  );
}
