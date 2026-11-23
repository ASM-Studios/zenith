import { afterEach, expect, test, vi } from 'vitest';
import { api } from './api.ts';
import type { Fetch } from './client.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

test('the shared client calls the API on the page origin when VITE_API_URL is unset', async () => {
  const fetch = vi.fn<Fetch>(async () => Response.json({ ok: true }));
  vi.stubGlobal('fetch', fetch);

  await api.get('/api/health', (data) => data);
  expect(fetch).toHaveBeenCalledWith('/api/health', expect.objectContaining({ method: 'GET' }));
});
