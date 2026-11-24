import type { WeatherProvider, WeatherQuery } from '@zenith/core';
import { vi } from 'vitest';
import { createCache, type CacheStore } from '../../src/lib/cache.ts';
import { createWeatherService, type WeatherServiceOptions } from '../../src/modules/weather/weather.service.ts';

export const paris = { latitude: 48.8566, longitude: 2.3522 };

export function testClock(start = new Date('2026-11-24T12:00:00.000Z')) {
  let current = start;
  return {
    now: () => current,
    advanceSeconds(seconds: number) {
      current = new Date(current.getTime() + seconds * 1000);
    },
  };
}

export function memoryStore() {
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

export function countCalls(provider: WeatherProvider) {
  const calls: string[] = [];
  function counted<T>(name: string, method?: (query: WeatherQuery) => Promise<T>) {
    return (
      method &&
      ((query: WeatherQuery) => {
        calls.push(name);
        return method(query);
      })
    );
  }
  const wrapped: WeatherProvider = {
    ...provider,
    getCurrent: counted('getCurrent', provider.getCurrent),
    getHourly: counted('getHourly', provider.getHourly),
    getDaily: counted('getDaily', provider.getDaily),
    getAirQuality: counted('getAirQuality', provider.getAirQuality),
    getPollen: counted('getPollen', provider.getPollen),
    getAlerts: counted('getAlerts', provider.getAlerts),
  };
  return { provider: wrapped, calls };
}

export function weatherSetup() {
  const memory = memoryStore();
  const clock = testClock();
  const logger = { warn: vi.fn<(obj: object, msg: string) => void>() };
  const cache = createCache(memory.store, { logger, now: clock.now });
  const serviceWith = (providers: WeatherProvider[], options: Partial<WeatherServiceOptions> = {}) =>
    createWeatherService({ cache, providers, logger, now: clock.now, ...options });
  return { ...memory, cache, clock, logger, serviceWith };
}
