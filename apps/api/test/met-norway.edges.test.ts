import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../test/msw-server.js';
import { createMetNorwayProvider } from '../src/modules/weather/providers/met-norway/provider.ts';
import { metNorwayForecast, metNorwayForecastUrl } from './mocks/met-norway.handlers.ts';

const location = { latitude: 59.9139, longitude: 10.7522 };
const otherLocation = { latitude: 60.39, longitude: 5.32 };
const start = Date.parse('2026-11-24T12:00:00Z');

function mutated(visit: (node: object) => void): object {
  const walk = (node: unknown): void => {
    if (node && typeof node === 'object') {
      visit(node);
      Object.values(node).forEach(walk);
    }
  };
  const forecast = metNorwayForecast();
  walk(forecast);
  return forecast;
}

function nullifying(keys: string[]): object {
  return mutated((node) => {
    for (const key of keys.filter((name) => Reflect.has(node, name))) {
      Reflect.set(node, key, null);
    }
  });
}

function serve(body: object, headers: Record<string, string> = {}) {
  let requests = 0;
  server.use(
    http.get(metNorwayForecastUrl, () => {
      requests += 1;
      return HttpResponse.json(body, { headers });
    }),
  );
  return () => requests;
}

describe('met-norway forecasts with missing parts', () => {
  it.each([
    ['getCurrent', 'next_1_hours'],
    ['getHourly', 'next_1_hours'],
    ['getDaily', 'next_6_hours'],
  ] as const)('rejects %s when the forecast has no %s period', async (method, missing) => {
    const provider = createMetNorwayProvider({ contact: 'ops@example.org' });
    serve(mutated((node) => Reflect.deleteProperty(node, missing)));

    await expect(provider[method]?.({ location })).rejects.toMatchObject({ name: 'ProviderInvalidResponseError' });
  });

  it('reports missing wind as null instead of zero', async () => {
    const provider = createMetNorwayProvider({ contact: 'ops@example.org' });
    serve(nullifying(['wind_speed', 'wind_speed_of_gust']));

    const current = await provider.getCurrent?.({ location });
    const days = await provider.getDaily?.({ location });

    expect(current).toMatchObject({ windSpeedKmh: null, windGustKmh: null });
    expect(days?.[0]).toMatchObject({ windSpeedMaxKmh: null, windGustMaxKmh: null });
  });

  it('reports a day without precipitation figures as null', async () => {
    const provider = createMetNorwayProvider({ contact: 'ops@example.org' });
    serve(nullifying(['precipitation_amount', 'probability_of_precipitation']));

    const days = await provider.getDaily?.({ location });

    expect(days?.[0]).toMatchObject({ precipitationSumMm: null, precipitationProbabilityMaxPercent: null });
  });
});

describe('met-norway forecast document cache limits', () => {
  it('keeps a document for a minute when the source sends no Expires', async () => {
    const clock = { now: start };
    const requests = serve(metNorwayForecast());
    const provider = createMetNorwayProvider({ contact: 'ops@example.org', now: () => clock.now });

    await provider.getCurrent?.({ location });
    clock.now += 59_000;
    await provider.getCurrent?.({ location });
    clock.now += 2000;
    await provider.getCurrent?.({ location });

    expect(requests()).toBe(2);
  });

  it('forgets the oldest document beyond the limit', async () => {
    const requests = serve(metNorwayForecast(), { Expires: new Date(start + 600_000).toUTCString() });
    const provider = createMetNorwayProvider({ contact: 'ops@example.org', now: () => start, maxDocuments: 1 });

    await provider.getCurrent?.({ location });
    await provider.getCurrent?.({ location: otherLocation });
    await provider.getCurrent?.({ location });

    expect(requests()).toBe(3);
  });

  it('rejects a not modified answer when nothing is stored', async () => {
    server.use(http.get(metNorwayForecastUrl, () => new HttpResponse(null, { status: 304 })));
    const provider = createMetNorwayProvider({ contact: 'ops@example.org' });

    await expect(provider.getCurrent?.({ location })).rejects.toMatchObject({ name: 'ProviderInvalidResponseError' });
  });

  it('keeps the stored Last-Modified when a not modified answer omits it', async () => {
    const clock = { now: start };
    const lastModified = 'Tue, 24 Nov 2026 11:50:00 GMT';
    const received: (string | null)[] = [];
    let answer = () =>
      HttpResponse.json(metNorwayForecast(), {
        headers: { Expires: new Date(start + 1000).toUTCString(), 'Last-Modified': lastModified },
      });
    server.use(
      http.get(metNorwayForecastUrl, ({ request }) => {
        received.push(request.headers.get('if-modified-since'));
        return answer();
      }),
    );
    const provider = createMetNorwayProvider({ contact: 'ops@example.org', now: () => clock.now });
    await provider.getCurrent?.({ location });
    answer = () => new HttpResponse(null, { status: 304, headers: { Expires: new Date(start + 5000).toUTCString() } });

    clock.now += 2000;
    await provider.getCurrent?.({ location });
    clock.now += 4000;
    await provider.getCurrent?.({ location });

    expect(received).toEqual([null, lastModified, lastModified]);
  });
});
