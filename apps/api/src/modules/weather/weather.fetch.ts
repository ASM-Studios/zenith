import {
  ProviderInvalidResponseError,
  ProviderUnsupportedError,
  WEATHER_DATA_METHODS,
  type WeatherDataType,
  type WeatherProvider,
  type WeatherQuery,
} from '@zenith/core';
import { weatherDataSchemas } from './weather.data.ts';

export async function fetchWeatherData(
  provider: WeatherProvider,
  dataType: WeatherDataType,
  query: WeatherQuery,
): Promise<unknown> {
  const method = provider[WEATHER_DATA_METHODS[dataType]];
  if (!method) {
    throw new ProviderUnsupportedError(provider.id, `${dataType} is not served`);
  }
  const data: unknown = await method(query);
  const result = weatherDataSchemas[dataType].safeParse(data);
  if (!result.success) {
    throw new ProviderInvalidResponseError(provider.id, `${dataType} does not match its schema`, {
      cause: result.error,
    });
  }
  return result.data;
}
