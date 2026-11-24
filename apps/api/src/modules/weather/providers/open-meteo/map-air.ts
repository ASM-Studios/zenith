import type { AirQuality, AirQualityIndex, Pollen } from '@zenith/core';
import type { OpenMeteoAirQuality } from './schemas.ts';
import { toInstant } from './time.ts';

function mapIndex(raw: OpenMeteoAirQuality): AirQualityIndex | null {
  if (raw.european_aqi !== undefined && raw.european_aqi !== null) {
    return { scale: 'european', value: raw.european_aqi };
  }
  if (raw.us_aqi !== undefined && raw.us_aqi !== null) {
    return { scale: 'us', value: raw.us_aqi };
  }
  return null;
}

export function mapAirQuality(raw: OpenMeteoAirQuality): AirQuality {
  return {
    time: toInstant(raw.time),
    index: mapIndex(raw),
    concentrationsMicrogramsPerCubicMeter: {
      pm25: raw.pm2_5 ?? null,
      pm10: raw.pm10 ?? null,
      ozone: raw.ozone ?? null,
      nitrogenDioxide: raw.nitrogen_dioxide ?? null,
      sulphurDioxide: raw.sulphur_dioxide ?? null,
      carbonMonoxide: raw.carbon_monoxide ?? null,
    },
  };
}

export function mapPollen(raw: OpenMeteoAirQuality): Pollen {
  return {
    time: toInstant(raw.time),
    grainsPerCubicMeter: {
      alder: raw.alder_pollen ?? null,
      birch: raw.birch_pollen ?? null,
      grass: raw.grass_pollen ?? null,
      mugwort: raw.mugwort_pollen ?? null,
      olive: raw.olive_pollen ?? null,
      ragweed: raw.ragweed_pollen ?? null,
    },
  };
}
