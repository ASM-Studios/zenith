from fnmatch import fnmatch
from pathlib import PurePosixPath

from ci_stamp import git
from hookio import RULES

CODE_SUFFIXES = {".ts", ".tsx", ".js", ".py"}
SPLIT_FIX = "Split it: one sub-issue of the issue per sub-PR (issue_create.py --parent <n>), see zenith-pr, Split PRs."


def parse_numstat(text):
    entries = []
    for line in text.splitlines():
        added, removed, path = line.split("\t", 2)
        if added != "-":
            entries.append((int(added), int(removed), path))
    return entries


def counted(entries):
    return [e for e in entries if not any(fnmatch(e[2], pattern) for pattern in RULES["size_exempt"])]


def total_lines(entries):
    return sum(added + removed for added, removed, _ in entries)


def grown_code_files(entries):
    return [path for added, removed, path in entries if added > removed and PurePosixPath(path).suffix in CODE_SUFFIXES]


def line_count(cwd, tree, path):
    content = git(cwd, "show", f"{tree}:{path}")
    return len(content.splitlines()) if content else 0


def size_problems(cwd, diff_args, tree=""):
    numstat = git(cwd, "diff", "--numstat", "--no-renames", *diff_args)
    entries = counted(parse_numstat(numstat or ""))
    problems = []
    if total_lines(entries) > RULES["max_pr_lines"]:
        problems.append((f"diff of {total_lines(entries)} lines, limit {RULES['max_pr_lines']}", SPLIT_FIX))
    for path in grown_code_files(entries):
        length = line_count(cwd, tree, path)
        if length > RULES["max_file_lines"]:
            problems.append((f"{path} has {length} lines, limit {RULES['max_file_lines']}", SPLIT_FIX))
    return problems
