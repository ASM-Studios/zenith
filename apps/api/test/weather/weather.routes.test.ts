import { WEATHER_DATA_TYPES, type WeatherProvider } from '@zenith/core';
import { createStubWeatherProvider, stubAttribution } from '@zenith/core/testing';
import Fastify from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import { weatherDataSchemas } from '@zenith/weather';
import { weatherRoutes } from '../../src/modules/weather/weather.routes.ts';
import { WEATHER_ROUTE_PATHS } from '../../src/modules/weather/weather.schema.ts';
import { buildTestApp } from '../helpers/build-test-app.ts';
import { weatherSetup } from '@zenith/weather/testing';

const apps: { close(): Promise<unknown> }[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

function routesApp(providers: WeatherProvider[], preferences: Record<string, string> = {}) {
  const setup = weatherSetup();
  const app = Fastify();
  app.register(weatherRoutes, { service: setup.serviceWith(providers), sourcePreferences: async () => preferences });
  apps.push(app);
  return { app, ...setup };
}

function getCurrent(app: ReturnType<typeof Fastify>, query: string) {
  return app.inject({ method: 'GET', url: `/api/weather/current?${query}` });
}

describe('weather routes', () => {
  it.each(WEATHER_DATA_TYPES)('serves %s with the provider attribution and updatedAt', async (dataType) => {
    const { app, clock } = routesApp([createStubWeatherProvider()]);

    const response = await app.inject({
      method: 'GET',
      url: `${WEATHER_ROUTE_PATHS[dataType]}?latitude=48.85&longitude=2.35`,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<Record<string, unknown>>();
    expect(weatherDataSchemas[dataType].safeParse(body.data).success).toBe(true);
    expect(body).toMatchObject({
      provider: { id: 'stub', attribution: stubAttribution },
      updatedAt: clock.now().toISOString(),
      stale: false,
    });
  });

  it.each([
    ['latitude', 'latitude=91&longitude=2'],
    ['latitude', 'latitude=&longitude=2'],
    ['latitude', 'latitude=north&longitude=2'],
    ['longitude', 'latitude=48'],
    ['longitude', 'latitude=48&longitude=-180.5'],
    ['provider', 'latitude=48&longitude=2&provider='],
  ])('rejects a bad %s with a message naming the field', async (field, query) => {
    const { app } = routesApp([createStubWeatherProvider()]);

    const response = await getCurrent(app, query);

    expect(response.statusCode).toBe(400);
    const body = response.json<{ error: string; message: string; issues: { path: string[] }[] }>();
    expect(body.error).toBe('invalid_query');
    expect(body.message).toMatch(new RegExp(`^${field}: `));
    expect(body.issues[0]?.path).toEqual([field]);
  });

  it('answers 404 no_provider when no provider offers the data type', async () => {
    const { app } = routesApp([createStubWeatherProvider({ dataTypes: ['current'] })]);

    const response = await app.inject({ method: 'GET', url: '/api/weather/pollen?latitude=1&longitude=1' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({ error: 'no_provider', dataType: 'pollen' });
  });

  it('honours the provider asked in the query over the stored preferences', async () => {
    const providers = ['a', 'b', 'c'].map((id) => createStubWeatherProvider({ id }));
    const { app } = routesApp(providers, { current: 'b', weather: 'c' });

    const asked = await getCurrent(app, 'latitude=1&longitude=1&provider=c');
    const stored = await getCurrent(app, 'latitude=1&longitude=1');

    expect(asked.json()).toMatchObject({ provider: { id: 'c' } });
    expect(stored.json()).toMatchObject({ provider: { id: 'b' } });
  });

  it('is wired into the app and open to anonymous clients', async () => {
    const app = buildTestApp({ weatherProviders: [createStubWeatherProvider()] });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/api/weather/alerts?latitude=48.85&longitude=2.35' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ provider: { id: 'stub' }, stale: false });
  });
});
