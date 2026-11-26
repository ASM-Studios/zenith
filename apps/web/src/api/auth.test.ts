import { afterEach, describe, expect, test, vi } from 'vitest';
import { json, sentBody, stubApi } from '../test/stub-api.ts';
import { ApiError } from './api-error.ts';
import { authErrorCode, currentUser, signIn, signOut, signUp, verifyEmail } from './auth.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

const user = { id: 'u1', name: 'Ada', email: 'ada@example.com', emailVerified: true };
const credentials = { email: user.email, password: 'p', callbackURL: '/' };

describe('auth client', () => {
  test('sign-up posts the name, email, password and callback to Better Auth', async () => {
    const fetch = stubApi({ '/api/auth/sign-up/email': json(200, { token: null, user }) });
    const input = { name: 'Ada', email: 'ada@example.com', password: 'a-long-password', callbackURL: '/en/sign-in' };

    await expect(signUp(input)).resolves.toBeUndefined();
    expect(sentBody(fetch, '/api/auth/sign-up/email')).toEqual(input);
  });

  test('verify-email sends the escaped token to Better Auth and rejects a refused one', async () => {
    stubApi({
      '/api/auth/verify-email?token=a%2Bb': json(200, { status: true }),
      '/api/auth/verify-email?token=old': json(401, { code: 'TOKEN_EXPIRED' }),
    });

    await expect(verifyEmail('a+b')).resolves.toBeUndefined();
    await expect(verifyEmail('old')).rejects.toBeInstanceOf(ApiError);
  });

  test('sign-in returns the name and email of the signed-in user', async () => {
    stubApi({ '/api/auth/sign-in/email': json(200, { token: 't', user }) });

    await expect(signIn(credentials)).resolves.toEqual({
      name: 'Ada',
      email: 'ada@example.com',
    });
  });

  test('sign-in rejects a response without a user', async () => {
    stubApi({ '/api/auth/sign-in/email': json(200, { token: 't' }) });
    await expect(signIn(credentials)).rejects.toThrow(TypeError);

    stubApi({ '/api/auth/sign-in/email': json(200, 'signed in') });
    await expect(signIn(credentials)).rejects.toThrow(TypeError);
  });

  test('the current user is null without a session and the session user otherwise', async () => {
    stubApi({ '/api/auth/get-session': json(200, null) });
    await expect(currentUser()).resolves.toBeNull();

    stubApi({ '/api/auth/get-session': json(200, { session: { id: 's1' }, user }) });
    await expect(currentUser()).resolves.toEqual({ name: 'Ada', email: 'ada@example.com' });
  });

  test('sign-out posts an empty body', async () => {
    const fetch = stubApi({ '/api/auth/sign-out': json(200, { success: true }) });

    await signOut();
    expect(sentBody(fetch, '/api/auth/sign-out')).toEqual({});
  });
});

describe('authErrorCode', () => {
  test('reads the code of a Better Auth error body', () => {
    const error = new ApiError('POST', '/api/auth/sign-in/email', 403, '{"code":"EMAIL_NOT_VERIFIED"}');
    expect(authErrorCode(error)).toBe('EMAIL_NOT_VERIFIED');
  });

  test('is undefined for a body that is not JSON or has no string code', () => {
    expect(authErrorCode(new ApiError('POST', '/x', 500, 'Bad gateway'))).toBeUndefined();
    expect(authErrorCode(new ApiError('POST', '/x', 400, '{"code":42}'))).toBeUndefined();
  });

  test('is undefined for an error that is not an API error', () => {
    expect(authErrorCode(new TypeError('Failed to fetch'))).toBeUndefined();
  });
});
