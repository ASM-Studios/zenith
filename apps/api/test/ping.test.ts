import { afterAll, describe, expect, it } from 'vitest';
import { buildTestApp } from './helpers/build-test-app.ts';

const app = buildTestApp();

afterAll(() => app.close());

describe('GET /ping', () => {
  it('answers pong', async () => {
    const response = await app.inject({ method: 'GET', url: '/ping' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('pong');
  });
});
