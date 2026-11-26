import type { ApiClient } from '../../api/client.ts';
import { isPlace, type Place } from '../location/place.ts';
import type { Favorite } from './favorites.ts';

export const maxLocationNameLength = 200;

const locationsPath = '/api/me/locations';

export type FavoritesRemote = {
  list(): Promise<Favorite[]>;
  push(places: Place[]): Promise<Favorite[]>;
  remove(id: string): Promise<void>;
};

function storedFavorite(entry: unknown): Favorite[] {
  if (isPlace(entry) && 'id' in entry && typeof entry.id === 'string' && entry.id !== '') {
    return [{ id: entry.id, name: entry.name, latitude: entry.latitude, longitude: entry.longitude }];
  }
  return [];
}

export function parseFavorites(data: unknown): Favorite[] {
  if (typeof data !== 'object' || data === null || !('locations' in data) || !Array.isArray(data.locations)) {
    throw new TypeError('invalid locations response');
  }
  const entries: unknown[] = data.locations;
  return entries.flatMap(storedFavorite);
}

export function createFavoritesRemote(api: Pick<ApiClient, 'get' | 'post' | 'delete'>): FavoritesRemote {
  return {
    list: () => api.get(locationsPath, parseFavorites),
    push: (places) =>
      api.post(
        locationsPath,
        {
          locations: places.map(({ name, latitude, longitude }) => ({
            name: name.trim().slice(0, maxLocationNameLength),
            latitude,
            longitude,
          })),
        },
        parseFavorites,
      ),
    remove: (id) => api.delete(`${locationsPath}/${encodeURIComponent(id)}`),
  };
}
