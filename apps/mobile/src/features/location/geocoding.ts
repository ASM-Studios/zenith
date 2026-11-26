import { isPlace, type Place, type PlaceResult } from './place.ts';

export type SearchFetch = (url: string) => Promise<Response>;

export const minQueryLength = 2;

export function geocodingUrl(query: string, language: string): string {
  const name = encodeURIComponent(query.trim());
  return `https://geocoding-api.open-meteo.com/v1/search?name=${name}&count=10&language=${language}&format=json`;
}

export function parseGeocoding(data: unknown): PlaceResult[] {
  if (typeof data !== 'object' || data === null) {
    throw new Error('invalid geocoding response');
  }
  const results: unknown = 'results' in data ? data.results : undefined;
  const entries: unknown[] = Array.isArray(results) ? results : [];
  return entries.flatMap((entry) => placeResult(entry));
}

function placeResult(entry: unknown): PlaceResult[] {
  if (!isPlace(entry)) {
    return [];
  }
  return [{ name: entry.name, latitude: entry.latitude, longitude: entry.longitude, detail: detailOf(entry) }];
}

function detailOf(entry: Place): string {
  const admin1: unknown = 'admin1' in entry ? entry.admin1 : undefined;
  const country: unknown = 'country' in entry ? entry.country : undefined;
  return [admin1, country].filter(isText).join(', ');
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value !== '';
}

export async function searchPlaces(query: string, language: string, fetch: SearchFetch): Promise<PlaceResult[]> {
  if (query.trim().length < minQueryLength) {
    return [];
  }
  const response = await fetch(geocodingUrl(query, language));
  if (!response.ok) {
    throw new Error(`geocoding failed with status ${response.status}`);
  }
  return parseGeocoding(await response.json());
}
