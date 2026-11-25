import { fileURLToPath } from 'node:url';
import { run } from './shell.ts';

const mobileDir = fileURLToPath(new URL('..', import.meta.url));

export function startExpo(platform: 'android' | 'ios', env: NodeJS.ProcessEnv = {}, extraArgs: string[] = []): never {
  const status = run('npx', ['expo', 'start', `--${platform}`, ...extraArgs], {
    cwd: mobileDir,
    env: { ...process.env, ...env },
  });
  process.exit(status);
}
