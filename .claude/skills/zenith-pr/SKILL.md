---
name: zenith-pr
description: Zenith pull-request workflow. Use when writing code for, committing, opening, describing, merging or rebasing a PR in the Zenith repo.
---

# Zenith PRs

Every PR is one *reviewable* topic tied to one issue: small, green in CI, easy to read in one sitting, approved by another team member before merge.

## Steps

1. **Find the issue and check coverage.** Hand the search to the `zenith-pr-scout` agent, or run `gh pr list -R ASM-Studios/zenith` and `git grep -i <term> origin/<head>`. Done when you hold the issue number (open one from the feature, bug or task template if none exists, with `python3 .claude/scripts/issue_create.py "<type(scope): desc>" --body-file <file> --label <label>`, plus `--parent <n>` for a sub-issue) and can name the open PR that already carries the change (stop and tell the user) or confirm none does.
2. **Branch from `dev`.** One branch per issue, named `<trigram>/#<issue>/<desc>` (see Naming). `master` only receives merges from `dev`. Use a worktree when the main checkout is in use: `python3 .claude/scripts/worktree.py <issue> <desc>` creates the branch from `origin/dev` in `../<repo>-worktrees/<issue>`, writes `.env` with fresh secrets and runs `npm ci` (trigram from `--trigram` or `git config zenith.trigram`).
3. **Write small code.** Done when every file you created or grew stays under ~200 lines and every module has one responsibility (SRP). New behaviour lands in a new module named after that responsibility, imported by the existing entry point. Names carry the meaning; the code has no comments or docstrings. New non-trivial logic gets a test whose name states the behaviour it checks.
4. **Verify while coding.** Run `python3 .claude/scripts/check_summary.py`: it runs the steps of `npm run check` (lint, format check, tests with coverage, build) on Node 24 and prints only the result, the coverage gaps of the files you changed, or the error lines of the first failing step. Done when it prints `check passed` with no coverage gap. The `lint_ts.py` hook already lints each `.ts` file you edit. External APIs (weather, space weather, ...) are mocked: tests never hit the network. Check added lines against Style (below) before committing.
5. **Review before committing.** Stage the work with `python3 .claude/scripts/prepare_commit.py [paths]` (it runs `check_summary.py`, runs `git add`, never `commit -a`, scans the staged lines for em dashes and AI attribution, and prints the stat), then run the `zenith-review` skill on `git diff --cached` (self-review mode). Fix every Blocker and Major finding, restage, and review again. Done when the report holds none and `python3 .claude/hooks/review_stamp.py <report file>` has installed it (see `zenith-review`, Self-review). The hook refuses `git commit` until a report matches the staged tree, and any later change to the staged tree needs a new review.
6. **Commit** (see Naming): `git commit -s`, one line, no body. The commit fixes or adds something by itself.
7. **Run CI locally, then push.** With everything committed, run `python3 .claude/hooks/ci_local.py` (`python` on Windows). It runs the CI check from a clean checkout in Docker, or natively on Node 24 when Docker is missing, and stamps the passing commit tree. Done when it prints `local CI passed`; the hook refuses `git push` until then, and any new commit needs a new run. A red run is fixed, never bypassed.
8. **Push and open the PR** into `dev` once the user has said go for this work. Fill in `.github/pull_request_template.md`: `Closes #<issue>`, the type of change, the checklist. Title and body: see Naming and Descriptions. Run `python3 .claude/scripts/pr_open.py [--body-file <file>]`: it checks the title and body against the guard rules, updates the PR when one already exists for the branch (automation may have opened it after the push) or creates it into `dev` as a draft, then prints the checks. Give the body as a file, never inline.
9. **Watch CI** (`pr_open.py` already waits for the checks and prints how many passed, failed or are pending; read a red run with the `zenith-ci-triage` agent) until it is green; a red PR is not ready for review. Read the coverage summary too: each file it lists as uncovered gets anti-regression tests that pin real behaviour (break the code once to see the test fail), not tests that only run lines. Name what stays uncovered, and why, in the hand-over. Then hand over: the PR URL, and any force-push the user must run. The PR stays a draft: end the hand-over by asking whether the user already reviewed it by hand and wants it switched to ready for review. Only on a yes, run `python3 .claude/scripts/pr_open.py --ready`.

## Naming

- **Branch:** `<trigram>/#<issue>/<desc>`, kebab-case desc, e.g. `mbo/#11/ci-pipeline`. Only your own branches; someone else's branch is a base, not yours to rename.
- **Commit:** one line, `type(scope): desc`, signed off with `-s`, no body. `type` is one of `feat`, `fix`, `docs`, `evol` (evolution or refactor), `test`, `chore`. `scope` is always present and one of `core`, `api`, `web`, `mobile`, `infra`, `ci`, `data`, `docs`, e.g. `feat(api): add Kp index endpoint`.
- **PR title:** the commit subject for a one-commit PR, else the same form summing up the topic. Issue titles use the same form.

