import { ProviderTimeoutError, ProviderUnsupportedError, type ProviderError } from '../providers/errors.ts';
import {
  isCovered,
  WEATHER_DATA_METHODS,
  WEATHER_DATA_TYPES,
  type Coverage,
  type WeatherDataMethod,
  type WeatherDataType,
  type WeatherProvider,
  type WeatherQuery,
} from '../weather/index.ts';
import {
  stubAirQuality,
  stubAlerts,
  stubAttribution,
  stubCurrentConditions,
  stubDailyForecast,
  stubHourlyForecast,
  stubPollen,
} from './stub-weather-data.ts';

export interface StubWeatherProviderOptions {
  id?: string;
  coverage?: Coverage;
  dataTypes?: WeatherDataType[];
  error?: ProviderError;
}

type WeatherDataMethods = Required<Pick<WeatherProvider, WeatherDataMethod>>;

export function createStubWeatherProvider(options: StubWeatherProviderOptions = {}): WeatherProvider {
  const { id = 'stub', coverage = { kind: 'global' }, dataTypes = [...WEATHER_DATA_TYPES], error } = options;

  function respond<T>(data: T): (query: WeatherQuery) => Promise<T> {
    return async (query) => {
      if (query.signal?.aborted) {
        throw new ProviderTimeoutError(id, 'request aborted', { cause: query.signal.reason });
      }
      if (!isCovered(coverage, query.location)) {
        throw new ProviderUnsupportedError(id, 'location outside coverage');
      }
      if (error) {
        throw error;
      }
      return structuredClone(data);
    };
  }

  const methods: WeatherDataMethods = {
    getCurrent: respond(stubCurrentConditions),
    getHourly: respond(stubHourlyForecast),
    getDaily: respond(stubDailyForecast),
    getAirQuality: respond(stubAirQuality),
    getPollen: respond(stubPollen),
    getAlerts: respond(stubAlerts),
  };

  const declaredMethods: Partial<WeatherDataMethods> = Object.fromEntries(
    dataTypes.map((dataType) => [WEATHER_DATA_METHODS[dataType], methods[WEATHER_DATA_METHODS[dataType]]]),
  );

  return {
    id,
    attribution: stubAttribution,
    capabilities: { coverage, dataTypes: [...dataTypes] },
    ...declaredMethods,
  };
}
