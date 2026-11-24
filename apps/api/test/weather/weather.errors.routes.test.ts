import {
  ProviderInvalidResponseError,
  ProviderQuotaError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  ProviderUnsupportedError,
  type ProviderError,
  type WeatherProvider,
} from '@zenith/core';
import { createStubWeatherProvider } from '@zenith/core/testing';
import Fastify from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { FRESH_TTL_SECONDS } from '../../src/modules/weather/weather.cache-policy.ts';
import { weatherRoutes } from '../../src/modules/weather/weather.routes.ts';
import { weatherSetup } from '../helpers/weather.ts';

const url = '/api/weather/current?latitude=48.85&longitude=2.35';
const apps: { close(): Promise<unknown> }[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

function appOn(setup: ReturnType<typeof weatherSetup>, providers: WeatherProvider[]) {
  const app = Fastify();
  app.register(weatherRoutes, { service: setup.serviceWith(providers), sourcePreferences: async () => ({}) });
  apps.push(app);
  return app;
}

function failingWith(error: ProviderError) {
  return appOn(weatherSetup(), [createStubWeatherProvider({ error })]);
}

describe('weather routes on a provider error', () => {
  it('serves the stale value flagged stale with its updatedAt', async () => {
    const setup = weatherSetup();
    await appOn(setup, [createStubWeatherProvider()]).inject({ method: 'GET', url });
    const cachedAt = setup.clock.now().toISOString();
    setup.clock.advanceSeconds(FRESH_TTL_SECONDS.current + 1);
    const failing = appOn(setup, [createStubWeatherProvider({ error: new ProviderUnavailableError('stub', '503') })]);

    const response = await failing.inject({ method: 'GET', url });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ provider: { id: 'stub' }, updatedAt: cachedAt, stale: true });
  });

  it.each([
    ['timeout', new ProviderTimeoutError('stub', 'timed out')],
    ['unavailable', new ProviderUnavailableError('stub', 'HTTP 502')],
    ['invalid-response', new ProviderInvalidResponseError('stub', 'not JSON')],
  ])('answers 503 source_unavailable on %s without a cached value', async (kind, error) => {
    const response = await failingWith(error).inject({ method: 'GET', url });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: 'source_unavailable', provider: 'stub', reason: kind });
    expect(response.headers['retry-after']).toBeUndefined();
  });

  it('answers 503 with Retry-After on quota without a cached value', async () => {
    const quota = new ProviderQuotaError('stub', 'HTTP 429', { retryAfterSeconds: 90 });

    const response = await failingWith(quota).inject({ method: 'GET', url });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ error: 'source_unavailable', provider: 'stub', reason: 'quota' });
    expect(response.headers['retry-after']).toBe('90');
  });

  it('answers 503 without Retry-After on quota with no known delay', async () => {
    const response = await failingWith(new ProviderQuotaError('stub', 'HTTP 429')).inject({ method: 'GET', url });

    expect(response.statusCode).toBe(503);
    expect(response.headers['retry-after']).toBeUndefined();
  });

  it('answers 404 not_supported on unsupported', async () => {
    const response = await failingWith(new ProviderUnsupportedError('stub', 'outside coverage')).inject({
      method: 'GET',
      url,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'not_supported', provider: 'stub' });
  });

  it('answers 500 on an error that is not a provider error', async () => {
    const broken = { ...createStubWeatherProvider(), getCurrent: () => Promise.reject(new TypeError('bug')) };

    const response = await appOn(weatherSetup(), [broken]).inject({ method: 'GET', url });

    expect(response.statusCode).toBe(500);
  });
});
