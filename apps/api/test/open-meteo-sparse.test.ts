import { AirQualitySchema, CurrentConditionsSchema, DailyForecastSchema, HourlyForecastSchema } from '@zenith/core';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../test/msw-server.js';
import { createOpenMeteoProvider } from '../src/modules/weather/providers/open-meteo/index.ts';
import { openMeteoAirQualityUrl, openMeteoForecastUrl } from './mocks/open-meteo.handlers.ts';

const paris = { latitude: 48.85, longitude: 2.35 };
const provider = createOpenMeteoProvider({ forecastUrl: openMeteoForecastUrl, airQualityUrl: openMeteoAirQualityUrl });

function respondWith(url: string, body: object) {
  server.use(http.get(url, () => HttpResponse.json(body)));
}

function everyValueIsNull(entry: object, except: string[]) {
  return Object.entries(entry)
    .filter(([name]) => !except.includes(name))
    .every(([, value]) => value === null);
}

describe('open-meteo provider with a source that omits optional fields', () => {
  it('maps omitted current measurements to null', async () => {
    respondWith(openMeteoForecastUrl, { current: { time: 1795532400, temperature_2m: 7.3, weather_code: 0 } });

    const result = CurrentConditionsSchema.parse(await provider.getCurrent?.({ location: paris }));

    expect(everyValueIsNull(result, ['time', 'condition', 'temperatureCelsius'])).toBe(true);
  });

  it('maps omitted hourly measurements to null', async () => {
    respondWith(openMeteoForecastUrl, {
      hourly: { time: [1795532400], temperature_2m: [7.3], weather_code: [61] },
    });

    const [hour] = (await provider.getHourly?.({ location: paris })) ?? [];

    expect(everyValueIsNull(HourlyForecastSchema.parse(hour), ['time', 'condition', 'temperatureCelsius'])).toBe(true);
  });

  it('maps omitted daily measurements to null', async () => {
    respondWith(openMeteoForecastUrl, {
      utc_offset_seconds: 3600,
      daily: { time: [1795474800], weather_code: [71], temperature_2m_max: [1], temperature_2m_min: [-2] },
    });

    const [day] = (await provider.getDaily?.({ location: paris })) ?? [];

    expect(
      everyValueIsNull(DailyForecastSchema.parse(day), [
        'date',
        'condition',
        'temperatureMinCelsius',
        'temperatureMaxCelsius',
      ]),
    ).toBe(true);
  });

  it('maps omitted pollutants to null and reports no index', async () => {
    respondWith(openMeteoAirQualityUrl, { current: { time: 1795532400 } });

    const result = AirQualitySchema.parse(await provider.getAirQuality?.({ location: paris }));

    expect(result.index).toBeNull();
    expect(Object.values(result.concentrationsMicrogramsPerCubicMeter).every((value) => value === null)).toBe(true);
  });

  it('maps omitted pollen species to null', async () => {
    respondWith(openMeteoAirQualityUrl, { current: { time: 1795532400 } });

    const result = await provider.getPollen?.({ location: paris });

    expect(Object.values(result?.grainsPerCubicMeter ?? {})).toEqual([null, null, null, null, null, null]);
  });
});
