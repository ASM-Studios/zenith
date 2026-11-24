import { createStubWeatherProvider } from '@zenith/core/testing';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { client } from '../../src/db/index.ts';
import { buildTestApp } from '../helpers/build-test-app.ts';
import { resetDb } from '../helpers/reset-db.ts';
import { signUpWithCookie } from '../helpers/session.ts';

const app = buildTestApp({
  weatherProviders: [createStubWeatherProvider({ id: 'first' }), createStubWeatherProvider({ id: 'second' })],
});

const url = '/api/weather/current?latitude=48.85&longitude=2.35';

beforeEach(resetDb);

afterAll(async () => {
  await app.close();
  await client.end();
});

async function servedBy(cookie?: string) {
  const response = await app.inject({ method: 'GET', url, headers: cookie ? { cookie } : {} });
  expect(response.statusCode).toBe(200);
  return response.json<{ provider: { id: string } }>().provider.id;
}

describe('weather routes and stored source preferences', () => {
  it('serves a signed-in user from the weather source saved in their preferences', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');
    await app.inject({
      method: 'PUT',
      url: '/api/me/preferences',
      headers: { cookie: ada },
      payload: { sourcePreferences: { weather: 'second' } },
    });

    expect(await servedBy(ada)).toBe('second');
  });

  it('serves a signed-in user without preferences and an anonymous client in registration order', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');

    expect(await servedBy(ada)).toBe('first');
    expect(await servedBy()).toBe('first');
  });
});
