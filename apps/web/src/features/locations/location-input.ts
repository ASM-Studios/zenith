import type { FavoriteInput } from '../../api/locations.ts';

export type LocationFields = { name: string; latitude: string; longitude: string };
export type LocationInputError = 'invalidName' | 'invalidCoordinates';

const maxNameLength = 200;

function parseName(name: string): string | undefined {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= maxNameLength ? trimmed : undefined;
}

function parseCoordinate(text: string, limit: number): number | undefined {
  const trimmed = text.trim();
  if (trimmed === '') {
    return undefined;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) && Math.abs(value) <= limit ? value : undefined;
}

export function parseLocationFields(
  fields: LocationFields,
): { ok: true; value: FavoriteInput } | { ok: false; error: LocationInputError } {
  const name = parseName(fields.name);
  if (name === undefined) {
    return { ok: false, error: 'invalidName' };
  }
  const latitude = parseCoordinate(fields.latitude, 90);
  const longitude = parseCoordinate(fields.longitude, 180);
  if (latitude === undefined || longitude === undefined) {
    return { ok: false, error: 'invalidCoordinates' };
  }
  return { ok: true, value: { name, latitude, longitude } };
}
