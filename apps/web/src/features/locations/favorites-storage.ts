import { type Favorite, isFavorite } from '../../api/locations.ts';

export const favoritesStorageKey = 'zenith.favorites';

export function readStoredFavorites(): Favorite[] {
  try {
    const raw = window.localStorage.getItem(favoritesStorageKey);
    if (raw === null) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isFavorite) : [];
  } catch {
    return [];
  }
}

export function writeStoredFavorites(favorites: Favorite[]): void {
  try {
    if (favorites.length === 0) {
      window.localStorage.removeItem(favoritesStorageKey);
    } else {
      window.localStorage.setItem(favoritesStorageKey, JSON.stringify(favorites));
    }
  } catch {
    return;
  }
}
