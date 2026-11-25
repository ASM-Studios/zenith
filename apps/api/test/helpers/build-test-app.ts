import type { WeatherProvider } from '@zenith/core';
import { buildApp } from '../../src/app.ts';
import { createCache } from '@zenith/weather';
import { createLogger } from '../../src/lib/logger.ts';

export function buildTestApp({ weatherProviders }: { weatherProviders?: WeatherProvider[] } = {}) {
  const logger = createLogger({ level: 'silent' });
  const store = { get: async () => null, set: async () => 'OK' };
  return buildApp({ logger, cache: createCache(store, { logger }), weatherProviders });
}
