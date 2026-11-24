import { ProviderTimeoutError, type WeatherQuery } from '@zenith/core';
import { createStubWeatherProvider, stubAttribution, stubCurrentConditions } from '@zenith/core/testing';
import { describe, expect, it } from 'vitest';
import { createCache } from '../../src/lib/cache.ts';
import { FRESH_TTL_SECONDS, retentionSeconds } from '../../src/modules/weather/weather.cache-policy.ts';
import { NoWeatherProviderError, WeatherSourceError } from '../../src/modules/weather/weather.errors.ts';
import { createWeatherService } from '../../src/modules/weather/weather.service.ts';
import { countCalls, memoryStore, paris, weatherSetup } from '../helpers/weather.ts';

describe('weather service', () => {
  it('returns provider data with its attribution and updatedAt', async () => {
    const { serviceWith, clock } = weatherSetup();
    const reading = await serviceWith([createStubWeatherProvider()]).get('current', paris);
    expect(reading).toEqual({
      data: stubCurrentConditions,
      provider: { id: 'stub', attribution: stubAttribution },
      updatedAt: clock.now(),
      stale: false,
    });
  });

  it('does not call the provider again for the same data type and rounded location inside the TTL', async () => {
    const { serviceWith, clock } = weatherSetup();
    const { provider, calls } = countCalls(createStubWeatherProvider());
    const service = serviceWith([provider]);

    const first = await service.get('current', paris);
    clock.advanceSeconds(FRESH_TTL_SECONDS.current - 1);
    const second = await service.get('current', { latitude: 48.8611, longitude: 2.3489 });

    expect(calls).toEqual(['getCurrent']);
    expect(second).toEqual(first);
  });

  it('judges freshness on the current time by default', async () => {
    const logger = { warn: () => undefined };
    const cache = createCache(memoryStore().store, { logger });
    const { provider, calls } = countCalls(createStubWeatherProvider());
    const service = createWeatherService({ cache, providers: [provider], logger });

    await service.get('current', paris);
    await service.get('current', paris);

    expect(calls).toEqual(['getCurrent']);
  });

  it('calls the provider again once the TTL has elapsed', async () => {
    const { serviceWith, clock } = weatherSetup();
    const { provider, calls } = countCalls(createStubWeatherProvider());
    const service = serviceWith([provider]);

    await service.get('current', paris);
    clock.advanceSeconds(FRESH_TTL_SECONDS.current);
    const refreshed = await service.get('current', paris);

    expect(calls).toEqual(['getCurrent', 'getCurrent']);
    expect(refreshed.updatedAt).toEqual(clock.now());
  });

  it('caches each data type and each location separately', async () => {
    const { serviceWith } = weatherSetup();
    const { provider, calls } = countCalls(createStubWeatherProvider());
    const service = serviceWith([provider]);

    await service.get('current', paris);
    await service.get('hourly', paris);
    await service.get('current', { latitude: 45.76, longitude: 4.84 });

    expect(calls).toEqual(['getCurrent', 'getHourly', 'getCurrent']);
  });

  it('stores the entry under its key for the freshness TTL plus the stale retention', async () => {
    const { serviceWith, store } = weatherSetup();
    await serviceWith([createStubWeatherProvider({ id: 'open-meteo' })]).get('daily', paris);
    expect(store.set).toHaveBeenCalledWith(
      'zenith:weather:open-meteo:daily:48.86:2.35',
      expect.any(String),
      'EX',
      retentionSeconds('daily'),
    );
  });

  it('queries the provider at the rounded location with an abort signal', async () => {
    const queries: WeatherQuery[] = [];
    const recording = {
      ...createStubWeatherProvider(),
      getCurrent: (query: WeatherQuery) => {
        queries.push(query);
        return Promise.resolve(stubCurrentConditions);
      },
    };
    const { serviceWith } = weatherSetup();
    await serviceWith([recording]).get('current', paris);
    expect(queries[0]?.location).toEqual({ latitude: 48.86, longitude: 2.35 });
    expect(queries[0]?.signal).toBeInstanceOf(AbortSignal);
  });

  it('aborts a provider call that outlives the timeout', async () => {
    const hanging = {
      ...createStubWeatherProvider({ id: 'slow' }),
      getCurrent: ({ signal }: WeatherQuery) =>
        new Promise<never>((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(new ProviderTimeoutError('slow', 'aborted')));
        }),
    };
    const { serviceWith } = weatherSetup();
    const error = await serviceWith([hanging], { timeoutMs: 5 })
      .get('current', paris)
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(WeatherSourceError);
    expect(error).toMatchObject({ providerId: 'slow', kind: 'timeout' });
  });

  it('uses the preferred provider when it offers the data type', async () => {
    const { serviceWith } = weatherSetup();
    const service = serviceWith([createStubWeatherProvider({ id: 'a' }), createStubWeatherProvider({ id: 'b' })]);
    await expect(service.get('current', paris, ['b'])).resolves.toMatchObject({ provider: { id: 'b' } });
    await expect(service.get('current', paris)).resolves.toMatchObject({ provider: { id: 'a' } });
  });

  it('reports a data type no provider offers', async () => {
    const { serviceWith } = weatherSetup();
    const service = serviceWith([createStubWeatherProvider({ dataTypes: ['current'] })]);
    await expect(service.get('pollen', paris)).rejects.toBeInstanceOf(NoWeatherProviderError);
  });

  it('rethrows an error that is not a provider error', async () => {
    const { serviceWith } = weatherSetup();
    const broken = { ...createStubWeatherProvider(), getCurrent: () => Promise.reject(new TypeError('bug')) };
    await expect(serviceWith([broken]).get('current', paris)).rejects.toThrow(TypeError);
  });
});
