import type {
  AirQuality,
  Alert,
  CurrentConditions,
  DailyForecast,
  HourlyForecast,
  Pollen,
  ProviderAttribution,
} from '../weather/index.ts';

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const STUB_START_MS = Date.UTC(2026, 0, 15, 0, 0, 0);

export const STUB_HOURLY_HOURS = 48;
export const STUB_DAILY_DAYS = 7;

export const stubAttribution: ProviderAttribution = {
  name: 'Zenith stub',
  url: 'https://example.com/zenith-stub',
  licence: 'CC0 1.0',
  licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
};

export const stubCurrentConditions: CurrentConditions = {
  time: new Date(STUB_START_MS).toISOString(),
  condition: 'clear',
  temperatureCelsius: -2,
  apparentTemperatureCelsius: -5,
  relativeHumidityPercent: 78,
  dewPointCelsius: -5.5,
  pressureHpa: 1024,
  windSpeedKmh: 8,
  windGustKmh: 15,
  windDirectionDegrees: 45,
  precipitationMm: 0,
  cloudCoverPercent: 5,
  visibilityMeters: 30_000,
  uvIndex: 0,
  isDay: false,
};

function stubHour(index: number): HourlyForecast {
  const cloudy = index >= 24;
  return {
    ...stubCurrentConditions,
    time: new Date(STUB_START_MS + index * HOUR_MS).toISOString(),
    condition: cloudy ? 'cloudy' : 'clear',
    temperatureCelsius: -2 + (index % 24) / 4,
    cloudCoverPercent: cloudy ? 90 : 5,
    precipitationProbabilityPercent: cloudy ? 40 : 0,
    cloudCoverLowPercent: cloudy ? 70 : 0,
    cloudCoverMidPercent: cloudy ? 50 : 0,
    cloudCoverHighPercent: cloudy ? 30 : 5,
  };
}

function stubDay(index: number): DailyForecast {
  return {
    date: new Date(STUB_START_MS + index * DAY_MS).toISOString().slice(0, 10),
    condition: index % 2 === 0 ? 'clear' : 'partly-cloudy',
    temperatureMinCelsius: -4 + index,
    temperatureMaxCelsius: 4 + index,
    precipitationSumMm: 0,
    precipitationProbabilityMaxPercent: 10,
    windSpeedMaxKmh: 20,
    windGustMaxKmh: 35,
    uvIndexMax: 1,
  };
}

export const stubHourlyForecast: HourlyForecast[] = Array.from({ length: STUB_HOURLY_HOURS }, (_, index) =>
  stubHour(index),
);

export const stubDailyForecast: DailyForecast[] = Array.from({ length: STUB_DAILY_DAYS }, (_, index) => stubDay(index));

export const stubAirQuality: AirQuality = {
  time: new Date(STUB_START_MS).toISOString(),
  index: { scale: 'european', value: 22 },
  concentrationsMicrogramsPerCubicMeter: {
    pm25: 8,
    pm10: 14,
    ozone: 55,
    nitrogenDioxide: 18,
    sulphurDioxide: 2,
    carbonMonoxide: 210,
  },
};

export const stubPollen: Pollen = {
  time: new Date(STUB_START_MS).toISOString(),
  grainsPerCubicMeter: { alder: 12, birch: 0, grass: 0, mugwort: 0, olive: null, ragweed: null },
};

export const stubAlerts: Alert[] = [
  {
    id: 'stub-alert-1',
    type: 'wind',
    severity: 'moderate',
    title: 'Strong wind',
    description: 'Gusts up to 80 km/h on exposed coasts.',
    startsAt: new Date(STUB_START_MS + 6 * HOUR_MS).toISOString(),
    endsAt: new Date(STUB_START_MS + 18 * HOUR_MS).toISOString(),
  },
];
