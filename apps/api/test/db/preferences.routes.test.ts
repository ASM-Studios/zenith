import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { client, db } from '../../src/db/index.ts';
import { user, userPreference } from '../../src/db/schema/index.ts';
import { buildTestApp } from '../helpers/build-test-app.ts';
import { resetDb } from '../helpers/reset-db.ts';
import { signUpWithCookie } from '../helpers/session.ts';

const app = buildTestApp();

const getRequest = (cookie: string) => app.inject({ method: 'GET', url: '/api/me/preferences', headers: { cookie } });

const putRequest = (cookie: string, sourcePreferences: object) =>
  app.inject({
    method: 'PUT',
    url: '/api/me/preferences',
    headers: { cookie },
    payload: { sourcePreferences },
  });

async function storedPreferences(cookie: string) {
  const response = await getRequest(cookie);
  return response.json<{ sourcePreferences: Record<string, string> }>().sourcePreferences;
}

beforeEach(resetDb);

afterAll(async () => {
  await app.close();
  await client.end();
});

describe('preferences routes', () => {
  it('anonymous GET and PUT are rejected with 401 and store nothing', async () => {
    const anonymousGet = await app.inject({ method: 'GET', url: '/api/me/preferences' });
    const anonymousPut = await app.inject({
      method: 'PUT',
      url: '/api/me/preferences',
      payload: { sourcePreferences: { weather: 'metno' } },
    });

    expect(anonymousGet.statusCode).toBe(401);
    expect(anonymousPut.statusCode).toBe(401);
    expect(await db.select().from(userPreference)).toHaveLength(0);
  });

  it('GET returns an empty object before any PUT', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');

    const response = await getRequest(ada);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ sourcePreferences: {} });
  });

  it('PUT then GET round-trips the stored value', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');

    const put = await putRequest(ada, { weather: 'metno' });

    expect(put.statusCode).toBe(200);
    expect(await storedPreferences(ada)).toEqual({ weather: 'metno' });
  });

  it('a second PUT replaces the first one', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');
    await putRequest(ada, { weather: 'metno' });

    await putRequest(ada, { aurora: 'noaa' });

    expect(await storedPreferences(ada)).toEqual({ aurora: 'noaa' });
  });

  it('preferences of one user are not visible to another user', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');
    const grace = await signUpWithCookie(app, 'grace@example.com');
    await putRequest(ada, { weather: 'metno' });

    expect(await storedPreferences(grace)).toEqual({});
  });

  it('an invalid body returns 400 and stores nothing', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');

    const response = await putRequest(ada, { weather: 42 });

    expect(response.statusCode).toBe(400);
    expect(await db.select().from(userPreference)).toHaveLength(0);
  });

  it('deleting the user removes their preferences', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');
    await putRequest(ada, { weather: 'metno' });

    await db.delete(user);

    expect(await db.select().from(userPreference)).toHaveLength(0);
  });
});
