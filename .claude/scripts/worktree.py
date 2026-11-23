import argparse
import re
import subprocess
import sys

from env_file import ensure_env
from repo import RULES, git, main_checkout
from with_node import run

BRANCH = re.compile(RULES["branch_pattern"])


def branch_name(trigram, issue, desc):
    branch = f"{trigram}/#{issue}/{desc}"
    if not BRANCH.match(branch):
        sys.exit(f"invalid branch {branch!r}: trigram is 3 lowercase letters, desc is kebab-case")
    return branch


def worktree_path(checkout, issue):
    return checkout.parent / f"{checkout.name}-worktrees" / str(issue)


def install(path):
    done = run(["npm", "ci", "--no-audit", "--no-fund"], cwd=path, capture_output=True, text=True)
    if done.returncode != 0:
        print("\n".join((done.stdout + done.stderr).splitlines()[-20:]))
        sys.exit("npm ci failed")
    return "npm ci done"


def main():
    parser = argparse.ArgumentParser(description="Create the worktree and branch for an issue")
    parser.add_argument("issue", type=int)
    parser.add_argument("desc", help="kebab-case description, e.g. kp-endpoint")
    parser.add_argument("--trigram", help="defaults to git config zenith.trigram")
    parser.add_argument("--base", default="origin/dev")
    parser.add_argument("--no-fetch", action="store_true")
    parser.add_argument("--no-install", action="store_true")
    args = parser.parse_args()
    checkout = main_checkout()
    if not checkout:
        sys.exit("not inside the Zenith git repository")
    trigram = args.trigram or git(checkout, "config", "zenith.trigram")
    if not trigram:
        sys.exit("pass --trigram or run: git config zenith.trigram <abc>")
    branch = branch_name(trigram, args.issue, args.desc)
    path = worktree_path(checkout, args.issue)
    if path.exists():
        sys.exit(f"{path} already exists")
    if not args.no_fetch and subprocess.run(["git", "fetch", "-q", "origin", "dev"], cwd=checkout).returncode != 0:
        print(f"fetch failed, using the local {args.base}")
    added = subprocess.run(["git", "worktree", "add", "-q", "-b", branch, str(path), args.base], cwd=checkout)
    if added.returncode != 0:
        sys.exit("git worktree add failed")
    env, _ = ensure_env(path)
    print(f"worktree {path} on {branch} from {args.base}")
    print(f"env {env} with generated secrets")
    print("npm ci skipped" if args.no_install else install(path))


if __name__ == "__main__":
    main()
