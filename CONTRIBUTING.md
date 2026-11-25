# Contributing to Zenith

## Workflow

AI agent guidelines live in [CLAUDE.md](CLAUDE.md) and `.claude/`.

1. Every unit of work is a GitHub issue on the **Zenith** project board. Open one (feature, bug or task template) before starting.
2. Create one branch per issue.
3. Open a pull request into `dev`.
4. `master` only receives merges from `dev`.

## Branch naming

```
<trigram>/#<issue-number>/<desc>
```

- `trigram`: the author's three-letter trigram.
- `desc`: short kebab-case description.

Example: `mbo/#11/ci-pipeline`

## Commits

```
type(scope): desc
```

- Types: `feat`, `fix`, `docs`, `evol` (evolution or refactor of existing code), and optionally `test`, `chore`.
- Scopes: `core`, `api`, `web`, `mobile`, `infra`, `ci`, `data`, `docs`.
- Commits are signed off: `git commit -s`.

Example: `feat(api): add Kp index endpoint`

Issue titles follow the same `type(scope): desc` convention.

## Pull requests and review

- Fill in the PR template and link the issue with `Closes #<issue>`.
- Every PR must be reviewed and approved by another team member before merge.
- Authors do not merge their own PR without approval.
- CI must be green.
- A PR too big to review is split: open one sub-issue of the original issue per sub-PR, name each branch after its sub-issue and close it with `Closes #<sub-issue>`. The parent issue is only mentioned (`Part of #<issue>`). Too big means more than 1000 changed lines (added plus removed, lockfiles and Drizzle output excluded) or a created or grown code file above 200 lines.

### Review before commit (Claude Code)

Every commit, docs-only included, needs a `zenith-review` of the staged diff (`git diff --cached`):

1. Stage with `git add` (never `commit -a`), run the `zenith-review` skill and fix every Blocker and Major finding.
2. `python3 .claude/hooks/review_stamp.py template` prints the report header for the staged tree. Complete it with the verdict `merge` and the remaining findings.
3. `python3 .claude/hooks/review_stamp.py <report file>` installs the report. Calling it without a report does nothing.

`git commit` is refused unless the installed report matches the staged tree: any later `git add` needs a new review. The report is checked, not trusted: it must name the staged tree and every staged file, carry the verdict `merge` and list no open Blocker or Major finding.

## Security

Report vulnerabilities privately, as described in [SECURITY.md](SECURITY.md).

## Local setup

1. Install [devenv](https://devenv.sh), [direnv](https://direnv.net) and [Docker](https://docs.docker.com/get-docker/) with the Compose plugin, then run `direnv allow`. This provides Node 24 and the npm dependencies.
2. Copy the environment file, then fill in `PASSWORD_PEPPER` and `BETTER_AUTH_SECRET` with the command given above each one; the API refuses to start without them:
   ```
   cp .env.example .env
   ```
3. Start the stack:
   ```
   docker compose up -d --build
   ```
   `--build` is needed after every code change, otherwise the previous image is reused. Migrations are applied by the `migrate` service before `api` starts (see [docs/database.md](docs/database.md)).

The `web` service serves the built web app on `http://localhost:8080` (`WEB_PORT`) and forwards `/api` and `/ping` to the API. Outside Docker, `npm run dev:web` starts it on `http://localhost:5173` with the same forwarding to the API on port 3000.

The `worker` service runs the scheduled jobs (`apps/api/src/jobs/`) on a BullMQ queue in Redis. Outside Docker, start it with `npm run dev:worker`.

The API image is distroless: it has no shell, no package manager and no `curl`, so `docker compose exec api sh` fails. Read logs with `docker compose logs api`. To get a shell, run the debug variant next to the stack: `docker run --rm -it --entrypoint sh gcr.io/distroless/nodejs24-debian13:debug-nonroot`. The `api` healthcheck is a Node `fetch` of `/ping` for the same reason.

## Web and mobile

Only computation code is shared between the web and mobile apps, through `@zenith/core` (see `docs/project.md`, section Stack Technique). Ephemerides, indicators, types and weather providers go in `packages/core`. Screens, components, navigation and the HTTP client stay in each app, because the web renders DOM and mobile renders React Native views.

Run the mobile app on an Android emulator with `npm run android:emulator`, or on a phone plugged in over USB with `npm run android:phone`. The emulator reaches the API on the host at `http://10.0.2.2:3000`; override it with `EXPO_PUBLIC_API_URL`. The tooling, the USB steps and the troubleshooting are in `docs/mobile-setup.md`. `npm run dev:mobile` starts Expo alone.

## Quality gates

```
npm run check
```

Runs lint, workflow lint (actionlint), tests and build. It must pass before opening a PR.

- Tests are required for new code and bug fixes.
- External APIs (weather, space weather, etc.) must be mocked in tests; tests never hit the network.
- Fixtures and HTTP mocking conventions: [docs/testing.md](docs/testing.md).

## Running CI locally

`Dockerfile.ci` holds a clean copy of the repo with its dependencies installed. `python3 .claude/hooks/ci_local.py` builds it, then runs `npm run check` in a container with the Docker socket mounted, which the database tests need to start Postgres with Testcontainers:

```
python3 .claude/hooks/ci_local.py
```

The container uses host networking on Linux. On macOS and Windows it reaches Postgres through `host.docker.internal`, which is not verified yet.

Run it on committed work before every push. AI agents use `python3 .claude/hooks/ci_local.py` instead, which also unlocks their `git push` hook (see [CLAUDE.md](CLAUDE.md)).

## Project board automation

The `Project sync` workflow keeps the board in step with issues, branches and PRs. Built-in project workflows add new issues as Backlog and move closed ones to Done.

- An issue gets an assignee: it moves to Ready.
- A branch `<trigram>/#<issue>/<desc>` is pushed: the issue moves to In progress and the first pusher is assigned if nobody is.
- A PR is linked to an issue by its branch name or a closing keyword (`Closes #<issue>`). A draft PR moves the issue to In progress; a PR ready for review moves it to In review, and back to In progress when it returns to draft. An issue the PR only mentions is not moved.
- An issue with sub-issues is never moved by a PR: its sub-issues are. Once all its sub-issues are closed, the parent moves to Done.
- The PR gets the assignees and labels of every issue it mentions.
- A status never moves backward on its own, except when a PR goes back to draft.

Setup, once, by a project admin:

1. Create a fine-grained token (GitHub, Settings, Developer settings, Personal access tokens) with resource owner `ASM-Studios`, access to the `zenith` repository, and the organization permission `Projects: Read and write`. A GitHub App with the same permissions works too.
2. Add it as the repository secret `PROJECT_TOKEN` (repository Settings, Secrets and variables, Actions).

Without the secret, the workflow still assigns people and copies labels, and logs that statuses were left as is.
