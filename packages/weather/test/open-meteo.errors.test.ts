import {
  ProviderInvalidResponseError,
  ProviderQuotaError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  type WeatherQuery,
} from '@zenith/core';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../test/msw-server.js';
import { createOpenMeteoProvider } from '../src/providers/open-meteo/provider.ts';
import { currentOk, openMeteoForecastUrl } from './mocks/open-meteo.handlers.ts';

const provider = createOpenMeteoProvider();
const query: WeatherQuery = { location: { latitude: 48.85, longitude: 2.35 } };

function answerWith(respond: () => Response) {
  server.use(http.get(openMeteoForecastUrl, respond));
}

describe.each(['getCurrent', 'getHourly', 'getDaily'] as const)('open-meteo %s errors', (method) => {
  const call = async (signal?: AbortSignal) => provider[method]?.({ ...query, signal });

  it('throws a quota error with the retry delay when rate limited', async () => {
    answerWith(() => new HttpResponse(null, { status: 429, headers: { 'Retry-After': '60' } }));

    await expect(call()).rejects.toMatchObject({
      name: ProviderQuotaError.name,
      providerId: 'open-meteo',
      retryAfterSeconds: 60,
    });
  });

  it('throws an unavailable error when the server fails', async () => {
    answerWith(() => new HttpResponse(null, { status: 502 }));

    await expect(call()).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it('throws a timeout error when the signal is aborted', async () => {
    answerWith(() => HttpResponse.json({}));

    await expect(call(AbortSignal.abort())).rejects.toBeInstanceOf(ProviderTimeoutError);
  });

  it('throws an invalid response error when the data is missing', async () => {
    answerWith(() => HttpResponse.json({}));

    await expect(call()).rejects.toBeInstanceOf(ProviderInvalidResponseError);
  });
});

describe('open-meteo data errors', () => {
  it('rejects an unknown WMO code', async () => {
    answerWith(() => HttpResponse.json({ current: { ...currentOk.current, weather_code: 4 } }));

    await expect(provider.getCurrent?.(query)).rejects.toMatchObject({
      name: ProviderInvalidResponseError.name,
      message: 'unknown WMO code 4',
    });
  });

  it('rejects a missing temperature', async () => {
    answerWith(() => HttpResponse.json({ current: { ...currentOk.current, temperature_2m: null } }));

    await expect(provider.getCurrent?.(query)).rejects.toBeInstanceOf(ProviderInvalidResponseError);
  });

  it.each([
    ['no row', { time: [], temperature_2m: [], weather_code: [] }],
    ['no time column', { temperature_2m: [6], weather_code: [0] }],
    ['a required column shorter than time', { time: ['2026-11-24T16:00'], temperature_2m: [], weather_code: [0] }],
  ])('rejects an hourly forecast with %s', async (_, hourly) => {
    answerWith(() => HttpResponse.json({ hourly }));

    await expect(provider.getHourly?.(query)).rejects.toBeInstanceOf(ProviderInvalidResponseError);
  });
});
