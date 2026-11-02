import Fastify from 'fastify';

const app = Fastify({ logger: true });

app.get('/ping', async () => 'pong');

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await app.close();
    process.exit(0);
  });
}

try {
  await app.listen({ host: process.env.HOST ?? '0.0.0.0', port: Number(process.env.API_PORT ?? 3000) });
} catch (error) {
  app.log.fatal(error);
  process.exit(1);
}
