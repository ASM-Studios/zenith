export interface Simulator {
  udid: string;
  name: string;
  booted: boolean;
  iosVersion: number[];
}

export type SimulatorChoice = { ok: true; simulator: Simulator } | { ok: false; message: string };

interface IphoneDevice {
  udid: string;
  name: string;
  state: string;
}

const iosRuntime = /SimRuntime\.iOS-(\d+(?:-\d+)*)$/;

const noSimulatorMessage =
  'No iPhone simulator found. Download the iOS platform with: xcodebuild -downloadPlatform iOS';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIphoneDevice(value: unknown): value is IphoneDevice {
  return (
    isRecord(value) &&
    typeof value.udid === 'string' &&
    typeof value.name === 'string' &&
    typeof value.state === 'string' &&
    value.isAvailable !== false &&
    value.name.startsWith('iPhone')
  );
}

function parseJson(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

export function parseSimulators(json: string): Simulator[] {
  const parsed = parseJson(json);
  if (!isRecord(parsed) || !isRecord(parsed.devices)) {
    return [];
  }
  return Object.entries(parsed.devices).flatMap(([runtime, list]: [string, unknown]) => {
    const version = iosRuntime.exec(runtime)?.[1];
    if (version === undefined || !Array.isArray(list)) {
      return [];
    }
    const iosVersion = version.split('-').map(Number);
    return list
      .filter(isIphoneDevice)
      .map((device) => ({ udid: device.udid, name: device.name, booted: device.state === 'Booted', iosVersion }));
  });
}

function byNewestRuntime(a: Simulator, b: Simulator): number {
  return b.iosVersion.join('.').localeCompare(a.iosVersion.join('.'), 'en', { numeric: true });
}

export function chooseSimulator(simulators: Simulator[]): SimulatorChoice {
  const simulator = simulators.find((candidate) => candidate.booted) ?? simulators.toSorted(byNewestRuntime)[0];
  return simulator ? { ok: true, simulator } : { ok: false, message: noSimulatorMessage };
}
