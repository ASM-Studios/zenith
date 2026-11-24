import { describe, expect, it } from 'vitest';
import { preferredProviderIds } from './weather.preferences.ts';

describe('preferredProviderIds', () => {
  it('orders the requested provider, the per-type preference, then the weather preference', () => {
    expect(preferredProviderIds('pollen', 'asked', { pollen: 'per-type', weather: 'general', aurora: 'noaa' })).toEqual(
      ['asked', 'per-type', 'general'],
    );
  });

  it('leaves out what is not set', () => {
    expect(preferredProviderIds('current', undefined, { weather: 'general' })).toEqual(['general']);
    expect(preferredProviderIds('current', undefined, {})).toEqual([]);
  });
});
