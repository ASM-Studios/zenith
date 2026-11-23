import argparse
import re
import sys

from repo import git, toplevel
from with_node import run

STEPS = ["lint", "format:check", "test:coverage", "build"]
ANSI = re.compile(r"\x1b\[[0-9;]*m")
SIGNAL = re.compile(r"error|fail|warn|expected|received|✗|×", re.IGNORECASE)
TESTS = re.compile(r"^\s*Tests\s+\d.*$", re.MULTILINE)
MAX_LINES = 40


def strip_ansi(text):
    return ANSI.sub("", text)


def signal_lines(output, limit=MAX_LINES):
    lines = [line.rstrip() for line in strip_ansi(output).splitlines() if line.strip() and not line.startswith("> ")]
    hits = [line for line in lines if SIGNAL.search(line)]
    return list(dict.fromkeys(hits or lines[-limit:]))[:limit]


def test_count(output):
    match = TESTS.search(strip_ansi(output))
    return " ".join(match.group(0).split()) if match else None


def coverage_gaps(markdown):
    gaps = {}
    for row in markdown.splitlines():
        if row.startswith("| `"):
            path, pct, ranges = (cell.strip() for cell in row.strip().strip("|").split("|"))
            gaps[path.strip("`")] = f"{pct} lines, uncovered {ranges}"
    return gaps


def changed_files(root, base):
    tracked = git(root, "diff", "--name-only", base) or ""
    untracked = git(root, "ls-files", "--others", "--exclude-standard") or ""
    return set((tracked + "\n" + untracked).split())


def report_coverage(root, scope):
    done = run(["node", ".github/scripts/coverage-summary.mjs"], cwd=root, capture_output=True, text=True)
    gaps = coverage_gaps(done.stdout)
    if scope is not None:
        gaps = {path: gap for path, gap in gaps.items() if path in scope}
    label = "changed files" if scope is not None else "all files"
    if not gaps:
        print(f"coverage: {label} fully covered")
    for path, gap in gaps.items():
        print(f"coverage gap: {path}: {gap}")


def main():
    parser = argparse.ArgumentParser(description="npm run check with a short report")
    parser.add_argument("--all", action="store_true", help="list coverage gaps for every file")
    parser.add_argument("--base", default="origin/dev", help="branch the changed files are compared to")
    args = parser.parse_args()
    root = toplevel()
    if not root:
        sys.exit("not inside the Zenith git repository")
    tests = None
    for step in STEPS:
        done = run(["npm", "run", step], cwd=root, capture_output=True, text=True)
        output = done.stdout + done.stderr
        if done.returncode != 0:
            print(f"check failed at {step}:")
            print("\n".join(signal_lines(output)))
            sys.exit(1)
        tests = test_count(output) if step == "test:coverage" else tests
    print(f"check passed: {tests or 'no test count found'}")
    report_coverage(root, None if args.all else changed_files(root, args.base))


if __name__ == "__main__":
    main()
