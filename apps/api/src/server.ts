import { config } from './lib/config.ts';
import { client } from './db/index.ts';
import { buildApp } from './app.ts';
import { createCache } from './lib/cache.ts';
import { createLogger } from './lib/logger.ts';
import { createRedis } from './lib/redis.ts';
import { createMetNorwayProvider } from './modules/weather/providers/met-norway/provider.ts';
import { createOpenMeteoProvider } from './modules/weather/providers/open-meteo/provider.ts';

const logger = createLogger({ level: config.server.logLevel });
const redis = createRedis(config.redis.url, logger);

const app = buildApp({
  logger,
  cache: createCache(redis, { logger: logger.child({ module: 'cache' }) }),
  weatherProviders: [createOpenMeteoProvider(), createMetNorwayProvider({ contact: config.weather.metNorwayContact })],
});

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
