import argparse
import json
import re
import subprocess
import sys
from itertools import combinations

from diff_scan import forbidden_hits, message_hits
from repo import REPO, RULES, check_pr, gh, git, toplevel


def fetch(root, number):
    ref = f"refs/review/pr-{number}"
    done = subprocess.run(["git", "fetch", "-q", "--no-prune", "origin", f"+pull/{number}/head:{ref}"], cwd=root, capture_output=True)
    return ref if done.returncode == 0 else None


def commit_problems(subjects):
    return [f"commit subject format: {s!r}" for s in subjects if not re.match(RULES["commit_pattern"], s)]


def empty_problems(subjects):
    return [] if subjects else ["no commit above the base, already merged or wrong --base"]


def parse_conflicts(output):
    files = []
    for line in output.splitlines()[1:]:
        if not line.strip():
            break
        files.append(line.strip())
    return files


def conflicts(root, refs):
    found = []
    for (first, ref_a), (second, ref_b) in combinations(refs.items(), 2):
        done = subprocess.run(
            ["git", "merge-tree", "--write-tree", "--name-only", ref_a, ref_b],
            cwd=root,
            capture_output=True,
            text=True,
        )
        if done.returncode == 1:
            found.append(f"#{first} and #{second} conflict in {', '.join(parse_conflicts(done.stdout))}")
    return found


def inspect(root, number, ref, base):
    meta = json.loads(gh("pr", "view", str(number), "-R", REPO, "--json", "title,body").stdout)
    span = f"{base}..{ref}"
    subjects = (git(root, "log", "--format=%s", span) or "").splitlines()
    problems = empty_problems(subjects) + commit_problems(subjects) + message_hits(root, span)
    rule = check_pr(["--title", meta["title"], "--body", meta["body"] or ""])
    problems += [f"{rule[0]}. {rule[1]}"] if rule else []
    problems += forbidden_hits(git(root, "diff", f"{base}...{ref}") or "")
    stat = git(root, "diff", "--shortstat", f"{base}...{ref}") or "no diff"
    print(f"#{number} {meta['title']}: {len(subjects)} commits, {stat}")
    for problem in problems or ["no finding"]:
        print(f"  - {problem}")
    return problems


def main():
    parser = argparse.ArgumentParser(description="Mechanical review pass over one or more PRs")
    parser.add_argument("numbers", type=int, nargs="+")
    parser.add_argument("--base", default="origin/dev")
    args = parser.parse_args()
    root = toplevel()
    if not root:
        sys.exit("not inside the Zenith git repository")
    refs = {}
    for number in args.numbers:
        ref = fetch(root, number)
        if ref:
            refs[number] = ref
        else:
            print(f"#{number}: fetch failed")
    problems = [p for number, ref in refs.items() for p in inspect(root, number, ref, args.base)]
    clashes = conflicts(root, refs)
    for clash in clashes:
        print(clash)
    print("no merge conflict between the PRs" if not clashes and len(refs) > 1 else "")
    sys.exit(1 if problems or clashes or len(refs) < len(args.numbers) else 0)


if __name__ == "__main__":
    main()
