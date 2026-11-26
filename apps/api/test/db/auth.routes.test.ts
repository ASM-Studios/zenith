import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { client, db } from '../../src/db/index.ts';
import { account, user } from '../../src/db/schema/index.ts';
import { buildTestApp } from '../helpers/build-test-app.ts';
import { resetDb } from '../helpers/reset-db.ts';
import { confirmEmail } from '../helpers/session.ts';

const app = buildTestApp();
const credentials = { email: 'ada@example.com', password: 'a-long-password', name: 'Ada' };

const signUp = (body: object = credentials) =>
  app.inject({
    method: 'POST',
    url: '/api/auth/sign-up/email',
    payload: body,
    headers: { origin: 'http://localhost:3000' },
  });

const signIn = (password: string, origin = 'http://localhost:3000') =>
  app.inject({
    method: 'POST',
    url: '/api/auth/sign-in/email',
    payload: { email: credentials.email, password },
    headers: { origin },
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

  it('sign-in with the right password sets a session cookie once the email is verified', async () => {
    await signUp();
    await confirmEmail(app, credentials.email);

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

  it('accepts a request from a web origin listed in BETTER_AUTH_TRUSTED_ORIGINS', async () => {
    await signUp();
    await confirmEmail(app, credentials.email);

    const response = await signIn(credentials.password, 'http://localhost:5173');

    expect(response.statusCode).toBe(200);
  });

  it('rejects a request from an origin that is not trusted', async () => {
    const response = await signIn(credentials.password, 'http://evil.example');

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'INVALID_ORIGIN' });
  });
});
