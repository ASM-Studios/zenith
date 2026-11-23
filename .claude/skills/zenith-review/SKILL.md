---
name: zenith-review
description: Review a Zenith pull request or diff for bugs and team conventions. Use when asked to review, check, audit or give feedback on a PR, branch or diff in the Zenith repo.
---

# Review a Zenith PR

A review finds the defects a merge would ship: wrong behaviour, leaked secrets, broken contracts between packages. Each finding is *verified*: it names the file and line, the input or state that triggers it, and what goes wrong. Style nits come last and never hide a bug.

## Steps

1. **Check out the PR away from the user's checkout.** Fetch the head (`git fetch origin pull/<n>/head:review/pr-<n>`) into a worktree (`git worktree add <dir> review/pr-<n>`). Done when `git log --oneline origin/dev..HEAD` lists the PR's commits.
2. **Read the intent.** Read the title, the body, the linked issue and every commit subject (`gh pr view <n> -R ASM-Studios/zenith`). Done when you can say in one line what the PR should do and what it must not break.
3. **Read the whole diff, then the code around it.** Use `git diff <merge-base>..HEAD`, file by file. For each changed function, open its callers and callees. Done when every changed file has been read and every changed public name (export, route, config key, env var, DB column) has been traced to all its users with `git grep`.
4. **Hunt by category** (see Checklist). Write each suspicion down with its file and line.
5. **Verify each suspicion.** Prove it with the code path, a quick test or `python3 .claude/hooks/ci_local.py` (Docker or Node 24, any platform; see `zenith-pr`, Where to run). Mark each finding **Confirmed** (reproduced or follows from the code without assumptions) or **Plausible** (depends on an assumption you name). Drop the ones you disproved. Done when every remaining finding has a concrete failure scenario.
6. **Check the conventions** against `zenith-pr` (Naming, Descriptions, Style, Attribution, file size and SRP). A broken convention is a finding of its own, ranked below the bugs.
7. **Report** (see Report). Post comments on GitHub only when the user says go.
8. **Summarize for the PR comment** (see Summary). Always the last step: hand the user something short enough to paste as a review comment, not the full report.

## Checklist

- **Secrets and auth.** `PASSWORD_PEPPER`, `BETTER_AUTH_SECRET` and other env values never reach logs, responses or the repo; `.env.example` holds placeholders only. Session and password paths (`apps/api/src/lib/auth.ts`, `password.ts`) keep their guarantees.
- **Database.** A schema change in `apps/api/src/db/schema` ships its Drizzle migration in `apps/api/drizzle`, and `docs/database.md` matches. Migrations apply on an existing database, not only an empty one.
- **Contracts.** Types and function signatures shared by `packages/core`, `apps/api` and the clients match on both sides; a field one side writes has a reader on the other. `packages/core` stays pure: no I/O, no network, no clock without an injected source.
- **Error paths.** Bad input is rejected with a message that names the field; a failed upstream call (weather, space weather) is reported and recovered from, not crashed on or silently ignored.
- **Lifecycle.** Connections, jobs and timers started have a matching stop; the Docker stack still boots (`docker compose up -d --build`).
- **Tests and CI.** New logic has a test that would fail without it; external APIs are mocked; no test hits the network; CI is green; files the coverage summary lists as uncovered have tests that would catch a regression; `packages/core` stays at or above its 90% threshold.
- **No em dash.** No added line, in code, comments or docs, introduces an em dash; grep the diff's added lines (`git diff <merge-base>..HEAD | grep -P '^\+[^+].*\x{2014}'`) and flag any hit as a convention finding.

## Report

Lead with the verdict: **merge**, **merge after fixes** or **needs rework**, in one line. Then the findings, most severe first, each as:

```
[Severity] file:line - what is wrong (Confirmed|Plausible)
  Trigger: the input or state that sets it off
  Effect: what the user or the system sees
  Fix: the smallest change that removes it
```

Severity: **Blocker** (leaked secret, data loss, crash, broken contract), **Major** (wrong behaviour on a realistic path), **Minor** (edge case, missing test, convention). End with one line on what you did not check (no Docker run, a client not built). No em dash anywhere in the report or summary (see `zenith-pr` Style), template line included.

## Summary

After the full Report, compress it into a comment-ready summary: the verdict in one line, then only the Confirmed/Plausible **Blocker** and **Major** findings, each in a line or two (file:line, what's wrong, effect). Drop the Minor list, the convention notes and the "not checked" line, and offer them only if the user asks for more detail.

Put the summary in a plain fenced code block (no language tag), never a markdown blockquote.

## Reference

- **Effort.** A small PR gets one careful pass. A PR over ~500 changed lines can fan out one `zenith-reviewer` agent per area (api, core, web, mobile, infra), then merge and re-verify their findings yourself. Use the project's agents as they are: never pass a `model` that overrides the one they pin.
- **Diff noise.** Skip generated files and lockfiles (`package-lock.json`, `drizzle/meta`) unless the PR is about them; say that you skipped them.
- **Chained PRs.** Review only the commits above the base PR; the base has its own review.

## Feedback log

Corrections from the team, newest first. `zenith-guidelines` adds to it.

- The summary goes in a plain fenced code block, because a blockquote's left bar copies out as a stray `|` per line.
