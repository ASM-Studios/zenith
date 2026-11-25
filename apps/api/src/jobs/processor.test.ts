import { describe, expect, it, vi } from 'vitest';
import { createCache } from '@zenith/weather';
import type { JobContext, JobDefinition } from './job.ts';
import { createProcessor, UnknownJobError } from './processor.ts';

const context: JobContext = {
  logger: { info: vi.fn<(obj: object, msg: string) => void>() },
  cache: createCache(
    { get: () => Promise.resolve(null), set: () => Promise.resolve('OK') },
    { logger: { warn: () => {} } },
  ),
};

function job(name: string, run: JobDefinition['run']): JobDefinition {
  return { name, everyMs: 1000, run };
}

describe('createProcessor', () => {
  it('runs the job registered under the queued name with the shared context', async () => {
    const kp = vi.fn<JobDefinition['run']>(() => Promise.resolve('kp done'));
    const other = vi.fn<JobDefinition['run']>(() => Promise.resolve());
    const process = createProcessor([job('other', other), job('kp', kp)], context);
    await expect(process({ name: 'kp' })).resolves.toBe('kp done');
    expect(kp).toHaveBeenCalledWith(context);
    expect(other).not.toHaveBeenCalled();
  });

  it('rejects a job name that is not registered', async () => {
    const process = createProcessor([], context);
    await expect(process({ name: 'ghost' })).rejects.toThrow(UnknownJobError);
  });

  it('propagates a job failure so BullMQ marks it failed', async () => {
    const process = createProcessor([job('kp', () => Promise.reject(new Error('upstream down')))], context);
    await expect(process({ name: 'kp' })).rejects.toThrow('upstream down');
  });
});
