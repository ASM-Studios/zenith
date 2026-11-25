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
import { createMetNorwayProvider } from '../src/providers/met-norway/provider.ts';
import { metNorwayForecast, metNorwayForecastUrl } from './mocks/met-norway.handlers.ts';

const query: WeatherQuery = { location: { latitude: 59.9139, longitude: 10.7522 } };

function answerWith(respond: () => Response) {
  server.use(http.get(metNorwayForecastUrl, respond));
}

describe.each(['getCurrent', 'getHourly', 'getDaily'] as const)('met-norway %s errors', (method) => {
  const call = async (signal?: AbortSignal) =>
    createMetNorwayProvider({ contact: 'ops@example.org' })[method]?.({ ...query, signal });

  it('throws a quota error with the retry delay when rate limited', async () => {
    answerWith(() => new HttpResponse(null, { status: 429, headers: { 'Retry-After': '30' } }));

    await expect(call()).rejects.toMatchObject({
      name: ProviderQuotaError.name,
      providerId: 'met-norway',
      retryAfterSeconds: 30,
    });
  });

  it('throws an unavailable error when the server fails', async () => {
    answerWith(() => new HttpResponse(null, { status: 503 }));

    await expect(call()).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it('throws a timeout error when the signal is aborted', async () => {
    answerWith(() => HttpResponse.json(metNorwayForecast()));

    await expect(call(AbortSignal.abort())).rejects.toBeInstanceOf(ProviderTimeoutError);
  });

  it('throws an invalid response error when the body is not a forecast', async () => {
    answerWith(() => HttpResponse.json({ properties: { timeseries: [] } }));

    await expect(call()).rejects.toBeInstanceOf(ProviderInvalidResponseError);
  });

  it('throws an invalid response error for an unknown symbol code', async () => {
    const everySymbolUnknown = JSON.stringify(metNorwayForecast()).replaceAll(
      /"symbol_code":"[a-z_]+"/g,
      '"symbol_code":"volcanicash_day"',
    );
    answerWith(() => HttpResponse.json(JSON.parse(everySymbolUnknown)));

    await expect(call()).rejects.toMatchObject({ name: ProviderInvalidResponseError.name, providerId: 'met-norway' });
  });
});
