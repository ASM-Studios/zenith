---
name: zenith-dev-fix
description: Fix a break on dev together with the test that catches it. Use when something that worked is broken on the Zenith dev branch, a regression is reported, or a merged PR broke another module.
---

# Fix dev with a regression test

A break that reached `dev` is a hole in CI. The fix is only done when CI would have stopped the break: every fix ships with a *regression test* that goes **red** on the broken code and **green** on the fix.

## Steps

1. **Reproduce.** Get the break in a test or a local run, with the exact symptom (log line, wrong value, failing request). For a runtime break, `python3 .claude/scripts/smoke.py --expect <service>:<regex>` starts the stack and reports which service fails, stops badly or never logs the expected line. Done when you can trigger it on demand.
2. **Find the root cause.** Bisect (`git bisect`) or read the merged PRs since the last green run. Done when you can name the commit that broke it and the module the fix belongs in.
3. **Write the test first.** Put it next to the module (`*.test.ts`, picked up by `vitest.config.ts`), named after the behaviour it protects. Mock external APIs; never use the network. Done when the test fails on current `dev` with a message that names the break.
4. **Fix.** Change the root cause, not the symptom, in the shared code every caller goes through.
5. **Prove both colours.** Run the test against the broken code (red) and the fixed code (green), and quote both results in your report. `python3 .claude/scripts/check_summary.py` gives each colour in a few lines. Then run `python3 .claude/hooks/ci_local.py` (see `zenith-pr`, Where to run), which pushing requires anyway.
6. **Open the PR** with `zenith-pr`, from a `<trigram>/#<issue>/<desc>` branch into `dev`: test commit first, then the fix commit.
7. **Close the gap.** Name, in one line of the report, why CI missed it (no test for that path, test too lenient, mocked away the real behaviour). Done when that answer and the new test match.

## Reference

- **Flaky versus broken.** A test that fails without the bug is worse than no test: wait on states, not sleeps, and inject the clock instead of reading it.
- **Fault injection.** Breaks that come from real-world faults (upstream API error or timeout, malformed payload, database unavailable) get a test that injects that fault, so the fault keeps being tested.

## Feedback log

Corrections from the team, newest first. `zenith-guidelines` adds to it.
