import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { client, db } from '../../src/db/index.ts';
import { location, user } from '../../src/db/schema/index.ts';
import { buildTestApp } from '../helpers/build-test-app.ts';
import { resetDb } from '../helpers/reset-db.ts';
import { signUpWithCookie } from '../helpers/session.ts';

const app = buildTestApp();

type Stored = { id: string; name: string; latitude: number; longitude: number };

const paris = { name: 'Paris', latitude: 48.85, longitude: 2.35 };
const tokyo = { name: 'Tokyo', latitude: 35.68, longitude: 139.69 };

const listRequest = (cookie: string) => app.inject({ method: 'GET', url: '/api/me/locations', headers: { cookie } });

const postRequest = (cookie: string, locations: object[]) =>
  app.inject({ method: 'POST', url: '/api/me/locations', headers: { cookie }, payload: { locations } });

const deleteRequest = (cookie: string, id: string) =>
  app.inject({ method: 'DELETE', url: `/api/me/locations/${id}`, headers: { cookie } });

async function listedLocations(cookie: string) {
  const response = await listRequest(cookie);
  return response.json<{ locations: Stored[] }>().locations;
}

beforeEach(resetDb);

afterAll(async () => {
  await app.close();
  await client.end();
});

describe('locations routes', () => {
  it('anonymous GET and POST are rejected with 401 and store nothing', async () => {
    const anonymousGet = await app.inject({ method: 'GET', url: '/api/me/locations' });
    const anonymousPost = await app.inject({
      method: 'POST',
      url: '/api/me/locations',
      payload: { locations: [paris] },
    });

    expect(anonymousGet.statusCode).toBe(401);
    expect(anonymousPost.statusCode).toBe(401);
    expect(await db.select().from(location)).toHaveLength(0);
  });

  it('a user lists only their own locations', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');
    const grace = await signUpWithCookie(app, 'grace@example.com');
    await postRequest(ada, [paris]);
    await postRequest(grace, [tokyo]);

    const locations = await listedLocations(ada);

    expect(locations).toHaveLength(1);
    expect(locations[0]).toMatchObject({ name: 'Paris', latitude: 48.85, longitude: 2.35 });
  });

  it('posting locations merges them with the stored ones without duplicates', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');
    await postRequest(ada, [paris]);

    await postRequest(ada, [tokyo]);

    const names = (await listedLocations(ada)).map((stored) => stored.name).toSorted();
    expect(names).toEqual(['Paris', 'Tokyo']);
  });

  it('posting the same list twice keeps one row per place', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');
    await postRequest(ada, [paris, tokyo]);

    await postRequest(ada, [paris, tokyo]);

    expect(await db.select().from(location)).toHaveLength(2);
  });

  it('posting an existing coordinate pair updates the name and keeps the id', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');
    await postRequest(ada, [paris]);
    const [before] = await listedLocations(ada);

    await postRequest(ada, [{ ...paris, name: 'Paris, France' }]);

    const after = await listedLocations(ada);
    expect(after).toHaveLength(1);
    expect(after[0]).toMatchObject({ id: before.id, name: 'Paris, France' });
  });

  it('two users can store the same coordinates separately', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');
    const grace = await signUpWithCookie(app, 'grace@example.com');

    await postRequest(ada, [paris]);
    await postRequest(grace, [paris]);

    const rows = await db.select().from(location);
    expect(rows).toHaveLength(2);
    expect(new Set(rows.map((row) => row.userId)).size).toBe(2);
  });

  it('a request containing the same coordinates twice keeps the last name', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');

    const response = await postRequest(ada, [
      { ...paris, name: 'Old name' },
      { ...paris, name: 'New name' },
    ]);

    expect(response.statusCode).toBe(200);
    const locations = await listedLocations(ada);
    expect(locations).toHaveLength(1);
    expect(locations[0].name).toBe('New name');
  });

  it('deleting a location removes the row and returns 204', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');
    await postRequest(ada, [paris]);
    const [stored] = await listedLocations(ada);

    const response = await deleteRequest(ada, stored.id);

    expect(response.statusCode).toBe(204);
    expect(await db.select().from(location)).toHaveLength(0);
  });

  it('deleting another user location returns 404 and keeps the row', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');
    const grace = await signUpWithCookie(app, 'grace@example.com');
    await postRequest(ada, [paris]);
    const [stored] = await listedLocations(ada);

    const response = await deleteRequest(grace, stored.id);

    expect(response.statusCode).toBe(404);
    expect(await db.select().from(location)).toHaveLength(1);
  });

  it('latitude 91 returns 400 and stores nothing', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');

    const response = await postRequest(ada, [{ ...paris, latitude: 91 }]);

    expect(response.statusCode).toBe(400);
    expect(await db.select().from(location)).toHaveLength(0);
  });

  it('an empty locations list returns 400', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');

    const response = await postRequest(ada, []);

    expect(response.statusCode).toBe(400);
  });

  it('deleting the user removes their locations', async () => {
    const ada = await signUpWithCookie(app, 'ada@example.com');
    await postRequest(ada, [paris]);

    await db.delete(user);

    expect(await db.select().from(location)).toHaveLength(0);
  });
});
