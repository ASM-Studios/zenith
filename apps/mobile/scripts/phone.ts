import { choosePhone, parseAdbDevices } from '../src/dev/adb-devices.ts';
import { requireAndroidTools, startExpo } from './android-tools.ts';
import { capture, fail, run } from './shell.ts';

const metroPort = '8081';
const apiPort = '3000';

requireAndroidTools();
run('adb', ['start-server'], { stdio: 'ignore' });
const choice = choosePhone(parseAdbDevices(capture('adb', ['devices'])));
if (!choice.ok) {
  fail(choice.message);
}
for (const port of [metroPort, apiPort]) {
  if (run('adb', ['-s', choice.serial, 'reverse', `tcp:${port}`, `tcp:${port}`]) !== 0) {
    fail(`adb reverse failed for port ${port}.`);
  }
}
startExpo({
  ANDROID_SERIAL: choice.serial,
  EXPO_PUBLIC_API_URL: `http://localhost:${apiPort}`,
});
