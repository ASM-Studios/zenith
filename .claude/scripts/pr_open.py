import argparse
import json
import re
import sys
import time
from pathlib import Path

from repo import REPO, RULES, check_pr, gh, git, toplevel

PASSING = {"SUCCESS", "NEUTRAL", "SKIPPED"}
UNFINISHED = {"", "PENDING", "EXPECTED"}
POLL_SECONDS = 15


def issue_of(branch):
    if not re.match(RULES["branch_pattern"], branch):
        return None
    return int(branch.split("/")[1][1:])


def summarize(rollup):
    passed, failed, pending = 0, [], 0
    for item in rollup:
        outcome = item.get("conclusion") or item.get("state") or ""
        if item.get("status", "COMPLETED") != "COMPLETED" or outcome in UNFINISHED:
            pending += 1
        elif outcome in PASSING:
            passed += 1
        else:
            failed.append(item.get("name") or item.get("context") or "check")
    return passed, failed, pending


def find_pr(branch):
    done = gh("pr", "list", "-R", REPO, "--head", branch, "--state", "open", "--json", "number,url")
    prs = json.loads(done.stdout or "[]")
    return prs[0] if prs else None


def rollup(number):
    done = gh("pr", "view", str(number), "-R", REPO, "--json", "statusCheckRollup", "--jq", ".statusCheckRollup")
    return json.loads(done.stdout or "[]")


def wait_checks(number, timeout):
    deadline = time.monotonic() + timeout
    while True:
        passed, failed, pending = summarize(rollup(number))
        started = passed + len(failed) + pending > 0
        if (started and not pending) or time.monotonic() > deadline:
            return passed, failed, pending
        time.sleep(POLL_SECONDS)


def open_or_update(branch, title, body, body_file):
    pr = find_pr(branch)
    if pr and body_file:
        gh("pr", "edit", str(pr["number"]), "-R", REPO, "--body-file", body_file)
    if pr:
        return pr, "updated" if body_file else "exists"
    done = gh("pr", "create", "-R", REPO, "--draft", "--base", "dev", "--head", branch, "--title", title, "--body", body)
    pr = find_pr(branch)
    if not pr:
        sys.exit(done.stderr.strip() or "gh pr create failed")
    return pr, "created"


def mark_ready(branch):
    pr = find_pr(branch)
    if not pr:
        sys.exit("no open PR for this branch")
    done = gh("pr", "ready", str(pr["number"]), "-R", REPO)
    if done.returncode != 0:
        sys.exit(done.stderr.strip() or "gh pr ready failed")
    return pr


def main():
    parser = argparse.ArgumentParser(description="Open or update the PR of the current branch and report its checks")
    parser.add_argument("--title", help="defaults to the last commit subject")
    parser.add_argument("--body-file", help="defaults to `Closes #<issue>` for a new PR")
    parser.add_argument("--ready", action="store_true", help="mark the open PR ready for review and stop")
    parser.add_argument("--no-wait", action="store_true")
    parser.add_argument("--timeout", type=int, default=300, help="seconds to wait for the checks")
    args = parser.parse_args()
    root = toplevel()
    if not root:
        sys.exit("not inside the Zenith git repository")
    branch = git(root, "branch", "--show-current") or ""
    issue = issue_of(branch)
    if not issue:
        sys.exit(f"branch {branch!r} does not match <trigram>/#<issue>/<desc>")
    if not git(root, "ls-remote", "--heads", "origin", branch):
        sys.exit("branch not pushed: run ci_local.py, then push it")
    if args.ready:
        print(f"pr ready: {mark_ready(branch)['url']}")
        return
    title = args.title or git(root, "log", "-1", "--format=%s")
    body = Path(args.body_file).read_text() if args.body_file else f"Closes #{issue}\n"
    problem = check_pr(["--title", title, "--body", body])
    if problem:
        sys.exit(f"{problem[0]}. {problem[1]}")
    pr, action = open_or_update(branch, title, body, args.body_file)
    print(f"pr {action}: {pr['url']}")
    if args.no_wait:
        return
    passed, failed, pending = wait_checks(pr["number"], args.timeout)
    print(f"checks: {passed} passed, {len(failed)} failed, {pending} pending")
    for name in failed:
        print(f"failed: {name}")
    sys.exit(1 if failed or pending else 0)


if __name__ == "__main__":
    main()