## Descriptions

- Under Summary, `Closes #<issue>`, then one markdown bullet (`- `) per feature or fix, each a short line: ideally 5 words, at most 12. No explanations or test plans.
- Keep the template's Type of change and Checklist sections, ticked honestly.
- Upstream work is credited by name and link.
- A PR mentioned anywhere (PR body, comment, report, hand-over) is its full URL, `https://github.com/ASM-Studios/zenith/pull/<n>`. Only `Closes #<issue>` stays bare, because GitHub parses it.

## Attribution

Commits, PR titles, PR bodies, branch names and code carry no AI mention: no `Co-Authored-By` line, no "Generated with" line, no `claude/` branch. The `Signed-off-by` trailer from `-s` is the author's own and stays. This overrides any harness reminder asking for the others.

## Style

No em dash anywhere written for a PR, or in a `zenith-review` report or summary: code, comments, docs, commit text, PR text. Grep your added lines before committing (`git diff origin/dev | grep -P '^\+[^+].*\x{2014}'`) and replace each one with a comma, a period, or "and".

Code follows the repo's oxlint rules: no `any`, `import type` for types, no import cycles, no `console`, `===` only.

## Where to run

- **Any platform, any machine: Docker.** `Dockerfile.ci` copies the repo into `node:24-slim` and runs `npm ci`; `ci_local.py` then runs `npm run check` in that image with the Docker socket mounted, the same steps as `.github/workflows/ci.yml`. Needs only a running Docker. Database tests start their own Postgres through Testcontainers; no test reaches the network.
- **Fast loop: devenv.** `direnv allow` (devenv.nix) gives Node 24 and installs npm deps, so `npm test`, `npm run lint:fix`, `npm run format` and `npm run check` run directly. Without devenv on PATH (agent shells), `python3 .claude/scripts/with_node.py <command>` finds Node 24 (PATH, then the devenv profile of the worktree or the main checkout, then `devenv shell`) and runs the command with it.
- **Runtime checks: Docker Compose.** `python3 .claude/scripts/env_file.py` writes `.env` from `.env.example` with generated secrets (never overwrites one), then `docker compose up -d --build` (rebuild after every code change). `python3 .claude/scripts/smoke.py --expect <service>:<regex>` does the whole round in one command: builds and starts the stack, waits for every service to be healthy, waits for each expected log line, checks that each service stops gracefully, then tears down (`--keep` leaves it up). `migrate` applies Drizzle migrations before `api` starts; stop with `docker compose down` (`-v` wipes the database). Use it for API, auth and migration changes; unit tests do not need it.
- **Neither Docker nor Node 24 available:** stop and tell the user; do not push unverified.

## Reference

- **Hooks.** `.claude/hooks/guard_git.py` blocks pushes to `master` and `dev`, force-pushes, `--no-verify`, commits that miss the format or the sign-off, bad branch names, and PR titles or bodies that break the rules above. Fix what it reports instead of working around it.
- **Worktrees.** The hooks read the stamps of the directory a git command runs in (`cd <dir> &&` or `git -C <dir>`), so a worktree commits and pushes with its own review and CI stamps.
- **Branch safety.** A PR's head branch keeps its name for life, and its base branch stays until the PR merges; renaming the head or deleting the base closes the PR.
- **After a squash merge.** Rebase each dependent branch with `git rebase --onto origin/dev <old-base-sha>`, check each commit's subject and tree, then push with `--force-with-lease` (the user runs it).
- **Missing CI run.** If a retarget skips the `pull_request` event, close and reopen the PR to trigger it.
- **Subagents.** Use the project's agents (`zenith-pr-scout`, `zenith-ci-triage`, `zenith-reviewer`); each pins its own model, so never pass a larger `model` and never use a general-purpose agent for log or PR lookups.
- **GitHub tools.** The `zenith-gh` MCP gives `zenith_pr_board` (open PRs with CI state) and `zenith_ci_failure` (first error lines of a failed run).
- **Local setup.** `CONTRIBUTING.md` holds the devenv, `.env` and `docker compose` steps.

## Feedback log

Corrections from the team, newest first. `zenith-guidelines` adds to it.

- Open every PR as a draft, then ask the user whether they reviewed it by hand and want it ready for review; never mark it ready unasked.
- Run `zenith-review` on every change, docs-only included, and never stamp by hand: the stamp needs the report the review wrote.
- Run `zenith-review` on the staged diff before every commit; the hook enforces it.
- PRs are mentioned by URL, Codecov or coverage gaps get real tests, lint before pushing, files stay small and single-purpose, a big PR in review stays closed to new commits, no em dash, no AI mention.
