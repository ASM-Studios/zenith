import {
  ProviderInvalidResponseError,
  ProviderQuotaError,
  ProviderTimeoutError,
  ProviderUnavailableError,
} from '@zenith/core';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '../../../test/msw-server.js';
import { createOpenMeteoProvider } from '../src/modules/weather/providers/open-meteo/index.ts';
import { current, openMeteoAirQualityUrl, openMeteoForecastUrl } from './mocks/open-meteo.handlers.ts';

const paris = { latitude: 48.85, longitude: 2.35 };
const provider = createOpenMeteoProvider({ forecastUrl: openMeteoForecastUrl, airQualityUrl: openMeteoAirQualityUrl });

describe('open-meteo provider errors', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps a rate limited forecast to a quota error carrying Retry-After', async () => {
    server.use(
      http.get(openMeteoForecastUrl, () => new HttpResponse(null, { status: 429, headers: { 'Retry-After': '60' } })),
    );

    const failure = await provider.getCurrent?.({ location: paris }).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ProviderQuotaError);
    expect(failure).toMatchObject({ providerId: 'open-meteo', retryAfterSeconds: 60 });
  });

  it('maps a server error on the air quality API to an unavailable error', async () => {
    server.use(http.get(openMeteoAirQualityUrl, () => new HttpResponse(null, { status: 502 })));

    await expect(provider.getAirQuality?.({ location: paris })).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it('maps a network failure to an unavailable error', async () => {
    server.use(http.get(openMeteoForecastUrl, () => HttpResponse.error()));

    await expect(provider.getDaily?.({ location: paris })).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it('maps a body that is not JSON to an invalid response error', async () => {
    server.use(http.get(openMeteoForecastUrl, () => new HttpResponse('<html>oops</html>')));

    await expect(provider.getCurrent?.({ location: paris })).rejects.toBeInstanceOf(ProviderInvalidResponseError);
  });

  it('maps a body that misses a required field to an invalid response error', async () => {
    server.use(http.get(openMeteoForecastUrl, () => HttpResponse.json({ current: { time: 1795532400 } })));

    await expect(provider.getCurrent?.({ location: paris })).rejects.toBeInstanceOf(ProviderInvalidResponseError);
  });

  it('maps hourly columns shorter than the time column to an invalid response error', async () => {
    server.use(
      http.get(openMeteoForecastUrl, () =>
        HttpResponse.json({ hourly: { time: [1795532400, 1795536000], temperature_2m: [7.3], weather_code: [3, 3] } }),
      ),
    );

    await expect(provider.getHourly?.({ location: paris })).rejects.toBeInstanceOf(ProviderInvalidResponseError);
  });

  it('maps an unknown WMO weather code to an invalid response error', async () => {
    server.use(
      http.get(openMeteoForecastUrl, () => HttpResponse.json({ current: { ...current.current, weather_code: 4 } })),
    );

    await expect(provider.getCurrent?.({ location: paris })).rejects.toBeInstanceOf(ProviderInvalidResponseError);
  });

  it('maps an already aborted signal to a timeout error', async () => {
    server.use(http.get(openMeteoForecastUrl, () => HttpResponse.json(current)));

    await expect(provider.getCurrent?.({ location: paris, signal: AbortSignal.abort() })).rejects.toBeInstanceOf(
      ProviderTimeoutError,
    );
  });

  it('maps an abort while the body is being read to a timeout error', async () => {
    const controller = new AbortController();
    const response = new Response('{}');
    vi.spyOn(response, 'json').mockImplementation(async () => {
      controller.abort();
      throw new DOMException('aborted', 'AbortError');
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(response);

    await expect(provider.getCurrent?.({ location: paris, signal: controller.signal })).rejects.toBeInstanceOf(
      ProviderTimeoutError,
    );
  });
});
