import { z } from 'zod';
import type { Cache } from './cache.ts';

export const DEFAULT_BLOCK_SECONDS = 60;
export const DEFAULT_DAILY_CALL_WARNING = 8_000;

const USAGE_RETENTION_SECONDS = 2 * 24 * 60 * 60;
const blockSchema = z.object({ until: z.iso.datetime() });
const usageSchema = z.number().int().nonnegative();

const blockKey = (providerId: string) => `quota:block:${providerId}`;

export interface QuotaGuard {
  blockedFor(providerId: string): Promise<number | null>;
  block(providerId: string, seconds: number | null): Promise<void>;
  recordCall(providerId: string): Promise<void>;
}

export interface QuotaOptions {
  logger: { warn(obj: object, msg: string): void };
  now: () => Date;
  dailyCallWarning?: number;
}

export function createQuotaGuard(cache: Cache, options: QuotaOptions): QuotaGuard {
  const { logger, now, dailyCallWarning = DEFAULT_DAILY_CALL_WARNING } = options;
  const usageKey = (providerId: string) => `quota:usage:${providerId}:${now().toISOString().slice(0, 10)}`;

  return {
    async blockedFor(providerId) {
      const entry = await cache.get(blockKey(providerId), blockSchema);
      if (!entry) {
        return null;
      }
      const remaining = Math.ceil((Date.parse(entry.value.until) - now().getTime()) / 1000);
      return remaining > 0 ? remaining : null;
    },

    async block(providerId, seconds) {
      const duration = Math.max(1, Math.ceil(seconds ?? DEFAULT_BLOCK_SECONDS));
      const until = new Date(now().getTime() + duration * 1000).toISOString();
      await cache.set(blockKey(providerId), { until }, duration);
    },

    async recordCall(providerId) {
      const key = usageKey(providerId);
      const calls = ((await cache.get(key, usageSchema))?.value ?? 0) + 1;
      await cache.set(key, calls, USAGE_RETENTION_SECONDS);
      if (calls === dailyCallWarning) {
        logger.warn({ providerId, calls }, 'weather provider reached its daily call warning threshold');
      }
    },
  };
}
