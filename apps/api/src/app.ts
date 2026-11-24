import Fastify from 'fastify';
import type { Logger } from 'pino';
import type { Cache } from './lib/cache.ts';
import { authRoutes } from './modules/auth/auth.routes.ts';
import { locationRoutes } from './modules/favorites/locations.routes.ts';
import { preferenceRoutes } from './modules/preferences/preferences.routes.ts';

export function buildApp({ logger, cache }: { logger: Logger; cache: Cache }) {
  const app = Fastify({ loggerInstance: logger });

  app.decorate('cache', cache);
  app.get('/ping', async () => 'pong');
  app.register(authRoutes);
  app.register(locationRoutes);
  app.register(preferenceRoutes);

  return app;
}
