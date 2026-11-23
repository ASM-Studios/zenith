import { Redis } from 'ioredis';
import type { Logger } from 'pino';

export function createRedis(url: string, logger: Logger): Redis {
  const log = logger.child({ module: 'redis' });
  const redis = new Redis(url, { enableOfflineQueue: false, maxRetriesPerRequest: 1 });
  let unavailable = false;
  redis.on('ready', () => {
    unavailable = false;
    log.info('redis ready');
  });
  redis.on('error', (err: Error) => {
    if (!unavailable) {
      unavailable = true;
      log.warn({ err }, 'redis unavailable, cache disabled until it reconnects');
    }
  });
  return redis;
}
