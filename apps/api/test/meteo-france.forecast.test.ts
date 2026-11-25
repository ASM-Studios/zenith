import { CurrentConditionsSchema, DailyForecastSchema, HourlyForecastSchema } from '@zenith/core';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../test/msw-server.js';
import { createMeteoFranceProvider } from '../src/modules/weather/providers/meteo-france/provider.ts';
import {
  currentOkHandler,
  dailyOkHandler,
  hourlyOk,
  hourlyOkHandler,
  meteoFranceForecastUrl,
} from './mocks/meteo-france.handlers.ts';

const location = { latitude: 48.85, longitude: 2.35 };
const provider = createMeteoFranceProvider();

function answerWith(body: object) {
  const params: Record<string, string>[] = [];
  server.use(
    http.get(meteoFranceForecastUrl, ({ request }) => {
      params.push(Object.fromEntries(new URL(request.url).searchParams));
      return HttpResponse.json(body);
    }),
  );
  return params;
}

describe('meteo-france current conditions', () => {
  it('maps the response to the core type', async () => {
    server.use(currentOkHandler);

    const current = await provider.getCurrent?.({ location });

    expect(CurrentConditionsSchema.parse(current)).toEqual({
      time: '2026-11-25T11:45:00Z',
      condition: 'drizzle',
      temperatureCelsius: 5.2,
      apparentTemperatureCelsius: 2.7,
      relativeHumidityPercent: 87,
      dewPointCelsius: 3.2,
      pressureHpa: 1009.1,
      windSpeedKmh: 6.4,
      windGustKmh: 14.8,
      windDirectionDegrees: 38,
      precipitationMm: 0.1,
      cloudCoverPercent: 100,
      visibilityMeters: null,
      uvIndex: null,
      isDay: true,
    });
  });
});

describe('meteo-france hourly forecast', () => {
  it('maps 48 hours to the core type', async () => {
    server.use(hourlyOkHandler);

    const hours = HourlyForecastSchema.array().parse(await provider.getHourly?.({ location }));

    expect(hours).toHaveLength(48);
    expect(hours[0]?.time).toBe('2026-11-25T11:00:00Z');
    expect(hours.map((hour) => hour.temperatureCelsius)).toEqual(hourlyOk.hourly.temperature_2m);
  });

  it('gives null for the measurements the source lacks', async () => {
    server.use(hourlyOkHandler);

    const hours = (await provider.getHourly?.({ location })) ?? [];

    const everyHourNull = Array.from({ length: 48 }, () => null);
    expect(hours.map((hour) => hour.visibilityMeters)).toEqual(everyHourNull);
    expect(hours.map((hour) => hour.uvIndex)).toEqual(everyHourNull);
    expect(hours.map((hour) => hour.precipitationProbabilityPercent)).toEqual(everyHourNull);
  });

  it('keeps the cloud cover of each layer', async () => {
    server.use(hourlyOkHandler);

    const hours = (await provider.getHourly?.({ location })) ?? [];

    const { hourly } = hourlyOk;
    expect(hours.map((hour) => hour.cloudCoverLowPercent)).toEqual(hourly.cloud_cover_low);
    expect(hours.map((hour) => hour.cloudCoverMidPercent)).toEqual(hourly.cloud_cover_mid);
    expect(hours.map((hour) => hour.cloudCoverHighPercent)).toEqual(hourly.cloud_cover_high);
  });

  it('asks for 48 hours in GMT at the location', async () => {
    const params = answerWith({ hourly: { time: ['2026-11-25T11:00'], temperature_2m: [5], weather_code: [3] } });

    await provider.getHourly?.({ location });

    expect(params[0]).toMatchObject({
      latitude: '48.85',
      longitude: '2.35',
      forecast_hours: '48',
      timezone: 'GMT',
    });
  });
});

describe('meteo-france daily forecast', () => {
  it('keeps the 4 forecast days and leaves out the empty ones after them', async () => {
    server.use(dailyOkHandler);

    const days = DailyForecastSchema.array().parse(await provider.getDaily?.({ location }));

    expect(days.map((day) => day.date)).toEqual(['2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28']);
    expect(days[0]).toEqual({
      date: '2026-11-25',
      condition: 'rain',
      temperatureMinCelsius: 3.6,
      temperatureMaxCelsius: 5.9,
      precipitationSumMm: 7.05,
      precipitationProbabilityMaxPercent: null,
      windSpeedMaxKmh: 9.6,
      windGustMaxKmh: 21.6,
      uvIndexMax: null,
    });
  });

  it('asks for 7 days with the timezone of the location', async () => {
    const params = answerWith({
      daily: { time: ['2026-11-25'], weather_code: [3], temperature_2m_min: [1], temperature_2m_max: [5] },
    });

    await provider.getDaily?.({ location });

    expect(params[0]).toMatchObject({
      latitude: '48.85',
      longitude: '2.35',
      forecast_days: '7',
      timezone: 'auto',
    });
  });
});

describe('meteo-france identity', () => {
  it('identifies the provider and credits Météo-France and Open-Meteo', () => {
    expect(provider).toMatchObject({
      id: 'meteo-france',
      attribution: {
        name: expect.stringMatching(/Météo-France.*Open-Meteo/),
        licence: expect.stringContaining('Licence Ouverte 2.0'),
      },
    });
  });
});
