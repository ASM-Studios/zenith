import { describe, expect, it } from 'vitest';
import { ProviderQuotaError, ProviderTimeoutError, ProviderUnsupportedError } from '../providers/errors.ts';
import {
  AirQualitySchema,
  AlertSchema,
  CurrentConditionsSchema,
  DailyForecastSchema,
  HourlyForecastSchema,
  PollenSchema,
  ProviderAttributionSchema,
  ProviderCapabilitiesSchema,
} from '../weather/index.ts';
import { STUB_DAILY_DAYS, STUB_HOURLY_HOURS } from './stub-weather-data.ts';
import { createStubWeatherProvider } from './stub-weather-provider.ts';

const paris = { location: { latitude: 48.85, longitude: 2.35 } };

describe('createStubWeatherProvider', () => {
  it('returns data that matches the core schemas', async () => {
    const provider = createStubWeatherProvider();

    expect(CurrentConditionsSchema.parse(await provider.getCurrent?.(paris))).toBeDefined();
    expect(HourlyForecastSchema.array().parse(await provider.getHourly?.(paris))).toHaveLength(STUB_HOURLY_HOURS);
    expect(DailyForecastSchema.array().parse(await provider.getDaily?.(paris))).toHaveLength(STUB_DAILY_DAYS);
    expect(AirQualitySchema.parse(await provider.getAirQuality?.(paris))).toBeDefined();
    expect(PollenSchema.parse(await provider.getPollen?.(paris))).toBeDefined();
    expect(AlertSchema.array().parse(await provider.getAlerts?.(paris))).toHaveLength(1);
  });

  it('declares valid attribution and capabilities', () => {
    const provider = createStubWeatherProvider();

    expect(ProviderAttributionSchema.safeParse(provider.attribution).success).toBe(true);
    expect(ProviderCapabilitiesSchema.safeParse(provider.capabilities).success).toBe(true);
  });

  it('exposes only the methods of its declared data types', () => {
    const provider = createStubWeatherProvider({ id: 'partial', dataTypes: ['current', 'alerts'] });

    expect(provider.id).toBe('partial');
    expect(provider.capabilities.dataTypes).toEqual(['current', 'alerts']);
    expect(provider.getCurrent).toBeDefined();
    expect(provider.getAlerts).toBeDefined();
    expect(provider.getHourly).toBeUndefined();
    expect(provider.getPollen).toBeUndefined();
  });

  it('returns a copy that callers cannot use to alter later responses', async () => {
    const provider = createStubWeatherProvider();
    const first = await provider.getHourly?.(paris);
    first?.splice(0);

    expect(await provider.getHourly?.(paris)).toHaveLength(STUB_HOURLY_HOURS);
  });

  it('rejects a location outside its coverage as unsupported', async () => {
    const provider = createStubWeatherProvider({
      coverage: { kind: 'regions', regions: [{ south: 41.3, west: -5.2, north: 51.1, east: 9.6 }] },
    });

    await expect(provider.getCurrent?.({ location: { latitude: 35.68, longitude: 139.69 } })).rejects.toBeInstanceOf(
      ProviderUnsupportedError,
    );
  });

  it('rejects an aborted request as a timeout', async () => {
    const provider = createStubWeatherProvider();
    const signal = AbortSignal.abort(new Error('too slow'));

    await expect(provider.getDaily?.({ ...paris, signal })).rejects.toBeInstanceOf(ProviderTimeoutError);
  });

  it('rejects every call with the injected error', async () => {
    const quota = new ProviderQuotaError('stub', 'rate limited', { retryAfterSeconds: 30 });
    const provider = createStubWeatherProvider({ error: quota });

    await expect(provider.getCurrent?.(paris)).rejects.toBe(quota);
    await expect(provider.getAlerts?.(paris)).rejects.toBe(quota);
  });
});
