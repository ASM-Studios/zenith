import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { client, db } from '../../src/db/index.ts';
import { account, user } from '../../src/db/schema/index.ts';
import { buildTestApp } from '../helpers/build-test-app.ts';
import { resetDb } from '../helpers/reset-db.ts';

const app = buildTestApp();
const credentials = { email: 'ada@example.com', password: 'a-long-password', name: 'Ada' };

const signUp = (body: object = credentials) =>
  app.inject({
    method: 'POST',
    url: '/api/auth/sign-up/email',
    payload: body,
    headers: { origin: 'http://localhost:3000' },
  });

const signIn = (password: string) =>
  app.inject({
    method: 'POST',
    url: '/api/auth/sign-in/email',
    payload: { email: credentials.email, password },
    headers: { origin: 'http://localhost:3000' },
  });

beforeEach(resetDb);

afterAll(async () => {
  await app.close();
  await client.end();
});

describe('auth routes', () => {
  it('sign-up stores the user and a credential account', async () => {
    const response = await signUp();

    expect(response.statusCode).toBe(200);
    expect(await db.select().from(user)).toHaveLength(1);
    expect(await db.select().from(account)).toHaveLength(1);
  });

  it('sign-up rejects an email that is already registered', async () => {
    await signUp();

    const response = await signUp();

    expect(response.statusCode).toBeGreaterThanOrEqual(400);
    expect(await db.select().from(user)).toHaveLength(1);
  });

  it('sign-in with the right password sets a session cookie', async () => {
    await signUp();

    const response = await signIn(credentials.password);

    expect(response.statusCode).toBe(200);
    expect(response.headers['set-cookie']).toContain('session_token');
  });

  it('sign-in with a wrong password is rejected without a session cookie', async () => {
    await signUp();

    const response = await signIn('not-the-password');

    expect(response.statusCode).toBe(401);
    expect(response.headers['set-cookie']).toBeUndefined();
  });
});
