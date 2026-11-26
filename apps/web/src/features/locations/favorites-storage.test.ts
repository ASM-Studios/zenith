import { afterEach, describe, expect, test, vi } from 'vitest';
import type { Favorite } from '../../api/locations.ts';
import { favoritesStorageKey, readStoredFavorites, writeStoredFavorites } from './favorites-storage.ts';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

const abisko: Favorite = { id: 'a1', name: 'Abisko', latitude: 68.35, longitude: 18.83 };
const tromso: Favorite = { id: 't1', name: 'Tromso', latitude: 69.65, longitude: 18.96 };

describe('favorites storage', () => {
  test('favoritesStorageKey names the key under which favorites are stored', () => {
    expect(favoritesStorageKey).toBe('zenith.favorites');
  });

  test('writeStoredFavorites then readStoredFavorites returns the same favorites', () => {
    writeStoredFavorites([abisko, tromso]);

    expect(readStoredFavorites()).toEqual([abisko, tromso]);
  });

  test('writeStoredFavorites stores the favorites as JSON under the storage key', () => {
    writeStoredFavorites([abisko]);

    expect(window.localStorage.getItem(favoritesStorageKey)).toBe(JSON.stringify([abisko]));
  });

  test('writeStoredFavorites removes the key when the list is empty', () => {
    writeStoredFavorites([abisko]);
    writeStoredFavorites([]);

    expect(window.localStorage.getItem(favoritesStorageKey)).toBeNull();
  });

  test('readStoredFavorites returns an empty list when nothing is stored', () => {
    expect(readStoredFavorites()).toEqual([]);
  });

  test('readStoredFavorites returns an empty list when the stored text is corrupt JSON', () => {
    window.localStorage.setItem(favoritesStorageKey, '{not json');

    expect(readStoredFavorites()).toEqual([]);
  });

  test('readStoredFavorites returns an empty list when the stored JSON is not an array', () => {
    window.localStorage.setItem(favoritesStorageKey, JSON.stringify({ locations: [abisko] }));

    expect(readStoredFavorites()).toEqual([]);
  });

  test('readStoredFavorites drops the entries that are not favorites', () => {
    window.localStorage.setItem(
      favoritesStorageKey,
      JSON.stringify([abisko, { name: 'Missing id', latitude: 1, longitude: 2 }, 'Tromso', null]),
    );

    expect(readStoredFavorites()).toEqual([abisko]);
  });

  test('readStoredFavorites returns an empty list when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    expect(readStoredFavorites()).toEqual([]);
  });

  test('writeStoredFavorites does not throw when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    expect(() => writeStoredFavorites([abisko])).not.toThrow();
  });
});
