import { ApiError } from '../../api/api-error.ts';
import type { Place } from '../location/place.ts';
import { addFavorite, favoriteKey, removeFavorite, type Favorite } from './favorites.ts';
import type { FavoritesRemote } from './favorites-remote.ts';

export const maxPushSize = 200;

function batchesOf<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );
}

export async function syncFavorites(local: Favorite[], remote: FavoritesRemote): Promise<Favorite[]> {
  const unsynced = local.filter((favorite) => favorite.id === undefined);
  await Promise.all(batchesOf(unsynced, maxPushSize).map((batch) => remote.push(batch)));
  return remote.list();
}

export async function addFavoriteSynced(
  favorites: Favorite[],
  place: Place,
  remote: FavoritesRemote | null,
): Promise<Favorite[]> {
  const added = addFavorite(favorites, place);
  if (remote === null) {
    return added;
  }
  return syncFavorites(added, remote).catch(() => added);
}

async function removeRemote(remote: FavoritesRemote, id: string): Promise<void> {
  try {
    await remote.remove(id);
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      throw error;
    }
  }
}

export async function removeFavoriteSynced(
  favorites: Favorite[],
  place: Place,
  remote: FavoritesRemote | null,
): Promise<Favorite[]> {
  const id = favorites.find((favorite) => favoriteKey(favorite) === favoriteKey(place))?.id;
  if (remote !== null && id !== undefined) {
    await removeRemote(remote, id);
  }
  return removeFavorite(favorites, place);
}
