import type { AirQuality, AirQualityIndex, Pollen } from '@zenith/core';
import type { AirQualityRow, PollenRow } from './air.schema.ts';

function indexOf(row: AirQualityRow): AirQualityIndex | null {
  if (row.european_aqi !== null) {
    return { scale: 'european', value: row.european_aqi };
  }
  return row.us_aqi === null ? null : { scale: 'us', value: row.us_aqi };
}

export function mapAirQuality(row: AirQualityRow): AirQuality {
  return {
    time: row.time,
    index: indexOf(row),
    concentrationsMicrogramsPerCubicMeter: {
      pm25: row.pm2_5,
      pm10: row.pm10,
      ozone: row.ozone,
      nitrogenDioxide: row.nitrogen_dioxide,
      sulphurDioxide: row.sulphur_dioxide,
      carbonMonoxide: row.carbon_monoxide,
    },
  };
}

export function mapPollen(row: PollenRow): Pollen {
  return {
    time: row.time,
    grainsPerCubicMeter: {
      alder: row.alder_pollen,
      birch: row.birch_pollen,
      grass: row.grass_pollen,
      mugwort: row.mugwort_pollen,
      olive: row.olive_pollen,
      ragweed: row.ragweed_pollen,
    },
  };
}
