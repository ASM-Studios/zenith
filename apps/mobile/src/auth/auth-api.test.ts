import { describe, expect, test, vi } from 'vitest';
import type { Fetch } from '../api/client.ts';
import { createAuthApi } from './auth-api.ts';
import { memoryStorage } from './memory-storage.fake.ts';
import { createTokenStore, sessionTokenKey } from './token-store.ts';

const user = { id: 'u1', email: 'ada@example.com', name: 'Ada' };

function setup(response: Response | Error, stored: Record<string, string> = {}) {
  const storage = memoryStorage(stored);
  const fetch = vi.fn<Fetch>(async () => {
    if (response instanceof Error) {
      throw response;
    }
    return response;
  });
  const api = createAuthApi({ baseUrl: 'https://zenith.test', fetch, tokenStore: createTokenStore(storage) });
  return { api, fetch, storage };
}

const signedIn = () => Response.json({ token: 'body-token', user }, { headers: { 'set-auth-token': 'header-token' } });

const credentials = { email: ' ada@example.com ', password: 'a-long-password' };

describe('signIn', () => {
  test('posts the trimmed email and password without cookies and keeps the header token', async () => {
    const { api, fetch, storage } = setup(signedIn());

    await expect(api.signIn(credentials)).resolves.toEqual(user);

    expect(fetch).toHaveBeenCalledWith('https://zenith.test/api/auth/sign-in/email', {
      method: 'POST',
      credentials: 'omit',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ada@example.com', password: 'a-long-password' }),
    });
    expect(storage.entries.get(sessionTokenKey)).toBe('header-token');
  });

  test('a 401 rejects as invalid credentials and stores no token', async () => {
    const { api, storage } = setup(new Response('{"code":"INVALID_EMAIL_OR_PASSWORD"}', { status: 401 }));

    await expect(api.signIn(credentials)).rejects.toMatchObject({ kind: 'invalid-credentials' });
    expect(storage.entries.size).toBe(0);
  });

  test('a success without the token header rejects as unknown and stores nothing', async () => {
    const { api, storage } = setup(Response.json({ token: 'body-token', user }));

    await expect(api.signIn(credentials)).rejects.toMatchObject({ kind: 'unknown' });
    expect(storage.entries.size).toBe(0);
  });

  test('a success whose body is not JSON rejects as unknown and stores nothing', async () => {
    const { api, storage } = setup(new Response('<html></html>', { headers: { 'set-auth-token': 'header-token' } }));

    await expect(api.signIn(credentials)).rejects.toMatchObject({ kind: 'unknown' });
    expect(storage.entries.size).toBe(0);
  });

  test('a failing request rejects as a network error', async () => {
    const { api } = setup(new TypeError('Network request failed'));

    await expect(api.signIn(credentials)).rejects.toMatchObject({ kind: 'network' });
  });
});

describe('signUp', () => {
  test('posts the trimmed name and email and keeps the header token', async () => {
    const { api, fetch, storage } = setup(signedIn());

    await expect(api.signUp({ ...credentials, name: ' Ada ' })).resolves.toEqual(user);

    expect(fetch.mock.calls[0]?.[0]).toBe('https://zenith.test/api/auth/sign-up/email');
    expect(fetch.mock.calls[0]?.[1].body).toBe(
      JSON.stringify({ name: 'Ada', email: 'ada@example.com', password: 'a-long-password' }),
    );
    expect(storage.entries.get(sessionTokenKey)).toBe('header-token');
  });

  test('an email already in use rejects as email taken', async () => {
    const { api } = setup(new Response('{"code":"USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"}', { status: 422 }));

    await expect(api.signUp({ ...credentials, name: 'Ada' })).rejects.toMatchObject({ kind: 'email-taken' });
  });
});

describe('getSession', () => {
  test('without a stored token it returns null and does not call the server', async () => {
    const { api, fetch } = setup(Response.json({ user }));

    await expect(api.getSession()).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  test('it sends the stored token as a bearer and returns the user', async () => {
    const { api, fetch } = setup(Response.json({ session: {}, user }), { [sessionTokenKey]: 'stored' });

    await expect(api.getSession()).resolves.toEqual(user);
    expect(fetch.mock.calls[0]?.[1].headers).toEqual({ accept: 'application/json', authorization: 'Bearer stored' });
  });

  test('a null session clears the stored token', async () => {
    const { api, storage } = setup(Response.json(null), { [sessionTokenKey]: 'expired' });

    await expect(api.getSession()).resolves.toBeNull();
    expect(storage.entries.size).toBe(0);
  });

  test('a 401 clears the stored token', async () => {
    const { api, storage } = setup(new Response('', { status: 401 }), { [sessionTokenKey]: 'expired' });

    await expect(api.getSession()).resolves.toBeNull();
    expect(storage.entries.size).toBe(0);
  });

  test('a network failure keeps the stored token so the user stays signed in offline', async () => {
    const { api, storage } = setup(new TypeError('Network request failed'), { [sessionTokenKey]: 'stored' });

    await expect(api.getSession()).rejects.toMatchObject({ kind: 'network' });
    expect(storage.entries.get(sessionTokenKey)).toBe('stored');
  });

  test('a server error keeps the stored token', async () => {
    const { api, storage } = setup(new Response('', { status: 503 }), { [sessionTokenKey]: 'stored' });

    await expect(api.getSession()).rejects.toMatchObject({ kind: 'unknown' });
    expect(storage.entries.get(sessionTokenKey)).toBe('stored');
  });
});

describe('signOut', () => {
  test('it tells the server with the bearer token and clears the stored token', async () => {
    const { api, fetch, storage } = setup(Response.json({ success: true }), { [sessionTokenKey]: 'stored' });

    await api.signOut();

    expect(fetch.mock.calls[0]?.[0]).toBe('https://zenith.test/api/auth/sign-out');
    expect(fetch.mock.calls[0]?.[1].headers).toMatchObject({ authorization: 'Bearer stored' });
    expect(storage.entries.size).toBe(0);
  });

  test('it clears the stored token even when the server cannot be reached', async () => {
    const { api, storage } = setup(new TypeError('Network request failed'), { [sessionTokenKey]: 'stored' });

    await expect(api.signOut()).resolves.toBeUndefined();
    expect(storage.entries.size).toBe(0);
  });

  test('without a stored token it does not call the server', async () => {
    const { api, fetch } = setup(Response.json({ success: true }));

    await api.signOut();

    expect(fetch).not.toHaveBeenCalled();
  });
});
