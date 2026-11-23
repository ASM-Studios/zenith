---
description: Explain a failing CI run or PR checks in at most 15 lines
argument-hint: <run-url | run-id | pr-url>
allowed-tools: Bash(gh run view:*), Bash(gh pr checks:*)
---
Spawn the `zenith-ci-triage` agent on $ARGUMENTS and relay its report unchanged.
