import { type ReactNode, useEffect, useMemo, useState } from 'react';
import type { Favorite, FavoriteInput } from '../../api/locations.ts';
import { useSession } from '../auth/useSession.ts';
import { FavoritesContext } from './favorites-context.ts';
import { readStoredFavorites } from './favorites-storage.ts';
import { addFavorite, loadFavorites, removeFavorite } from './favorites-store.ts';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, ready: sessionReady } = useSession();
  const signedIn = user !== null;
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!sessionReady) {
      return undefined;
    }
    let current = true;
    loadFavorites(signedIn)
      .then(
        (loaded) => {
          if (current) {
            setFavorites(loaded);
            setLoadFailed(false);
          }
        },
        () => {
          if (current) {
            setFavorites(readStoredFavorites());
            setLoadFailed(true);
          }
        },
      )
      .finally(() => {
        if (current) {
          setReady(true);
        }
      });
    return () => {
      current = false;
    };
  }, [sessionReady, signedIn]);

  const state = useMemo(
    () => ({
      favorites,
      ready,
      loadFailed,
      add: async (input: FavoriteInput) => setFavorites(await addFavorite(signedIn, favorites, input)),
      remove: async (id: string) => setFavorites(await removeFavorite(signedIn, favorites, id)),
    }),
    [favorites, ready, loadFailed, signedIn],
  );
  return <FavoritesContext value={state}>{children}</FavoritesContext>;
}
