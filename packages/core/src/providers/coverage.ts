import type { Coordinates } from '../types/coordinates.ts';
import type { BoundingBox, Coverage } from '../types/weather-provider.ts';

function crossesAntimeridian(box: BoundingBox): boolean {
  return box.west > box.east;
}

function containsLongitude(box: BoundingBox, longitude: number): boolean {
  if (crossesAntimeridian(box)) return longitude >= box.west || longitude <= box.east;
  return longitude >= box.west && longitude <= box.east;
}

export function isInBoundingBox(box: BoundingBox, location: Coordinates): boolean {
  const inLatitude = location.latitude >= box.south && location.latitude <= box.north;
  return inLatitude && containsLongitude(box, location.longitude);
}

export function isCovered(coverage: Coverage, location: Coordinates): boolean {
  if (coverage.kind === 'global') return true;
  return coverage.regions.some((region) => isInBoundingBox(region, location));
}
