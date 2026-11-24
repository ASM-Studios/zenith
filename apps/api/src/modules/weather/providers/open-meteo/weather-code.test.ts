import { describe, expect, it } from 'vitest';
import type { WeatherCondition } from '@zenith/core';
import { ProviderInvalidResponseError, WEATHER_CONDITIONS } from '@zenith/core';
import { mapWeatherCode } from './weather-code.ts';

const PROVIDER_ID = 'open-meteo';

const groups: [WeatherCondition, number[]][] = [
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

function mapUnknownCode(): WeatherCondition {
  return mapWeatherCode(PROVIDER_ID, 4);
}

function catchError(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  return null;
}

function conditionOrNull(code: number): string | null {
  try {
    return mapWeatherCode(PROVIDER_ID, code);
  } catch {
    return null;
  }
}

describe('mapWeatherCode', () => {
  for (const [condition, codes] of groups) {
    it(`maps WMO codes ${codes.join(', ')} to ${condition}`, () => {
      for (const code of codes) {
        expect(mapWeatherCode(PROVIDER_ID, code)).toBe(condition);
      }
    });
  }

  it('produces every WeatherCondition except sleet, which no WMO code reports', () => {
    const produced = new Set<string>();
    for (let code = 0; code <= 99; code += 1) {
      const condition = conditionOrNull(code);
      if (condition !== null) {
        produced.add(condition);
      }
    }
    expect(produced).toEqual(new Set(WEATHER_CONDITIONS.filter((condition) => condition !== 'sleet')));
  });

  it('throws ProviderInvalidResponseError naming the unknown WMO code', () => {
    expect(mapUnknownCode).toThrow(ProviderInvalidResponseError);
    expect(mapUnknownCode).toThrow('unknown WMO weather code 4');
  });

  it('carries the providerId on the error thrown for an unknown code', () => {
    const error = catchError(mapUnknownCode);
    expect(error).toBeInstanceOf(ProviderInvalidResponseError);
    expect(error).toHaveProperty('providerId', PROVIDER_ID);
  });

  it('throws for a NaN code instead of returning an inherited property', () => {
    expect(() => mapWeatherCode(PROVIDER_ID, Number.NaN)).toThrow(ProviderInvalidResponseError);
  });
});
