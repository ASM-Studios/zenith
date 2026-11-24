import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { hasReadyEmulator, parseAdbDevices } from '../src/dev/adb-devices.ts';
import { requireAndroidTools, startExpo } from './android-tools.ts';
import { capture, fail, run } from './shell.ts';

const avdName = 'zenith';
const systemImage = 'system-images;android-36;google_apis_playstore;x86_64';
const bootTimeoutMs = 180_000;

function ensureAvd(): void {
  if (capture('emulator', ['-list-avds']).split('\n').includes(avdName)) {
    return;
  }
  process.stdout.write(`Creating the "${avdName}" virtual device...\n`);
  const status = run(
    'avdmanager',
    ['create', 'avd', '--force', '--name', avdName, '--package', systemImage, '--device', 'pixel_6'],
    { input: 'no\n', stdio: ['pipe', 'inherit', 'inherit'] },
  );
  if (status !== 0) {
    fail('Could not create the virtual device. Is the system image installed?');
  }
}

function emulatorIsReady(): boolean {
  return hasReadyEmulator(parseAdbDevices(capture('adb', ['devices'])));
}

function bootCompleted(): boolean {
  return capture('adb', ['shell', 'getprop', 'sys.boot_completed']).trim() === '1';
}

async function waitForBoot(deadline: number): Promise<void> {
  if (emulatorIsReady() && bootCompleted()) {
    return;
  }
  if (Date.now() > deadline) {
    fail('The emulator did not finish booting in 3 minutes.');
  }
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await waitForBoot(deadline);
}

function launchEmulator(): void {
  if (!existsSync('/dev/kvm') && process.platform === 'linux') {
    fail('/dev/kvm is missing: enable virtualization in the BIOS and add your user to the kvm group.');
  }
  process.stdout.write('Starting the emulator...\n');
  spawn('emulator', ['-avd', avdName], { detached: true, stdio: 'ignore' }).unref();
}

requireAndroidTools();
ensureAvd();
if (!emulatorIsReady()) {
  launchEmulator();
}
await waitForBoot(Date.now() + bootTimeoutMs);
startExpo();
