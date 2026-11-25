zenith/
├── apps/
│   ├── api/                              # BACKEND · @zenith/api (Node.js + Fastify)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── weather/              # terrestrial weather
│   │   │   │   ├── space/                # Kp, OVATION, solar wind, solar flares
│   │   │   │   ├── sky/                  # light pollution, sky data
│   │   │   │   ├── auth/                 # user accounts (Better Auth)
│   │   │   │   ├── favorites/            # favorite locations
│   │   │   │   └── notifications/        # rules, devices, push delivery
│   │   │   ├── jobs/                     # scheduled jobs (BullMQ)
│   │   │   ├── db/                       # Drizzle schema, migrations, demo seed
│   │   │   ├── lib/                      # Redis cache, config, logger
│   │   │   ├── app.ts                    # Fastify app factory (buildApp)
│   │   │   ├── server.ts                 # API entry point
│   │   │   └── worker.ts                 # worker entry point
│   │   ├── test/                         # fixtures/<provider>, mocks/, db/ (Testcontainers), helpers/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                              # FRONTEND · @zenith/web (React + Vite)
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── features/                 # weather, space, sky, favorites, notifications
│   │   │   ├── components/               # web UI components
│   │   │   ├── api/                      # HTTP client for apps/api
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── mobile/                           # FRONTEND · @zenith/mobile (Expo / React Native)
│       ├── assets/
│       ├── src/
│       │   ├── features/                 # same split as web, own screens
│       │   ├── components/               # React Native components
│       │   ├── navigation/               # React Navigation stack
│       │   ├── api/                      # HTTP client for apps/api
│       │   └── dev/                      # adb parsing for the android:* commands
│       ├── scripts/                      # android:emulator and android:phone runners (docs/mobile-setup.md)
│       ├── App.tsx
│       ├── app.json
│       ├── metro.config.cjs                  # resolves @zenith/core from source
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── core/                             # SHARED · @zenith/core (pure computations, the only code shared by web and mobile)
│       ├── src/
│       │   ├── ephemeris/                # Sun, Moon, twilights (Astronomy Engine)
│       │   ├── indicator/                # stargazing indicator
│       │   ├── constellations/           # visibility, sky map projection
│       │   ├── types/                    # shared types (HourlyForecast…)
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── data/                                 # star catalog, constellation lines, light pollution extract, demo data
├── scripts/                              # light pollution atlas preprocessing (Python)
├── docs/                                 # technical and user documentation
│
├── .github/
│   ├── workflows/
│   │   └── ci.yml                        # lint, tests, build
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
│
├── docker-compose.yml                    # postgres, redis, api, worker, web
├── devenv.nix                            # development environment (Nix)
├── package.json                          # npm workspaces root
├── vitest.config.ts                      # unit and db test projects
├── vitest.setup.ts                       # msw server, shared by all tests
├── test/                                 # shared test helpers (msw server)
├── package-lock.json                     # single lockfile, at the root
├── .gitignore
├── ATTRIBUTIONS.md                       # data sources and licenses
└── README.md
