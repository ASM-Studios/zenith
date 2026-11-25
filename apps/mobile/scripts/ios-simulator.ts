import { chooseSimulator, parseSimulators } from '../src/dev/simulators.ts';
import { iosHostProblem, xcodeProblem } from '../src/dev/xcode-check.ts';
import { startExpo } from './expo.ts';
import { capture, fail, run } from './shell.ts';

function check(problem: string | undefined): void {
  if (problem !== undefined) {
    fail(problem);
  }
}

check(iosHostProblem(process.platform));
const developerDir = capture('xcode-select', ['-p']).trim();
const simulatorList = developerDir === '' ? '' : capture('xcrun', ['simctl', 'list', 'devices', 'available', '--json']);
check(xcodeProblem(developerDir, simulatorList !== ''));

const choice = chooseSimulator(parseSimulators(simulatorList));
if (!choice.ok) {
  fail(choice.message);
}
const { simulator } = choice;
process.stdout.write(`Waiting for the ${simulator.name} simulator to boot...\n`);
if (run('xcrun', ['simctl', 'bootstatus', simulator.udid, '-b'], { stdio: 'ignore' }) !== 0) {
  fail(`Could not boot the ${simulator.name} simulator.`);
}
run('open', ['-a', 'Simulator']);
startExpo('ios', {}, ['--localhost']);
