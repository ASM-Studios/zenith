# Zenith

Stargazing and space-weather app. npm workspaces monorepo: `apps/api` (Node, Fastify, Drizzle, Better Auth) and `packages/core` (pure computations). `docs/` holds the technical documentation (`arborescence.md` is the target layout, `database.md` the schema).

These guidelines replace the `lucy-guidelines` plugin, which is disabled for this repo in `.claude/settings.json`. `CONTRIBUTING.md` is the human-facing source of the workflow; the skills below apply it.

## Always

- **Quality gate.** `npm run check` (lint, format check, tests with coverage, build) is the CI. Run it locally while coding (devenv or Node 24), and run `python3 .claude/hooks/ci_local.py` on the committed work before every push: it runs the same CI in Docker on any platform, falls back to Node 24, and unlocks `git push` for that commit. The hook blocks a push without it. Details: `zenith-pr`, Where to run.
- **Small code.** Files stay under ~200 lines, one responsibility each. Names carry the meaning; no comments or docstrings. New non-trivial logic gets a test whose name states the behaviour it checks.
- **Tests never hit the network.** External APIs (weather, space weather) are mocked.
- **No AI attribution** in commits, PR titles, PR bodies, branch names or code: no `Co-Authored-By`, no "Generated with", no `claude/` branch. The `Signed-off-by` trailer from `git commit -s` stays.
- **No em dash** in anything written for a PR or a review: code, docs, commit text, PR text.
- **Never push** to `master` or `dev`, force-push, or skip hooks (`--no-verify`). Open a PR from your own branch and let the user run any force-push.
- **Repo and PR links** are full URLs (`https://github.com/ASM-Studios/zenith/pull/<n>`). Only `Closes #<issue>` stays bare.

## Naming

- Branch: `<trigram>/#<issue>/<desc>`, e.g. `mbo/#11/ci-pipeline`.
- Commit: `type(scope): desc`, one line, signed off. Types `feat fix docs evol test chore`; scopes `core api web mobile infra ci data docs`.
- PR: into `dev`, title in the commit form, built from `.github/pull_request_template.md` with `Closes #<issue>`.

## Skills, agents, tools (all in `.claude/`)

- `zenith-pr`: write, commit, open and merge a PR. Command `/pr-ready` lists the gaps on the current branch; `/pr-status` lists your open PRs.
- `zenith-review`: review a PR or diff; `zenith-reviewer` agent for one area of a big PR.
- `zenith-dev-fix`: fix a break on `dev` with a test that is red before and green after.
- `zenith-guidelines`: record a correction as a lasting rule. Use it whenever someone states a rule or repeats a request.
- Agents `zenith-pr-scout` and `zenith-ci-triage` do read-only PR and CI lookups; `/ci-triage` runs the second.
- Hook `.claude/hooks/guard_git.py` enforces the git and PR rules above. MCP server `zenith-gh` (`.mcp.json`) gives `zenith_pr_board` and `zenith_ci_failure`.
- `.claude/hooks/ci_local.py` runs the CI locally and stamps the passing commit; `Dockerfile.ci` at the repo root is what it builds.
- Tests for the hooks and the MCP server: `python3 -m unittest discover -s .claude/tests`.
