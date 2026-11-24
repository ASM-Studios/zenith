import {
  ProviderInvalidResponseError,
  ProviderQuotaError,
  ProviderTimeoutError,
  ProviderUnavailableError,
} from '@zenith/core';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../../../../test/msw-server.js';
import { fetchOrThrow } from './fetch-or-throw.ts';

const url = 'https://provider.test/data';

describe('fetchOrThrow', () => {
  it('returns the response of a successful call', async () => {
    server.use(http.get(url, () => HttpResponse.json({ ok: true })));

    const response = await fetchOrThrow('p', url);

    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('maps an aborted signal to ProviderTimeoutError keeping the cause', async () => {
    server.use(http.get(url, () => HttpResponse.json({})));
    const controller = new AbortController();
    controller.abort();

    const failure = await fetchOrThrow('p', url, controller.signal).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ProviderTimeoutError);
    expect(failure).toMatchObject({ kind: 'timeout', providerId: 'p', cause: expect.anything() });
  });

  it('maps a network error to ProviderUnavailableError keeping the cause', async () => {
    server.use(http.get(url, () => HttpResponse.error()));

    const failure = await fetchOrThrow('p', url).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ProviderUnavailableError);
    expect(failure).toMatchObject({ cause: expect.anything() });
  });

  it('maps an HTTP 5xx to ProviderUnavailableError', async () => {
    server.use(http.get(url, () => new HttpResponse(null, { status: 503 })));

    await expect(fetchOrThrow('p', url)).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it('maps an HTTP 429 to ProviderQuotaError with the Retry-After seconds', async () => {
    server.use(http.get(url, () => new HttpResponse(null, { status: 429, headers: { 'Retry-After': '30' } })));

    const failure = await fetchOrThrow('p', url).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ProviderQuotaError);
    expect(failure).toMatchObject({ kind: 'quota', retryAfterSeconds: 30 });
  });

  it('leaves retryAfterSeconds null when Retry-After is missing or is a date', async () => {
    server.use(http.get(url, () => new HttpResponse(null, { status: 429 })));
    const missing = await fetchOrThrow('p', url).catch((error: unknown) => error);

    server.use(
      http.get(
        url,
        () => new HttpResponse(null, { status: 429, headers: { 'Retry-After': 'Wed, 21 Oct 2026 07:28:00 GMT' } }),
      ),
    );
    const dated = await fetchOrThrow('p', url).catch((error: unknown) => error);

    expect(missing).toMatchObject({ retryAfterSeconds: null });
    expect(dated).toMatchObject({ retryAfterSeconds: null });
  });

  it('maps an HTTP 4xx other than 429 to ProviderInvalidResponseError', async () => {
    server.use(http.get(url, () => new HttpResponse(null, { status: 400 })));

    await expect(fetchOrThrow('p', url)).rejects.toBeInstanceOf(ProviderInvalidResponseError);
  });
});
