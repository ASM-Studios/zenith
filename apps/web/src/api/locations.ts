import { api } from './api.ts';

export type Favorite = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type FavoriteInput = Omit<Favorite, 'id'>;

export function isFavorite(value: unknown): value is Favorite {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'latitude' in value &&
    typeof value.latitude === 'number' &&
    'longitude' in value &&
    typeof value.longitude === 'number'
  );
}

function parseLocations(data: unknown): Favorite[] {
  const list = typeof data === 'object' && data !== null && 'locations' in data ? data.locations : undefined;
  if (Array.isArray(list) && list.every(isFavorite)) {
    return list.map(({ id, name, latitude, longitude }) => ({ id, name, latitude, longitude }));
  }
  throw new TypeError('the locations must be a list of favorites');
}

const ignoreBody = () => undefined;

export function fetchLocations(): Promise<Favorite[]> {
  return api.get('/api/me/locations', parseLocations);
}

export function saveLocations(locations: FavoriteInput[]): Promise<Favorite[]> {
  return api.post('/api/me/locations', { locations }, parseLocations);
}

export function removeLocation(id: string): Promise<void> {
  return api.delete(`/api/me/locations/${encodeURIComponent(id)}`, ignoreBody);
}
