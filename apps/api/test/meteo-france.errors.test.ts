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
import { createMeteoFranceProvider } from '../src/modules/weather/providers/meteo-france/provider.ts';
import { currentOk, meteoFranceForecastUrl } from './mocks/meteo-france.handlers.ts';

const provider = createMeteoFranceProvider();
const query: WeatherQuery = { location: { latitude: 48.85, longitude: 2.35 } };

function answerWith(respond: () => Response) {
  server.use(http.get(meteoFranceForecastUrl, respond));
}

describe.each(['getCurrent', 'getHourly', 'getDaily'] as const)('meteo-france %s errors', (method) => {
  const call = async (signal?: AbortSignal) => provider[method]?.({ ...query, signal });

  it('throws a quota error with the retry delay when rate limited', async () => {
    answerWith(() => new HttpResponse(null, { status: 429, headers: { 'Retry-After': '60' } }));

    await expect(call()).rejects.toMatchObject({
      name: ProviderQuotaError.name,
      providerId: 'meteo-france',
      retryAfterSeconds: 60,
    });
  });

  it('throws an unavailable error when the server fails', async () => {
    answerWith(() => new HttpResponse(null, { status: 502 }));

    await expect(call()).rejects.toMatchObject({
      name: ProviderUnavailableError.name,
      providerId: 'meteo-france',
    });
  });

  it('throws a timeout error when the signal is aborted', async () => {
    answerWith(() => HttpResponse.json({}));

    await expect(call(AbortSignal.abort())).rejects.toMatchObject({
      name: ProviderTimeoutError.name,
      providerId: 'meteo-france',
    });
  });
});

describe('meteo-france data errors', () => {
  it('rejects an unknown WMO code', async () => {
    answerWith(() => HttpResponse.json({ current: { ...currentOk.current, weather_code: 4 } }));

    await expect(provider.getCurrent?.(query)).rejects.toMatchObject({
      name: ProviderInvalidResponseError.name,
      providerId: 'meteo-france',
      message: 'unknown WMO code 4',
    });
  });

  it.each([
    [
      'a partly null last day',
      {
        time: ['2026-11-25', '2026-11-26'],
        weather_code: [3, 3],
        temperature_2m_min: [1, null],
        temperature_2m_max: [5, null],
      },
    ],
    [
      'an empty day in the middle',
      {
        time: ['2026-11-25', '2026-11-26', '2026-11-27'],
        weather_code: [3, null, 3],
        temperature_2m_min: [1, null, 2],
        temperature_2m_max: [5, null, 6],
      },
    ],
    [
      'only empty days',
      {
        time: ['2026-11-25', '2026-11-26'],
        weather_code: [null, null],
        temperature_2m_min: [null, null],
        temperature_2m_max: [null, null],
      },
    ],
  ])('rejects a daily forecast with %s', async (_, daily) => {
    answerWith(() => HttpResponse.json({ daily }));

    await expect(provider.getDaily?.(query)).rejects.toBeInstanceOf(ProviderInvalidResponseError);
  });
});
