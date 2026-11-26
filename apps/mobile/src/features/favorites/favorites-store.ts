import { isPlace, type Place } from '../location/place.ts';
import type { KeyValueStorage } from '../location/selected-place.ts';
import { favoriteKey, type Favorite } from './favorites.ts';

export const favoritesKey = 'zenith.favorites';

export function createFavoritesStore(storage: KeyValueStorage) {
  return {
    async load(): Promise<Favorite[]> {
      try {
        const text = await storage.getItem(favoritesKey);
        if (text === null) {
          return [];
        }
        return toFavorites(parseJson(text));
      } catch {
        return [];
      }
    },
    async save(favorites: Favorite[]): Promise<void> {
      await storage.setItem(favoritesKey, JSON.stringify(favorites.map(toStoredFavorite)));
    },
    async clear(): Promise<void> {
      await storage.removeItem(favoritesKey);
    },
  };
}

function toFavorites(value: unknown): Favorite[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<string>();
  const favorites: Favorite[] = [];
  for (const rawEntry of value) {
    if (!isPlace(rawEntry)) {
      continue;
    }
    const key = favoriteKey(rawEntry);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    favorites.push(withId(rawEntry, storedId(rawEntry)));
  }
  return favorites;
}

function storedId(entry: unknown): string | undefined {
  const raw = typeof entry === 'object' && entry !== null && 'id' in entry ? entry.id : undefined;
  return typeof raw === 'string' && raw !== '' ? raw : undefined;
}

function toStoredFavorite(entry: Favorite): Favorite {
  return withId(entry, entry.id);
}

function withId(place: Place, id: string | undefined): Favorite {
  const { name, latitude, longitude } = place;
  return id === undefined || id === '' ? { name, latitude, longitude } : { name, latitude, longitude, id };
}

function parseJson(text: string): unknown {
  try {
    const value: unknown = JSON.parse(text);
    return value;
  } catch {
    return undefined;
  }
}
