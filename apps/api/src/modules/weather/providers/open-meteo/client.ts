import { ProviderInvalidResponseError, ProviderTimeoutError, type WeatherQuery } from '@zenith/core';
import type { z } from 'zod';
import { fetchOrThrow } from '../fetch-or-throw.ts';
import { OPEN_METEO_ID } from './constants.ts';

export interface OpenMeteoRequest<Schema extends z.ZodType> {
  baseUrl: string;
  query: WeatherQuery;
  params: Record<string, string>;
  schema: Schema;
}

function buildUrl(baseUrl: string, query: WeatherQuery, params: Record<string, string>): string {
  const url = new URL(baseUrl);
  url.searchParams.set('latitude', String(query.location.latitude));
  url.searchParams.set('longitude', String(query.location.longitude));
  url.searchParams.set('timeformat', 'unixtime');
  url.searchParams.set('timezone', 'auto');
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }
  return url.toString();
}

async function readJson(response: Response, signal?: AbortSignal): Promise<unknown> {
  try {
    return await response.json();
  } catch (cause) {
    if (signal?.aborted) {
      throw new ProviderTimeoutError(OPEN_METEO_ID, 'request aborted', { cause });
    }
    throw new ProviderInvalidResponseError(OPEN_METEO_ID, 'response body is not JSON', { cause });
  }
}

export async function requestOpenMeteo<Schema extends z.ZodType>({
  baseUrl,
  query,
  params,
  schema,
}: OpenMeteoRequest<Schema>): Promise<z.output<Schema>> {
  const response = await fetchOrThrow(OPEN_METEO_ID, buildUrl(baseUrl, query, params), query.signal);
  const parsed = schema.safeParse(await readJson(response, query.signal));
  if (!parsed.success) {
    throw new ProviderInvalidResponseError(OPEN_METEO_ID, 'response does not match the expected shape', {
      cause: parsed.error,
    });
  }
  return parsed.data;
}
