import { describe, expect, it } from 'vitest';
import type { BoundingBox, Coverage } from '../index.ts';
import { isCovered, isInBoundingBox } from '../index.ts';

const metropolitanFrance: BoundingBox = { south: 41, west: -5.5, north: 51.5, east: 10 };
const pacificAcrossAntimeridian: BoundingBox = { south: -25, west: 160, north: -5, east: -170 };

describe('isInBoundingBox', () => {
  it('contains a point inside the box', () => {
    expect(isInBoundingBox(metropolitanFrance, { latitude: 48.85, longitude: 2.35 })).toBe(true);
  });

  it('contains a point on the edge of the box', () => {
    expect(isInBoundingBox(metropolitanFrance, { latitude: 41, longitude: 10 })).toBe(true);
  });

  it('rejects a point outside the latitude range', () => {
    expect(isInBoundingBox(metropolitanFrance, { latitude: 59.9, longitude: 2 })).toBe(false);
  });

  it('rejects a point outside the longitude range', () => {
    expect(isInBoundingBox(metropolitanFrance, { latitude: 45, longitude: 13.4 })).toBe(false);
  });

  it('wraps a box that crosses the antimeridian', () => {
    expect(isInBoundingBox(pacificAcrossAntimeridian, { latitude: -18, longitude: 178 })).toBe(true);
    expect(isInBoundingBox(pacificAcrossAntimeridian, { latitude: -18, longitude: -175 })).toBe(true);
    expect(isInBoundingBox(pacificAcrossAntimeridian, { latitude: -18, longitude: 0 })).toBe(false);
  });
});

describe('isCovered', () => {
  const france: Coverage = {
    kind: 'regions',
    regions: [metropolitanFrance, { south: 15.8, west: -61.9, north: 16.6, east: -61 }],
  };

  it('covers every location with a global coverage', () => {
    expect(isCovered({ kind: 'global' }, { latitude: -77.8, longitude: 166.7 })).toBe(true);
  });

  it('covers a location inside any of its regions', () => {
    expect(isCovered(france, { latitude: 16.2, longitude: -61.5 })).toBe(true);
  });

  it('does not cover a location outside all of its regions', () => {
    expect(isCovered(france, { latitude: 52.5, longitude: 13.4 })).toBe(false);
  });

  it('covers nothing with no region', () => {
    expect(isCovered({ kind: 'regions', regions: [] }, { latitude: 0, longitude: 0 })).toBe(false);
  });
});
