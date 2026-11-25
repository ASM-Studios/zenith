import { CurrentConditionsSchema, DailyForecastSchema, HourlyForecastSchema, offersDataType } from '@zenith/core';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../test/msw-server.js';
import { createMetNorwayProvider } from '../src/modules/weather/providers/met-norway/provider.ts';
import { metNorwayForecast, metNorwayForecastUrl } from './mocks/met-norway.handlers.ts';

const location = { latitude: 59.9139, longitude: 10.7522 };

function providerAnswering(body: object = metNorwayForecast()) {
  const requests: Request[] = [];
  server.use(
    http.get(metNorwayForecastUrl, ({ request }) => {
      requests.push(request);
      return HttpResponse.json(body, { headers: { Expires: new Date(Date.now() + 600_000).toUTCString() } });
    }),
  );
  return { provider: createMetNorwayProvider({ contact: 'ops@example.org' }), requests };
}

describe('met-norway provider', () => {
  it('offers current, hourly and daily everywhere', () => {
    const { provider } = providerAnswering();

    expect(offersDataType(provider, 'current', location)).toBe(true);
    expect(offersDataType(provider, 'daily', { latitude: -33.9, longitude: 151.2 })).toBe(true);
    expect(offersDataType(provider, 'airQuality', location)).toBe(false);
  });

  it('maps the first entry to current conditions with metric units', async () => {
    const { provider } = providerAnswering();

    const current = await provider.getCurrent?.({ location });

    expect(CurrentConditionsSchema.parse(current)).toEqual({
      time: '2026-11-24T12:00:00Z',
      condition: 'cloudy',
      temperatureCelsius: 5,
      apparentTemperatureCelsius: null,
      relativeHumidityPercent: 80,
      dewPointCelsius: 2,
      pressureHpa: 1015.1,
      windSpeedKmh: 18,
      windGustKmh: 29.2,
      windDirectionDegrees: 108,
      precipitationMm: 0.2,
      cloudCoverPercent: 95,
      visibilityMeters: null,
      uvIndex: 1.5,
      isDay: false,
    });
  });

  it('maps 48 hours with precipitation probability and cloud layers', async () => {
    const { provider } = providerAnswering();

    const hours = await provider.getHourly?.({ location });

    expect(hours).toHaveLength(48);
    expect(HourlyForecastSchema.array().parse(hours)[1]).toMatchObject({
      time: '2026-11-24T13:00:00Z',
      condition: 'partly-cloudy',
      precipitationProbabilityPercent: 30,
      cloudCoverLowPercent: 90,
      cloudCoverMidPercent: 50,
      cloudCoverHighPercent: 10,
    });
  });

  it('groups the six-hour blocks into at most seven UTC days', async () => {
    const { provider } = providerAnswering();

    const days = await provider.getDaily?.({ location });

    expect(days).toHaveLength(7);
    expect(DailyForecastSchema.array().parse(days)[1]).toEqual({
      date: '2026-11-25',
      condition: 'rain',
      temperatureMinCelsius: 2 + 12 / 10,
      temperatureMaxCelsius: 11,
      precipitationSumMm: 4.4,
      precipitationProbabilityMaxPercent: 70,
      windSpeedMaxKmh: 18,
      windGustMaxKmh: 29.2,
      uvIndexMax: 1.5,
    });
  });

  it('asks for at most four decimals and identifies itself', async () => {
    const { provider, requests } = providerAnswering();

    await provider.getCurrent?.({ location: { latitude: 59.913912345, longitude: 10.752212345 } });

    const [request] = requests;
    expect(request?.headers.get('user-agent')).toBe('zenith/1.0 ops@example.org');
    expect(Object.fromEntries(new URL(request?.url ?? '').searchParams)).toEqual({ lat: '59.9139', lon: '10.7522' });
  });
});
