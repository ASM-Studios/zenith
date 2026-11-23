import { config } from './lib/config.ts';
import Fastify from 'fastify';
import { client } from './db/index.ts';
import { createLogger } from './lib/logger.ts';
import { createRedis } from './lib/redis.ts';
import { authRoutes } from './modules/auth/auth.routes.ts';

const logger = createLogger({ level: config.server.logLevel });
const redis = createRedis(config.redis.url, logger);

const app = Fastify({ loggerInstance: logger });

app.get('/ping', async () => 'pong');
app.register(authRoutes);

app.addHook('onClose', async () => {
  await Promise.allSettled([client.end(), redis.quit()]);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app.close().then(() => process.exit(0));
  });
}

try {
  await app.listen({ host: config.server.host, port: config.server.port });
} catch (error) {
  app.log.fatal(error);
  process.exit(1);
}
