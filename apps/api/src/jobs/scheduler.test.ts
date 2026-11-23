import { describe, expect, it, vi } from 'vitest';
import type { JobDefinition } from './job.ts';
import { scheduleJobs, type SchedulerQueue } from './scheduler.ts';

function job(name: string, everyMs: number): JobDefinition {
  return { name, everyMs, run: () => Promise.resolve() };
}

function fakeQueue(existing: string[]) {
  return {
    upsertJobScheduler: vi.fn<SchedulerQueue['upsertJobScheduler']>(() => Promise.resolve()),
    getJobSchedulers: vi.fn<SchedulerQueue['getJobSchedulers']>(() =>
      Promise.resolve(existing.map((key) => ({ key }))),
    ),
    removeJobScheduler: vi.fn<SchedulerQueue['removeJobScheduler']>(() => Promise.resolve(true)),
  };
}

describe('scheduleJobs', () => {
  it('upserts one scheduler per job with its interval and name', async () => {
    const queue = fakeQueue(['kp', 'heartbeat']);
    await scheduleJobs(queue, [job('heartbeat', 60_000), job('kp', 900_000)]);
    expect(queue.upsertJobScheduler).toHaveBeenCalledWith('heartbeat', { every: 60_000 }, { name: 'heartbeat' });
    expect(queue.upsertJobScheduler).toHaveBeenCalledWith('kp', { every: 900_000 }, { name: 'kp' });
    expect(queue.removeJobScheduler).not.toHaveBeenCalled();
  });

  it('removes schedulers whose job is no longer registered', async () => {
    const queue = fakeQueue(['heartbeat', 'retired', 'old']);
    await expect(scheduleJobs(queue, [job('heartbeat', 60_000)])).resolves.toEqual(['retired', 'old']);
    expect(queue.removeJobScheduler).toHaveBeenCalledTimes(2);
    expect(queue.removeJobScheduler).toHaveBeenCalledWith('retired');
    expect(queue.removeJobScheduler).toHaveBeenCalledWith('old');
  });

  it('removes every scheduler when no job is registered', async () => {
    const queue = fakeQueue(['heartbeat']);
    await expect(scheduleJobs(queue, [])).resolves.toEqual(['heartbeat']);
    expect(queue.upsertJobScheduler).not.toHaveBeenCalled();
  });
});
