import { describe, expect, it } from 'vitest';
import { server } from '../../../test/msw-server.js';
import {
  exampleProviderUrl,
  forecastOkHandler,
  forecastRateLimitedHandler,
} from './mocks/example-provider.handlers.js';

describe('http mocking', () => {
  it('serves the fixture for a mocked provider call', async () => {
    server.use(forecastOkHandler);

    const response = await fetch(exampleProviderUrl);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ hourly: { cloud_cover: [10, 85] } });
  });

  it('serves a rate limit fixture with its status', async () => {
    server.use(forecastRateLimitedHandler);

    const response = await fetch(exampleProviderUrl);

    expect(response.status).toBe(429);
  });

  it('fails a request that no handler mocks', async () => {
    await expect(fetch('https://unmocked.test/anything')).rejects.toThrow('fetch failed');
  });

  it('rejects a call again once handlers are reset', async () => {
    server.use(forecastOkHandler);
    server.resetHandlers();

    await expect(fetch(exampleProviderUrl)).rejects.toThrow('fetch failed');
  });
});
