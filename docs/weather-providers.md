# Weather providers

Every weather source (Open-Meteo, MET Norway, Meteo-France...) implements the `WeatherProvider` interface from `@zenith/core`. The API only talks to that interface, so a source can be added, swapped or selected per data type without touching the routes.

## Contract

```ts
interface WeatherProvider {
  readonly id: string;
  readonly attribution: ProviderAttribution;
  readonly capabilities: ProviderCapabilities;
  readonly getCurrent?: (query: WeatherQuery) => Promise<CurrentConditions>;
  readonly getHourly?: (query: WeatherQuery) => Promise<HourlyForecast[]>;
  readonly getDaily?: (query: WeatherQuery) => Promise<DailyForecast[]>;
  readonly getAirQuality?: (query: WeatherQuery) => Promise<AirQuality>;
  readonly getPollen?: (query: WeatherQuery) => Promise<Pollen>;
  readonly getAlerts?: (query: WeatherQuery) => Promise<Alert[]>;
}
```

- `id`: stable identifier used in API parameters and user preferences (`open-meteo`, `met-norway`, `meteo-france`).
- `attribution`: source name, URL, licence and licence URL, shown on every data screen.
- `capabilities.coverage`: `{ kind: 'global' }` or `{ kind: 'regions', regions: BoundingBox[] }`. A box whose `west` is greater than its `east` crosses the antimeridian.
- `capabilities.dataTypes`: the data types the provider serves, among `current`, `hourly`, `daily`, `airQuality`, `pollen`, `alerts`. Implement exactly the matching methods.
- `WeatherQuery`: the `location` (`latitude`, `longitude`) and an optional `signal`. Pass the signal to `fetch` so the caller can enforce a timeout.

`offersDataType(provider, dataType, location)` tells whether a provider can serve a data type at a location. Use it to list the sources offered to the user.

## Data

Every type has a Zod schema next to it (`CurrentConditionsSchema`, `HourlyForecastSchema`...). The TypeScript type is inferred from the schema, and the schema validates data read back from the cache or received by the clients.

- Units are in the field names: `temperatureCelsius`, `windSpeedKmh`, `pressureHpa`, `precipitationMm`, `visibilityMeters`, percentages end with `Percent`. Convert to these units inside the provider.
- A value the source does not provide is `null`, never a missing field.
- Instants are ISO 8601 strings with a timezone (`2026-01-15T22:00:00Z`). Daily entries use the local calendar date of the location (`2026-01-15`).
- `condition` is one of `WEATHER_CONDITIONS`. Each provider maps its own codes (WMO codes, MET Norway symbol codes...) to that list.
- Hourly entries carry the cloud cover per layer (low, mid, high) needed by the night-sky and aurora indices.
- Alert severity follows the CAP scale `minor`, `moderate`, `severe`, `extreme`. Meteo-France vigilance colours map to it (yellow to moderate, orange to severe, red to extreme).

## Errors

A provider throws only the errors from `@zenith/core`, keeping the original failure as `cause`:

| Failure | Error | `kind` |
|---|---|---|
| Request aborted through `signal` | `ProviderTimeoutError` | `timeout` |
| Network error, HTTP 5xx | `ProviderUnavailableError` | `unavailable` |
| HTTP 429 or quota exhausted | `ProviderQuotaError` (with `retryAfterSeconds` from `Retry-After`) | `quota` |
| Body that is not JSON or does not match the expected shape | `ProviderInvalidResponseError` | `invalid-response` |
| Location outside coverage, data type not served | `ProviderUnsupportedError` | `unsupported` |

Every error extends `ProviderError` and carries the `providerId`. The API reads `kind` to choose between serving stale cache and reporting the source as unavailable.

## Example provider

`@zenith/core/testing` exports `createStubWeatherProvider`, a complete provider with fixed data. It is the reference implementation and the provider to use in tests and in demo mode. It is not exported from `@zenith/core`, so the web and mobile bundles never include it.

```ts
import { createStubWeatherProvider } from '@zenith/core/testing';

const provider = createStubWeatherProvider({
  id: 'stub-france',
  coverage: { kind: 'regions', regions: [{ south: 41.3, west: -5.2, north: 51.1, east: 9.6 }] },
  dataTypes: ['current', 'hourly'],
});

await provider.getCurrent?.({ location: { latitude: 48.85, longitude: 2.35 } });
```

Options: `id`, `coverage`, `dataTypes` (only the matching methods are present) and `error`, a `ProviderError` that every call rejects with, to test degraded mode.

A real provider follows the same shape:

```ts
export function createExampleProvider(baseUrl: string): WeatherProvider {
  const id = 'example';
  return {
    id,
    attribution: { name: 'Example', url: baseUrl, licence: 'CC BY 4.0', licenceUrl: 'https://creativecommons.org/licenses/by/4.0/' },
    capabilities: { coverage: { kind: 'global' }, dataTypes: ['current'] },
    getCurrent: async ({ location, signal }) => {
      const response = await fetchOrThrow(id, `${baseUrl}?lat=${location.latitude}&lon=${location.longitude}`, signal);
      return mapCurrent(id, await response.json());
    },
  };
}
```

Here `fetchOrThrow` (`apps/api/src/modules/weather/providers/fetch-or-throw.ts`) turns an abort, a network error, a 5xx and a 429 into the errors above, and `mapCurrent` converts the source response to `CurrentConditions` or throws `ProviderInvalidResponseError`. Tests mock the HTTP calls with msw (see [testing.md](testing.md)).

## Open-Meteo

`createOpenMeteoProvider` (`apps/api/src/modules/weather/providers/open-meteo/`) is the first real provider. It needs no API key and is published under CC BY 4.0.

- Id `open-meteo`, global coverage, data types `current`, `hourly` (48 hours), `daily` (7 days), `airQuality` and `pollen`. Open-Meteo has no alerts, so `getAlerts` is absent.
- Forecast data comes from `https://api.open-meteo.com/v1/forecast`, air quality and pollen from `https://air-quality-api.open-meteo.com/v1/air-quality`. Both URLs can be overridden in the options, which the tests use to target a mocked host.
- Requests ask for `timeformat=unixtime&timezone=auto`. Instants are built from the unix seconds, and daily dates from the local midnight shifted by `utc_offset_seconds`.
- WMO weather codes map to `WEATHER_CONDITIONS`. No WMO code reports `sleet`, and an unknown code throws `ProviderInvalidResponseError`.
- `index` of the air quality is the European index, else the US index, else `null`.
- Pollen is only available in Europe. Elsewhere Open-Meteo returns nothing and every species is `null`.
- Fixtures under `apps/api/test/fixtures/open-meteo/` are real responses for Paris and New York, trimmed to the requested fields.
