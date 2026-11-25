import type { WeatherProvider } from '@zenith/core';
import { mapCurrent } from './current.map.ts';
import { mapDaily } from './daily.map.ts';
import { createForecastSource } from './document-cache.ts';
import { mapHourly } from './hourly.map.ts';
import { MET_NORWAY_ATTRIBUTION, MET_NORWAY_ID } from './identity.ts';

interface MetNorwayOptions {
  contact: string;
  now?: () => number;
  maxDocuments?: number;
}

export function createMetNorwayProvider({ contact, now, maxDocuments }: MetNorwayOptions): WeatherProvider {
  const source = createForecastSource({ userAgent: `zenith/1.0 ${contact}`, now, maxDocuments });
  return {
    id: MET_NORWAY_ID,
    attribution: MET_NORWAY_ATTRIBUTION,
    capabilities: { coverage: { kind: 'global' }, dataTypes: ['current', 'hourly', 'daily'] },
    getCurrent: async ({ location, signal }) => mapCurrent(await source.load(location, signal)),
    getHourly: async ({ location, signal }) => mapHourly(await source.load(location, signal)),
    getDaily: async ({ location, signal }) => mapDaily(await source.load(location, signal)),
  };
}
