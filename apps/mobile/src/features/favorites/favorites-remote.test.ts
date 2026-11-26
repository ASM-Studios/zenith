import { describe, expect, test, vi } from 'vitest';
import { createApiClient, type Fetch } from '../../api/client.ts';
import { createFavoritesRemote, maxLocationNameLength, parseFavorites } from './favorites-remote.ts';

const stored = { id: 'a1', name: 'Paris', latitude: 48.85, longitude: 2.35 };

function remoteAnswering(response: Response) {
  const fetch = vi.fn<Fetch>(async () => response);
  return { fetch, remote: createFavoritesRemote(createApiClient({ baseUrl: 'https://zenith.test', fetch })) };
}

describe('parseFavorites', () => {
  test('keeps the id, name and coordinates of each stored location', () => {
    expect(parseFavorites({ locations: [{ ...stored, userId: 'u1', createdAt: 'x' }] })).toEqual([stored]);
  });

  test('drops locations without an id or with invalid coordinates', () => {
    const invalid = [{ ...stored, id: undefined }, { ...stored, id: '' }, { ...stored, latitude: 200 }, null, 'x'];

    expect(parseFavorites({ locations: [...invalid, stored] })).toEqual([stored]);
  });

  test('a response without a locations array is rejected', () => {
    expect(() => parseFavorites({ locations: 'none' })).toThrow('invalid locations response');
    expect(() => parseFavorites(null)).toThrow('invalid locations response');
  });
});

describe('createFavoritesRemote', () => {
  test('list gets the locations of the account', async () => {
    const { remote, fetch } = remoteAnswering(Response.json({ locations: [stored] }));

    await expect(remote.list()).resolves.toEqual([stored]);
    expect(fetch.mock.calls[0]?.[0]).toBe('https://zenith.test/api/me/locations');
    expect(fetch.mock.calls[0]?.[1].method).toBe('GET');
  });

  test('push posts only the name and coordinates, trimmed and limited to the API name length', async () => {
    const { remote, fetch } = remoteAnswering(Response.json({ locations: [stored] }));
    const long = { id: 'ignored', name: `  ${'x'.repeat(maxLocationNameLength + 10)}`, latitude: 1, longitude: 2 };

    await remote.push([long]);

    expect(fetch.mock.calls[0]?.[1].method).toBe('POST');
    const body = fetch.mock.calls[0]?.[1].body;
    expect(typeof body === 'string' ? JSON.parse(body) : body).toEqual({
      locations: [{ name: 'x'.repeat(maxLocationNameLength), latitude: 1, longitude: 2 }],
    });
  });

  test('remove deletes the location by its encoded id', async () => {
    const { remote, fetch } = remoteAnswering(new Response(null, { status: 204 }));

    await remote.remove('a/b');

    expect(fetch.mock.calls[0]?.[0]).toBe('https://zenith.test/api/me/locations/a%2Fb');
    expect(fetch.mock.calls[0]?.[1].method).toBe('DELETE');
  });
});
