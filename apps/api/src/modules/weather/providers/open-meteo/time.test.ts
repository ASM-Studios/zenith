import { describe, expect, it } from 'vitest';
import { toInstant, toLocalDate } from './time.ts';

describe('open-meteo time', () => {
  it('converts unix seconds to an ISO instant in UTC without milliseconds', () => {
    expect(toInstant(1768514400)).toBe('2026-01-15T22:00:00Z');
  });

  it('dates a day on the local calendar when the offset is positive', () => {
    expect(toLocalDate(1768431600, 3600)).toBe('2026-01-15');
  });

  it('dates a day on the local calendar when the offset is negative', () => {
    expect(toLocalDate(1768532400, -18000)).toBe('2026-01-15');
  });

  it('moves to the next local day when the offset crosses midnight', () => {
    expect(toLocalDate(1768514400, 7200)).toBe('2026-01-16');
  });
});
