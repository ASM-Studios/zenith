import { isPlace, type Place } from './place.ts';

export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export const selectedPlaceKey = 'zenith.selectedPlace';

export function createSelectedPlaceStore(storage: KeyValueStorage) {
  return {
    async load(): Promise<Place | null> {
      const text = await storage.getItem(selectedPlaceKey);
      if (text === null) {
        return null;
      }
      const value = parseJson(text);
      if (!isPlace(value)) {
        return null;
      }
      return { name: value.name, latitude: value.latitude, longitude: value.longitude };
    },
    async save(place: Place): Promise<void> {
      const { name, latitude, longitude } = place;
      await storage.setItem(selectedPlaceKey, JSON.stringify({ name, latitude, longitude }));
    },
    async clear(): Promise<void> {
      await storage.removeItem(selectedPlaceKey);
    },
  };
}

function parseJson(text: string): unknown {
  try {
    const value: unknown = JSON.parse(text);
    return value;
  } catch {
    return undefined;
  }
}
