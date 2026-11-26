import { renderHook } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { useFavorites } from './useFavorites.ts';

test('useFavorites refuses to run outside a FavoritesProvider', () => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);

  expect(() => renderHook(() => useFavorites())).toThrow('useFavorites needs a FavoritesProvider');
});
