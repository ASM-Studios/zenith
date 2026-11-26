import { isPlace, type Place } from './place.ts';

export type LocationApi = {
  requestForegroundPermissionsAsync(): Promise<{ granted: boolean }>;
  getCurrentPositionAsync(): Promise<{ coords: { latitude: number; longitude: number } }>;
};

export type DeviceLocation = { status: 'granted'; place: Place } | { status: 'denied' } | { status: 'unavailable' };

export const devicePlaceName = 'My position';

export async function locateDevice(api: LocationApi): Promise<DeviceLocation> {
  try {
    const permission = await api.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      return { status: 'denied' };
    }
    const { coords } = await api.getCurrentPositionAsync();
    const place = { name: devicePlaceName, latitude: coords.latitude, longitude: coords.longitude };
    return isPlace(place) ? { status: 'granted', place } : { status: 'unavailable' };
  } catch {
    return { status: 'unavailable' };
  }
}
