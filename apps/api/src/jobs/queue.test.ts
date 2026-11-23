import { describe, expect, it } from 'vitest';
import { queueOptions, workerOptions } from './queue.ts';

describe('queueOptions', () => {
  it('connects to the configured Redis URL under the zenith prefix', () => {
    expect(queueOptions('redis://redis:6379/2')).toEqual({
      connection: { url: 'redis://redis:6379/2' },
      prefix: 'zenith:bull',
    });
  });
});

describe('workerOptions', () => {
  it('shares the queue connection and prefix', () => {
    expect(workerOptions('redis://redis:6379/2')).toMatchObject(queueOptions('redis://redis:6379/2'));
  });

  it('caps the finished jobs kept in Redis', () => {
    expect(workerOptions('redis://redis:6379')).toMatchObject({
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 1000 },
    });
  });
});
