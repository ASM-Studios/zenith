# Testing

`npm test` runs Vitest across the workspaces and works fully offline. `npm run check` adds lint, format, coverage and build.

## Mocking external APIs

HTTP is mocked with [msw](https://mswjs.io), which is also usable from web and mobile tests.

- `test/msw-server.ts` exports the shared `server`.
- `vitest.setup.ts` starts it before all tests, resets per-test handlers after each test and closes it at the end.
- Unmocked requests fail the test (`onUnhandledRequest: 'error'`), so a missing handler can never reach the network.

Register handlers inside a test with `server.use(...)`. They are dropped after the test.

## Fixtures convention

Each workspace keeps its test data under `<workspace>/test`:

```
<workspace>/test/fixtures/<provider>/<scenario>.json
<workspace>/test/mocks/<provider>.handlers.ts
```

- One folder per provider, one JSON file per scenario, named after what it represents (`forecast-ok.json`, `forecast-rate-limited.json`).
- Fixtures are real response bodies, trimmed to the fields the code reads.
- `<provider>.handlers.ts` builds msw handlers from the fixtures and exports one handler per scenario plus the URL.
- Tests import the handlers and pass them to `server.use(...)`.

`apps/api/test/example-provider.test.ts` shows the pattern. Replace it with real providers as they land.

## Where tests live

Unit tests sit next to the code (`src/**/*.test.ts`). Tests that need fixtures or mocks sit in `<workspace>/test/`.
