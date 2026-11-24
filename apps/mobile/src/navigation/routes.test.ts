import { expect, test } from 'vitest';
import { initialRoute } from './routes.ts';

test('the app opens on the Home route', () => {
  expect(initialRoute).toBe('Home');
});
