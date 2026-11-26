export type Place = { name: string; latitude: number; longitude: number };

export type PlaceResult = Place & { detail: string };

export function isPlace(value: unknown): value is Place {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value.name === 'string' &&
    value.name.trim() !== '' &&
    'latitude' in value &&
    isCoordinate(value.latitude, 90) &&
    'longitude' in value &&
    isCoordinate(value.longitude, 180)
  );
}

function isCoordinate(value: unknown, limit: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= limit;
}
