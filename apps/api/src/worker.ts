import { Queue, Worker } from 'bullmq';
import { createProcessor } from './jobs/processor.ts';
import { QUEUE_NAME, queueOptions, workerOptions } from './jobs/queue.ts';
import { jobs } from './jobs/registry.ts';
import { scheduleJobs } from './jobs/scheduler.ts';
import { createCache } from '@zenith/weather';
import { loadWorkerConfig } from './lib/env.ts';
import { createLogger } from './lib/logger.ts';
import { createRedis } from './lib/redis.ts';

const config = loadWorkerConfig(process.env);
const logger = createLogger({ level: config.server.logLevel });
const log = logger.child({ module: 'worker' });
const redis = createRedis(config.redis.url, logger);
const cache = createCache(redis, { logger: logger.child({ module: 'cache' }) });

const queue = new Queue(QUEUE_NAME, queueOptions(config.redis.url));
const worker = new Worker(QUEUE_NAME, createProcessor(jobs, { logger: log, cache }), workerOptions(config.redis.url));

worker.on('completed', (job) => log.debug({ job: job.name, id: job.id }, 'job completed'));
worker.on('failed', (job, err) => log.error({ err, job: job?.name, id: job?.id }, 'job failed'));
worker.on('error', (err) => log.error({ err }, 'worker error'));

async function shutdown(): Promise<void> {
  await worker.close();
  await Promise.allSettled([queue.close(), redis.quit()]);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown().then(() => process.exit(0));
  });
}

try {
  const removed = await scheduleJobs(queue, jobs);
  log.info({ jobs: jobs.map((job) => job.name), removed }, 'job schedulers registered');
} catch (error) {
  log.fatal({ err: error }, 'cannot register job schedulers');
  await shutdown();
  process.exit(1);
}
