import { createStubWeatherProvider } from '@zenith/core/testing';
import { describe, expect, it } from 'vitest';
import { createWeatherRegistry } from './weather.registry.ts';

const paris = { latitude: 48.85, longitude: 2.35 };
const tokyo = { latitude: 35.68, longitude: 139.69 };
const france = { kind: 'regions' as const, regions: [{ south: 41.3, west: -5.2, north: 51.1, east: 9.6 }] };

const global = createStubWeatherProvider({ id: 'global' });
const french = createStubWeatherProvider({ id: 'french', coverage: france });
const currentOnly = createStubWeatherProvider({ id: 'current-only', dataTypes: ['current'] });

describe('createWeatherRegistry', () => {
  it('selects the first registered provider offering the data type', () => {
    const registry = createWeatherRegistry([currentOnly, global]);
    expect(registry.select('current', paris, [])?.id).toBe('current-only');
    expect(registry.select('pollen', paris, [])?.id).toBe('global');
  });

  it('skips a provider whose coverage excludes the location', () => {
    const registry = createWeatherRegistry([french, global]);
    expect(registry.select('current', paris, [])?.id).toBe('french');
    expect(registry.select('current', tokyo, [])?.id).toBe('global');
  });

  it('puts a preferred provider ahead of the registration order', () => {
    const registry = createWeatherRegistry([global, french]);
    expect(registry.select('current', paris, ['french'])?.id).toBe('french');
  });

  it('tries preferences in order and falls back when none offers the data', () => {
    const registry = createWeatherRegistry([global, french, currentOnly]);
    expect(registry.select('daily', paris, ['current-only', 'french'])?.id).toBe('french');
    expect(registry.select('current', tokyo, ['unknown', 'french'])?.id).toBe('global');
  });

  it('returns null when no provider offers the data type at the location', () => {
    expect(createWeatherRegistry([french]).select('current', tokyo, [])).toBeNull();
    expect(createWeatherRegistry([]).select('current', paris, [])).toBeNull();
  });

  it('refuses two providers with the same id', () => {
    expect(() => createWeatherRegistry([global, createStubWeatherProvider({ id: 'global' })])).toThrow(
      'weather provider "global" is registered twice',
    );
  });
});
