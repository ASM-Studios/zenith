import { expect, test } from 'vitest';
import { initialRoute, tabRoutes } from './routes.ts';

test('the app opens on the Home route', () => {
  expect(initialRoute).toBe('Home');
});

test('the tabs are Home, Favorites and Account in that order', () => {
  expect(tabRoutes).toEqual(['Home', 'Favorites', 'Account']);
});

test('the initial route is one of the tabs', () => {
  expect(tabRoutes).toContain(initialRoute);
});
