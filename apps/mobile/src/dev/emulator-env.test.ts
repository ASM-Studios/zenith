import { describe, expect, it } from 'vitest';
import { withEmulatorLibraries } from './emulator-env.ts';

describe('withEmulatorLibraries', () => {
  it('puts the emulator libraries before the inherited ones so their libc++ wins', () => {
    const env = withEmulatorLibraries({ ANDROID_HOME: '/sdk', LD_LIBRARY_PATH: '/other/lib' });
    expect(env['LD_LIBRARY_PATH']).toBe('/sdk/emulator/lib64:/other/lib');
  });

  it('sets only the emulator libraries when nothing is inherited', () => {
    expect(withEmulatorLibraries({ ANDROID_HOME: '/sdk' })['LD_LIBRARY_PATH']).toBe('/sdk/emulator/lib64');
  });

  it('leaves the environment alone without an SDK home', () => {
    const env = { LD_LIBRARY_PATH: '/other/lib' };
    expect(withEmulatorLibraries(env)).toEqual(env);
  });
});
