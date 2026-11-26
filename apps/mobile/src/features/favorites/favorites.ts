import type { Place } from '../location/place.ts';

export type Favorite = Place & { id?: string };

export function favoriteKey(place: Place): string {
  return `${place.latitude},${place.longitude}`;
}

export function isFavorite(favorites: Favorite[], place: Place): boolean {
  const key = favoriteKey(place);
  return favorites.some((favorite) => favoriteKey(favorite) === key);
}

export function addFavorite(favorites: Favorite[], place: Place): Favorite[] {
  const key = favoriteKey(place);
  if (!isFavorite(favorites, place)) {
    return [...favorites, { name: place.name, latitude: place.latitude, longitude: place.longitude }];
  }
  return favorites.map((favorite) => (favoriteKey(favorite) === key ? { ...favorite, name: place.name } : favorite));
}

export function removeFavorite(favorites: Favorite[], place: Place): Favorite[] {
  const key = favoriteKey(place);
  return favorites.filter((favorite) => favoriteKey(favorite) !== key);
}
