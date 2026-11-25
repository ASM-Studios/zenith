import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../test/msw-server.js';
import { createMetNorwayProvider } from '../src/modules/weather/providers/met-norway/provider.ts';
import { metNorwayForecast, metNorwayForecastUrl } from './mocks/met-norway.handlers.ts';

const location = { latitude: 59.9139, longitude: 10.7522 };
const lastModified = 'Tue, 24 Nov 2026 11:50:00 GMT';

function setup() {
  const clock = { now: Date.parse('2026-11-24T12:00:00Z') };
  const received: (string | null)[] = [];
  let answer: () => Response = () => HttpResponse.json(metNorwayForecast(), { headers: expiry(600_000) });

  function expiry(afterMs: number) {
    return { Expires: new Date(clock.now + afterMs).toUTCString(), 'Last-Modified': lastModified };
  }

  server.use(
    http.get(metNorwayForecastUrl, ({ request }) => {
      received.push(request.headers.get('if-modified-since'));
      return answer();
    }),
  );
  const provider = createMetNorwayProvider({ contact: 'ops@example.org', now: () => clock.now });
  return {
    provider,
    received,
    advance: (ms: number) => (clock.now += ms),
    answerWith: (next: () => Response) => (answer = next),
    expiry,
  };
}

describe('met-norway forecast document cache', () => {
  it('serves current, hourly and daily from one request before it expires', async () => {
    const { provider, received } = setup();

    await provider.getCurrent?.({ location });
    await provider.getHourly?.({ location });
    await provider.getDaily?.({ location });

    expect(received).toEqual([null]);
  });

  it('asks again with If-Modified-Since once the document expired', async () => {
    const { provider, received, advance } = setup();
    await provider.getCurrent?.({ location });

    advance(600_001);
    await provider.getCurrent?.({ location });

    expect(received).toEqual([null, lastModified]);
  });

  it('keeps serving the stored document after a not modified answer', async () => {
    const { provider, received, advance, answerWith, expiry } = setup();
    const first = await provider.getHourly?.({ location });
    answerWith(() => new HttpResponse(null, { status: 304, headers: expiry(600_000) }));

    advance(600_001);
    const second = await provider.getHourly?.({ location });
    advance(1000);
    await provider.getHourly?.({ location });

    expect(second).toEqual(first);
    expect(received).toHaveLength(2);
  });

  it('replaces the stored document when the source sends a new one', async () => {
    const { provider, advance, answerWith, expiry } = setup();
    await provider.getCurrent?.({ location });
    answerWith(() => HttpResponse.json(metNorwayForecast('clearsky_day'), { headers: expiry(600_000) }));

    advance(600_001);
    const current = await provider.getCurrent?.({ location });

    expect(current).toMatchObject({ condition: 'clear', isDay: true });
  });

  it('drops the old validator when a new document comes without Last-Modified', async () => {
    const { provider, received, advance, answerWith } = setup();
    await provider.getCurrent?.({ location });
    answerWith(() => HttpResponse.json(metNorwayForecast(), { headers: { Expires: 'Tue, 24 Nov 2026 12:10:30 GMT' } }));
    advance(600_001);
    await provider.getCurrent?.({ location });

    advance(3_600_000);
    await provider.getCurrent?.({ location });

    expect(received).toEqual([null, lastModified, null]);
  });

  it('does not share documents between locations', async () => {
    const { provider, received } = setup();

    await provider.getCurrent?.({ location });
    await provider.getCurrent?.({ location: { latitude: 60.39, longitude: 5.32 } });

    expect(received).toHaveLength(2);
  });
});
