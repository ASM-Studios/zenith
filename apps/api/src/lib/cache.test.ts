import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createCache, type CacheStore } from './cache.ts';

const now = new Date('2026-11-23T12:00:00.000Z');
const kpSchema = z.object({ kp: z.number() });

function fakeLogger() {
  return { warn: vi.fn<(obj: object, msg: string) => void>() };
}

function memoryStore() {
  const data = new Map<string, string>();
  const store = {
    get: vi.fn<CacheStore['get']>((key) => Promise.resolve(data.get(key) ?? null)),
    set: vi.fn<CacheStore['set']>((key, value) => {
      data.set(key, value);
      return Promise.resolve('OK');
    }),
  };
  return { data, store };
}

function failingStore(): CacheStore {
  return {
    get: () => Promise.reject(new Error('connection refused')),
    set: () => Promise.reject(new Error('connection refused')),
  };
}

function setup(store?: CacheStore) {
  const memory = memoryStore();
  const logger = fakeLogger();
  const cache = createCache(store ?? memory.store, { logger, now: () => now });
  return { cache, logger, ...memory };
}

describe('createCache', () => {
  it('returns the stored value with its updatedAt', async () => {
    const { cache } = setup();
    await expect(cache.set('kp', { kp: 4.33 }, 600)).resolves.toEqual({ value: { kp: 4.33 }, updatedAt: now });
    await expect(cache.get('kp', kpSchema)).resolves.toEqual({ value: { kp: 4.33 }, updatedAt: now });
  });

  it('returns null on a miss', async () => {
    const { cache, logger } = setup();
    await expect(cache.get('missing', kpSchema)).resolves.toBeNull();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('writes a prefixed key with the TTL in seconds', async () => {
    const { cache, store } = setup();
    await cache.set('weather:48.9:2.4', [1, 2], 300);
    expect(store.set).toHaveBeenCalledWith(
      'zenith:weather:48.9:2.4',
      JSON.stringify({ value: [1, 2], updatedAt: now.toISOString() }),
      'EX',
      300,
    );
  });

  it('honours a custom prefix', async () => {
    const { data, store } = memoryStore();
    const cache = createCache(store, { logger: fakeLogger(), prefix: 'test:' });
    await cache.set('a', 1, 10);
    expect([...data.keys()]).toEqual(['test:a']);
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects ttlSeconds=%s', async (ttl) => {
    const { cache, store } = setup();
    await expect(cache.set('a', 1, ttl)).rejects.toThrow(RangeError);
    expect(store.set).not.toHaveBeenCalled();
  });

  it('treats a read failure as a miss', async () => {
    const { cache, logger } = setup(failingStore());
    await expect(cache.get('kp', kpSchema)).resolves.toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ key: 'kp' }), 'cache read failed');
  });

  it('still returns the entry when the write fails', async () => {
    const { cache, logger } = setup(failingStore());
    await expect(cache.set('kp', 3, 60)).resolves.toEqual({ value: 3, updatedAt: now });
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ key: 'kp' }), 'cache write failed');
  });

  it('ignores entries that are not JSON', async () => {
    const { cache, data, logger } = setup();
    data.set('zenith:kp', 'not json');
    await expect(cache.get('kp', kpSchema)).resolves.toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.anything(), 'cache entry is not valid JSON');
  });

  it.each([
    ['a primitive', '42'],
    ['null', 'null'],
    ['missing updatedAt', JSON.stringify({ value: { kp: 1 } })],
    ['non-string updatedAt', JSON.stringify({ value: { kp: 1 }, updatedAt: 123 })],
    ['invalid updatedAt', JSON.stringify({ value: { kp: 1 }, updatedAt: 'yesterday' })],
    ['a value that no longer matches the schema', JSON.stringify({ value: { kp: '1' }, updatedAt: now.toISOString() })],
  ])('ignores entries with %s', async (_label, raw) => {
    const { cache, data, logger } = setup();
    data.set('zenith:kp', raw);
    await expect(cache.get('kp', kpSchema)).resolves.toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.anything(), 'cache entry does not match its schema');
  });

  it('uses the current time by default', async () => {
    vi.useFakeTimers({ now });
    try {
      const cache = createCache(memoryStore().store, { logger: fakeLogger() });
      await expect(cache.set('a', 1, 10)).resolves.toEqual({ value: 1, updatedAt: now });
    } finally {
      vi.useRealTimers();
    }
  });
});
