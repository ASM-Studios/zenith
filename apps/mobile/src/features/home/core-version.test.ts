import { VERSION } from '@zenith/core';
import { expect, test } from 'vitest';

test('the mobile app resolves the shared core package', () => {
  expect(VERSION).toBe('1.0.0');
});
