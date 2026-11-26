import { describe, expect, test } from 'vitest';
import { memoryStorage } from './memory-storage.fake.ts';
import { createTokenStore, sessionTokenKey, type SecureStorage } from './token-store.ts';

const locked = async (): Promise<never> => {
  throw new Error('keystore locked');
};

const failingStorage: SecureStorage = { getItemAsync: locked, setItemAsync: locked, deleteItemAsync: locked };

describe('createTokenStore', () => {
  test('a saved token is returned by get under the session token key', async () => {
    const storage = memoryStorage();
    const store = createTokenStore(storage);

    await store.save('abc');

    expect(storage.entries.get(sessionTokenKey)).toBe('abc');
    await expect(store.get()).resolves.toBe('abc');
  });

  test('get returns null when nothing is stored or the stored token is empty', async () => {
    await expect(createTokenStore(memoryStorage()).get()).resolves.toBeNull();
    await expect(createTokenStore(memoryStorage({ [sessionTokenKey]: '' })).get()).resolves.toBeNull();
  });

  test('clear removes the stored token', async () => {
    const store = createTokenStore(memoryStorage({ [sessionTokenKey]: 'abc' }));

    await store.clear();

    await expect(store.get()).resolves.toBeNull();
  });

  test('get and clear do not throw when the secure storage fails', async () => {
    const store = createTokenStore(failingStorage);

    await expect(store.get()).resolves.toBeNull();
    await expect(store.clear()).resolves.toBeUndefined();
  });

  test('save rejects when the secure storage fails so a sign-in is not reported as done', async () => {
    await expect(createTokenStore(failingStorage).save('abc')).rejects.toThrow('keystore locked');
  });
});
