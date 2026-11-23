import { describe, expect, it } from 'vitest';
import { VERSION } from './index.ts';

describe('@zenith/core', () => {
  it('exposes a semver version', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
