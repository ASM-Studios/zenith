import { use } from 'react';
import { FavoritesContext, type FavoritesState } from './favorites-context.ts';

export function useFavorites(): FavoritesState {
  const favorites = use(FavoritesContext);
  if (!favorites) {
    throw new Error('useFavorites needs a FavoritesProvider');
  }
  return favorites;
}
