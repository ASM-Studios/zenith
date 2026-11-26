type Outcome = { latitude: number; longitude: number } | { code: 1 | 2 | 3 };

const toJSON = () => ({});

function positionAt(latitude: number, longitude: number): GeolocationPosition {
  const coords: GeolocationCoordinates = {
    latitude,
    longitude,
    accuracy: 0,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    toJSON,
  };
  return { coords, timestamp: 0, toJSON };
}

function failureWith(code: 1 | 2 | 3): GeolocationPositionError {
  return { code, message: '', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };
}

export function stubGeolocation(outcome: Outcome) {
  const getCurrentPosition: Geolocation['getCurrentPosition'] = (success, failure) => {
    if ('code' in outcome) {
      failure?.(failureWith(outcome.code));
    } else {
      success(positionAt(outcome.latitude, outcome.longitude));
    }
  };
  Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });
}

export function clearGeolocation() {
  Reflect.deleteProperty(navigator, 'geolocation');
}
