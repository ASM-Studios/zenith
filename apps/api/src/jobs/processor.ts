import type { JobContext, JobDefinition } from './job.ts';

export interface QueuedJob {
  name: string;
}

export class UnknownJobError extends Error {
  override name = 'UnknownJobError';
}

export function createProcessor(jobs: readonly JobDefinition[], context: JobContext) {
  const byName = new Map(jobs.map((job) => [job.name, job]));
  return async (job: QueuedJob): Promise<unknown> => {
    const definition = byName.get(job.name);
    if (!definition) {
      throw new UnknownJobError(`no job registered under "${job.name}"`);
    }
    return definition.run(context);
  };
}
