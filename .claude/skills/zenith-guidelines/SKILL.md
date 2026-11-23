---
name: zenith-guidelines
description: Update the Zenith AI guidelines. Use when someone corrects the agent, is unhappy with how it worked, repeats an earlier request, states a rule ("always", "never", "from now on"), or asks to share or improve the guidelines.
---

# Keep the guidelines current

The guidelines live in this repo: `CLAUDE.md` and `.claude/` (skills, agents, commands, hooks, MCP). A correction is a *lesson*: once one person teaches it, every agent on the team should know it.

## Steps

1. **Capture the lesson.** Write down what the person said (their words, short), what you did, and what they wanted instead. Done when the lesson fits in one positive sentence ("Files stay under ~200 lines"), not a ban.
2. **Choose its home.** Team convention (how we name, commit, review, test, write code) goes in this repo. Personal preference or one-off context goes in the agent's local memory. When unsure, ask the user in one question.
3. **Find the skill.** Pick the skill whose trigger covers the lesson (`zenith-pr` for code and PRs, `zenith-review` for reviews, `zenith-dev-fix` for regressions, this skill for the process itself). Always-on rules go in `CLAUDE.md`. A lesson with a distinct trigger of its own becomes a new skill in `.claude/skills/<name>/SKILL.md`, listed in `CLAUDE.md`. A rule a hook can enforce also goes in `.claude/hooks/rules.json` with a case in `.claude/tests`.
4. **Edit the rule in place.** Change the step or reference line the lesson touches, so each rule lives in one place. Add one line to that skill's feedback log with the person's words. Keep each `SKILL.md` under ~150 lines; move long reference to a sibling file the skill points to.
5. **Open the PR** with `zenith-pr` once the user says go: branch `<trigram>/#<issue>/guidelines-<topic>`, commit `docs(docs): <lesson>` (`evol(ci)` when a hook changes), signed off. Body: `Closes #<issue>` and one bullet per lesson.
6. **Report.** Give the PR URL and tell the user teammates get the change when it merges to `dev` and they pull.

## Reference

- **Writing rules.** State the behaviour you want; a ban alone drags the banned behaviour into focus. Give each step a checkable "Done when". Cut lines an agent already follows by default.
- **Layout.** `CLAUDE.md` is the index and the always-on rules; `.claude/skills/<name>/SKILL.md` one skill each; `.claude/settings.json` wires the hooks and the MCP server.
- **Hook tests.** `python3 -m unittest discover -s .claude/tests` must pass before the PR.

## Feedback log

Corrections from the team, newest first. This skill adds to every skill's log.

- Zenith's own branch norm is `<trigram>/#<issue>/<desc>`.
