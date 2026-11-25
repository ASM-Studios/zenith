import { afterEach, expect, test, vi } from 'vitest';
import type { Fetch } from './client.ts';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.doUnmock('react-native');
  vi.resetModules();
});

async function requestedUrl(os: string): Promise<string | undefined> {
  vi.doMock('react-native', () => ({ Platform: { OS: os } }));
  const fetch = vi.fn<Fetch>(async () => Response.json({ ok: true }));
  vi.stubGlobal('fetch', fetch);
  const { api } = await import('./api.ts');
  await api.get('/api/health', (data) => data);
  return fetch.mock.calls[0]?.[0];
}

test('the shared client calls the API at the default URL of the running platform', async () => {
  expect(await requestedUrl('ios')).toBe('http://localhost:3000/api/health');
});

test('EXPO_PUBLIC_API_URL overrides the platform default', async () => {
  vi.stubEnv('EXPO_PUBLIC_API_URL', 'http://192.168.1.20:3000');
  expect(await requestedUrl('android')).toBe('http://192.168.1.20:3000/api/health');
});
