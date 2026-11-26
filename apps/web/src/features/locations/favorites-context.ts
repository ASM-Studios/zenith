import { createContext } from 'react';
import type { Favorite, FavoriteInput } from '../../api/locations.ts';

export type FavoritesState = {
  favorites: Favorite[];
  ready: boolean;
  loadFailed: boolean;
  add: (input: FavoriteInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const FavoritesContext = createContext<FavoritesState | null>(null);
