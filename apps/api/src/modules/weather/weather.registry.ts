import { offersDataType, type GeoPoint, type WeatherDataType, type WeatherProvider } from '@zenith/core';

export interface WeatherRegistry {
  select(dataType: WeatherDataType, location: GeoPoint, preferredIds: readonly string[]): WeatherProvider | null;
}

function assertUniqueIds(providers: readonly WeatherProvider[]) {
  const ids = new Set<string>();
  for (const { id } of providers) {
    if (ids.has(id)) {
      throw new Error(`weather provider "${id}" is registered twice`);
    }
    ids.add(id);
  }
}

export function createWeatherRegistry(providers: readonly WeatherProvider[]): WeatherRegistry {
  assertUniqueIds(providers);
  const byId = new Map(providers.map((provider) => [provider.id, provider]));

  return {
    select(dataType, location, preferredIds) {
      const preferred = preferredIds.flatMap((id) => byId.get(id) ?? []);
      const candidates = [...preferred, ...providers];
      return candidates.find((provider) => offersDataType(provider, dataType, location)) ?? null;
    },
  };
}
