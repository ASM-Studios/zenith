import { offersDataType, type GeoPoint } from '@zenith/core';
import { describe, expect, it } from 'vitest';
import { createMeteoFranceProvider } from '../src/modules/weather/providers/meteo-france/provider.ts';
import { createOpenMeteoProvider } from '../src/modules/weather/providers/open-meteo/provider.ts';
import { createWeatherRegistry } from '../src/modules/weather/weather.registry.ts';
import { paris } from './helpers/weather.ts';

const provider = createMeteoFranceProvider();

const offeredCities = [
  { name: 'Paris', latitude: 48.86, longitude: 2.35 },
  { name: 'Brest', latitude: 48.39, longitude: -4.49 },
  { name: 'Ouessant', latitude: 48.46, longitude: -5.1 },
  { name: 'Dunkirk', latitude: 51.03, longitude: 2.38 },
  { name: 'Givet', latitude: 50.14, longitude: 4.82 },
  { name: 'Lauterbourg', latitude: 48.97, longitude: 8.18 },
  { name: 'Strasbourg', latitude: 48.58, longitude: 7.75 },
  { name: 'Chamonix', latitude: 45.92, longitude: 6.87 },
  { name: 'Bonneval-sur-Arc', latitude: 45.37, longitude: 7.05 },
  { name: 'Hendaye', latitude: 43.36, longitude: -1.77 },
  { name: 'Prats-de-Mollo', latitude: 42.4, longitude: 2.48 },
  { name: 'Menton', latitude: 43.77, longitude: 7.5 },
  { name: 'Bonifacio', latitude: 41.39, longitude: 9.16 },
  { name: 'Belle-Ile', latitude: 47.33, longitude: -3.2 },
  { name: 'Lyon', latitude: 45.76, longitude: 4.84 },
  { name: 'Penmarch', latitude: 47.8, longitude: -4.37 },
  { name: 'Mulhouse', latitude: 47.75, longitude: 7.34 },
  { name: 'Larrau border', latitude: 42.99, longitude: -1 },
];

const notOfferedCities = [
  { name: 'London', latitude: 51.51, longitude: -0.13 },
  { name: 'Brussels', latitude: 50.85, longitude: 4.35 },
  { name: 'Luxembourg', latitude: 49.61, longitude: 6.13 },
  { name: 'Bern', latitude: 46.95, longitude: 7.45 },
  { name: 'Turin', latitude: 45.07, longitude: 7.69 },
  { name: 'Frankfurt', latitude: 50.11, longitude: 8.68 },
  { name: 'Barcelona', latitude: 41.39, longitude: 2.17 },
  { name: 'Santa Teresa in Sardinia', latitude: 41.24, longitude: 9.19 },
  { name: 'Saint-Denis in Reunion', latitude: -20.88, longitude: 55.45 },
];

describe('meteo-france coverage of current conditions', () => {
  it.each(offeredCities)('offers current conditions in $name', ({ latitude, longitude }) => {
    expect(offersDataType(provider, 'current', { latitude, longitude })).toBe(true);
  });

  it.each(notOfferedCities)('does not offer current conditions in $name', ({ latitude, longitude }) => {
    expect(offersDataType(provider, 'current', { latitude, longitude })).toBe(false);
  });
});

describe('meteo-france data types in Paris', () => {
  it.each([
    ['current', true],
    ['hourly', true],
    ['daily', true],
    ['airQuality', false],
    ['pollen', false],
    ['alerts', false],
  ] as const)('offers %s in Paris: %s', (dataType, offered) => {
    expect(offersDataType(provider, dataType, paris)).toBe(offered);
  });
});

describe('meteo-france registry selection', () => {
  const registry = createWeatherRegistry([createOpenMeteoProvider(), createMeteoFranceProvider()]);
  const sydney: GeoPoint = { latitude: -33.87, longitude: 151.21 };

  it('selects meteo-france in Paris when it is preferred', () => {
    expect(registry.select('current', paris, ['meteo-france'])?.id).toBe('meteo-france');
  });

  it('selects open-meteo in Sydney when meteo-france is preferred', () => {
    expect(registry.select('current', sydney, ['meteo-france'])?.id).toBe('open-meteo');
  });

  it('selects open-meteo in Paris when no provider is preferred', () => {
    expect(registry.select('current', paris, [])?.id).toBe('open-meteo');
  });
});
