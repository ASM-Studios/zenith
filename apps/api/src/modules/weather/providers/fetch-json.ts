import {
  ProviderInvalidResponseError,
  ProviderQuotaError,
  ProviderTimeoutError,
  ProviderUnavailableError,
  type ProviderError,
} from '@zenith/core';
import type { z } from 'zod';

interface FetchJsonRequest<Schema extends z.ZodType> {
  providerId: string;
  url: URL;
  schema: Schema;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

type JsonResponse<Data> = { modified: true; data: Data; headers: Headers } | { modified: false; headers: Headers };

function retryAfterSeconds(response: Response): number | undefined {
  const header = response.headers.get('retry-after') ?? '';
  return /^\d+$/.test(header) ? Number(header) : undefined;
}

function statusError(providerId: string, response: Response): ProviderError {
  const message = `HTTP ${response.status}`;
  const cause = new Error(message);
  if (response.status === 429) {
    return new ProviderQuotaError(providerId, message, { cause, retryAfterSeconds: retryAfterSeconds(response) });
  }
  if (response.status >= 500) {
    return new ProviderUnavailableError(providerId, message, { cause });
  }
  return new ProviderInvalidResponseError(providerId, message, { cause });
}

function transportError(providerId: string, cause: unknown, signal?: AbortSignal): ProviderError {
  if (signal?.aborted) {
    return new ProviderTimeoutError(providerId, 'request aborted', { cause });
  }
  return new ProviderUnavailableError(providerId, 'network error', { cause });
}

function parseJson(providerId: string, body: string): unknown {
  try {
    return JSON.parse(body);
  } catch (cause) {
    throw new ProviderInvalidResponseError(providerId, 'body is not JSON', { cause });
  }
}

export async function fetchJsonResponse<Schema extends z.ZodType>(
  request: FetchJsonRequest<Schema>,
): Promise<JsonResponse<z.output<Schema>>> {
  const { providerId, url, schema, signal, headers } = request;
  const response = await fetch(url, { signal, headers }).catch((cause: unknown) => {
    throw transportError(providerId, cause, signal);
  });
  if (response.status === 304) {
    return { modified: false, headers: response.headers };
  }
  if (!response.ok) {
    throw statusError(providerId, response);
  }
  const body = await response.text().catch((cause: unknown) => {
    throw transportError(providerId, cause, signal);
  });
  const parsed = schema.safeParse(parseJson(providerId, body));
  if (!parsed.success) {
    throw new ProviderInvalidResponseError(providerId, 'body does not match the expected shape', {
      cause: parsed.error,
    });
  }
  return { modified: true, data: parsed.data, headers: response.headers };
}

export async function fetchJson<Schema extends z.ZodType>(
  request: FetchJsonRequest<Schema>,
): Promise<z.output<Schema>> {
  const result = await fetchJsonResponse(request);
  if (!result.modified) {
    throw new ProviderInvalidResponseError(request.providerId, 'unexpected HTTP 304');
  }
  return result.data;
}
