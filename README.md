# Zenith

Zenith tells you when and where the sky is worth watching. It combines terrestrial weather, space weather and light pollution into two hourly scores from 0 to 100: the **aurora index** and the **night-sky index**.

[![CI](https://img.shields.io/github/actions/workflow/status/ASM-Studios/zenith/ci.yml?branch=dev&style=flat-square&label=CI)](https://github.com/ASM-Studios/zenith/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/codecov/c/github/ASM-Studios/zenith?style=flat-square&label=coverage)](https://codecov.io/gh/ASM-Studios/zenith)
[![License: GPL-3.0](https://img.shields.io/github/license/ASM-Studios/zenith?style=flat-square)](LICENSE)
[![Node >=24](https://img.shields.io/badge/node-%3E%3D24-5fa04e?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Last commit](https://img.shields.io/github/last-commit/ASM-Studios/zenith/dev?style=flat-square)](https://github.com/ASM-Studios/zenith/commits/dev)
[![Open issues](https://img.shields.io/github/issues/ASM-Studios/zenith?style=flat-square)](https://github.com/ASM-Studios/zenith/issues)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

## Features

Available:

- Account authentication API (Better Auth, Argon2 password hashing)
- Scheduled jobs worker (BullMQ on Redis)
- Documented aurora and night-sky index methodology

Planned:

- Terrestrial weather with cloud cover per layer
- Space weather: Kp, OVATION aurora probability, solar wind, solar flares
- Light pollution from VIIRS night-time radiance
- Hourly aurora and night-sky indexes per location
- Favorite locations and notifications

## Stack

| Area | Technology |
| --- | --- |
| Language | TypeScript, Node.js 24 |
| Web | React, Vite |
| API | Fastify, Zod, Better Auth |
| Data | PostgreSQL, Drizzle ORM, Redis |
| Jobs | BullMQ worker |
| Tooling | npm workspaces, Vitest, oxlint, Prettier |
| Infra | Docker Compose, devenv, GitHub Actions |

## Repository layout

| Path | Content |
| --- | --- |
| `apps/api` | HTTP API and scheduled-jobs worker |
| `apps/web` | Web app (React, Vite) |
| `packages/core` | Pure shared logic and types |
| `docs` | Index methodology, database, references |

The full target tree is in [docs/arborescence.md](docs/arborescence.md).

## Data sources and licences

Weather, space weather, map, star and light-pollution data come from third parties under their own licences. The licence and required attribution of each source are listed in [ATTRIBUTIONS.md](ATTRIBUTIONS.md).

## Getting started

Prerequisites: [Docker](https://docs.docker.com/get-docker/) with the Compose plugin, and Node.js 24 (or [devenv](https://devenv.sh) with [direnv](https://direnv.net), which provides it).

```sh
cp .env.example .env
```

Fill `PASSWORD_PEPPER` and `BETTER_AUTH_SECRET` with `openssl rand -hex 32`; the API refuses to start without them. Then:

```sh
docker compose up -d --build
```

The web app is served on `http://localhost:8080` and the API listens on `http://localhost:3000`. Rebuild after every code change. Stop with `docker compose down` (add `-v` to wipe the database).

For development tooling, install the dependencies once:

```sh
npm ci
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API in watch mode (needs Postgres and Redis) |
| `npm run dev:web` | Start the web app on `http://localhost:5173` |
| `npm run lint` | Lint with oxlint |
| `npm run format:check` | Check formatting with Prettier |
| `npm test` | Run the tests |
| `npm run test:coverage` | Run the tests with coverage |
| `npm run build` | Build every workspace |
| `npm run check` | Lint, format, coverage and build, as in CI |

## Documentation

- [Aurora index](docs/aurora_index.md)
- [Night-sky index](docs/night_sky_index.md)
- [Database](docs/database.md)
- [Literature references](docs/literature_references.md)

## Data sources

- [NOAA SWPC](https://www.swpc.noaa.gov): Kp and OVATION aurora model
- [Earth Observation Group](https://eogdata.mines.edu): VIIRS night-time lights

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or a pull request. Report vulnerabilities as described in [SECURITY.md](SECURITY.md).

## License

Zenith is released under the [GNU GPL v3](LICENSE).
