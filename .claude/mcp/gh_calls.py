import json
import os
import re
import shlex
import subprocess
from pathlib import Path

ORG = "ASM-Studios"
REPOS = json.loads((Path(__file__).parent / "repos.json").read_text())
ERROR_LINE = re.compile(r"error|fail|timed out|traceback|assert", re.I)


def gh(*args):
    command = shlex.split(os.environ.get("ZENITH_GH", "gh"))
    done = subprocess.run([*command, *args], capture_output=True, text=True, timeout=60)
    if done.returncode:
        raise RuntimeError(done.stderr.strip()[:300] or "gh failed")
    return done.stdout


def ci_state(rollup):
    states = [c.get("conclusion") or c.get("status") or "" for c in rollup or []]
    if any(s in ("FAILURE", "TIMED_OUT", "CANCELLED", "STARTUP_FAILURE") for s in states):
        return "red"
    if any(s in ("IN_PROGRESS", "QUEUED", "PENDING", "") for s in states):
        return "pending"
    return "green" if states else "none"


def pr_board(author="@me"):
    board = []
    for repo in REPOS:
        out = gh(
            "pr", "list", "-R", f"{ORG}/{repo}", "--author", author, "--state", "open",
            "--json", "url,title,baseRefName,isDraft,statusCheckRollup",
        )
        for pr in json.loads(out or "[]"):
            board.append(
                {
                    "url": pr["url"],
                    "title": pr["title"],
                    "base": pr["baseRefName"],
                    "draft": pr["isDraft"],
                    "ci": ci_state(pr["statusCheckRollup"]),
                }
            )
    return board


def ci_failure(repo, run_id, max_lines=12):
    log = gh("run", "view", str(run_id), "-R", f"{ORG}/{repo}", "--log-failed")
    lines = [line.split("\t", 2) for line in log.splitlines()]
    hits = [f"{p[0]} | {p[2][:200]}" for p in lines if len(p) == 3 and ERROR_LINE.search(p[2])]
    return {"run": run_id, "first_errors": hits[:max_lines]}
