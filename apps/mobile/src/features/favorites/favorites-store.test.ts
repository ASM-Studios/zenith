import { describe, expect, test } from 'vitest';
import type { KeyValueStorage } from '../location/selected-place.ts';
import { createFavoritesStore, favoritesKey } from './favorites-store.ts';

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const items = new Map(Object.entries(initial));
  return {
    async getItem(key) {
      return items.get(key) ?? null;
    },
    async setItem(key, value) {
      items.set(key, value);
    },
    async removeItem(key) {
      items.delete(key);
    },
  };
}

function failingReadStorage(): KeyValueStorage {
  return {
    async getItem() {
      throw new Error('read failed');
    },
    async setItem() {},
    async removeItem() {},
  };
}

const abisko = { id: 'a', name: 'Abisko', latitude: 68.35, longitude: 18.82 };
const tromso = { id: 'b', name: 'Tromso', latitude: 69.65, longitude: 18.96 };

describe('createFavoritesStore', () => {
  test('load returns an empty list when nothing was saved', async () => {
    const store = createFavoritesStore(memoryStorage());

    await expect(store.load()).resolves.toEqual([]);
  });

  test('save then load restores the favorites with their ids', async () => {
    const store = createFavoritesStore(memoryStorage());

    await store.save([abisko, { name: 'Kiruna', latitude: 67.85, longitude: 20.22 }]);

    await expect(store.load()).resolves.toEqual([abisko, { name: 'Kiruna', latitude: 67.85, longitude: 20.22 }]);
  });

  test('load drops invalid entries and duplicate coordinates and keeps the valid ones in order', async () => {
    const stored = [
      abisko,
      { name: 'Invalid', latitude: 200, longitude: 0 },
      { id: 'dup', name: 'Duplicate', latitude: 68.35, longitude: 18.82 },
      'not a place',
      tromso,
    ];
    const store = createFavoritesStore(memoryStorage({ [favoritesKey]: JSON.stringify(stored) }));

    await expect(store.load()).resolves.toEqual([abisko, tromso]);
  });

  test('load returns an empty list for corrupt text and for JSON that is not an array', async () => {
    const corrupt = createFavoritesStore(memoryStorage({ [favoritesKey]: '{not json' }));
    const notArray = createFavoritesStore(memoryStorage({ [favoritesKey]: JSON.stringify(abisko) }));

    await expect(corrupt.load()).resolves.toEqual([]);
    await expect(notArray.load()).resolves.toEqual([]);
  });

  test('load returns an empty list when the storage read fails', async () => {
    const store = createFavoritesStore(failingReadStorage());

    await expect(store.load()).resolves.toEqual([]);
  });

  test('load ignores an id that is not a non-empty string', async () => {
    const stored = [
      { id: '', name: 'Empty id', latitude: 68.35, longitude: 18.82 },
      { id: 42, name: 'Numeric id', latitude: 69.65, longitude: 18.96 },
    ];
    const store = createFavoritesStore(memoryStorage({ [favoritesKey]: JSON.stringify(stored) }));

    await expect(store.load()).resolves.toEqual([
      { name: 'Empty id', latitude: 68.35, longitude: 18.82 },
      { name: 'Numeric id', latitude: 69.65, longitude: 18.96 },
    ]);
  });

  test('clear removes the saved favorites', async () => {
    const store = createFavoritesStore(memoryStorage());

    await store.save([abisko]);
    await store.clear();

    await expect(store.load()).resolves.toEqual([]);
  });
});
