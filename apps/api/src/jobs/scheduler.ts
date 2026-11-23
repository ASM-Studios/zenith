import type { JobDefinition } from './job.ts';

export interface SchedulerQueue {
  upsertJobScheduler(id: string, repeat: { every: number }, template: { name: string }): Promise<unknown>;
  getJobSchedulers(): Promise<{ key: string }[]>;
  removeJobScheduler(id: string): Promise<boolean>;
}

export async function scheduleJobs(queue: SchedulerQueue, jobs: readonly JobDefinition[]): Promise<string[]> {
  await Promise.all(jobs.map((job) => queue.upsertJobScheduler(job.name, { every: job.everyMs }, { name: job.name })));
  const known = new Set(jobs.map((job) => job.name));
  const stale = (await queue.getJobSchedulers()).map((scheduler) => scheduler.key).filter((key) => !known.has(key));
  await Promise.all(stale.map((key) => queue.removeJobScheduler(key)));
  return stale;
}
