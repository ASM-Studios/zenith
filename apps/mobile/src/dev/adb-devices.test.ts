import { describe, expect, it } from 'vitest';
import { choosePhone, hasReadyEmulator, parseAdbDevices } from './adb-devices.ts';

const header = 'List of devices attached\n';

describe('parseAdbDevices', () => {
  it('reads the serial and state of each device line', () => {
    const output = `${header}emulator-5554\tdevice\nR58M123\tunauthorized\n\n`;
    expect(parseAdbDevices(output)).toEqual([
      { serial: 'emulator-5554', state: 'device' },
      { serial: 'R58M123', state: 'unauthorized' },
    ]);
  });

  it('shortens the no permissions explanation to its state', () => {
    const output = `${header}0123\tno permissions (user in plugdev group; are your udev rules wrong?); see [x]\n`;
    expect(parseAdbDevices(output)).toEqual([{ serial: '0123', state: 'no permissions' }]);
  });

  it('returns nothing when no device is attached', () => {
    expect(parseAdbDevices(header)).toEqual([]);
  });
});

describe('hasReadyEmulator', () => {
  it('is true only for an emulator that finished connecting', () => {
    expect(hasReadyEmulator([{ serial: 'emulator-5554', state: 'device' }])).toBe(true);
    expect(hasReadyEmulator([{ serial: 'emulator-5554', state: 'offline' }])).toBe(false);
    expect(hasReadyEmulator([{ serial: 'R58M123', state: 'device' }])).toBe(false);
  });
});

describe('choosePhone', () => {
  it('picks the only authorized phone and ignores emulators', () => {
    const devices = [
      { serial: 'emulator-5554', state: 'device' },
      { serial: 'R58M123', state: 'device' },
    ];
    expect(choosePhone(devices)).toEqual({ ok: true, serial: 'R58M123' });
  });

  it('asks to plug a phone when none is attached', () => {
    const choice = choosePhone([{ serial: 'emulator-5554', state: 'device' }]);
    expect(choice).toMatchObject({ ok: false, message: expect.stringContaining('No phone') });
  });

  it('asks to accept the USB debugging prompt for an unauthorized phone', () => {
    const choice = choosePhone([{ serial: 'R58M123', state: 'unauthorized' }]);
    expect(choice).toMatchObject({ ok: false, message: expect.stringContaining('Allow USB debugging') });
  });

  it('points to the udev rules when adb has no permission', () => {
    const choice = choosePhone([{ serial: 'R58M123', state: 'no permissions' }]);
    expect(choice).toMatchObject({ ok: false, message: expect.stringContaining('udev') });
  });

  it('names the state of a phone in an unknown state', () => {
    const choice = choosePhone([{ serial: 'R58M123', state: 'recovery' }]);
    expect(choice).toMatchObject({ ok: false, message: expect.stringContaining('recovery') });
  });

  it('refuses several phones because the target would be ambiguous', () => {
    const devices = [
      { serial: 'A', state: 'device' },
      { serial: 'B', state: 'device' },
    ];
    expect(choosePhone(devices)).toMatchObject({ ok: false, message: expect.stringContaining('Several') });
  });
});
