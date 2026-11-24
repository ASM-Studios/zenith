import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { client, db } from '../../src/db/index.ts';
import { account, location, session, user, userPreference } from '../../src/db/schema/index.ts';
import { buildTestApp } from '../helpers/build-test-app.ts';
import { resetDb } from '../helpers/reset-db.ts';
import { signUpWithCookie } from '../helpers/session.ts';

const app = buildTestApp();
const password = 'a-long-password';
const paris = { name: 'Paris', latitude: 48.85, longitude: 2.35 };

const deleteAccount = (cookie?: string, body: object = {}) =>
  app.inject({
    method: 'POST',
    url: '/api/auth/delete-user',
    payload: body,
    headers: { origin: 'http://localhost:3000', ...(cookie ? { cookie } : {}) },
  });

async function signUpWithData(email: string) {
  const cookie = await signUpWithCookie(app, email);
  await app.inject({ method: 'POST', url: '/api/me/locations', headers: { cookie }, payload: { locations: [paris] } });
  await app.inject({
    method: 'PUT',
    url: '/api/me/preferences',
    headers: { cookie },
    payload: { sourcePreferences: { weather: 'metno' } },
  });
  const [row] = await db.select().from(user).where(eq(user.email, email));
  return { cookie, id: row?.id ?? '' };
}

async function rowCounts(id: string) {
  const [users, sessions, accounts, locations, preferences] = await Promise.all([
    db.select().from(user).where(eq(user.id, id)),
    db.select().from(session).where(eq(session.userId, id)),
    db.select().from(account).where(eq(account.userId, id)),
    db.select().from(location).where(eq(location.userId, id)),
    db.select().from(userPreference).where(eq(userPreference.userId, id)),
  ]);
  return [users, sessions, accounts, locations, preferences].map((rows) => rows.length);
}

beforeEach(resetDb);

afterAll(async () => {
  await app.close();
  await client.end();
});

describe('account deletion', () => {
  it('removes the user and every row that belongs to them when the password is right', async () => {
    const ada = await signUpWithData('ada@example.com');
    expect(await rowCounts(ada.id)).toEqual([1, 1, 1, 1, 1]);

    const response = await deleteAccount(ada.cookie, { password });

    expect(response.statusCode).toBe(200);
    expect(await rowCounts(ada.id)).toEqual([0, 0, 0, 0, 0]);
  });

  it('removes the account with a fresh session and no password', async () => {
    const ada = await signUpWithData('ada@example.com');

    const response = await deleteAccount(ada.cookie);

    expect(response.statusCode).toBe(200);
    expect(await rowCounts(ada.id)).toEqual([0, 0, 0, 0, 0]);
  });

  it('refuses a wrong password and keeps every row', async () => {
    const ada = await signUpWithData('ada@example.com');

    const response = await deleteAccount(ada.cookie, { password: 'not-the-password' });

    expect(response.statusCode).toBeGreaterThanOrEqual(400);
    expect(await rowCounts(ada.id)).toEqual([1, 1, 1, 1, 1]);
  });

  it('refuses an anonymous request and keeps every row', async () => {
    const ada = await signUpWithData('ada@example.com');

    const response = await deleteAccount(undefined, { password });

    expect(response.statusCode).toBe(401);
    expect(await rowCounts(ada.id)).toEqual([1, 1, 1, 1, 1]);
  });

  it('leaves the rows of other users untouched', async () => {
    const ada = await signUpWithData('ada@example.com');
    const grace = await signUpWithData('grace@example.com');

    await deleteAccount(ada.cookie, { password });

    expect(await rowCounts(ada.id)).toEqual([0, 0, 0, 0, 0]);
    expect(await rowCounts(grace.id)).toEqual([1, 1, 1, 1, 1]);
  });

  it('invalidates the session cookie of the deleted user', async () => {
    const ada = await signUpWithData('ada@example.com');

    await deleteAccount(ada.cookie, { password });
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/get-session',
      headers: { cookie: ada.cookie },
    });

    expect(response.json()).toBeNull();
  });
});
