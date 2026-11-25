import { ProviderUnavailableError } from '@zenith/core';
import { createStubWeatherProvider } from '@zenith/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { createWeatherClient, type WeatherFetch } from '../src/client.ts';
import { WeatherSourceError } from '../src/errors.ts';
import { countCalls, paris, weatherSetup } from '../src/testing/index.ts';

const down = () => Promise.reject(new TypeError('network down'));

const attribution = {
  name: 'Remote',
  url: 'https://remote.example',
  licence: 'CC BY 4.0',
  licenceUrl: 'https://remote.example/licence',
};

const apiBody = {
  data: { remote: true },
  provider: { id: 'remote', attribution },
  updatedAt: '2026-11-24T11:00:00.000Z',
  status: 'fresh',
};

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}

function clientOn(fetch: WeatherFetch, providers = [createStubWeatherProvider()]) {
  const setup = weatherSetup();
  const client = createWeatherClient({
    apiBaseUrl: 'https://api.example',
    direct: setup.serviceWith(providers),
    fetch,
  });
  return { client, setup };
}

describe('weather client', () => {
  it('uses the global fetch when none is given', async () => {
    const globalFetch = vi.fn<typeof fetch>(() => jsonResponse(apiBody));
    vi.stubGlobal('fetch', globalFetch);
    const client = createWeatherClient({ apiBaseUrl: 'https://api.example', direct: weatherSetup().serviceWith([]) });

    const reading = await client.get('current', paris);
    vi.unstubAllGlobals();

    expect(reading.provider.id).toBe('remote');
  });

  it('answers from the api and leaves the providers alone while the api works', async () => {
    const counted = countCalls(createStubWeatherProvider());
    const { client } = clientOn(() => jsonResponse(apiBody), [counted.provider]);

    const reading = await client.get('current', paris);

    expect(reading).toMatchObject({ data: { remote: true }, provider: { id: 'remote' }, status: 'fresh' });
    expect(reading.updatedAt).toEqual(new Date('2026-11-24T11:00:00.000Z'));
    expect(counted.calls).toEqual([]);
  });

  it('asks the api route of the data type with the coordinates and the preferred provider', async () => {
    const fetch = vi.fn<WeatherFetch>(() => jsonResponse(apiBody));
    const { client } = clientOn(fetch);

    await client.get('airQuality', { latitude: 48.85, longitude: 2.35 }, ['open-meteo']);

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example/api/weather/air-quality?latitude=48.85&longitude=2.35&provider=open-meteo',
    );
  });

  it('asks the providers directly when the server is unreachable', async () => {
    const { client } = clientOn(down);

    const reading = await client.get('current', paris);

    expect(reading).toMatchObject({ provider: { id: 'stub' }, status: 'fresh' });
  });

  it('asks the providers directly when the server answers 5xx', async () => {
    const { client } = clientOn(() => jsonResponse({ error: 'source_unavailable' }, 503));

    const reading = await client.get('current', paris);

    expect(reading.provider.id).toBe('stub');
  });

  it('asks the providers directly when the server answers a body it cannot read', async () => {
    const { client } = clientOn(() => jsonResponse({ unexpected: true }));

    const reading = await client.get('current', paris);

    expect(reading.provider.id).toBe('stub');
  });

  it('serves the cached value flagged stale when the server and the provider are both down', async () => {
    const setup = weatherSetup();
    const failing = createStubWeatherProvider({ error: new ProviderUnavailableError('stub', '503') });
    const client = (providers: Parameters<typeof setup.serviceWith>[0]) =>
      createWeatherClient({ apiBaseUrl: 'https://api.example', direct: setup.serviceWith(providers), fetch: down });
    await client([createStubWeatherProvider()]).get('current', paris);
    setup.clock.advanceSeconds(24 * 3600);

    const reading = await client([failing]).get('current', paris);

    expect(reading.status).toBe('stale');
  });

  it('fails with a source error when the server and the provider are both down and nothing is cached', async () => {
    const failing = createStubWeatherProvider({ error: new ProviderUnavailableError('stub', '503') });
    const { client } = clientOn(down, [failing]);

    await expect(client.get('current', paris)).rejects.toBeInstanceOf(WeatherSourceError);
  });
});
