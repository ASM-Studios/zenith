import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { client, db } from '../../src/db/index.ts';
import { account, user } from '../../src/db/schema/index.ts';
import { buildTestApp } from '../helpers/build-test-app.ts';
import { mailsTo, outbox } from '../helpers/outbox.ts';
import { resetDb } from '../helpers/reset-db.ts';
import { confirmEmail, cookiesOf, signUpWithCookie } from '../helpers/session.ts';

const app = buildTestApp();
const email = 'ada@example.com';
const password = 'a-long-password';
const origin = 'http://localhost:3000';

const signUp = (address = email) =>
  app.inject({
    method: 'POST',
    url: '/api/auth/sign-up/email',
    payload: { email: address, password, name: 'Ada' },
    headers: { origin },
  });

const signIn = () =>
  app.inject({
    method: 'POST',
    url: '/api/auth/sign-in/email',
    payload: { email, password },
    headers: { origin },
  });

beforeEach(resetDb);

afterAll(async () => {
  await app.close();
  await client.end();
});

describe('email verification', () => {
  it('sign-up mails one verification link to the address and sets no cookie', async () => {
    const response = await signUp();

    expect(response.statusCode).toBe(200);
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(response.json().token).toBeNull();
    expect(mailsTo(email)).toHaveLength(1);
    expect(mailsTo(email)[0]?.text).toContain('/api/auth/verify-email?token=');
  });

  it('sign-in before verification is refused without a cookie and mails a fresh link', async () => {
    await signUp();

    const response = await signIn();

    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe('EMAIL_NOT_VERIFIED');
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(mailsTo(email)).toHaveLength(2);
  });

  it('the emailed link verifies the address and sign-in then succeeds', async () => {
    await signUp();

    await confirmEmail(app, email);
    const response = await signIn();

    const [row] = await db.select().from(user).where(eq(user.email, email));
    expect(row?.emailVerified).toBe(true);
    expect(response.statusCode).toBe(200);
    expect(cookiesOf(response)).toContain('session_token');
  });

  it('a tampered verification link does not verify the address', async () => {
    await signUp();
    const link = new URL(mailsTo(email)[0]?.text.match(/https?:\/\/\S+/)?.[0] ?? '');
    link.searchParams.set('token', `${link.searchParams.get('token')}x`);

    await app.inject({ method: 'GET', url: `${link.pathname}${link.search}`, headers: { origin } });

    const [row] = await db.select().from(user).where(eq(user.email, email));
    expect(row?.emailVerified).toBe(false);
  });

  it.each(['/api/me/locations', '/api/me/preferences'])(
    'a session of an unverified user gets 403 on %s',
    async (url) => {
      const cookie = await signUpWithCookie(app, email);
      await db.update(user).set({ emailVerified: false }).where(eq(user.email, email));

      const response = await app.inject({ method: 'GET', url, headers: { cookie } });

      expect(response.statusCode).toBe(403);
    },
  );

  it('a session of a verified user is served on /api/me/locations', async () => {
    const cookie = await signUpWithCookie(app, email);

    const response = await app.inject({ method: 'GET', url: '/api/me/locations', headers: { cookie } });

    expect(response.statusCode).toBe(200);
  });
});

describe('duplicate sign-up', () => {
  it('answers like a new sign-up and creates nothing', async () => {
    const first = await signUp();
    const second = await signUp();

    expect(second.statusCode).toBe(first.statusCode);
    expect(Object.keys(second.json()).toSorted()).toEqual(Object.keys(first.json()).toSorted());
    expect(Object.keys(second.json().user).toSorted()).toEqual(Object.keys(first.json().user).toSorted());
    expect(second.json().token).toBeNull();
    expect(second.headers['set-cookie']).toBeUndefined();
    expect(await db.select().from(user)).toHaveLength(1);
    expect(await db.select().from(account)).toHaveLength(1);
  });

  it('notifies the owner of the address and sends no second verification link', async () => {
    await signUp();
    outbox.length = 0;

    await signUp();
    await new Promise((resolve) => setImmediate(resolve));

    expect(mailsTo(email)).toHaveLength(1);
    expect(mailsTo(email)[0]?.subject).toContain('Someone tried to create');
    expect(mailsTo(email)[0]?.text).not.toContain('verify-email');
  });

  it('does not change the password of the existing account', async () => {
    await signUp();
    await confirmEmail(app, email);

    await app.inject({
      method: 'POST',
      url: '/api/auth/sign-up/email',
      payload: { email, password: 'another-long-password', name: 'Mallory' },
      headers: { origin },
    });

    expect((await signIn()).statusCode).toBe(200);
  });
});
