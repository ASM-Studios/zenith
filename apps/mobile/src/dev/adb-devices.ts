export interface AdbDevice {
  serial: string;
  state: string;
}

export type PhoneChoice = { ok: true; serial: string } | { ok: false; message: string };

const emulatorPrefix = 'emulator-';

export function parseAdbDevices(output: string): AdbDevice[] {
  return output
    .split('\n')
    .slice(1)
    .map((line) => line.split('\t'))
    .filter((cells): cells is [string, string] => cells.length === 2 && cells[0] !== '')
    .map(([serial, rest]) => ({
      serial,
      state: rest.startsWith('no permissions') ? 'no permissions' : rest.trim(),
    }));
}

export function hasReadyEmulator(devices: AdbDevice[]): boolean {
  return devices.some((d) => d.serial.startsWith(emulatorPrefix) && d.state === 'device');
}

const stateMessages: Record<string, string> = {
  unauthorized:
    'The phone is locked or has not trusted this computer. Accept the "Allow USB debugging" prompt on the phone.',
  offline: 'The phone is offline. Unplug it, plug it back and unlock it.',
  'no permissions': 'adb cannot open the USB device. Check the udev rules (see docs/mobile-setup.md).',
};

export function choosePhone(devices: AdbDevice[]): PhoneChoice {
  const phones = devices.filter((d) => !d.serial.startsWith(emulatorPrefix));
  const [first, ...others] = phones;
  if (!first) {
    return {
      ok: false,
      message: 'No phone found. Enable USB debugging, plug the phone and unlock it.',
    };
  }
  if (others.length > 0) {
    return { ok: false, message: 'Several phones are connected. Keep only one plugged in.' };
  }
  if (first.state !== 'device') {
    return {
      ok: false,
      message: stateMessages[first.state] ?? `The phone is in state "${first.state}".`,
    };
  }
  return { ok: true, serial: first.serial };
}
