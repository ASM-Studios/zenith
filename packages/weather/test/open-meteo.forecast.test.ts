import { CurrentConditionsSchema, DailyForecastSchema, HourlyForecastSchema, offersDataType } from '@zenith/core';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../test/msw-server.js';
import { createOpenMeteoProvider } from '../src/providers/open-meteo/provider.ts';
import {
  currentOkHandler,
  dailyOkHandler,
  hourlyOk,
  hourlyOkHandler,
  openMeteoForecastUrl,
} from './mocks/open-meteo.handlers.ts';

const location = { latitude: 48.85, longitude: 2.35 };
const provider = createOpenMeteoProvider();
const bareCurrent = { time: '2026-11-24T16:45', temperature_2m: 6.3, weather_code: 3 };

function answerWith(body: object) {
  const params: Record<string, string>[] = [];
  server.use(
    http.get(openMeteoForecastUrl, ({ request }) => {
      params.push(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json(body);
    }),
  );
  return params;
}

describe('open-meteo current conditions', () => {
  it('maps the response to the core type', async () => {
    server.use(currentOkHandler);

    const current = await provider.getCurrent?.({ location });

    expect(CurrentConditionsSchema.parse(current)).toEqual({
      time: '2026-11-24T16:45:00Z',
      condition: 'cloudy',
      temperatureCelsius: 6.3,
      apparentTemperatureCelsius: 2.6,
      relativeHumidityPercent: 80,
      dewPointCelsius: 3.1,
      pressureHpa: 1015.1,
      windSpeedKmh: 14,
      windGustKmh: 29.2,
      windDirectionDegrees: 108,
      precipitationMm: 0,
      cloudCoverPercent: 95,
      visibilityMeters: 30640,
      uvIndex: 0,
      isDay: false,
    });
  });

  it('asks for GMT times at the location', async () => {
    const params = answerWith({ current: bareCurrent });

    await provider.getCurrent?.({ location });

    expect(params[0]).toMatchObject({
      latitude: '48.85',
      longitude: '2.35',
      timezone: 'GMT',
      current: expect.stringMatching(/^temperature_2m,weather_code,.*,is_day$/),
    });
  });

  it('gives null for every measurement the source omits', async () => {
    answerWith({ current: bareCurrent });

    const current = CurrentConditionsSchema.parse(await provider.getCurrent?.({ location }));

    const known = Object.entries(current).filter(([, value]) => value !== null);
    expect(Object.fromEntries(known)).toEqual({
      time: '2026-11-24T16:45:00Z',
      condition: 'cloudy',
      temperatureCelsius: 6.3,
    });
  });

  it('reads the day flag', async () => {
    answerWith({ current: { ...bareCurrent, is_day: 1 } });

    await expect(provider.getCurrent?.({ location })).resolves.toMatchObject({ isDay: true });
  });
});

describe('open-meteo hourly forecast', () => {
  it('maps 48 hours to the core type', async () => {
    server.use(hourlyOkHandler);

    const hours = HourlyForecastSchema.array().parse(await provider.getHourly?.({ location }));

    expect(hours).toHaveLength(48);
    expect(hours[0]?.time).toBe('2026-11-24T16:00:00Z');
    expect(hours.map((hour) => hour.temperatureCelsius)).toEqual(hourlyOk.hourly.temperature_2m);
  });

  it('keeps the rain probability and the cloud cover of each layer', async () => {
    server.use(hourlyOkHandler);

    const hours = (await provider.getHourly?.({ location })) ?? [];

    const { hourly } = hourlyOk;
    expect(hours.map((hour) => hour.precipitationProbabilityPercent)).toEqual(hourly.precipitation_probability);
    expect(hours.map((hour) => hour.cloudCoverLowPercent)).toEqual(hourly.cloud_cover_low);
    expect(hours.map((hour) => hour.cloudCoverMidPercent)).toEqual(hourly.cloud_cover_mid);
    expect(hours.map((hour) => hour.cloudCoverHighPercent)).toEqual(hourly.cloud_cover_high);
  });

  it('asks for 48 hours in GMT', async () => {
    const params = answerWith({ hourly: { time: ['2026-11-24T16:00'], temperature_2m: [6], weather_code: [0] } });

    await provider.getHourly?.({ location });

    expect(params[0]).toMatchObject({ forecast_hours: '48', timezone: 'GMT' });
  });
});

describe('open-meteo daily forecast', () => {
  it('maps 7 days to the core type', async () => {
    server.use(dailyOkHandler);

    const days = DailyForecastSchema.array().parse(await provider.getDaily?.({ location }));

    expect(days).toHaveLength(7);
    expect(days[1]).toEqual({
      date: '2026-11-25',
      condition: 'rain-showers',
      temperatureMinCelsius: 4.2,
      temperatureMaxCelsius: 7.4,
      precipitationSumMm: 2.25,
      precipitationProbabilityMaxPercent: 70,
      windSpeedMaxKmh: 9.2,
      windGustMaxKmh: 20.9,
      uvIndexMax: 0.35,
    });
  });

  it('keeps the local dates around the spring clock change', async () => {
    const dates = ['2027-03-27', '2027-03-28', '2027-03-29'];
    const zeros = [0, 0, 0];
    const params = answerWith({
      utc_offset_seconds: 3600,
      daily: { time: dates, weather_code: zeros, temperature_2m_min: zeros, temperature_2m_max: zeros },
    });

    const days = await provider.getDaily?.({ location });

    expect(days?.map((day) => day.date)).toEqual(dates);
    expect(params[0]).toMatchObject({ forecast_days: '7', timezone: 'auto' });
  });
});

describe('open-meteo identity', () => {
  it.each([
    ['current', true],
    ['hourly', true],
    ['daily', true],
    ['alerts', false],
  ] as const)('offers %s in Sydney: %s', (dataType, offered) => {
    expect(offersDataType(provider, dataType, { latitude: -33.87, longitude: 151.21 })).toBe(offered);
  });

  it('credits Open-Meteo under CC BY 4.0', () => {
    expect(provider).toMatchObject({ id: 'open-meteo', attribution: { name: 'Open-Meteo', licence: 'CC BY 4.0' } });
  });
});
