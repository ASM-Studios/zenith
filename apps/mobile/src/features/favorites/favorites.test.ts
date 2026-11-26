import { describe, expect, test } from 'vitest';
import { addFavorite, favoriteKey, isFavorite, removeFavorite, type Favorite } from './favorites.ts';

const abisko = { name: 'Abisko', latitude: 68.35, longitude: 18.82 };
const tromso = { name: 'Tromso', latitude: 69.65, longitude: 18.96 };

describe('favoriteKey', () => {
  test('favoriteKey joins latitude and longitude without rounding', () => {
    expect(favoriteKey({ name: 'Precise', latitude: 68.123456789, longitude: -18.5 })).toBe('68.123456789,-18.5');
  });
});

describe('addFavorite', () => {
  test('addFavorite appends a place without an id at the end', () => {
    const favorites: Favorite[] = [{ id: 'a', ...tromso }];

    const result = addFavorite(favorites, abisko);

    expect(result).toEqual([
      { id: 'a', ...tromso },
      { name: 'Abisko', latitude: 68.35, longitude: 18.82 },
    ]);
    expect(result[1]).not.toHaveProperty('id');
  });

  test('addFavorite keeps the position and id of an existing place and takes the new name', () => {
    const favorites: Favorite[] = [
      { id: 'a', ...tromso },
      { id: 'b', ...abisko },
    ];

    const result = addFavorite(favorites, { ...abisko, name: 'Abisko National Park' });

    expect(result).toEqual([
      { id: 'a', ...tromso },
      { id: 'b', name: 'Abisko National Park', latitude: 68.35, longitude: 18.82 },
    ]);
  });

  test('addFavorite and removeFavorite do not mutate their input', () => {
    const favorites: Favorite[] = [{ id: 'a', ...tromso }];
    const snapshot = favorites.map((favorite) => ({ ...favorite }));

    const added = addFavorite(favorites, abisko);
    const renamed = addFavorite(favorites, { ...tromso, name: 'Renamed' });
    const removed = removeFavorite(favorites, tromso);

    expect(favorites).toEqual(snapshot);
    expect(added).not.toBe(favorites);
    expect(renamed).not.toBe(favorites);
    expect(removed).not.toBe(favorites);
  });
});

describe('removeFavorite', () => {
  test('removeFavorite drops the place with the same coordinates and keeps the others', () => {
    const favorites: Favorite[] = [
      { id: 'a', ...tromso },
      { id: 'b', ...abisko },
    ];

    expect(removeFavorite(favorites, { ...abisko, name: 'Other name' })).toEqual([{ id: 'a', ...tromso }]);
  });

  test('removeFavorite returns an equal list when the place is not a favorite', () => {
    const favorites: Favorite[] = [{ id: 'a', ...tromso }];

    expect(removeFavorite(favorites, abisko)).toEqual(favorites);
  });
});

describe('isFavorite', () => {
  test('isFavorite matches on coordinates and ignores the name', () => {
    const favorites: Favorite[] = [{ id: 'a', ...abisko }];

    expect(isFavorite(favorites, { name: 'Another name', latitude: 68.35, longitude: 18.82 })).toBe(true);
    expect(isFavorite(favorites, { ...abisko, latitude: 68.3500001 })).toBe(false);
  });
});
