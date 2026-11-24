import { z } from 'zod';

export const maxLocationsPerRequest = 200;

const locationInput = z.object({
  name: z.string().trim().min(1).max(200),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const postLocationsBody = z.object({
  locations: z.array(locationInput).min(1).max(maxLocationsPerRequest),
});

export const locationParams = z.object({ id: z.uuid() });
