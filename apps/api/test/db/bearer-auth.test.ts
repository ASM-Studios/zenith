import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { client } from '../../src/db/index.ts';
import { buildTestApp } from '../helpers/build-test-app.ts';
import { resetDb } from '../helpers/reset-db.ts';

const app = buildTestApp();

const credentials = { email: 'mobile@example.com', password: 'a-long-password' };

async function signUp() {
  return app.inject({
    method: 'POST',
    url: '/api/auth/sign-up/email',
    payload: { ...credentials, name: 'Mobile' },
  });
}

function headerText(value: string | string[] | number | undefined) {
  return Array.isArray(value) ? (value[0] ?? '') : String(value ?? '');
}

const listWith = (authorization: string) =>
  app.inject({ method: 'GET', url: '/api/me/locations', headers: { authorization } });

beforeEach(resetDb);

afterAll(async () => {
  await app.close();
  await client.end();
});

describe('bearer authentication', () => {
  it('sign-up returns a session token in the set-auth-token header', async () => {
    const response = await signUp();

    expect(response.statusCode).toBe(200);
    expect(headerText(response.headers['set-auth-token'])).not.toBe('');
  });

  it('a bearer token from sign-in authenticates the favorites routes', async () => {
    await signUp();
    const signIn = await app.inject({ method: 'POST', url: '/api/auth/sign-in/email', payload: credentials });
    const token = headerText(signIn.headers['set-auth-token']);

    const response = await listWith(`Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ locations: [] });
  });

  it('a bearer token that was never issued is rejected with 401', async () => {
    expect((await listWith('Bearer not-a-real-token')).statusCode).toBe(401);
  });

  it('a bearer token stops working after sign-out', async () => {
    const token = headerText((await signUp()).headers['set-auth-token']);
    await app.inject({
      method: 'POST',
      url: '/api/auth/sign-out',
      payload: {},
      headers: { authorization: `Bearer ${token}` },
    });

    expect((await listWith(`Bearer ${token}`)).statusCode).toBe(401);
  });
});
