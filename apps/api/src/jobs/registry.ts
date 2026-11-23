import { heartbeat } from './heartbeat.ts';
import type { JobDefinition } from './job.ts';

export const jobs: readonly JobDefinition[] = [heartbeat];
