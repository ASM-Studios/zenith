import {
  ProviderInvalidResponseError,
  ProviderQuotaError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  ProviderUnsupportedError,
  type ProviderError,
} from '@zenith/core';
import { createStubWeatherProvider, stubHourlyForecast } from '@zenith/core/testing';
import { describe, expect, it } from 'vitest';
import { FRESH_TTL_SECONDS } from '../../src/modules/weather/weather.cache-policy.ts';
import { weatherDataSchemas } from '../../src/modules/weather/weather.data.ts';
import { WeatherSourceError } from '../../src/modules/weather/weather.errors.ts';
import { paris, weatherSetup } from '../helpers/weather.ts';

const transientErrors: [string, ProviderError][] = [
  ['timeout', new ProviderTimeoutError('stub', 'timed out')],
  ['unavailable', new ProviderUnavailableError('stub', 'HTTP 503')],
  ['quota', new ProviderQuotaError('stub', 'HTTP 429', { retryAfterSeconds: 120 })],
  ['invalid-response', new ProviderInvalidResponseError('stub', 'not JSON')],
];
const unsupported = new ProviderUnsupportedError('stub', 'location outside coverage');

async function withExpiredEntry(error: ProviderError) {
  const setup = weatherSetup();
  await setup.serviceWith([createStubWeatherProvider()]).get('hourly', paris);
  const cachedAt = setup.clock.now();
  setup.clock.advanceSeconds(FRESH_TTL_SECONDS.hourly + 60);
  return { failing: setup.serviceWith([createStubWeatherProvider({ error })]), cachedAt, logger: setup.logger };
}

function failure(promise: Promise<unknown>) {
  return promise.then(
    () => expect.fail('expected the call to fail'),
    (error: unknown) => error,
  );
}

describe('weather service on a provider error', () => {
  it.each(transientErrors)('serves the stale entry flagged stale with its updatedAt on %s', async (_kind, error) => {
    const { failing, cachedAt, logger } = await withExpiredEntry(error);

    const reading = await failing.get('hourly', paris);

    expect(reading).toMatchObject({
      data: weatherDataSchemas.hourly.parse(stubHourlyForecast),
      updatedAt: cachedAt,
      stale: true,
    });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ providerId: 'stub', dataType: 'hourly' }),
      'weather provider call failed',
    );
  });

  it.each(transientErrors)('reports the source unavailable on %s when nothing is cached', async (kind, error) => {
    const { serviceWith } = weatherSetup();

    const caught = await failure(serviceWith([createStubWeatherProvider({ error })]).get('hourly', paris));

    expect(caught).toBeInstanceOf(WeatherSourceError);
    expect(caught).toMatchObject({ providerId: 'stub', kind, cause: error });
  });

  it('carries the retry delay of a quota error', async () => {
    const { serviceWith } = weatherSetup();
    const quota = new ProviderQuotaError('stub', 'HTTP 429', { retryAfterSeconds: 120 });

    const caught = await failure(serviceWith([createStubWeatherProvider({ error: quota })]).get('hourly', paris));

    expect(caught).toMatchObject({ kind: 'quota', retryAfterSeconds: 120 });
  });

  it('leaves the retry delay empty for other kinds', async () => {
    const { serviceWith } = weatherSetup();
    const timeout = new ProviderTimeoutError('stub', 'timed out');

    const caught = await failure(serviceWith([createStubWeatherProvider({ error: timeout })]).get('hourly', paris));

    expect(caught).toMatchObject({ kind: 'timeout', retryAfterSeconds: null });
  });

  it('does not serve the stale entry on unsupported, since the source no longer serves it', async () => {
    const { failing } = await withExpiredEntry(unsupported);

    const caught = await failure(failing.get('hourly', paris));

    expect(caught).toBeInstanceOf(WeatherSourceError);
    expect(caught).toMatchObject({ kind: 'unsupported' });
  });

  it('reports unsupported when nothing is cached', async () => {
    const { serviceWith } = weatherSetup();

    const caught = await failure(serviceWith([createStubWeatherProvider({ error: unsupported })]).get('hourly', paris));

    expect(caught).toMatchObject({ kind: 'unsupported' });
  });

  it('serves a fresh entry without calling a failing provider', async () => {
    const setup = weatherSetup();
    await setup.serviceWith([createStubWeatherProvider()]).get('hourly', paris);
    const failing = setup.serviceWith([
      createStubWeatherProvider({ error: new ProviderUnavailableError('stub', 'HTTP 503') }),
    ]);

    await expect(failing.get('hourly', paris)).resolves.toMatchObject({ stale: false });
  });
});
