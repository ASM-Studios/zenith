import type { BoundingBox, Coverage } from '@zenith/core';

const franceByArea: Record<string, BoundingBox> = {
  north: { south: 50.2, west: 1.5, north: 51.1, east: 4.25 },
  normandyToArdennes: { south: 49.6, west: -2, north: 50.2, east: 5.4 },
  brittanyToAlsace: { south: 48, west: -5.2, north: 49.6, east: 8.3 },
  southBrittanyToSundgau: { south: 47.4, west: -4.5, north: 48, east: 7.65 },
  loireToJura: { south: 46.3, west: -3.3, north: 47.4, east: 7.1 },
  atlanticToAlps: { south: 44.3, west: -1.8, north: 46.3, east: 7.2 },
  basqueCoastToRiviera: { south: 43, west: -1.8, north: 44.3, east: 7.75 },
  pyreneesToGulfOfLion: { south: 42.3, west: -1.05, north: 43, east: 6.6 },
  corsica: { south: 41.3, west: 8.5, north: 43.05, east: 9.6 },
};

export const METEO_FRANCE_COVERAGE: Coverage = { kind: 'regions', regions: Object.values(franceByArea) };
