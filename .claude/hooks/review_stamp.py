import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import ci_stamp  # noqa: E402

REPORT_NAME = "zenith-review-report"
USAGE = "usage: review_stamp.py template | review_stamp.py <report file>"


def index_tree(cwd):
    return ci_stamp.git(cwd, "write-tree")


def staged_files(cwd):
    out = ci_stamp.git(cwd, "-c", "core.quotepath=off", "diff", "--cached", "--name-only")
    return out.splitlines() if out else []


def report_path(cwd):
    relative = ci_stamp.git(cwd, "rev-parse", "--git-path", REPORT_NAME)
    return Path(cwd or ".") / relative if relative else None


def template(cwd):
    files = "\n".join(f"- {name}" for name in staged_files(cwd))
    return f"Tree: {index_tree(cwd)}\nVerdict: <merge | merge after fixes | needs rework>\nFiles reviewed:\n{files}\nFindings:\n"


def problem(report, cwd):
    lines = report.splitlines()
    tree = index_tree(cwd)
    if f"Tree: {tree}" not in lines:
        return "the report was written for another staged tree, review the current one"
    if "Verdict: merge" not in lines:
        return "the verdict is not `merge`: fix the findings, restage and review again"
    missing = [name for name in staged_files(cwd) if f"- {name}" not in lines]
    if missing:
        return f"the report does not list the staged file {missing[0]!r}"
    if any(re.match(r"\[(Blocker|Major)\]", line) for line in lines):
        return "the report still lists a Blocker or Major finding"
    return None


def install(cwd, report):
    reason = problem(report, cwd)
    path = report_path(cwd)
    if reason is None and path:
        path.write_text(report)
    return reason


def is_fresh(cwd):
    tree, path = index_tree(cwd), report_path(cwd)
    if not tree or not path or tree == ci_stamp.head_tree(cwd):
        return True
    return path.is_file() and problem(path.read_text(), cwd) is None


def main():
    root = ci_stamp.git(".", "rev-parse", "--show-toplevel")
    if not root:
        sys.exit("not inside the Zenith git repository")
    args = sys.argv[1:]
    if args == ["template"]:
        print(template(root), end="")
        return
    if len(args) != 1 or not Path(args[0]).is_file():
        sys.exit(f"a stamp needs the report written by the zenith-review skill. {USAGE}")
    if ci_stamp.git(root, "diff", "--name-only"):
        sys.exit("unstaged changes: stage everything with git add, the report covers the staged tree")
    reason = install(root, Path(args[0]).read_text())
    if reason:
        sys.exit(f"report refused: {reason}")
    print("review recorded: commit is unlocked for this staged tree")


if __name__ == "__main__":
    main()
