import { z } from 'zod';
import { LatitudeSchema, LongitudeSchema, type GeoPoint } from './geo-point.ts';

export const BoundingBoxSchema = z
  .object({
    south: LatitudeSchema,
    west: LongitudeSchema,
    north: LatitudeSchema,
    east: LongitudeSchema,
  })
  .refine((box) => box.south <= box.north, { message: 'south must not exceed north', path: ['south'] });

export const CoverageSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('global') }),
  z.object({ kind: z.literal('regions'), regions: z.array(BoundingBoxSchema).min(1) }),
]);

export type BoundingBox = z.infer<typeof BoundingBoxSchema>;
export type Coverage = z.infer<typeof CoverageSchema>;

function isWithinLongitude(box: BoundingBox, longitude: number): boolean {
  if (box.west <= box.east) {
    return longitude >= box.west && longitude <= box.east;
  }
  return longitude >= box.west || longitude <= box.east;
}

function isInBox(box: BoundingBox, point: GeoPoint): boolean {
  return point.latitude >= box.south && point.latitude <= box.north && isWithinLongitude(box, point.longitude);
}

export function isCovered(coverage: Coverage, point: GeoPoint): boolean {
  if (coverage.kind === 'global') {
    return true;
  }
  return coverage.regions.some((box) => isInBox(box, point));
}
