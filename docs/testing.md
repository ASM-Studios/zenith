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

## Database tests

Tests that need Postgres live in `apps/api/test/db/` and run in the `db` Vitest project. The other tests run in the `unit` project and never start Docker.

- `apps/api/test/global-setup.ts` starts one `postgres:17` container per run with Testcontainers, applies the migrations from `apps/api/drizzle` and provides the URL as `databaseUrl`.
- `apps/api/test/setup-env.ts` sets `DATABASE_URL` from it. Static values (pepper, auth secret and URL) live in `apps/api/test/env.ts`.
- Better Auth uses the module-level `db`, so a rollback per test is not possible. Call `resetDb()` from `apps/api/test/helpers/reset-db.ts` in `beforeEach`: it truncates every table.
- `buildTestApp()` in `apps/api/test/helpers/build-test-app.ts` returns the Fastify app without listening or Redis, ready for `app.inject(...)`.

Docker must be running to execute the `db` project. To run only the Docker-free tests:

```
npx vitest run --project unit
```

## CI report on pull requests

Each run of `CI` and of `Dev environment` ends with a `PR report` job. It posts a new comment on the pull request with the status of every job and a link to each screenshot, grouped by platform, then deletes the earlier report comments. Pull requests from forks get no comment, because their token cannot write.

- Screenshots are named `<platform>-<screen>.png` (`web`, `android`, `ios`) and uploaded one by one with `archive: false`, so a link opens the image and not a zip. The links need a GitHub login.
- `.github/scripts/pr-report/` holds the code: `collect.mjs` reads the runs of the commit, `render.mjs` builds the markdown, `comments.mjs` posts and deletes. Its tests run with the unit project and use no network.
- Each screenshot is also uploaded as an asset of the `ci-screenshots` prerelease, named `pr-<number>-<commit>-<artifact id>-<file>`, so the comment embeds the image inline. The assets of earlier commits of the same pull request are deleted on each run, and a failed upload leaves the plain link. `contents: write` is granted to the report job only.
- The report only deletes comments written by a bot that carry its marker, and only older ones, so two reports finishing together leave one.
