meteo/
├── apps/
│   ├── api/                              # BACKEND · @meteo/api (Node.js + Fastify)
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
│   │   │   ├── server.ts                 # API entry point
│   │   │   └── worker.ts                 # worker entry point
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                              # FRONTEND · @meteo/web (React + Vite)
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── features/                 # weather, space, sky, favorites, notifications
│   │   │   ├── components/               # shared UI components
│   │   │   ├── api/                      # HTTP client for apps/api
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── mobile/                           # FRONTEND · @meteo/mobile (Expo / React Native)
│       ├── assets/
│       ├── src/
│       │   ├── features/                 # same split as web
│       │   ├── components/
│       │   └── api/
│       ├── App.tsx
│       ├── app.json
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── core/                             # SHARED · @meteo/core (pure computations)
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
├── package-lock.json                     # single lockfile, at the root
├── .gitignore
├── ATTRIBUTIONS.md                       # data sources and licenses
└── README.md
