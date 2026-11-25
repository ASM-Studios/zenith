import { describe, expect, it } from 'vitest';
import { chooseSimulator, parseSimulators } from './simulators.ts';

const listing = (devices: Record<string, unknown>): string => JSON.stringify({ devices });

describe('parseSimulators', () => {
  it('reads the iPhones of each iOS runtime with their version and state', () => {
    const json = listing({
      'com.apple.CoreSimulator.SimRuntime.iOS-18-2': [
        { udid: 'A1', name: 'iPhone 16', state: 'Booted', isAvailable: true },
        { udid: 'A2', name: 'iPhone 16 Pro', state: 'Shutdown', isAvailable: true },
      ],
      'com.apple.CoreSimulator.SimRuntime.iOS-17-5': [{ udid: 'B1', name: 'iPhone 15', state: 'Shutdown' }],
    });
    expect(parseSimulators(json)).toEqual([
      { udid: 'A1', name: 'iPhone 16', booted: true, iosVersion: [18, 2] },
      { udid: 'A2', name: 'iPhone 16 Pro', booted: false, iosVersion: [18, 2] },
      { udid: 'B1', name: 'iPhone 15', booted: false, iosVersion: [17, 5] },
    ]);
  });

  it('ignores watchOS, tvOS and visionOS runtimes', () => {
    const json = listing({
      'com.apple.CoreSimulator.SimRuntime.watchOS-11-2': [{ udid: 'W1', name: 'iPhone Watch', state: 'Shutdown' }],
      'com.apple.CoreSimulator.SimRuntime.tvOS-18-2': [{ udid: 'T1', name: 'iPhone TV', state: 'Shutdown' }],
      'com.apple.CoreSimulator.SimRuntime.xrOS-2-0': [{ udid: 'X1', name: 'iPhone Vision', state: 'Shutdown' }],
    });
    expect(parseSimulators(json)).toEqual([]);
  });

  it('ignores iPads and unavailable devices', () => {
    const json = listing({
      'com.apple.CoreSimulator.SimRuntime.iOS-18-2': [
        { udid: 'P1', name: 'iPad Air', state: 'Shutdown', isAvailable: true },
        { udid: 'U1', name: 'iPhone 14', state: 'Shutdown', isAvailable: false },
        { udid: 'O1', name: 'iPhone 16', state: 'Shutdown', isAvailable: true },
      ],
    });
    expect(parseSimulators(json)).toEqual([{ udid: 'O1', name: 'iPhone 16', booted: false, iosVersion: [18, 2] }]);
  });

  it('returns nothing for output that is not simctl JSON', () => {
    expect(parseSimulators('not json')).toEqual([]);
    expect(parseSimulators('{}')).toEqual([]);
    expect(parseSimulators('{"devices":[]}')).toEqual([]);
    expect(parseSimulators('{"devices":{"com.apple.CoreSimulator.SimRuntime.iOS-18-2":"nope"}}')).toEqual([]);
  });
});

describe('chooseSimulator', () => {
  it('reuses a booted iPhone before any other', () => {
    const choice = chooseSimulator([
      { udid: 'NEW', name: 'iPhone 16', booted: false, iosVersion: [18, 2] },
      { udid: 'OLD', name: 'iPhone 15', booted: true, iosVersion: [17, 5] },
    ]);
    expect(choice).toEqual({
      ok: true,
      simulator: { udid: 'OLD', name: 'iPhone 15', booted: true, iosVersion: [17, 5] },
    });
  });

  it('picks an iPhone of the newest iOS runtime when none is booted', () => {
    const choice = chooseSimulator([
      { udid: 'A', name: 'iPhone 15', booted: false, iosVersion: [18] },
      { udid: 'B', name: 'iPhone 16', booted: false, iosVersion: [18, 2] },
      { udid: 'C', name: 'iPhone 14', booted: false, iosVersion: [17, 5] },
      { udid: 'D', name: 'iPhone 15 Pro', booted: false, iosVersion: [18] },
    ]);
    expect(choice).toMatchObject({ ok: true, simulator: { udid: 'B' } });
  });

  it('compares versions of different length and keeps the first on a tie', () => {
    const choice = chooseSimulator([
      { udid: 'X', name: 'iPhone 15', booted: false, iosVersion: [17, 5] },
      { udid: 'Y', name: 'iPhone 16', booted: false, iosVersion: [18, 0] },
      { udid: 'Z', name: 'iPhone 16e', booted: false, iosVersion: [18, 0] },
    ]);
    expect(choice).toMatchObject({ ok: true, simulator: { udid: 'Y' } });
  });

  it('tells how to download the iOS platform when no iPhone exists', () => {
    expect(chooseSimulator([])).toEqual({
      ok: false,
      message: 'No iPhone simulator found. Download the iOS platform with: xcodebuild -downloadPlatform iOS',
    });
  });
});
