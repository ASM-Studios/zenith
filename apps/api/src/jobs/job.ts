import type { Cache } from '../lib/cache.ts';

export interface JobLogger {
  info(obj: object, msg: string): void;
}

export interface JobContext {
  logger: JobLogger;
  cache: Cache;
}

export interface JobDefinition {
  name: string;
  everyMs: number;
  run(context: JobContext): Promise<unknown>;
}
