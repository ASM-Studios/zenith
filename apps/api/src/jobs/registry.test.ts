import { describe, expect, it } from 'vitest';
import { jobs } from './registry.ts';

describe('job registry', () => {
  it('gives every job a unique name and a positive interval', () => {
    const names = jobs.map((job) => job.name);
    expect(new Set(names).size).toBe(names.length);
    for (const job of jobs) {
      expect(job.everyMs).toBeGreaterThan(0);
    }
  });

  it('registers the heartbeat job', () => {
    expect(jobs.map((job) => job.name)).toContain('heartbeat');
  });
});
