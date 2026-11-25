import { ProviderInvalidResponseError, type GeoPoint } from '@zenith/core';
import { fetchJsonResponse } from '../fetch-json.ts';
import { ForecastResponseSchema, type ForecastEntry } from './forecast.schema.ts';
import { forecastUrl } from './forecast.request.ts';
import { MET_NORWAY_ID } from './identity.ts';

const FALLBACK_LIFETIME_MS = 60_000;
const DEFAULT_MAX_DOCUMENTS = 500;

interface StoredForecast {
  timeseries: ForecastEntry[];
  expiresAt: number;
  lastModified: string | null;
}

interface ForecastSource {
  load(location: GeoPoint, signal?: AbortSignal): Promise<ForecastEntry[]>;
}

interface ForecastSourceOptions {
  userAgent: string;
  now?: () => number;
  maxDocuments?: number;
}

function expiryOf(headers: Headers, now: number): number {
  const expires = Date.parse(headers.get('expires') ?? '');
  return Number.isNaN(expires) ? now + FALLBACK_LIFETIME_MS : expires;
}

export function createForecastSource({
  userAgent,
  now = Date.now,
  maxDocuments = DEFAULT_MAX_DOCUMENTS,
}: ForecastSourceOptions): ForecastSource {
  const documents = new Map<string, StoredForecast>();

  function remember(key: string, stored: StoredForecast) {
    documents.delete(key);
    documents.set(key, stored);
    for (const oldest of documents.keys()) {
      if (documents.size <= maxDocuments) {
        break;
      }
      documents.delete(oldest);
    }
  }

  return {
    async load(location, signal) {
      const url = forecastUrl(location);
      const stored = documents.get(url.href);
      if (stored && now() < stored.expiresAt) {
        remember(url.href, stored);
        return stored.timeseries;
      }
      const headers: Record<string, string> = { 'User-Agent': userAgent };
      if (stored?.lastModified) {
        headers['If-Modified-Since'] = stored.lastModified;
      }
      const result = await fetchJsonResponse({
        providerId: MET_NORWAY_ID,
        url,
        schema: ForecastResponseSchema,
        signal,
        headers,
      });
      const expiresAt = expiryOf(result.headers, now());
      const lastModified = result.headers.get('last-modified');
      if (result.modified) {
        const { timeseries } = result.data.properties;
        remember(url.href, { timeseries, expiresAt, lastModified });
        return timeseries;
      }
      if (!stored) {
        throw new ProviderInvalidResponseError(MET_NORWAY_ID, 'not modified without a stored forecast');
      }
      remember(url.href, { ...stored, expiresAt, lastModified: lastModified ?? stored.lastModified });
      return stored.timeseries;
    },
  };
}
