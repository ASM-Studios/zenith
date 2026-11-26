import { afterEach, describe, expect, test } from 'vitest';
import { clearGeolocation, stubGeolocation } from '../../test/stub-geolocation.ts';
import { getDevicePosition, PositionError } from './device-position.ts';

afterEach(clearGeolocation);

describe('getDevicePosition', () => {
  test('it resolves with the coordinates of the browser', async () => {
    stubGeolocation({ latitude: 48.85, longitude: 2.35 });

    await expect(getDevicePosition()).resolves.toEqual({ latitude: 48.85, longitude: 2.35 });
  });

  test('it rejects with the denied reason when the permission is refused', async () => {
    stubGeolocation({ code: 1 });

    await expect(getDevicePosition()).rejects.toMatchObject({ reason: 'denied' });
  });

  test('it rejects with the unavailable reason when the browser cannot locate', async () => {
    stubGeolocation({ code: 2 });

    const failure = await getDevicePosition().catch((caught: unknown) => caught);
    expect(failure).toBeInstanceOf(PositionError);
    expect(failure).toMatchObject({ reason: 'unavailable' });
  });

  test('it rejects with the unsupported reason when the browser has no geolocation', async () => {
    await expect(getDevicePosition()).rejects.toMatchObject({ reason: 'unsupported' });
  });
});
