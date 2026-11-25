import type { GeoPoint } from '@zenith/core';

const FORECAST_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/complete';
const COORDINATE_DECIMALS = 4;

function coordinate(value: number): string {
  return String(Number(value.toFixed(COORDINATE_DECIMALS)));
}

export function forecastUrl(location: GeoPoint): URL {
  const url = new URL(FORECAST_URL);
  url.search = new URLSearchParams({
    lat: coordinate(location.latitude),
    lon: coordinate(location.longitude),
  }).toString();
  return url;
}
