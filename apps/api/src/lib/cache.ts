import { z } from 'zod';

declare module 'fastify' {
  interface FastifyInstance {
    cache: Cache;
  }
}

export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: 'EX', seconds: number): Promise<unknown>;
}

export interface CacheEntry<T> {
  value: T;
  updatedAt: Date;
}

export interface Cache {
  get<T>(key: string, schema: z.ZodType<T>): Promise<CacheEntry<T> | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<CacheEntry<T>>;
}

export interface CacheOptions {
  logger: { warn(obj: object, msg: string): void };
  prefix?: string;
  now?: () => Date;
}

function envelope<T>(schema: z.ZodType<T>) {
  return z.object({ value: schema, updatedAt: z.iso.datetime().transform((iso) => new Date(iso)) });
}

export function createCache(store: CacheStore, options: CacheOptions): Cache {
  const { logger, prefix = 'zenith:', now = () => new Date() } = options;

  return {
    async get<T>(key: string, schema: z.ZodType<T>) {
      let raw: string | null;
      try {
        raw = await store.get(prefix + key);
      } catch (err) {
        logger.warn({ err, key }, 'cache read failed');
        return null;
      }
      if (raw === null) {
        return null;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        logger.warn({ err, key }, 'cache entry is not valid JSON');
        return null;
      }
      const result = envelope(schema).safeParse(parsed);
      if (!result.success) {
        logger.warn({ key, issues: result.error.issues }, 'cache entry does not match its schema');
        return null;
      }
      return result.data;
    },

    async set<T>(key: string, value: T, ttlSeconds: number) {
      if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
        throw new RangeError(`ttlSeconds must be a positive integer, got ${ttlSeconds}`);
      }
      const entry: CacheEntry<T> = { value, updatedAt: now() };
      const payload = JSON.stringify({ value, updatedAt: entry.updatedAt.toISOString() });
      try {
        await store.set(prefix + key, payload, 'EX', ttlSeconds);
      } catch (err) {
        logger.warn({ err, key }, 'cache write failed');
      }
      return entry;
    },
  };
}
