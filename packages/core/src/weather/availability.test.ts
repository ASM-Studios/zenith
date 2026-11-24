import { describe, expect, it } from 'vitest';
import { createStubWeatherProvider } from '../testing/index.ts';
import { offersDataType } from './availability.ts';
import type { WeatherProvider } from './provider.ts';

const paris = { latitude: 48.85, longitude: 2.35 };
const tokyo = { latitude: 35.68, longitude: 139.69 };
const franceOnly = { kind: 'regions', regions: [{ south: 41.3, west: -5.2, north: 51.1, east: 9.6 }] } as const;

describe('offersDataType', () => {
  it('offers a declared data type inside the coverage', () => {
    const provider = createStubWeatherProvider({ coverage: franceOnly, dataTypes: ['current'] });
    expect(offersDataType(provider, 'current', paris)).toBe(true);
  });

  it('does not offer a data type outside the coverage', () => {
    const provider = createStubWeatherProvider({ coverage: franceOnly, dataTypes: ['current'] });
    expect(offersDataType(provider, 'current', tokyo)).toBe(false);
  });

  it('does not offer a data type the provider does not declare', () => {
    const provider = createStubWeatherProvider({ dataTypes: ['current'] });
    expect(offersDataType(provider, 'pollen', paris)).toBe(false);
  });

  it('does not offer a declared data type whose method is missing', () => {
    const { getAlerts: _missing, ...withoutAlerts } = createStubWeatherProvider();
    const provider: WeatherProvider = withoutAlerts;
    expect(offersDataType(provider, 'alerts', paris)).toBe(false);
  });
});
