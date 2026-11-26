import { expect, test } from 'vitest';
import { devicePlaceName, locateDevice, type LocationApi } from './device-location.ts';

type Calls = { positionReads: number };

function fakeApi(overrides: Partial<LocationApi> = {}): { api: LocationApi; calls: Calls } {
  const calls: Calls = { positionReads: 0 };
  const api: LocationApi = {
    requestForegroundPermissionsAsync: async () => ({ granted: true }),
    getCurrentPositionAsync: async () => {
      calls.positionReads += 1;
      return { coords: { latitude: 48.85, longitude: 2.35 } };
    },
    ...overrides,
  };
  return { api, calls };
}

test('a granted permission gives the device position as a place', async () => {
  expect(await locateDevice(fakeApi().api)).toEqual({
    status: 'granted',
    place: { name: devicePlaceName, latitude: 48.85, longitude: 2.35 },
  });
});

test('a denied permission never reads the position', async () => {
  const { api, calls } = fakeApi({ requestForegroundPermissionsAsync: async () => ({ granted: false }) });
  expect(await locateDevice(api)).toEqual({ status: 'denied' });
  expect(calls.positionReads).toBe(0);
});

test('a position read failure reports the location as unavailable', async () => {
  const { api } = fakeApi({
    getCurrentPositionAsync: async () => {
      throw new Error('location services are off');
    },
  });
  expect(await locateDevice(api)).toEqual({ status: 'unavailable' });
});

test('a permission request failure reports the location as unavailable', async () => {
  const { api } = fakeApi({
    requestForegroundPermissionsAsync: async () => {
      throw new Error('no provider');
    },
  });
  expect(await locateDevice(api)).toEqual({ status: 'unavailable' });
});

test('coordinates out of range report the location as unavailable', async () => {
  const { api } = fakeApi({ getCurrentPositionAsync: async () => ({ coords: { latitude: 120, longitude: 2 } }) });
  expect(await locateDevice(api)).toEqual({ status: 'unavailable' });
});
