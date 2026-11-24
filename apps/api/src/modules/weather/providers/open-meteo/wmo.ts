import type { WeatherCondition } from '@zenith/core';

const conditionGroups: ReadonlyArray<readonly [WeatherCondition, readonly number[]]> = [
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

const conditionByCode = new Map<number, WeatherCondition>(
  conditionGroups.flatMap(([condition, codes]) => codes.map((code) => [code, condition] as const)),
);

export function conditionFromWmoCode(code: number): WeatherCondition | null {
  return conditionByCode.get(code) ?? null;
}
