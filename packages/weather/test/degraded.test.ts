import {
  ProviderInvalidResponseError,
  ProviderQuotaError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  type ProviderError,
  type WeatherProvider,
} from '@zenith/core';
import { createStubWeatherProvider } from '@zenith/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { FRESH_TTL_SECONDS } from '../src/cache-policy.ts';
import { WeatherSourceError } from '../src/errors.ts';
import { paris, weatherSetup } from '../src/testing/weather-setup.ts';

function failingFirst(errors: ProviderError[]) {
  const base = createStubWeatherProvider();
  const getHourly = vi.fn<NonNullable<WeatherProvider['getHourly']>>((query) => {
    const error = errors[getHourly.mock.calls.length - 1];
    return error ? Promise.reject(error) : base.getHourly!(query);
  });
  return { provider: { ...base, getHourly }, getHourly };
}

const timeout = () => new ProviderTimeoutError('stub', 'timed out');
const unavailable = () => new ProviderUnavailableError('stub', 'HTTP 503');
const rateLimited = (retryAfterSeconds?: number) => new ProviderQuotaError('stub', 'HTTP 429', { retryAfterSeconds });

function failure(promise: Promise<unknown>) {
  return promise.then(
    () => expect.fail('expected the call to fail'),
    (error: unknown) => error,
  );
}

async function withExpiredEntry() {
  const setup = weatherSetup();
  await setup.serviceWith([createStubWeatherProvider()]).get('hourly', paris);
  setup.clock.advanceSeconds(FRESH_TTL_SECONDS.hourly + 60);
  return setup;
}

describe('weather service degraded mode', () => {
  it('retries a timeout and serves the fresh answer of the next attempt', async () => {
    const { serviceWith } = weatherSetup();
    const { provider, getHourly } = failingFirst([timeout()]);

    await expect(serviceWith([provider]).get('hourly', paris)).resolves.toMatchObject({ status: 'fresh' });
    expect(getHourly).toHaveBeenCalledTimes(2);
  });

  it('retries a 5xx twice, then serves the stale entry', async () => {
    const setup = await withExpiredEntry();
    const { provider, getHourly } = failingFirst([unavailable(), unavailable(), unavailable()]);

    await expect(setup.serviceWith([provider]).get('hourly', paris)).resolves.toMatchObject({ status: 'stale' });
    expect(getHourly).toHaveBeenCalledTimes(3);
  });

  it('waits with an exponential backoff between the attempts', async () => {
    const { serviceWith } = weatherSetup();
    const sleep = vi.fn<(ms: number) => Promise<void>>(() => Promise.resolve());
    const { provider } = failingFirst([unavailable(), unavailable()]);

    await serviceWith([provider], { retry: { sleep, baseDelayMs: 50 } }).get('hourly', paris);

    expect(sleep.mock.calls).toEqual([[50], [100]]);
  });

  it('reports the source unavailable once the retries are spent and nothing is cached', async () => {
    const { serviceWith } = weatherSetup();
    const { provider } = failingFirst([timeout(), timeout(), timeout()]);

    const caught = await failure(serviceWith([provider]).get('hourly', paris));

    expect(caught).toBeInstanceOf(WeatherSourceError);
    expect(caught).toMatchObject({ kind: 'timeout', status: 'unavailable' });
  });

  it('does not retry an invalid response', async () => {
    const setup = await withExpiredEntry();
    const { provider, getHourly } = failingFirst([new ProviderInvalidResponseError('stub', 'not JSON')]);

    await setup.serviceWith([provider]).get('hourly', paris);

    expect(getHourly).toHaveBeenCalledTimes(1);
  });

  it('does not retry a quota error and serves the stale entry', async () => {
    const setup = await withExpiredEntry();
    const { provider, getHourly } = failingFirst([rateLimited(120)]);

    await expect(setup.serviceWith([provider]).get('hourly', paris)).resolves.toMatchObject({ status: 'stale' });
    expect(getHourly).toHaveBeenCalledTimes(1);
  });

  it('stops calling a provider after a quota error until its retry delay has passed', async () => {
    const setup = await withExpiredEntry();
    const { provider, getHourly } = failingFirst([rateLimited(120)]);
    const service = setup.serviceWith([provider]);

    await service.get('hourly', paris);
    await service.get('hourly', paris);
    setup.clock.advanceSeconds(121);
    await service.get('hourly', paris);

    expect(getHourly).toHaveBeenCalledTimes(2);
  });

  it('reports the remaining block as the retry delay when nothing is cached', async () => {
    const { serviceWith, clock } = weatherSetup();
    const { provider } = failingFirst([rateLimited(120)]);
    const service = serviceWith([provider]);

    await failure(service.get('hourly', paris));
    clock.advanceSeconds(20);
    const caught = await failure(service.get('hourly', paris));

    expect(caught).toMatchObject({ kind: 'quota', retryAfterSeconds: 100 });
  });

  it('blocks for the default delay when the quota error names none', async () => {
    const { serviceWith } = weatherSetup();
    const { provider } = failingFirst([rateLimited()]);
    const service = serviceWith([provider]);

    await failure(service.get('hourly', paris));
    const caught = await failure(service.get('hourly', paris));

    expect(caught).toMatchObject({ kind: 'quota', retryAfterSeconds: 60 });
  });

  it('warns when the daily calls to a provider reach the threshold', async () => {
    const { serviceWith, logger } = weatherSetup();

    await serviceWith([createStubWeatherProvider()], { dailyCallWarning: 1 }).get('hourly', paris);

    expect(logger.warn).toHaveBeenCalledWith(
      { providerId: 'stub', calls: 1 },
      'weather provider reached its daily call warning threshold',
    );
  });
});
