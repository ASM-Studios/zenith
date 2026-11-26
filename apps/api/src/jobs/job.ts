import type { Cache } from '@zenith/weather';

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
