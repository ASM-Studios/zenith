import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { client, db } from '../../src/db/index.ts';
import { user } from '../../src/db/schema/index.ts';
import { buildTestApp } from '../helpers/build-test-app.ts';
import { lastLink, mailsTo } from '../helpers/outbox.ts';
import { resetDb } from '../helpers/reset-db.ts';

const app = buildTestApp();
const email = 'ada@example.com';

const signUp = (callbackURL: string) =>
  app.inject({
    method: 'POST',
    url: '/api/auth/sign-up/email',
    payload: { email, password: 'a-long-password', name: 'Ada', callbackURL },
    headers: { origin: 'http://localhost:5173' },
  });

beforeEach(resetDb);

afterAll(async () => {
  await app.close();
  await client.end();
});

describe('verification link to the web app', () => {
  it('mails a link to the web verification page, which verifies the address through the API', async () => {
    await signUp('http://localhost:5173/en/verify-email');
    const link = new URL(lastLink(email));

    expect(`${link.origin}${link.pathname}`).toBe('http://localhost:5173/en/verify-email');
    const token = link.searchParams.get('token') ?? '';
    const response = await app.inject({ method: 'GET', url: `/api/auth/verify-email?token=${token}` });

    expect(response.statusCode).toBe(200);
    const [row] = await db.select().from(user).where(eq(user.email, email));
    expect(row?.emailVerified).toBe(true);
  });

  it('refuses a callbackURL outside the trusted origins and mails nothing', async () => {
    const response = await signUp('http://evil.example/en/verify-email');

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'INVALID_CALLBACK_URL' });
    expect(mailsTo(email)).toHaveLength(0);
  });

  it('answers an expired or forged token with an error code the web page can show', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/auth/verify-email?token=forged' });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: 'INVALID_TOKEN' });
  });
});
