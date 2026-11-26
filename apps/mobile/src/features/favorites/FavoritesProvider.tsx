import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api } from '../../api/api.ts';
import { useSession } from '../../auth/SessionProvider.tsx';
import type { Place } from '../location/place.ts';
import { isFavorite, type Favorite } from './favorites.ts';
import { createFavoritesRemote } from './favorites-remote.ts';
import { createFavoritesStore } from './favorites-store.ts';
import { addFavoriteSynced, removeFavoriteSynced, syncFavorites } from './favorites-sync.ts';

const store = createFavoritesStore(AsyncStorage);
const remote = createFavoritesRemote(api);

const updateFailed = 'Could not update your favorites. Check your connection and try again.';

type FavoritesContextValue = {
  favorites: Favorite[];
  failure: string | null;
  has: (place: Place) => boolean;
  toggle: (place: Place) => Promise<void>;
  remove: (place: Place) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { state } = useSession();
  const userId = state.status === 'signedIn' ? state.user.id : null;
  const activeRemote = userId === null ? null : remote;
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [failure, setFailure] = useState<string | null>(null);
  const [previousUserId, setPreviousUserId] = useState(userId);
  const signedInBefore = useRef(false);

  const commit = useCallback((next: Favorite[]) => {
    setFavorites(next);
    void store.save(next).catch(() => undefined);
  }, []);

  useEffect(() => {
    let current = true;
    void store.load().then((saved) => {
      if (current) {
        setFavorites((chosen) => (chosen.length > 0 ? chosen : saved));
      }
    });
    return () => {
      current = false;
    };
  }, []);

  if (previousUserId !== userId) {
    setPreviousUserId(userId);
    if (userId === null) {
      setFavorites([]);
      setFailure(null);
    }
  }

  useEffect(() => {
    const wasSignedIn = signedInBefore.current;
    signedInBefore.current = userId !== null;
    if (userId === null && wasSignedIn) {
      void store.clear().catch(() => undefined);
    }
  }, [userId]);

  useEffect(() => {
    let current = true;
    if (userId !== null) {
      void store
        .load()
        .then((local) => syncFavorites(local, remote))
        .then((synced) => {
          if (current) {
            commit(synced);
          }
        })
        .catch(() => undefined);
    }
    return () => {
      current = false;
    };
  }, [userId, commit]);

  const remove = useCallback(
    async (place: Place) => {
      setFailure(null);
      try {
        commit(await removeFavoriteSynced(favorites, place, activeRemote));
      } catch {
        setFailure(updateFailed);
      }
    },
    [favorites, activeRemote, commit],
  );

  const toggle = useCallback(
    async (place: Place) => {
      if (isFavorite(favorites, place)) {
        await remove(place);
        return;
      }
      setFailure(null);
      commit(await addFavoriteSynced(favorites, place, activeRemote));
    },
    [favorites, activeRemote, commit, remove],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({ favorites, failure, has: (place) => isFavorite(favorites, place), toggle, remove }),
    [favorites, failure, toggle, remove],
  );
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const value = useContext(FavoritesContext);
  if (value === null) {
    throw new Error('useFavorites must be used inside FavoritesProvider');
  }
  return value;
}
