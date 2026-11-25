import type { CacheStore } from './cache.ts';

export interface KeyValueStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
}

interface Stored {
  value: string;
  expiresAt: number;
}

function isStored(parsed: unknown): parsed is Stored {
  return (
    typeof parsed === 'object' &&
    parsed !== null &&
    'value' in parsed &&
    typeof parsed.value === 'string' &&
    'expiresAt' in parsed &&
    typeof parsed.expiresAt === 'number'
  );
}

export function createStorageStore(storage: KeyValueStorage, now: () => Date = () => new Date()): CacheStore {
  return {
    async get(key) {
      const raw = await storage.getItem(key);
      if (raw === null) {
        return null;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return null;
      }
      return isStored(parsed) && parsed.expiresAt > now().getTime() ? parsed.value : null;
    },
    async set(key, value, _mode, seconds) {
      const stored: Stored = { value, expiresAt: now().getTime() + seconds * 1000 };
      await storage.setItem(key, JSON.stringify(stored));
      return 'OK';
    },
  };
}
