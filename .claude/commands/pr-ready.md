---
description: Check the current branch against the zenith-pr checklist and list the gaps
allowed-tools: Bash(git diff:*), Bash(git log:*), Bash(git status:*), Bash(gh pr view:*), Bash(gh pr checks:*)
---
Follow the `zenith-pr` skill on the current branch without changing anything: base `dev`, branch and commit names, sign-off, file sizes under ~200 lines, tests for new logic with external APIs mocked, `npm run check`, em dash in added lines, PR title, template and `Closes #<issue>`, CI and coverage. Report only the gaps, one line each.
