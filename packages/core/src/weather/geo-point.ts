import { z } from 'zod';

export const LatitudeSchema = z.number().min(-90).max(90);
export const LongitudeSchema = z.number().min(-180).max(180);

export const GeoPointSchema = z.object({
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
});

export type GeoPoint = z.infer<typeof GeoPointSchema>;
