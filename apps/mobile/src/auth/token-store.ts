export type SecureStorage = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

export const sessionTokenKey = 'zenith.sessionToken';

export function createTokenStore(storage: SecureStorage) {
  return {
    get: async (): Promise<string | null> => {
      try {
        const token = await storage.getItemAsync(sessionTokenKey);
        return token === null || token === '' ? null : token;
      } catch {
        return null;
      }
    },
    save: (token: string) => storage.setItemAsync(sessionTokenKey, token),
    clear: async (): Promise<void> => {
      try {
        await storage.deleteItemAsync(sessionTokenKey);
      } catch {
        return;
      }
    },
  };
}

export type TokenStore = ReturnType<typeof createTokenStore>;
