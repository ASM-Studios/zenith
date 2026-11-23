import Fastify from 'fastify';
import type { Logger } from 'pino';
import type { Cache } from './lib/cache.ts';
import { authRoutes } from './modules/auth/auth.routes.ts';

export function buildApp({ logger, cache }: { logger: Logger; cache: Cache }) {
  const app = Fastify({ loggerInstance: logger });

  app.decorate('cache', cache);
  app.get('/ping', async () => 'pong');
  app.register(authRoutes);

  return app;
}
