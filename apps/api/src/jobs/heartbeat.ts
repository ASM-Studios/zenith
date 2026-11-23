import type { JobDefinition } from './job.ts';

export const HEARTBEAT_KEY = 'worker:heartbeat';

const EVERY_MS = 60_000;
const TTL_SECONDS = (3 * EVERY_MS) / 1000;

export const heartbeat: JobDefinition = {
  name: 'heartbeat',
  everyMs: EVERY_MS,
  async run({ cache, logger }) {
    const entry = await cache.set(HEARTBEAT_KEY, { status: 'alive' }, TTL_SECONDS);
    logger.info({ at: entry.updatedAt }, 'worker heartbeat');
    return entry.updatedAt.toISOString();
  },
};
