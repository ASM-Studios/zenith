export const metNorwayForecastUrl = 'https://api.met.no/weatherapi/locationforecast/2.0/complete';

const START = Date.parse('2026-11-24T12:00:00Z');
const HOUR = 3_600_000;
const HOURLY_ENTRIES = 60;
const TOTAL_HOURS = 9 * 24;

function entryAt(hours: number, symbol: string) {
  const time = new Date(START + hours * HOUR);
  const hourOfDay = time.getUTCHours();
  const isBlockStart = hourOfDay % 6 === 0;
  return {
    time: time.toISOString().replace('.000Z', 'Z'),
    data: {
      instant: {
        details: {
          air_temperature: 5 + hours / 10,
          relative_humidity: 80,
          dew_point_temperature: 2,
          air_pressure_at_sea_level: 1015.1,
          wind_speed: 5,
          wind_speed_of_gust: 8.1,
          wind_from_direction: 108,
          cloud_area_fraction: 95,
          cloud_area_fraction_low: 90,
          cloud_area_fraction_medium: 50,
          cloud_area_fraction_high: 10,
          ultraviolet_index_clear_sky: hourOfDay === 12 ? 1.5 : 0,
        },
      },
      ...(hours < HOURLY_ENTRIES
        ? {
            next_1_hours: {
              summary: { symbol_code: symbol },
              details: { precipitation_amount: 0.2, probability_of_precipitation: 30 },
            },
          }
        : {}),
      ...(isBlockStart
        ? {
            next_6_hours: {
              summary: { symbol_code: hourOfDay === 12 ? 'rain' : 'cloudy' },
              details: {
                air_temperature_max: 8 + hours / 10,
                air_temperature_min: 2 + hours / 10,
                precipitation_amount: 1.1,
                probability_of_precipitation: hourOfDay === 12 ? 70 : 20,
              },
            },
          }
        : {}),
    },
  };
}

export function metNorwayForecast(firstSymbol = 'cloudy_night') {
  const steps = Array.from({ length: TOTAL_HOURS }, (_, hours) => hours).filter(
    (hours) => hours < HOURLY_ENTRIES || hours % 6 === 0,
  );
  return {
    type: 'Feature',
    properties: { timeseries: steps.map((hours) => entryAt(hours, hours === 0 ? firstSymbol : 'partlycloudy_day')) },
  };
}
