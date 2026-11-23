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

## Quality gates

```
npm run check
```

Runs lint, tests and build. It must pass before opening a PR.

- Tests are required for new code and bug fixes.
- External APIs (weather, space weather, etc.) must be mocked in tests; tests never hit the network.

## Running CI locally

`Dockerfile.ci` runs the CI check (`npm ci` then `npm run check`) from a clean copy of the repo, so it gives the same result on Linux, macOS and Windows:

```
docker build -f Dockerfile.ci --progress=plain .
```

Run it on committed work before every push. AI agents use `python3 .claude/hooks/ci_local.py` instead, which also unlocks their `git push` hook (see [CLAUDE.md](CLAUDE.md)).

## Project board automation

The `Project sync` workflow keeps the board in step with issues, branches and PRs. Built-in project workflows add new issues as Backlog and move closed ones to Done.

- An issue gets an assignee: it moves to Ready.
- A branch `<trigram>/#<issue>/<desc>` is pushed, or a PR mentions the issue: the issue moves to In progress and the first pusher is assigned if nobody is.
- A PR leaves draft: the issue moves to In review. Back to draft: In progress.
- The PR gets the issue's assignees and labels.
- A status never moves backward on its own, except when a PR goes back to draft.

Setup, once, by a project admin:

1. Create a fine-grained token (GitHub, Settings, Developer settings, Personal access tokens) with resource owner `ASM-Studios`, access to the `zenith` repository, and the organization permission `Projects: Read and write`. A GitHub App with the same permissions works too.
2. Add it as the repository secret `PROJECT_TOKEN` (repository Settings, Secrets and variables, Actions).

Without the secret, the workflow still assigns people and copies labels, and logs that statuses were left as is.
