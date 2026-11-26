import { describe, expect, test } from 'vitest';
import { createSelectedPlaceStore, selectedPlaceKey, type KeyValueStorage } from './selected-place.ts';

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

const abisko = { name: 'Abisko', latitude: 68.35, longitude: 18.82 };

describe('createSelectedPlaceStore', () => {
  test('the store returns null when nothing was saved', async () => {
    const store = createSelectedPlaceStore(memoryStorage());

    await expect(store.load()).resolves.toBeNull();
  });

  test('the store restores a saved place', async () => {
    const store = createSelectedPlaceStore(memoryStorage());

    await store.save(abisko);
    await expect(store.load()).resolves.toEqual(abisko);
  });

  test('the store returns null for corrupt stored text and for a stored value that is not a place', async () => {
    const corrupt = createSelectedPlaceStore(memoryStorage({ [selectedPlaceKey]: '{not json' }));
    const notPlace = createSelectedPlaceStore(
      memoryStorage({ [selectedPlaceKey]: JSON.stringify({ name: 'Abisko', latitude: 200, longitude: 0 }) }),
    );

    await expect(corrupt.load()).resolves.toBeNull();
    await expect(notPlace.load()).resolves.toBeNull();
  });

  test('clear removes the saved place', async () => {
    const store = createSelectedPlaceStore(memoryStorage());

    await store.save(abisko);
    await store.clear();
    await expect(store.load()).resolves.toBeNull();
  });
});
