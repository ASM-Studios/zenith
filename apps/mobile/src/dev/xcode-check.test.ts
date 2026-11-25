import { describe, expect, it } from 'vitest';
import { iosHostProblem, xcodeProblem } from './xcode-check.ts';

const selectXcode = 'sudo xcode-select -s /Applications/Xcode.app/Contents/Developer';

describe('iosHostProblem', () => {
  it('accepts macOS', () => {
    expect(iosHostProblem('darwin')).toBeUndefined();
  });

  it('refuses Linux and Windows with the Android alternative', () => {
    const message = 'The iOS simulator needs macOS and Xcode. On Linux, use npm run android:emulator.';
    expect(iosHostProblem('linux')).toBe(message);
    expect(iosHostProblem('win32')).toBe(message);
  });
});

describe('xcodeProblem', () => {
  it('asks to install Xcode when no developer directory is selected', () => {
    expect(xcodeProblem('', true)).toBe(
      `Xcode was not found. Install Xcode from the App Store, then run: ${selectXcode}`,
    );
  });

  it('spots the Command Line Tools selected without Xcode', () => {
    expect(xcodeProblem('/Library/Developer/CommandLineTools', true)).toBe(
      `Only the Command Line Tools are selected. Install Xcode from the App Store, then run: ${selectXcode}`,
    );
  });

  it('asks for the first launch when simctl does not run', () => {
    expect(xcodeProblem('/Applications/Xcode.app/Contents/Developer', false)).toBe(
      'Xcode is not set up yet. Open it once or run: sudo xcodebuild -runFirstLaunch',
    );
  });

  it('passes a working Xcode', () => {
    expect(xcodeProblem('/Applications/Xcode.app/Contents/Developer', true)).toBeUndefined();
  });
});
