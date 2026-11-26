import { describe, expect, test, vi } from 'vitest';
import { ApiError } from './api-error.ts';
import { createApiClient, type Fetch } from './client.ts';

const asIs = (data: unknown) => data;

function parseKp(data: unknown): number {
  if (typeof data === 'object' && data !== null && 'kp' in data && typeof data.kp === 'number') {
    return data.kp;
  }
  throw new TypeError('kp must be a number');
}

function respondWith(response: Response) {
  return vi.fn<Fetch>(async () => response);
}

describe('createApiClient', () => {
  test('get prefixes the path with the base URL and returns the parsed JSON body', async () => {
    const fetch = respondWith(Response.json({ kp: 5 }));
    const client = createApiClient({ baseUrl: 'https://zenith.test', fetch });

    await expect(client.get('/api/space/kp', parseKp)).resolves.toBe(5);
    expect(fetch).toHaveBeenCalledWith('https://zenith.test/api/space/kp', {
      method: 'GET',
      credentials: 'include',
      headers: { accept: 'application/json' },
    });
  });

  test('post sends the body as JSON with a JSON content type', async () => {
    const fetch = respondWith(Response.json({ id: 1 }));
    const client = createApiClient({ baseUrl: '', fetch });

    await client.post('/api/favorites', { name: 'Abisko' }, asIs);
    expect(fetch).toHaveBeenCalledWith('/api/favorites', {
      method: 'POST',
      credentials: 'include',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: '{"name":"Abisko"}',
    });
  });

  test('delete accepts an empty 204 answer', async () => {
    const fetch = respondWith(new Response(null, { status: 204 }));
    const client = createApiClient({ baseUrl: '', fetch });

    await expect(client.delete('/api/me/locations/1', () => 'gone')).resolves.toBe('gone');
    expect(fetch).toHaveBeenCalledWith('/api/me/locations/1', {
      method: 'DELETE',
      credentials: 'include',
      headers: { accept: 'application/json' },
    });
  });

  test('a non-2xx response rejects with an ApiError carrying the status and body', async () => {
    const client = createApiClient({ baseUrl: '', fetch: respondWith(new Response('nope', { status: 401 })) });

    const error = await client.get('/api/me', asIs).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ method: 'GET', path: '/api/me', status: 401, body: 'nope' });
  });

  test('a body the parser rejects rejects the call with the parser error', async () => {
    const client = createApiClient({ baseUrl: '', fetch: respondWith(Response.json({ kp: 'high' })) });

    await expect(client.get('/api/space/kp', parseKp)).rejects.toThrow('kp must be a number');
  });
});
