import { ApiError } from '../../api/api-error.ts';
import type { Place } from '../location/place.ts';
import { favoriteKey, type Favorite } from './favorites.ts';
import type { FavoritesRemote } from './favorites-remote.ts';

export type FakeFailure = 'push' | 'list' | 'remove' | 'missing';

const offline = () => new TypeError('Network request failed');

export function fakeRemote(initial: Place[] = [], failure?: FakeFailure) {
  const server: Favorite[] = initial.map((place, index) => ({ ...place, id: `server-${index}` }));
  const calls: string[] = [];

  const remote: FavoritesRemote = {
    list: async () => {
      calls.push('list');
      if (failure === 'list') {
        throw offline();
      }
      return server.map((favorite) => ({ ...favorite }));
    },
    push: async (places) => {
      calls.push(`push:${places.length}`);
      if (failure === 'push') {
        throw offline();
      }
      for (const place of places) {
        const stored = server.find((favorite) => favoriteKey(favorite) === favoriteKey(place));
        if (stored === undefined) {
          server.push({ ...place, id: `server-${server.length}` });
        } else {
          stored.name = place.name;
        }
      }
      return server.map((favorite) => ({ ...favorite }));
    },
    remove: async (id) => {
      calls.push(`remove:${id}`);
      if (failure === 'remove') {
        throw offline();
      }
      if (failure === 'missing') {
        throw new ApiError('DELETE', `/api/me/locations/${id}`, 404, '');
      }
      server.splice(
        server.findIndex((favorite) => favorite.id === id),
        1,
      );
    },
  };
  return { remote, server, calls };
}
