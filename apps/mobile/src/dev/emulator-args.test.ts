import { describe, expect, it } from 'vitest';
import { emulatorArgs } from './emulator-args.ts';

describe('emulatorArgs', () => {
  it('opens a window by default', () => {
    expect(emulatorArgs('zenith', false)).toEqual(['-avd', 'zenith']);
  });

  it('runs without window, audio or GPU when headless', () => {
    const args = emulatorArgs('zenith', true);
    expect(args.slice(0, 2)).toEqual(['-avd', 'zenith']);
    expect(args).toEqual(expect.arrayContaining(['-no-window', '-no-audio', '-gpu', 'swiftshader_indirect']));
  });
});
