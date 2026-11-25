import { WEATHER_DATA_TYPES } from '@zenith/core';
import { describe, expect, it } from 'vitest';
import {
  FRESH_TTL_SECONDS,
  isFresh,
  retentionSeconds,
  roundLocation,
  STALE_RETENTION_SECONDS,
  weatherCacheKey,
} from './cache-policy.ts';

describe('weather cache policy', () => {
  it('rounds a location to two decimals', () => {
    expect(roundLocation({ latitude: 48.8566, longitude: 2.3522 })).toEqual({ latitude: 48.86, longitude: 2.35 });
  });

  it('builds the key from provider id, data type and rounded location', () => {
    expect(weatherCacheKey('open-meteo', 'hourly', { latitude: 48.8566, longitude: -2.3 })).toBe(
      'weather:open-meteo:hourly:48.86:-2.30',
    );
  });

  it('gives nearby points in the same cell the same key', () => {
    expect(weatherCacheKey('a', 'current', { latitude: 48.8551, longitude: 2.3549 })).toBe(
      weatherCacheKey('a', 'current', { latitude: 48.8649, longitude: 2.3451 }),
    );
  });

  it('never writes a negative zero in the key', () => {
    expect(weatherCacheKey('a', 'current', { latitude: -0.001, longitude: -0.004 })).toBe(
      'weather:a:current:0.00:0.00',
    );
  });

  it('keys each data type and provider apart', () => {
    const keys = WEATHER_DATA_TYPES.flatMap((dataType) =>
      ['a', 'b'].map((id) => weatherCacheKey(id, dataType, { latitude: 1, longitude: 1 })),
    );
    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each(WEATHER_DATA_TYPES)('keeps a %s entry past its freshness so it can be served stale', (dataType) => {
    expect(Number.isInteger(FRESH_TTL_SECONDS[dataType])).toBe(true);
    expect(retentionSeconds(dataType)).toBe(FRESH_TTL_SECONDS[dataType] + STALE_RETENTION_SECONDS);
  });

  it('refreshes alerts more often than daily forecasts', () => {
    expect(FRESH_TTL_SECONDS.alerts).toBeLessThan(FRESH_TTL_SECONDS.daily);
  });

  it('treats an entry as fresh until its TTL has elapsed', () => {
    const updatedAt = new Date('2026-11-24T12:00:00.000Z');
    const at = (seconds: number) => new Date(updatedAt.getTime() + seconds * 1000);
    expect(isFresh('current', updatedAt, at(FRESH_TTL_SECONDS.current - 1))).toBe(true);
    expect(isFresh('current', updatedAt, at(FRESH_TTL_SECONDS.current))).toBe(false);
  });
});
