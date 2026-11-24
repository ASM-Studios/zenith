import { describe, expect, it } from 'vitest';
import { BoundingBoxSchema, CoverageSchema, isCovered, type Coverage } from './coverage.ts';

const metropolitanFrance: Coverage = {
  kind: 'regions',
  regions: [{ south: 41.3, west: -5.2, north: 51.1, east: 9.6 }],
};

const acrossAntimeridian: Coverage = {
  kind: 'regions',
  regions: [{ south: -50, west: 165, north: -30, east: -175 }],
};

describe('isCovered', () => {
  it('covers every point with a global coverage', () => {
    expect(isCovered({ kind: 'global' }, { latitude: -89, longitude: 179 })).toBe(true);
  });

  it('covers a point inside a region', () => {
    expect(isCovered(metropolitanFrance, { latitude: 48.85, longitude: 2.35 })).toBe(true);
  });

  it('does not cover a point outside every region', () => {
    expect(isCovered(metropolitanFrance, { latitude: 40.4, longitude: -3.7 })).toBe(false);
  });

  it('covers a point on the edge of a region', () => {
    expect(isCovered(metropolitanFrance, { latitude: 51.1, longitude: 9.6 })).toBe(true);
  });

  it('covers a point in any of several regions', () => {
    const withReunion: Coverage = {
      kind: 'regions',
      regions: [...metropolitanFrance.regions, { south: -21.4, west: 55.2, north: -20.8, east: 55.9 }],
    };
    expect(isCovered(withReunion, { latitude: -21.1, longitude: 55.5 })).toBe(true);
  });

  it('covers both sides of a region crossing the antimeridian', () => {
    expect(isCovered(acrossAntimeridian, { latitude: -41, longitude: 174.8 })).toBe(true);
    expect(isCovered(acrossAntimeridian, { latitude: -44, longitude: -176.5 })).toBe(true);
  });

  it('does not cover a point between the edges of a region crossing the antimeridian', () => {
    expect(isCovered(acrossAntimeridian, { latitude: -40, longitude: 0 })).toBe(false);
  });

  it('does not cover a point outside the latitude band of a region crossing the antimeridian', () => {
    expect(isCovered(acrossAntimeridian, { latitude: 0, longitude: 175 })).toBe(false);
  });
});

describe('CoverageSchema', () => {
  it('rejects a regional coverage without region', () => {
    expect(CoverageSchema.safeParse({ kind: 'regions', regions: [] }).success).toBe(false);
  });

  it('rejects a box whose south edge is north of its north edge', () => {
    expect(BoundingBoxSchema.safeParse({ south: 10, west: 0, north: 5, east: 1 }).success).toBe(false);
  });
});
