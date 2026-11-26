import { describe, expect, test, vi } from 'vitest';
import { geocodingUrl, parseGeocoding, searchPlaces, type SearchFetch } from './geocoding.ts';
import { isPlace } from './place.ts';

function respondWith(body: unknown, status = 200) {
  return vi.fn<SearchFetch>(async () => new Response(JSON.stringify(body), { status }));
}

describe('geocodingUrl', () => {
  test('geocodingUrl encodes the query and trims it', () => {
    expect(geocodingUrl('  Abisko & co  ', 'fr')).toBe(
      'https://geocoding-api.open-meteo.com/v1/search?name=Abisko%20%26%20co&count=10&language=fr&format=json',
    );
  });
});

describe('parseGeocoding', () => {
  test('parseGeocoding maps a result with admin1 and country to a place with a detail', () => {
    const places = parseGeocoding({
      results: [{ name: 'Abisko', latitude: 68.35, longitude: 18.82, admin1: 'Norrbotten', country: 'Sweden' }],
    });

    expect(places).toEqual([{ name: 'Abisko', latitude: 68.35, longitude: 18.82, detail: 'Norrbotten, Sweden' }]);
  });

  test('parseGeocoding returns no places when the response has no results', () => {
    expect(parseGeocoding({})).toEqual([]);
  });

  test('parseGeocoding drops entries with invalid coordinates', () => {
    const places = parseGeocoding({
      results: [
        { name: 'Nowhere', latitude: 120, longitude: 0 },
        { name: 'Valid', latitude: 10, longitude: 20 },
      ],
    });

    expect(places.map((place) => place.name)).toEqual(['Valid']);
  });

  test('parseGeocoding rejects a response that is not an object', () => {
    expect(() => parseGeocoding('oops')).toThrow('invalid geocoding response');
  });
});

describe('searchPlaces', () => {
  test('searchPlaces does not call fetch for a query shorter than the minimum', async () => {
    const fetch = respondWith({});

    await expect(searchPlaces(' a ', 'en', fetch)).resolves.toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('searchPlaces requests the geocoding url and returns the parsed places', async () => {
    const fetch = respondWith({ results: [{ name: 'Abisko', latitude: 68.35, longitude: 18.82, country: 'Sweden' }] });

    await expect(searchPlaces(' Abisko ', 'en', fetch)).resolves.toEqual([
      { name: 'Abisko', latitude: 68.35, longitude: 18.82, detail: 'Sweden' },
    ]);
    expect(fetch).toHaveBeenCalledWith(geocodingUrl('Abisko', 'en'));
  });

  test('searchPlaces throws on a non-ok response', async () => {
    await expect(searchPlaces('Abisko', 'en', respondWith({}, 500))).rejects.toThrow(
      'geocoding failed with status 500',
    );
  });
});

describe('isPlace', () => {
  test('isPlace rejects out of range coordinates and an empty name', () => {
    expect(isPlace({ name: 'Abisko', latitude: 91, longitude: 0 })).toBe(false);
    expect(isPlace({ name: 'Abisko', latitude: 0, longitude: -181 })).toBe(false);
    expect(isPlace({ name: '', latitude: 0, longitude: 0 })).toBe(false);
    expect(isPlace({ name: 'Abisko', latitude: 68.35, longitude: 18.82 })).toBe(true);
  });
});
