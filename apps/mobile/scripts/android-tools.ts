import { fileURLToPath } from 'node:url';
import { fail, hasCommand, run } from './shell.ts';

export const mobileDir = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const insideProfileFlag = 'ZENITH_ANDROID_PROFILE';

export function requireAndroidTools(): void {
  if (hasCommand('adb')) {
    return;
  }
  if (process.env[insideProfileFlag] === undefined && hasCommand('devenv')) {
    const status = run('devenv', ['--profile', 'android', 'shell', '--', 'node', ...process.argv.slice(1)], {
      cwd: repoRoot,
      env: { ...process.env, [insideProfileFlag]: '1' },
    });
    process.exit(status);
  }
  fail('adb was not found. Install the Android platform-tools (see docs/mobile-setup.md) or use devenv.');
}

export function startExpo(env: NodeJS.ProcessEnv = {}, extraArgs: string[] = []): never {
  const status = run('npx', ['expo', 'start', '--android', ...extraArgs], {
    cwd: mobileDir,
    env: { ...process.env, ...env },
  });
  process.exit(status);
}
