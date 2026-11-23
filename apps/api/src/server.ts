import { config } from './lib/config.ts';
import Fastify from 'fastify';
import { client } from './db/index.ts';
import { createLogger } from './lib/logger.ts';
import { authRoutes } from './modules/auth/auth.routes.ts';

const logger = createLogger({ level: config.server.logLevel });

const app = Fastify({ loggerInstance: logger });

app.get('/ping', async () => 'pong');
app.register(authRoutes);

app.addHook('onClose', async () => {
  await client.end();
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
