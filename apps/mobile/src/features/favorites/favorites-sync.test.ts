import { describe, expect, test } from 'vitest';
import { fakeRemote } from './fake-remote.fake.ts';
import type { Favorite } from './favorites.ts';
import { addFavoriteSynced, maxPushSize, removeFavoriteSynced, syncFavorites } from './favorites-sync.ts';

const paris = { name: 'Paris', latitude: 48.85, longitude: 2.35 };
const tokyo = { name: 'Tokyo', latitude: 35.68, longitude: 139.69 };
const abisko = { name: 'Abisko', latitude: 68.35, longitude: 18.82 };

describe('syncFavorites', () => {
  test('pushes the favorites that have no server id and returns the server list with ids', async () => {
    const { remote, calls } = fakeRemote();

    const synced = await syncFavorites([paris, tokyo], remote);

    expect(calls).toEqual(['push:2', 'list']);
    expect(synced).toEqual([
      { ...paris, id: 'server-0' },
      { ...tokyo, id: 'server-1' },
    ]);
  });

  test('does not push when every local favorite already has an id', async () => {
    const { remote, calls } = fakeRemote([paris]);

    await syncFavorites([{ ...paris, id: 'server-0' }], remote);

    expect(calls).toEqual(['list']);
  });

  test('favorites that only exist on the server are pulled in', async () => {
    const { remote } = fakeRemote([abisko]);

    const synced = await syncFavorites([paris], remote);

    expect(synced.map((favorite) => favorite.name)).toEqual(['Abisko', 'Paris']);
  });

  test('a local favorite with an id the server no longer has is dropped', async () => {
    const { remote } = fakeRemote([tokyo]);

    const synced = await syncFavorites([{ ...paris, id: 'deleted-elsewhere' }], remote);

    expect(synced).toEqual([{ ...tokyo, id: 'server-0' }]);
  });

  test('pushes at most the API limit of favorites per request', async () => {
    const { remote, calls } = fakeRemote();
    const many: Favorite[] = Array.from({ length: maxPushSize * 2 + 50 }, (_, index) => ({
      name: `Place ${index}`,
      latitude: index / 10,
      longitude: 0,
    }));

    const synced = await syncFavorites(many, remote);

    expect(calls.filter((call) => call.startsWith('push')).toSorted()).toEqual(['push:200', 'push:200', 'push:50']);
    expect(synced).toHaveLength(many.length);
  });

  test('a favorite already on the server under another name takes the local name', async () => {
    const { remote } = fakeRemote([paris]);

    const synced = await syncFavorites([{ ...paris, name: 'Paris, France' }], remote);

    expect(synced).toEqual([{ ...paris, name: 'Paris, France', id: 'server-0' }]);
  });

  test('a failing list rejects so the caller keeps its local list', async () => {
    const { remote } = fakeRemote([], 'list');

    await expect(syncFavorites([{ ...paris, id: 'server-0' }], remote)).rejects.toThrow('Network request failed');
  });

  test('a failing push rejects so the caller keeps its local list', async () => {
    const { remote } = fakeRemote([], 'push');

    await expect(syncFavorites([paris], remote)).rejects.toThrow('Network request failed');
  });
});

describe('addFavoriteSynced', () => {
  test('signed out, the favorite is added locally without an id', async () => {
    await expect(addFavoriteSynced([], paris, null)).resolves.toEqual([paris]);
  });

  test('signed in, the favorite is pushed and comes back with its server id', async () => {
    const { remote, server } = fakeRemote();

    const favorites = await addFavoriteSynced([], paris, remote);

    expect(server).toHaveLength(1);
    expect(favorites).toEqual([{ ...paris, id: 'server-0' }]);
  });

  test('signed in but offline, the favorite stays in the local list for the next sync', async () => {
    const { remote } = fakeRemote([], 'push');

    await expect(addFavoriteSynced([tokyo], paris, remote)).resolves.toEqual([tokyo, paris]);
  });
});

describe('removeFavoriteSynced', () => {
  const synced: Favorite[] = [{ ...paris, id: 'server-0' }, tokyo];

  test('signed out, the favorite is removed locally and nothing else happens', async () => {
    await expect(removeFavoriteSynced(synced, paris, null)).resolves.toEqual([tokyo]);
  });

  test('signed in, the server copy is deleted by id before the local one is removed', async () => {
    const { remote, calls, server } = fakeRemote([paris]);

    await expect(removeFavoriteSynced(synced, paris, remote)).resolves.toEqual([tokyo]);
    expect(calls).toEqual(['remove:server-0']);
    expect(server).toHaveLength(0);
  });

  test('a favorite that was never synced is removed without calling the server', async () => {
    const { remote, calls } = fakeRemote();

    await expect(removeFavoriteSynced(synced, tokyo, remote)).resolves.toEqual([{ ...paris, id: 'server-0' }]);
    expect(calls).toEqual([]);
  });

  test('a favorite the server already deleted is removed locally', async () => {
    const { remote } = fakeRemote([paris], 'missing');

    await expect(removeFavoriteSynced(synced, paris, remote)).resolves.toEqual([tokyo]);
  });

  test('a failing delete rejects so the favorite stays in the caller list', async () => {
    const { remote } = fakeRemote([paris], 'remove');

    await expect(removeFavoriteSynced(synced, paris, remote)).rejects.toThrow('Network request failed');
  });
});
