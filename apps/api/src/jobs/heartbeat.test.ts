import { describe, expect, it, vi } from 'vitest';
import { createCache, type CacheStore } from '../lib/cache.ts';
import { HEARTBEAT_KEY, heartbeat } from './heartbeat.ts';

const now = new Date('2026-11-23T12:00:00.000Z');

function setup() {
  const store = {
    get: vi.fn<CacheStore['get']>(() => Promise.resolve(null)),
    set: vi.fn<CacheStore['set']>(() => Promise.resolve('OK')),
  };
  const cache = createCache(store, { logger: { warn: vi.fn<(obj: object, msg: string) => void>() }, now: () => now });
  const logger = { info: vi.fn<(obj: object, msg: string) => void>() };
  return { store, cache, logger };
}

describe('heartbeat job', () => {
  it('runs every minute', () => {
    expect(heartbeat.everyMs).toBe(60_000);
  });

  it('stores its last run in the cache for three intervals', async () => {
    const { store, cache, logger } = setup();
    await heartbeat.run({ cache, logger });
    expect(store.set).toHaveBeenCalledWith(
      `zenith:${HEARTBEAT_KEY}`,
      JSON.stringify({ value: { status: 'alive' }, updatedAt: now.toISOString() }),
      'EX',
      180,
    );
  });

  it('logs and returns the run time', async () => {
    const { cache, logger } = setup();
    await expect(heartbeat.run({ cache, logger })).resolves.toBe(now.toISOString());
    expect(logger.info).toHaveBeenCalledWith({ at: now }, 'worker heartbeat');
  });
});
