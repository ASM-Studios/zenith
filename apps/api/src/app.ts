import type { WeatherProvider } from '@zenith/core';
import Fastify from 'fastify';
import type { Logger } from 'pino';
import type { Cache } from './lib/cache.ts';
import { authRoutes } from './modules/auth/auth.routes.ts';
import { locationRoutes } from './modules/favorites/locations.routes.ts';
import { preferenceRoutes } from './modules/preferences/preferences.routes.ts';
import { sessionSourcePreferences } from './modules/weather/weather.preferences.ts';
import { weatherRoutes } from './modules/weather/weather.routes.ts';
import { createWeatherService } from './modules/weather/weather.service.ts';

export interface AppDependencies {
  logger: Logger;
  cache: Cache;
  weatherProviders?: readonly WeatherProvider[];
}

export function buildApp({ logger, cache, weatherProviders = [] }: AppDependencies) {
  const app = Fastify({ loggerInstance: logger });
  const weatherService = createWeatherService({
    cache,
    providers: weatherProviders,
    logger: logger.child({ module: 'weather' }),
  });

  app.decorate('cache', cache);
  app.get('/ping', async () => 'pong');
  app.register(authRoutes);
  app.register(locationRoutes);
  app.register(preferenceRoutes);
  app.register(weatherRoutes, { service: weatherService, sourcePreferences: sessionSourcePreferences });

  return app;
}
