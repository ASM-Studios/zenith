import type { GeoPoint } from '@zenith/core';
import type { z } from 'zod';

export function variablesOf(row: z.ZodObject): string {
  return Object.keys(row.shape)
    .filter((name) => name !== 'time')
    .join(',');
}

export function locationUrl(baseUrl: string, location: GeoPoint, params: Record<string, string>): URL {
  const url = new URL(baseUrl);
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    ...params,
  }).toString();
  return url;
}
