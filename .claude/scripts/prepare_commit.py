import argparse
import subprocess
import sys
from pathlib import Path

from diff_scan import forbidden_hits
from repo import git, size_problems, toplevel

CHECK = Path(__file__).with_name("check_summary.py")


def main():
    parser = argparse.ArgumentParser(description="Check, stage and scan the work before a commit")
    parser.add_argument("paths", nargs="*", help="files to stage, default: everything")
    parser.add_argument("--skip-check", action="store_true", help="skip check_summary.py")
    args = parser.parse_args()
    root = toplevel()
    if not root:
        sys.exit("not inside the Zenith git repository")
    if not args.skip_check and subprocess.run([sys.executable, str(CHECK)], cwd=root).returncode != 0:
        sys.exit(1)
    subprocess.run(["git", "add", *(args.paths or ["-A"])], cwd=root, check=True)
    diff = git(root, "diff", "--cached")
    if not diff:
        sys.exit("nothing staged")
    print(git(root, "diff", "--cached", "--stat"))
    hits = forbidden_hits(diff)
    for hit in hits:
        print(f"forbidden text: {hit}")
    oversized = size_problems(root, ["--cached"])
    for rule, fix in oversized:
        print(f"size: {rule}. {fix}")
    if hits or oversized:
        sys.exit(1)
    print("next: zenith-review on `git diff --cached`, then python3 .claude/hooks/review_stamp.py <report file>")


if __name__ == "__main__":
    main()
