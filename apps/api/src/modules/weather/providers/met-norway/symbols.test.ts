import { describe, expect, it } from 'vitest';
import { conditionFromSymbol, symbolParts } from './symbols.ts';

describe('symbolParts', () => {
  it.each([
    ['clearsky_day', { base: 'clearsky', isDay: true }],
    ['rain_night', { base: 'rain', isDay: false }],
    ['fair_polartwilight', { base: 'fair', isDay: null }],
    ['cloudy', { base: 'cloudy', isDay: null }],
  ])('reads the day flag of %s from its suffix', (symbol, parts) => {
    expect(symbolParts(symbol)).toEqual(parts);
  });
});

describe('conditionFromSymbol', () => {
  it.each([
    ['clearsky_day', 'clear'],
    ['fair_night', 'mostly-clear'],
    ['partlycloudy_day', 'partly-cloudy'],
    ['cloudy', 'cloudy'],
    ['lightrain', 'drizzle'],
    ['rain', 'rain'],
    ['heavyrain', 'heavy-rain'],
    ['heavyrainshowers_night', 'rain-showers'],
    ['heavysnow', 'snow'],
    ['snowshowers_day', 'snow-showers'],
    ['rainandthunder', 'thunderstorm'],
    ['lightssleetshowersandthunder_day', 'thunderstorm'],
  ])('maps %s to %s', (symbol, condition) => {
    expect(conditionFromSymbol(symbol)).toBe(condition);
  });

  it.each(['unknown', 'cloudy_unknown', ''])('returns null for the unknown symbol "%s"', (symbol) => {
    expect(conditionFromSymbol(symbol)).toBeNull();
  });
});
