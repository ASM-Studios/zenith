import {
  AirQualitySchema,
  CurrentConditionsSchema,
  DailyForecastSchema,
  HourlyForecastSchema,
  offersDataType,
  PollenSchema,
} from '@zenith/core';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../test/msw-server.js';
import { createOpenMeteoProvider } from '../src/modules/weather/providers/open-meteo/index.ts';
import {
  airQualityEurope,
  airQualityEuropeHandler,
  airQualityOutsideEuropeHandler,
  current,
  forecastHandler,
  hourly,
  openMeteoAirQualityUrl,
  openMeteoForecastUrl,
} from './mocks/open-meteo.handlers.ts';

const paris = { latitude: 48.85, longitude: 2.35 };
const provider = createOpenMeteoProvider({ forecastUrl: openMeteoForecastUrl, airQualityUrl: openMeteoAirQualityUrl });

function useAirQuality(overrides: object) {
  server.use(
    http.get(openMeteoAirQualityUrl, () =>
      HttpResponse.json({ current: { ...airQualityEurope.current, ...overrides } }),
    ),
  );
}

describe('open-meteo provider mapping', () => {
  it('maps the current conditions to the core type with converted instant and day flag', async () => {
    server.use(forecastHandler);

    const result = await provider.getCurrent?.({ location: paris });

    expect(CurrentConditionsSchema.parse(result)).toEqual({
      time: '2026-11-24T15:00:00Z',
      condition: 'cloudy',
      temperatureCelsius: 7.3,
      apparentTemperatureCelsius: 4,
      relativeHumidityPercent: 79,
      dewPointCelsius: 3.9,
      pressureHpa: 1015.4,
      windSpeedKmh: 12.6,
      windGustKmh: 24.8,
      windDirectionDegrees: 110,
      precipitationMm: 0,
      cloudCoverPercent: 100,
      visibilityMeters: 30300,
      uvIndex: 0.4,
      isDay: true,
    });
  });

  it('maps 48 hourly entries with cloud cover per layer', async () => {
    server.use(forecastHandler);

    const result = await provider.getHourly?.({ location: paris });

    expect(result).toHaveLength(48);
    expect(result?.map((hour) => HourlyForecastSchema.parse(hour))).toHaveLength(48);
    const columns = hourly.hourly;
    expect(result?.[47]).toEqual({
      time: new Date(columns.time[47] * 1000).toISOString().replace('.000Z', 'Z'),
      condition: 'mostly-clear',
      temperatureCelsius: columns.temperature_2m[47],
      apparentTemperatureCelsius: columns.apparent_temperature[47],
      relativeHumidityPercent: columns.relative_humidity_2m[47],
      dewPointCelsius: columns.dew_point_2m[47],
      pressureHpa: columns.pressure_msl[47],
      windSpeedKmh: columns.wind_speed_10m[47],
      windGustKmh: columns.wind_gusts_10m[47],
      windDirectionDegrees: columns.wind_direction_10m[47],
      precipitationMm: columns.precipitation[47],
      cloudCoverPercent: columns.cloud_cover[47],
      visibilityMeters: columns.visibility[47],
      uvIndex: columns.uv_index[47],
      precipitationProbabilityPercent: columns.precipitation_probability[47],
      cloudCoverLowPercent: columns.cloud_cover_low[47],
      cloudCoverMidPercent: columns.cloud_cover_mid[47],
      cloudCoverHighPercent: columns.cloud_cover_high[47],
    });
  });

  it('maps 7 daily entries dated on the local calendar day', async () => {
    server.use(forecastHandler);

    const result = await provider.getDaily?.({ location: paris });

    expect(result).toHaveLength(7);
    expect(result?.map((day) => DailyForecastSchema.parse(day))).toHaveLength(7);
    expect(result?.[0]).toEqual({
      date: '2026-11-24',
      condition: 'cloudy',
      temperatureMinCelsius: 2.3,
      temperatureMaxCelsius: 7.6,
      precipitationSumMm: 0,
      precipitationProbabilityMaxPercent: 0,
      windSpeedMaxKmh: 13.5,
      windGustMaxKmh: 27.4,
      uvIndexMax: 1.5,
    });
    expect(result?.[1]).toMatchObject({ condition: 'rain-showers', precipitationSumMm: 5.95 });
  });

  it('sends the coordinates, unix time format and the 48 hour and 7 day horizons', async () => {
    const urls: URL[] = [];
    server.use(
      http.get(openMeteoForecastUrl, ({ request }) => {
        urls.push(new URL(request.url));
        return HttpResponse.json(request.url.includes('hourly') ? { hourly: { time: [] } } : {});
      }),
    );

    await provider.getHourly?.({ location: paris }).catch(() => undefined);
    await provider.getDaily?.({ location: paris }).catch(() => undefined);

    expect(urls[0]?.searchParams.get('forecast_hours')).toBe('48');
    expect(urls[1]?.searchParams.get('forecast_days')).toBe('7');
    expect(urls[0]?.searchParams.get('latitude')).toBe('48.85');
    expect(urls[0]?.searchParams.get('longitude')).toBe('2.35');
    expect(urls[0]?.searchParams.get('timeformat')).toBe('unixtime');
  });

  it('keeps a value the source reports as null or omits as null', async () => {
    server.use(
      http.get(openMeteoForecastUrl, () =>
        HttpResponse.json({ current: { ...current.current, visibility: null, uv_index: undefined, is_day: null } }),
      ),
    );

    const result = await provider.getCurrent?.({ location: paris });

    expect(CurrentConditionsSchema.parse(result)).toMatchObject({ visibilityMeters: null, uvIndex: null, isDay: null });
  });

  it('maps air quality with the european index and pollutant concentrations', async () => {
    server.use(airQualityEuropeHandler);

    const result = await provider.getAirQuality?.({ location: paris });

    expect(AirQualitySchema.parse(result)).toMatchObject({
      index: { scale: 'european', value: 44 },
      concentrationsMicrogramsPerCubicMeter: { pm25: 10.7, ozone: 28, carbonMonoxide: 283 },
    });
  });

  it('falls back on the us index, then on no index', async () => {
    useAirQuality({ european_aqi: null });
    const us = await provider.getAirQuality?.({ location: paris });
    useAirQuality({ european_aqi: null, us_aqi: null });
    const none = await provider.getAirQuality?.({ location: paris });

    expect(us?.index).toEqual({ scale: 'us', value: 64 });
    expect(none?.index).toBeNull();
  });

  it('maps pollen grains per species in Europe', async () => {
    useAirQuality({ birch_pollen: 42.5 });

    const result = await provider.getPollen?.({ location: paris });

    expect(PollenSchema.parse(result).grainsPerCubicMeter).toEqual({
      alder: 0,
      birch: 42.5,
      grass: 0,
      mugwort: 0,
      olive: 0,
      ragweed: 0,
    });
  });

  it('returns null for every species outside the pollen coverage', async () => {
    server.use(airQualityOutsideEuropeHandler);

    const result = await provider.getPollen?.({ location: { latitude: 40.71, longitude: -74.01 } });

    expect(Object.values(PollenSchema.parse(result).grainsPerCubicMeter)).toEqual([null, null, null, null, null, null]);
  });

  it('offers every data type but alerts anywhere', () => {
    const location = { latitude: -33.87, longitude: 151.21 };

    expect(offersDataType(provider, 'daily', location)).toBe(true);
    expect(offersDataType(provider, 'pollen', location)).toBe(true);
    expect(offersDataType(provider, 'alerts', location)).toBe(false);
    expect(provider.getAlerts).toBeUndefined();
  });

  it('declares the Open-Meteo attribution under CC BY 4.0', () => {
    expect(provider).toMatchObject({ id: 'open-meteo', attribution: { name: 'Open-Meteo', licence: 'CC BY 4.0' } });
  });
});
