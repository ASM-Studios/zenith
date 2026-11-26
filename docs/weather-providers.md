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

## Serving weather data

`packages/weather` holds the providers, the cache and the stale logic, and `apps/api/src/modules/weather` serves them to the clients. It depends only on `WeatherProvider`, so a new source needs no change there.

- **Registration.** `buildApp` takes `weatherProviders`, the list built at app start in `server.ts`. The order of the list is the default order of selection. Open-Meteo is registered first, so it is the default, then MET Norway.
- **Selection.** For each request, the first provider for which `offersDataType` holds wins, trying first the `provider` query parameter, then the signed-in user's source preference for the data type (`sourcePreferences.current`, `sourcePreferences.airQuality`...), then their `sourcePreferences.weather`, then the registration order. An unknown or unfit preference is skipped.
- **Cache.** Entries live in the Redis cache under `weather:<provider id>:<data type>:<latitude>:<longitude>`, the location rounded to 2 decimals (about 1 km); the provider is queried at that rounded location. A second request in the same cell inside the freshness TTL does not call the provider.
- **Freshness.** `current` 10 min, `hourly` 30 min, `daily` 3 h, `airQuality` 1 h, `pollen` 3 h, `alerts` 5 min. Redis keeps each entry 24 h longer so it can be served stale.
- **Timeout.** Each provider call gets an `AbortSignal` that fires after 10 s.

### Routes

`GET /api/weather/{current,hourly,daily,air-quality,pollen,alerts}?latitude=&longitude=[&provider=]`, open to anonymous clients. The answer is:

```json
{ "data": {}, "provider": { "id": "open-meteo", "attribution": {} }, "updatedAt": "2026-11-24T12:00:00.000Z", "stale": false }
```

`data` follows the schema of the data type. `updatedAt` is when the provider answered, not when the client asked.

### Errors

| Case | Answer |
|---|---|
| Missing or out of range `latitude` / `longitude`, empty `provider` | `400 { error: "invalid_query", message: "latitude: ...", issues }` |
| No registered provider offers the data type at the location | `404 { error: "no_provider", dataType }` |
| `timeout`, `unavailable`, `quota`, `invalid-response` with a cached entry | `200` with the cached data, its `updatedAt` and `stale: true` |
| `timeout`, `unavailable`, `quota`, `invalid-response` without a cached entry | `503 { error: "source_unavailable", provider, reason: <kind> }`, plus `Retry-After` on a quota error that gives one |
| `unsupported`, cached or not | `404 { error: "not_supported", provider }`: the source says it does not serve this, so an old value is not served |

A provider response that does not match the data schema counts as `invalid-response` and is never cached.

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
      const url = new URL(`${baseUrl}?lat=${location.latitude}&lon=${location.longitude}`);
      return mapCurrent(await fetchJson({ providerId: id, url, schema: ExampleResponseSchema, signal }));
    },
  };
}
```

`fetchJson` (`packages/weather/src/providers/fetch-json.ts`) validates the body with the schema and turns every failure into the errors above, an unexpected 4xx being an `invalid-response`. `mapCurrent` converts the validated response to `CurrentConditions`. Tests mock the HTTP calls with msw (see [testing.md](testing.md)).

## Open-Meteo

`createOpenMeteoProvider` (`packages/weather/src/providers/open-meteo`) needs no API key. Its data is under CC BY 4.0.

- Global coverage, data types `current`, `hourly` (48 hours), `daily` (7 days), `airQuality` and `pollen`.
- `airQuality` gives the European index, else the US index, else `null`.
- `pollen` covers Europe only: elsewhere every species is `null`, and the answer is cached like any other.
- `current`, `hourly`, `airQuality` and `pollen` are requested in GMT, `daily` in the local timezone of the location. Daily dates are read as they come, without applying a UTC offset.
- The requested variables are the keys of the row schemas, so a field is added in one place.
- WMO weather codes map to `WEATHER_CONDITIONS`. No code reports `sleet`, and an unknown code is an `invalid-response`.

## MET Norway

`createMetNorwayProvider` (`packages/weather/src/providers/met-norway`) uses Locationforecast 2.0 (`complete`) and needs no API key. Its data is under CC BY 4.0.

- Global coverage, data types `current`, `hourly` (48 hours) and `daily` (7 days). No air quality, pollen or alerts.
- Every request carries `User-Agent: zenith/1.0 <contact>`, the contact being `MET_NORWAY_CONTACT` (an email or a URL, the repository URL by default). Coordinates are sent with at most 4 decimals.
- One forecast document per location feeds the three data types. It is kept in memory (500 locations at most) until its `Expires` time, 1 minute when the header is missing. After that the request carries `If-Modified-Since`, and a `304` keeps the stored document.
- Wind speeds are converted from m/s to km/h. `apparentTemperatureCelsius` and `visibilityMeters` are `null`, and `uvIndex` is the clear-sky index.
- `symbol_code` maps to `WEATHER_CONDITIONS` without its `_day`, `_night` or `_polartwilight` suffix, which gives `isDay` (`null` for polar twilight). An unknown code is an `invalid-response`.
- `daily` groups the 6-hour blocks (00, 06, 12 and 18 UTC) by UTC date, and takes the condition of the 12 UTC block. The first and the last day can be partial.
