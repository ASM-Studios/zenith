# Weather providers

Every terrestrial weather source implements `WeatherProvider` from `@zenith/core`, so the API and the clients read one shape whatever the source.

## Data types

| Type | Returned by | Content |
| --- | --- | --- |
| `current` | `current(location)` | `CurrentConditions` |
| `hourly` | `hourly(location, hours)` | `HourlyForecast[]`, one per hour from now |
| `daily` | `daily(location, days)` | `DailyForecast[]`, one per local day from today |
| `airQuality` | `airQuality?(location)` | `AirQuality[]` |
| `pollen` | `pollen?(location)` | `Pollen[]` |
| `alerts` | `alerts?(location)` | `Alert[]`, official warnings in force |

`current`, `hourly` and `daily` are required. A provider declares in `capabilities.dataTypes` each type it serves and implements the optional method of each optional type it declares. A declared type whose method is missing is not offered.

## Units

| Quantity | Unit | Field suffix |
| --- | --- | --- |
| Temperature | degree Celsius | `C` |
| Wind speed | metre per second | `Ms` |
| Wind direction | degree, direction the wind comes from | `Deg` |
| Precipitation | millimetre | `Mm` |
| Pressure | hectopascal | `Hpa` |
| Visibility | metre | `M` |
| Cloud cover, humidity, probability | fraction from 0 to 1 | none |
| Air pollutants | µg/m³ | none |
| Pollen | grains per m³ | `PerM3` |

Times are ISO 8601 strings in UTC (`2026-01-01T21:00:00.000Z`); daily dates are local calendar days (`2026-01-01`). Cloud cover gives the low, mid and high layers when the source has them; the night-sky index falls back to `total` otherwise ([night_sky_index.md](night_sky_index.md)).

## Coverage

`capabilities.coverage` is either `{ kind: 'global' }` or a list of bounding boxes (`south`, `west`, `north`, `east`, in degrees). A box whose `west` is greater than its `east` crosses the antimeridian. `providersOffering(providers, location, dataType)` keeps the providers that declare the type and cover the location, so a regional source is never offered outside its area.

## Alerts

`severity` is one of `minor`, `moderate`, `severe`, `extreme` (CAP levels). Each source maps its own scale onto it; Meteo-France vigilance yellow, orange and red become `moderate`, `severe` and `extreme`, and green produces no alert. `onset` and `expires` bound the validity.

## Errors

A provider turns its failures into one of the `ProviderError` subclasses, each with the `providerId` and the original failure as `cause`:

| Class | `kind` | Extra field |
| --- | --- | --- |
| `ProviderTimeoutError` | `timeout` | `timeoutMs` |
| `ProviderUnavailableError` | `unavailable` | `status`, absent when the source was unreachable |
| `ProviderQuotaError` | `quota` | `retryAfterSeconds`, when the source sent one |

`isProviderError(error)` tells them from unexpected errors. Space weather providers reuse the same classes.

## Example stub

```ts
import type { WeatherProvider } from '@zenith/core';
import { ProviderUnavailableError } from '@zenith/core';

export const exampleProvider: WeatherProvider = {
  id: 'example',
  name: 'Example',
  attribution: 'Example data, CC BY 4.0',
  capabilities: {
    coverage: { kind: 'regions', regions: [{ south: 41, west: -5.5, north: 51.5, east: 10 }] },
    dataTypes: ['current', 'hourly', 'daily'],
  },
  current: async () => ({
    time: new Date().toISOString(),
    temperatureC: 4,
    wind: { speedMs: 3 },
    cloudCover: { total: 0.2 },
  }),
  hourly: async () => {
    throw new ProviderUnavailableError('example', 503);
  },
  daily: async () => [],
};
```

`packages/core/test/stub-weather-provider.ts` is a working stub used by the core tests.
