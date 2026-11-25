import { ProviderInvalidResponseError, ProviderUnsupportedError } from '@zenith/core';
import { createStubWeatherProvider, stubCurrentConditions, stubHourlyForecast } from '@zenith/core/testing';
import { describe, expect, it } from 'vitest';
import { weatherDataSchemas } from './data.ts';
import { fetchWeatherData } from './fetch.ts';

const query = { location: { latitude: 48.85, longitude: 2.35 } };

describe('fetchWeatherData', () => {
  it('returns the data of the method matching the data type', async () => {
    const provider = createStubWeatherProvider();
    await expect(fetchWeatherData(provider, 'current', query)).resolves.toEqual(stubCurrentConditions);
    await expect(fetchWeatherData(provider, 'hourly', query)).resolves.toEqual(
      weatherDataSchemas.hourly.parse(stubHourlyForecast),
    );
  });

  it('calls the method on the provider so a class based provider keeps its state', async () => {
    const stub = createStubWeatherProvider();
    class ClassProvider {
      readonly id = stub.id;
      readonly attribution = stub.attribution;
      readonly capabilities = stub.capabilities;
      readonly current = stubCurrentConditions;
      getCurrent() {
        return Promise.resolve(this.current);
      }
    }

    await expect(fetchWeatherData(new ClassProvider(), 'current', query)).resolves.toEqual(stubCurrentConditions);
  });

  it('reports a missing method as unsupported', async () => {
    const provider = createStubWeatherProvider({ dataTypes: ['current'] });
    await expect(fetchWeatherData(provider, 'pollen', query)).rejects.toBeInstanceOf(ProviderUnsupportedError);
  });

  it('reports data that does not match its schema as an invalid response', async () => {
    const provider = { ...createStubWeatherProvider(), getCurrent: () => Promise.resolve({ temperature: 'hot' }) };
    await expect(fetchWeatherData(provider, 'current', query)).rejects.toBeInstanceOf(ProviderInvalidResponseError);
  });
});
