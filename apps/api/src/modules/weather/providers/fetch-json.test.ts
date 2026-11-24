import {
  ProviderInvalidResponseError,
  ProviderQuotaError,
  ProviderTimeoutError,
  ProviderUnavailableError,
} from '@zenith/core';
import { delay, http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { server } from '../../../../../../test/msw-server.js';
import { fetchJson } from './fetch-json.ts';

const url = new URL('https://provider.test/data');
const schema = z.object({ value: z.number() });

function call(signal?: AbortSignal) {
  return fetchJson({ providerId: 'test', url, schema, signal });
}

async function failureFor(respond: () => Response, signal?: AbortSignal): Promise<unknown> {
  server.use(http.get(url.href, respond));
  return call(signal).catch((error: unknown) => error);
}

function interruptedBody(interrupt: (controller: ReadableStreamDefaultController) => void) {
  const chunks = [new TextEncoder().encode('{"value":')];
  return new Response(
    new ReadableStream({
      pull: async (controller) => {
        const chunk = chunks.shift();
        if (chunk) {
          controller.enqueue(chunk);
          return;
        }
        await delay(20);
        interrupt(controller);
      },
    }),
  );
}

describe('fetchJson', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the body parsed by the schema', async () => {
    server.use(http.get(url.href, () => HttpResponse.json({ value: 1, extra: true })));

    await expect(call()).resolves.toEqual({ value: 1 });
  });

  it('reports an aborted request as a timeout', async () => {
    const failure = await failureFor(() => HttpResponse.json({ value: 1 }), AbortSignal.abort());

    expect(failure).toBeInstanceOf(ProviderTimeoutError);
    expect(failure).toMatchObject({ providerId: 'test', cause: expect.anything() });
  });

  it('reports an abort during the body as a timeout', async () => {
    const abort = new AbortController();
    const failure = await failureFor(() => interruptedBody(() => abort.abort()), abort.signal);

    expect(failure).toBeInstanceOf(ProviderTimeoutError);
  });

  it('reports a network failure as unavailable with its cause', async () => {
    const failure = await failureFor(() => HttpResponse.error());

    expect(failure).toBeInstanceOf(ProviderUnavailableError);
    expect(failure).toMatchObject({ providerId: 'test', cause: expect.any(TypeError) });
  });

  it('reports a connection lost during the body as unavailable', async () => {
    const lost = new TypeError('terminated');
    const response = interruptedBody((controller) => controller.error(lost));
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(response);

    const failure = await call().catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ProviderUnavailableError);
    expect(failure).toMatchObject({ cause: lost });
  });

  it.each([500, 503])('reports HTTP %i as unavailable', async (status) => {
    const failure = await failureFor(() => new HttpResponse(null, { status }));

    expect(failure).toBeInstanceOf(ProviderUnavailableError);
  });

  it.each([
    ['30', 30],
    ['Wed, 21 Oct 2026 07:28:00 GMT', null],
    ['', null],
  ])('reports HTTP 429 with Retry-After "%s" as a quota error retrying after %s', async (header, seconds) => {
    const failure = await failureFor(() => new HttpResponse(null, { status: 429, headers: { 'Retry-After': header } }));

    expect(failure).toBeInstanceOf(ProviderQuotaError);
    expect(failure).toMatchObject({ retryAfterSeconds: seconds });
  });

  it('reports HTTP 429 without Retry-After as a quota error without delay', async () => {
    const failure = await failureFor(() => new HttpResponse(null, { status: 429 }));

    expect(failure).toBeInstanceOf(ProviderQuotaError);
    expect(failure).toMatchObject({ retryAfterSeconds: null });
  });

  it('reports HTTP 400 as an invalid response', async () => {
    const failure = await failureFor(() => HttpResponse.json({ error: true }, { status: 400 }));

    expect(failure).toBeInstanceOf(ProviderInvalidResponseError);
    expect(failure).toMatchObject({ message: 'HTTP 400' });
  });

  it('reports a body that is not JSON as an invalid response', async () => {
    const failure = await failureFor(() => HttpResponse.text('<html>'));

    expect(failure).toBeInstanceOf(ProviderInvalidResponseError);
    expect(failure).toMatchObject({ cause: expect.any(SyntaxError) });
  });

  it('reports a body of another shape as an invalid response', async () => {
    const failure = await failureFor(() => HttpResponse.json({ value: 'one' }));

    expect(failure).toBeInstanceOf(ProviderInvalidResponseError);
    expect(failure).toMatchObject({ cause: expect.any(z.ZodError) });
  });
});
