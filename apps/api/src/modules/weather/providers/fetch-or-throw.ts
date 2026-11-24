import {
  ProviderInvalidResponseError,
  ProviderQuotaError,
  ProviderTimeoutError,
  ProviderUnavailableError,
} from '@zenith/core';

const ABORT_ERROR_NAMES = new Set(['AbortError', 'TimeoutError']);

function isAbortError(error: unknown): boolean {
  return error instanceof Error && ABORT_ERROR_NAMES.has(error.name);
}

function parseRetryAfterSeconds(response: Response): number | undefined {
  const header = response.headers.get('retry-after');
  if (header === null || !/^\d+$/.test(header.trim())) {
    return undefined;
  }
  return Number(header);
}

export async function fetchOrThrow(providerId: string, url: string, signal?: AbortSignal): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) {
      throw new ProviderTimeoutError(providerId, 'request aborted', { cause: error });
    }
    throw new ProviderUnavailableError(providerId, 'network error', { cause: error });
  }

  if (response.ok) {
    return response;
  }
  const cause = new Error(`HTTP ${response.status}`);
  if (response.status === 429) {
    throw new ProviderQuotaError(providerId, 'quota exhausted', {
      cause,
      retryAfterSeconds: parseRetryAfterSeconds(response),
    });
  }
  if (response.status >= 500) {
    throw new ProviderUnavailableError(providerId, `upstream error ${response.status}`, { cause });
  }
  throw new ProviderInvalidResponseError(providerId, `unexpected status ${response.status}`, { cause });
}
