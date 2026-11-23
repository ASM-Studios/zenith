# Zenith

Stargazing and space-weather app. npm workspaces monorepo: `apps/api` (Node, Fastify, Drizzle, Better Auth) and `packages/core` (pure computations). `docs/` holds the technical documentation (`arborescence.md` is the target layout, `database.md` the schema).

These guidelines replace the `lucy-guidelines` plugin, which is disabled for this repo in `.claude/settings.json`. `CONTRIBUTING.md` is the human-facing source of the workflow; the skills below apply it.

## Always

- **Quality gate.** `npm run check` (lint, format check, tests with coverage, build) is the CI. Run it locally while coding (devenv or Node 24), and run `python3 .claude/hooks/ci_local.py` on the committed work before every push: it runs the same CI in Docker on any platform, falls back to Node 24, and unlocks `git push` for that commit. The hook blocks a push without it. Details: `zenith-pr`, Where to run.
- **Review before commit.** Stage, run `zenith-review` on `git diff --cached`, fix Blocker and Major findings, then install the report with `python3 .claude/hooks/review_stamp.py <report file>` (`template` prints its header). Docs-only changes included, never stamp by hand. The hook blocks `git commit` (and `commit -a`) without a report matching the staged tree.
- **Small code.** Files stay under ~200 lines, one responsibility each. Names carry the meaning; no comments or docstrings. New non-trivial logic gets a test whose name states the behaviour it checks.
- **Tests never hit the network.** External APIs (weather, space weather) are mocked.
- **No AI attribution** in commits, PR titles, PR bodies, branch names or code: no `Co-Authored-By`, no "Generated with", no `claude/` branch. The `Signed-off-by` trailer from `git commit -s` stays.
- **No em dash** in anything written for a PR or a review: code, docs, commit text, PR text.
- **Never push** to `master` or `dev`, force-push, or skip hooks (`--no-verify`). Open a PR from your own branch and let the user run any force-push.
- **Draft first.** `pr_open.py` opens every PR as a draft. At the hand-over, ask the user whether they reviewed it by hand and want it ready; only a yes runs `pr_open.py --ready`.
- **Repo and PR links** are full URLs (`https://github.com/ASM-Studios/zenith/pull/<n>`). Only `Closes #<issue>` stays bare.

## Naming

- Branch: `<trigram>/#<issue>/<desc>`, e.g. `mbo/#11/ci-pipeline`.
- Commit: `type(scope): desc`, one line, signed off. Types `feat fix docs evol test chore`; scopes `core api web mobile infra ci data docs`.
- PR: into `dev`, title in the commit form, built from `.github/pull_request_template.md` with `Closes #<issue>`.

## Key commands

Run from the repo root or a worktree. Each prints a short report; prefer them to the raw commands.

- `python3 .claude/scripts/worktree.py <issue> <desc>`: branch, worktree, `.env` and `npm ci` in one step.
- `python3 .claude/scripts/check_summary.py`: `npm run check`, reduced to the result, the coverage gaps of changed files (`--all` for every file) or the first failing step's errors.
- `python3 .claude/scripts/with_node.py <command>`: run any npm or node command on Node 24 when it is not on PATH.
- `python3 .claude/scripts/env_file.py`: create `.env` with generated secrets.
- `python3 .claude/scripts/smoke.py --expect <service>:<regex>`: start the compose stack, check health, log lines and graceful stops, tear down.
- `python3 .claude/scripts/issue_create.py "<type(scope): desc>" --body-file <file> --label <label> [--parent <n>]`: create an issue (sub-issue with `--parent`) and check how its body rendered. Always give bodies as files, never inline.
- `python3 .claude/scripts/prepare_commit.py`: `check_summary.py`, stage, scan the staged lines for em dashes and AI attribution, print the stat.
- `python3 .claude/scripts/pr_open.py [--body-file <file>]`: open the PR of the current branch into `dev`, or update its body when it already exists, then wait for the checks and print the result.
- `python3 .claude/scripts/review_pr.py <n>...`: mechanical review pass over PRs (stat, commit and title format, forbidden text, merge conflicts between the PRs).
- `python3 .claude/hooks/ci_local.py`: CI on the committed work, required before `git push`.
- Hook `.claude/hooks/lint_ts.py` lints every `.ts` file after an edit and reports errors at once.

## Skills, agents, tools (all in `.claude/`)

- `zenith-pr`: write, commit, open and merge a PR. Command `/pr-ready` lists the gaps on the current branch; `/pr-status` lists your open PRs.
- `zenith-review`: review a PR or diff; `zenith-reviewer` agent for one area of a big PR.
- `zenith-dev-fix`: fix a break on `dev` with a test that is red before and green after.
- `zenith-guidelines`: record a correction as a lasting rule. Use it whenever someone states a rule or repeats a request.
- Agents `zenith-pr-scout` and `zenith-ci-triage` do read-only PR and CI lookups; `/ci-triage` runs the second.
- Hook `.claude/hooks/guard_git.py` enforces the git and PR rules above. MCP server `zenith-gh` (`.mcp.json`) gives `zenith_pr_board` and `zenith_ci_failure`.
- `.claude/hooks/ci_local.py` runs the CI locally and stamps the passing commit; `Dockerfile.ci` at the repo root is what it builds.
- Tests for the hooks, scripts and the MCP server: `python3 -m unittest discover -s .claude/tests`.
