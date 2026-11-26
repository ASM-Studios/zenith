import { afterEach, expect, test, vi } from 'vitest';
import type { Fetch } from './client.ts';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.doUnmock('react-native');
  vi.doUnmock('expo-secure-store');
  vi.resetModules();
});

async function firstRequest(os: string, token: string | null = null) {
  vi.doMock('react-native', () => ({ Platform: { OS: os } }));
  vi.doMock('expo-secure-store', () => ({
    getItemAsync: async () => token,
    setItemAsync: async () => undefined,
    deleteItemAsync: async () => undefined,
  }));
  const fetch = vi.fn<Fetch>(async () => Response.json({ ok: true }));
  vi.stubGlobal('fetch', fetch);
  const { api } = await import('./api.ts');
  await api.get('/api/health', (data) => data);
  return fetch.mock.calls[0];
}

test('the shared client calls the API at the default URL of the running platform', async () => {
  expect((await firstRequest('ios'))?.[0]).toBe('http://localhost:3000/api/health');
});

test('EXPO_PUBLIC_API_URL overrides the platform default', async () => {
  vi.stubEnv('EXPO_PUBLIC_API_URL', 'http://192.168.1.20:3000');
  expect((await firstRequest('android'))?.[0]).toBe('http://192.168.1.20:3000/api/health');
});

test('the shared client sends the session token kept in secure storage', async () => {
  expect((await firstRequest('ios', 'stored-token'))?.[1].headers).toMatchObject({
    authorization: 'Bearer stored-token',
  });
});

test('the shared client sends no authorization header while signed out', async () => {
  expect((await firstRequest('ios'))?.[1].headers).toEqual({ accept: 'application/json' });
});
