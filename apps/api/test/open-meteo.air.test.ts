import {
  AirQualitySchema,
  offersDataType,
  PollenSchema,
  ProviderInvalidResponseError,
  ProviderQuotaError,
  ProviderTimeoutError,
  ProviderUnavailableError,
} from '@zenith/core';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../test/msw-server.js';
import { createOpenMeteoProvider } from '../src/modules/weather/providers/open-meteo/provider.ts';
import {
  airQualityOk,
  airQualityOkHandler,
  openMeteoAirUrl,
  pollenParisHandler,
  pollenSydneyHandler,
} from './mocks/open-meteo-air.handlers.ts';

const location = { latitude: 48.85, longitude: 2.35 };
const provider = createOpenMeteoProvider();
const time = '2026-11-24T16:00';

function answerWith(respond: () => Response) {
  const params: Record<string, string>[] = [];
  server.use(
    http.get(openMeteoAirUrl, ({ request }) => {
      params.push(Object.fromEntries(new URL(request.url).searchParams));
      return respond();
    }),
  );
  return params;
}

const answerCurrent = (current: object) => answerWith(() => HttpResponse.json({ current }));

describe('open-meteo air quality', () => {
  it('maps the response to the core type', async () => {
    server.use(airQualityOkHandler);

    const airQuality = await provider.getAirQuality?.({ location });

    expect(AirQualitySchema.parse(airQuality)).toEqual({
      time: '2026-11-24T16:00:00Z',
      index: { scale: 'european', value: 49 },
      concentrationsMicrogramsPerCubicMeter: {
        pm25: 12.9,
        pm10: 14.7,
        ozone: 17,
        nitrogenDioxide: 40.9,
        sulphurDioxide: 3,
        carbonMonoxide: 308,
      },
    });
  });

  it('keeps a European index of zero', async () => {
    answerCurrent({ ...airQualityOk.current, european_aqi: 0 });

    await expect(provider.getAirQuality?.({ location })).resolves.toMatchObject({
      index: { scale: 'european', value: 0 },
    });
  });

  it('falls back to the US index without a European one', async () => {
    answerCurrent({ ...airQualityOk.current, european_aqi: null });

    await expect(provider.getAirQuality?.({ location })).resolves.toMatchObject({ index: { scale: 'us', value: 64 } });
  });

  it('gives null for the index and every pollutant the source omits', async () => {
    answerCurrent({ time });

    const airQuality = AirQualitySchema.parse(await provider.getAirQuality?.({ location }));

    expect(airQuality.index).toBeNull();
    expect(new Set(Object.values(airQuality.concentrationsMicrogramsPerCubicMeter))).toEqual(new Set([null]));
  });

  it('asks for the indexes and pollutants in GMT', async () => {
    const params = answerCurrent({ time });

    await provider.getAirQuality?.({ location });

    expect(params).toEqual([
      {
        latitude: '48.85',
        longitude: '2.35',
        timezone: 'GMT',
        current: 'european_aqi,us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide',
      },
    ]);
  });
});

describe('open-meteo pollen', () => {
  it('maps each species to the core type', async () => {
    answerCurrent({
      time,
      alder_pollen: 1,
      birch_pollen: 2,
      grass_pollen: 3,
      mugwort_pollen: 4,
      olive_pollen: 5,
      ragweed_pollen: 6,
    });

    expect(PollenSchema.parse(await provider.getPollen?.({ location }))).toEqual({
      time: '2026-11-24T16:00:00Z',
      grainsPerCubicMeter: { alder: 1, birch: 2, grass: 3, mugwort: 4, olive: 5, ragweed: 6 },
    });
  });

  it.each([
    ['zero in Paris off season', pollenParisHandler, 0],
    ['null in Sydney, outside the covered area', pollenSydneyHandler, null],
  ])('gives %s for every species', async (_, handler, grains) => {
    server.use(handler);

    const pollen = PollenSchema.parse(await provider.getPollen?.({ location }));

    expect(Object.values(pollen.grainsPerCubicMeter)).toEqual(Array.from({ length: 6 }, () => grains));
  });

  it('asks for every species in GMT', async () => {
    const params = answerCurrent({ time });

    await provider.getPollen?.({ location });

    expect(params[0]).toMatchObject({
      timezone: 'GMT',
      current: 'alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen',
    });
  });
});

describe.each(['getAirQuality', 'getPollen'] as const)('open-meteo %s errors', (method) => {
  it.each([
    ['a quota error when rate limited', 429, ProviderQuotaError],
    ['an unavailable error when the server fails', 502, ProviderUnavailableError],
  ])('throws %s', async (_, status, expected) => {
    answerWith(() => new HttpResponse(null, { status }));

    await expect(provider[method]?.({ location })).rejects.toBeInstanceOf(expected);
  });

  it('throws a timeout error when the signal is aborted', async () => {
    answerCurrent({ time });

    const signal = AbortSignal.abort();
    await expect(provider[method]?.({ location, signal })).rejects.toBeInstanceOf(ProviderTimeoutError);
  });

  it('throws an invalid response error without a time', async () => {
    answerCurrent({});

    await expect(provider[method]?.({ location })).rejects.toBeInstanceOf(ProviderInvalidResponseError);
  });
});

describe('open-meteo air coverage', () => {
  it.each(['airQuality', 'pollen'] as const)('offers %s in Sydney', (dataType) => {
    expect(offersDataType(provider, dataType, { latitude: -33.87, longitude: 151.21 })).toBe(true);
  });
});
