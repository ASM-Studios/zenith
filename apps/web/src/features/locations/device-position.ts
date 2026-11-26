export type PositionFailure = 'unsupported' | 'denied' | 'unavailable';

export type DevicePosition = { latitude: number; longitude: number };

export class PositionError extends Error {
  override name = 'PositionError';
  readonly reason: PositionFailure;

  constructor(reason: PositionFailure) {
    super(`the position is ${reason}`);
    this.reason = reason;
  }
}

const positionTimeoutMs = 10_000;

export function getDevicePosition(): Promise<DevicePosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new PositionError('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (failure) => reject(new PositionError(failure.code === failure.PERMISSION_DENIED ? 'denied' : 'unavailable')),
      { timeout: positionTimeoutMs },
    );
  });
}
