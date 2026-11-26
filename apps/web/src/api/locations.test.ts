import { afterEach, describe, expect, test, vi } from 'vitest';
import type { Fetch } from './client.ts';
import { fetchLocations, removeLocation, saveLocations } from './locations.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

const abisko = { id: 'a1', name: 'Abisko', latitude: 68.35, longitude: 18.83 };

function stub(response: Response) {
  const fetch = vi.fn<Fetch>(async () => response);
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('locations api', () => {
  test('fetchLocations returns the favorites of the account', async () => {
    stub(Response.json({ locations: [{ ...abisko, userId: 'u1' }] }));

    await expect(fetchLocations()).resolves.toEqual([abisko]);
  });

  test('fetchLocations rejects an answer without a list of favorites', async () => {
    stub(Response.json({ locations: [{ name: 'Abisko' }] }));

    await expect(fetchLocations()).rejects.toThrow('favorites');
  });

  test('fetchLocations rejects an answer that is not an object', async () => {
    stub(Response.json(null));

    await expect(fetchLocations()).rejects.toThrow('favorites');
  });

  test('saveLocations posts the locations and returns the merged list', async () => {
    const fetch = stub(Response.json({ locations: [abisko] }));

    await expect(saveLocations([{ name: 'Abisko', latitude: 68.35, longitude: 18.83 }])).resolves.toEqual([abisko]);
    expect(fetch.mock.calls[0]?.[1].body).toBe('{"locations":[{"name":"Abisko","latitude":68.35,"longitude":18.83}]}');
  });

  test('removeLocation deletes the location by id', async () => {
    const fetch = stub(new Response(null, { status: 204 }));

    await removeLocation('a/1');
    expect(fetch).toHaveBeenCalledWith('/api/me/locations/a%2F1', expect.objectContaining({ method: 'DELETE' }));
  });
});
