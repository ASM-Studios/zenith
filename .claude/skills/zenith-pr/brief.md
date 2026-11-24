# Task brief

The lead fills this brief for each part of a delegated PR and gives it to one sub-agent. The agent touches nothing outside its owned files.

## Goal

<one sentence: what this part must achieve>

## Files you own (exclusive)

- <path>

## Files you may read (read-only)

- <path>

## Interfaces to respect

- <signature, name or type the other parts rely on>

## Tests to add

- <test name that states the behaviour it checks>

## Acceptance command

<command that must pass before you report>

## Rules

- No comments or docstrings.
- Files stay at most 200 lines, one responsibility per file.
- Tests never reach the network; external APIs are mocked.
- No em dash in anything you write.
- No commits.

## Report format

- Files changed: <list>
- Acceptance command: <pass or fail, with its last output line>
- Not done: <anything left open, or "nothing">
