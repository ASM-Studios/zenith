import { ProviderInvalidResponseError, type WeatherCondition } from '@zenith/core';
import { MET_NORWAY_ID } from './identity.ts';

interface SymbolParts {
  base: string;
  isDay: boolean | null;
}

const suffixFlags: ReadonlyArray<readonly [string, boolean | null]> = [
  ['_day', true],
  ['_night', false],
  ['_polartwilight', null],
];

const thunderBases = [
  'lightrainandthunder',
  'rainandthunder',
  'heavyrainandthunder',
  'lightsleetandthunder',
  'sleetandthunder',
  'heavysleetandthunder',
  'lightsnowandthunder',
  'snowandthunder',
  'heavysnowandthunder',
  'lightrainshowersandthunder',
  'rainshowersandthunder',
  'heavyrainshowersandthunder',
  'lightssleetshowersandthunder',
  'sleetshowersandthunder',
  'heavysleetshowersandthunder',
  'lightssnowshowersandthunder',
  'snowshowersandthunder',
  'heavysnowshowersandthunder',
];

const conditionGroups: ReadonlyArray<readonly [WeatherCondition, readonly string[]]> = [
  ['clear', ['clearsky']],
  ['mostly-clear', ['fair']],
  ['partly-cloudy', ['partlycloudy']],
  ['cloudy', ['cloudy']],
  ['fog', ['fog']],
  ['drizzle', ['lightrain']],
  ['rain', ['rain']],
  ['heavy-rain', ['heavyrain']],
  ['rain-showers', ['lightrainshowers', 'rainshowers', 'heavyrainshowers']],
  ['sleet', ['sleet', 'lightsleet', 'heavysleet', 'lightsleetshowers', 'sleetshowers', 'heavysleetshowers']],
  ['snow', ['lightsnow', 'snow', 'heavysnow']],
  ['snow-showers', ['lightsnowshowers', 'snowshowers', 'heavysnowshowers']],
  ['thunderstorm', thunderBases],
];

const conditionByBase = new Map<string, WeatherCondition>(
  conditionGroups.flatMap(([condition, bases]) => bases.map((base) => [base, condition] as const)),
);

export function symbolParts(symbolCode: string): SymbolParts {
  for (const [suffix, isDay] of suffixFlags) {
    if (symbolCode.endsWith(suffix)) return { base: symbolCode.slice(0, -suffix.length), isDay };
  }
  return { base: symbolCode, isDay: null };
}

export function conditionFromSymbol(symbolCode: string): WeatherCondition | null {
  return conditionByBase.get(symbolParts(symbolCode).base) ?? null;
}

export function conditionOf(symbolCode: string): WeatherCondition {
  const condition = conditionFromSymbol(symbolCode);
  if (condition === null) {
    throw new ProviderInvalidResponseError(MET_NORWAY_ID, `unknown symbol code ${symbolCode}`);
  }
  return condition;
}
