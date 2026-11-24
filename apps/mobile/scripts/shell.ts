import { spawnSync } from 'node:child_process';
import type { SpawnSyncOptions } from 'node:child_process';

export function hasCommand(name: string): boolean {
  return spawnSync(name, ['--version'], { stdio: 'ignore' }).error === undefined;
}

export function capture(command: string, args: string[], env: NodeJS.ProcessEnv = process.env): string {
  const result = spawnSync(command, args, { encoding: 'utf8', env });
  return result.stdout ?? '';
}

export function run(command: string, args: string[], options: SpawnSyncOptions = {}): number {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  return result.status ?? 1;
}

export function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
