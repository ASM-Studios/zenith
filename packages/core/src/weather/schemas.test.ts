import { describe, expect, it } from 'vitest';
import {
  stubAirQuality,
  stubAlerts,
  stubCurrentConditions,
  stubDailyForecast,
  stubHourlyForecast,
  stubPollen,
} from '../testing/index.ts';
import { AirQualitySchema } from './air-quality.ts';
import { AlertSchema } from './alert.ts';
import { CurrentConditionsSchema } from './current-conditions.ts';
import { DailyForecastSchema } from './daily-forecast.ts';
import { GeoPointSchema } from './geo-point.ts';
import { HourlyForecastSchema } from './hourly-forecast.ts';
import { PollenSchema } from './pollen.ts';

const [hour] = stubHourlyForecast;
const [day] = stubDailyForecast;
const [alert] = stubAlerts;

describe('GeoPointSchema', () => {
  it('accepts a point on the globe', () => {
    expect(GeoPointSchema.safeParse({ latitude: 48.85, longitude: 2.35 }).success).toBe(true);
  });

  it('rejects a latitude beyond the pole', () => {
    expect(GeoPointSchema.safeParse({ latitude: 91, longitude: 0 }).success).toBe(false);
  });

  it('rejects a longitude beyond the antimeridian', () => {
    expect(GeoPointSchema.safeParse({ latitude: 0, longitude: 181 }).success).toBe(false);
  });
});

describe('CurrentConditionsSchema', () => {
  it('accepts null for a measurement the source does not provide', () => {
    expect(CurrentConditionsSchema.safeParse({ ...stubCurrentConditions, uvIndex: null }).success).toBe(true);
  });

  it('rejects a missing measurement instead of null', () => {
    const { uvIndex: _omitted, ...withoutUv } = stubCurrentConditions;
    expect(CurrentConditionsSchema.safeParse(withoutUv).success).toBe(false);
  });

  it('rejects a humidity above 100 percent', () => {
    expect(CurrentConditionsSchema.safeParse({ ...stubCurrentConditions, relativeHumidityPercent: 120 }).success).toBe(
      false,
    );
  });

  it('rejects a time without timezone', () => {
    expect(CurrentConditionsSchema.safeParse({ ...stubCurrentConditions, time: '2026-01-15 00:00' }).success).toBe(
      false,
    );
  });

  it('rejects a condition outside the shared list', () => {
    expect(CurrentConditionsSchema.safeParse({ ...stubCurrentConditions, condition: 'sunny' }).success).toBe(false);
  });
});

describe('HourlyForecastSchema', () => {
  it('accepts an hour with cloud cover per layer', () => {
    expect(HourlyForecastSchema.safeParse(hour).success).toBe(true);
  });

  it('rejects a negative low cloud cover', () => {
    expect(HourlyForecastSchema.safeParse({ ...hour, cloudCoverLowPercent: -1 }).success).toBe(false);
  });
});

describe('DailyForecastSchema', () => {
  it('rejects a date that is not a calendar day', () => {
    expect(DailyForecastSchema.safeParse({ ...day, date: '2026-02-30' }).success).toBe(false);
  });

  it('rejects a minimum temperature above the maximum', () => {
    expect(DailyForecastSchema.safeParse({ ...day, temperatureMinCelsius: 10, temperatureMaxCelsius: 5 }).success).toBe(
      false,
    );
  });
});

describe('AirQualitySchema', () => {
  it('accepts a reading without index', () => {
    expect(AirQualitySchema.safeParse({ ...stubAirQuality, index: null }).success).toBe(true);
  });

  it('rejects an index on an unknown scale', () => {
    expect(AirQualitySchema.safeParse({ ...stubAirQuality, index: { scale: 'uk', value: 3 } }).success).toBe(false);
  });
});

describe('PollenSchema', () => {
  it('rejects a reading that omits a species', () => {
    const { ragweed: _omitted, ...withoutRagweed } = stubPollen.grainsPerCubicMeter;
    expect(PollenSchema.safeParse({ ...stubPollen, grainsPerCubicMeter: withoutRagweed }).success).toBe(false);
  });
});

describe('AlertSchema', () => {
  it('accepts an alert without end', () => {
    expect(AlertSchema.safeParse({ ...alert, endsAt: null }).success).toBe(true);
  });

  it('rejects a severity outside the CAP scale', () => {
    expect(AlertSchema.safeParse({ ...alert, severity: 'orange' }).success).toBe(false);
  });

  it('rejects an alert that ends before it starts', () => {
    expect(
      AlertSchema.safeParse({ ...alert, startsAt: '2026-01-15T18:00:00Z', endsAt: '2026-01-15T06:00:00Z' }).success,
    ).toBe(false);
  });

  it('compares start and end across timezones', () => {
    expect(
      AlertSchema.safeParse({ ...alert, startsAt: '2026-01-15T10:00:00+02:00', endsAt: '2026-01-15T09:00:00Z' })
        .success,
    ).toBe(true);
  });
});
