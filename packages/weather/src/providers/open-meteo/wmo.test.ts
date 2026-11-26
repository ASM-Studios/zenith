import { WEATHER_CONDITIONS, type WeatherCondition } from '@zenith/core';
import { describe, expect, it } from 'vitest';
import { conditionFromWmoCode } from './wmo.ts';

const groups: ReadonlyArray<readonly [WeatherCondition, readonly number[]]> = [
  ['clear', [0]],
  ['mostly-clear', [1]],
  ['partly-cloudy', [2]],
  ['cloudy', [3]],
  ['fog', [45, 48]],
  ['drizzle', [51, 53, 55]],
  ['freezing-rain', [56, 57, 66, 67]],
  ['rain', [61, 63]],
  ['heavy-rain', [65]],
  ['snow', [71, 73, 75, 77]],
  ['rain-showers', [80, 81, 82]],
  ['snow-showers', [85, 86]],
  ['thunderstorm', [95, 96, 99]],
];

const cases = groups.flatMap(([condition, codes]) => codes.map((code) => [code, condition] as const));

describe('conditionFromWmoCode', () => {
  it.each(cases)('maps WMO code %i to %s', (code, condition) => {
    expect(conditionFromWmoCode(code)).toBe(condition);
  });

  it.each([4, 10, 44, 100, -1, 1.5, Number.NaN])('returns null for unknown code %s', (code) => {
    expect(conditionFromWmoCode(code)).toBeNull();
  });

  it('produces every weather condition except sleet over codes 0 to 99', () => {
    const produced = new Set<WeatherCondition>();
    for (let code = 0; code <= 99; code += 1) {
      const condition = conditionFromWmoCode(code);
      if (condition !== null) produced.add(condition);
    }
    const expected = WEATHER_CONDITIONS.filter((condition) => condition !== 'sleet');
    expect(produced).toEqual(new Set(expected));
  });
});
