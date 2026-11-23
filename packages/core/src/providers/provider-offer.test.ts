import { describe, expect, it } from 'vitest';
import { stubWeatherProvider } from '../../test/stub-weather-provider.ts';
import { offersAt, providersOffering, providesDataType } from '../index.ts';

const paris = { latitude: 48.85, longitude: 2.35 };
const oslo = { latitude: 59.91, longitude: 10.75 };

const global = stubWeatherProvider('global', {
  coverage: { kind: 'global' },
  dataTypes: ['current', 'hourly', 'daily', 'airQuality'],
});
const franceOnly = {
  ...stubWeatherProvider('france', {
    coverage: { kind: 'regions', regions: [{ south: 41, west: -5.5, north: 51.5, east: 10 }] },
    dataTypes: ['current', 'hourly', 'daily', 'alerts'],
  }),
  alerts: async () => [],
};

describe('provider offer', () => {
  it('provides only the data types it declares', () => {
    expect(providesDataType(global, 'hourly')).toBe(true);
    expect(providesDataType(global, 'alerts')).toBe(false);
  });

  it('does not provide a declared data type whose method is missing', () => {
    expect(providesDataType(global, 'airQuality')).toBe(false);
  });

  it('provides an optional data type it declares and implements', () => {
    expect(providesDataType(franceOnly, 'alerts')).toBe(true);
  });

  it('does not provide an implemented data type it does not declare', () => {
    expect(providesDataType({ ...global, pollen: async () => [] }, 'pollen')).toBe(false);
  });

  it('offers a data type only inside its coverage', () => {
    expect(offersAt(franceOnly, paris, 'alerts')).toBe(true);
    expect(offersAt(franceOnly, oslo, 'alerts')).toBe(false);
  });

  it('does not offer an undeclared data type even inside its coverage', () => {
    expect(offersAt(franceOnly, paris, 'pollen')).toBe(false);
  });

  it('lists the providers offering a data type at a location', () => {
    const providers = [global, franceOnly];

    expect(providersOffering(providers, paris, 'hourly').map(({ id }) => id)).toEqual(['global', 'france']);
    expect(providersOffering(providers, oslo, 'hourly').map(({ id }) => id)).toEqual(['global']);
    expect(providersOffering(providers, oslo, 'alerts')).toEqual([]);
  });
});

describe('stub weather provider', () => {
  it('returns as many hourly forecasts as hours requested', async () => {
    const hours = await global.hourly(paris, 48);

    expect(hours).toHaveLength(48);
    expect(hours[1]?.time).toBe('2026-01-01T01:00:00.000Z');
  });

  it('returns as many daily forecasts as days requested', async () => {
    const days = await global.daily(paris, 7);

    expect(days.map(({ date }) => date).at(-1)).toBe('2026-01-07');
  });

  it('returns current conditions with a cloud cover fraction', async () => {
    const current = await global.current(paris);

    expect(current.cloudCover.total).toBeGreaterThanOrEqual(0);
    expect(current.cloudCover.total).toBeLessThanOrEqual(1);
  });
});
