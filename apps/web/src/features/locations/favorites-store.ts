import {
  fetchLocations,
  removeLocation,
  saveLocations,
  type Favorite,
  type FavoriteInput,
} from '../../api/locations.ts';
import { readStoredFavorites, writeStoredFavorites } from './favorites-storage.ts';

function withoutId({ name, latitude, longitude }: Favorite): FavoriteInput {
  return { name, latitude, longitude };
}

function sameCoordinates(a: FavoriteInput, b: FavoriteInput): boolean {
  return a.latitude === b.latitude && a.longitude === b.longitude;
}

export async function loadFavorites(signedIn: boolean): Promise<Favorite[]> {
  const local = readStoredFavorites();
  if (!signedIn) {
    return local;
  }
  const synced = local.length > 0 ? await saveLocations(local.map(withoutId)) : await fetchLocations();
  writeStoredFavorites([]);
  return synced;
}

export async function addFavorite(signedIn: boolean, current: Favorite[], input: FavoriteInput): Promise<Favorite[]> {
  if (signedIn) {
    return saveLocations([input]);
  }
  const next = [
    ...current.filter((favorite) => !sameCoordinates(favorite, input)),
    { id: crypto.randomUUID(), ...input },
  ];
  writeStoredFavorites(next);
  return next;
}

export async function removeFavorite(signedIn: boolean, current: Favorite[], id: string): Promise<Favorite[]> {
  const next = current.filter((favorite) => favorite.id !== id);
  if (signedIn) {
    await removeLocation(id);
  } else {
    writeStoredFavorites(next);
  }
  return next;
}
