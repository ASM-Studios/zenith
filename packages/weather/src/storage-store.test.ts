import { describe, expect, it } from 'vitest';
import { createStorageStore, type KeyValueStorage } from './storage-store.ts';
import { testClock } from './testing/index.ts';

function memoryStorage(): KeyValueStorage & { items: Map<string, string> } {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key) => Promise.resolve(items.get(key) ?? null),
    setItem: (key, value) => {
      items.set(key, value);
      return Promise.resolve();
    },
  };
}

describe('storage store', () => {
  it('returns what was stored before it expires', async () => {
    const clock = testClock();
    const store = createStorageStore(memoryStorage(), clock.now);
    await store.set('k', 'v', 'EX', 60);
    clock.advanceSeconds(59);

    expect(await store.get('k')).toBe('v');
  });

  it('returns nothing once the entry expired', async () => {
    const clock = testClock();
    const store = createStorageStore(memoryStorage(), clock.now);
    await store.set('k', 'v', 'EX', 60);
    clock.advanceSeconds(60);

    expect(await store.get('k')).toBeNull();
  });

  it('returns nothing for a key never stored', async () => {
    expect(await createStorageStore(memoryStorage()).get('missing')).toBeNull();
  });

  it.each(['not json', '{"value":1}', '"text"', 'null'])('ignores the corrupted entry %s', async (raw) => {
    const storage = memoryStorage();
    storage.items.set('k', raw);

    expect(await createStorageStore(storage).get('k')).toBeNull();
  });

  it('reads from a synchronous storage', async () => {
    const items = new Map<string, string>();
    const store = createStorageStore({
      getItem: (key) => items.get(key) ?? null,
      setItem: (key, value) => void items.set(key, value),
    });
    await store.set('k', 'v', 'EX', 60);

    expect(await store.get('k')).toBe('v');
  });
});
