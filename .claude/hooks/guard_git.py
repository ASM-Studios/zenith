import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import ci_stamp  # noqa: E402
import review_stamp  # noqa: E402
import size_rules  # noqa: E402
from gh_rules import check_pr  # noqa: E402
from git_message import commit_messages, forbidden_in  # noqa: E402
from hookio import RULES, block, command_of, read_payload, split_segments  # noqa: E402
from shell_text import command_text  # noqa: E402
from workdir import git_directory, resolve, strip_global_options  # noqa: E402

PROTECTED = RULES["protected_branches"]


def current_branch(cwd):
    try:
        out = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=cwd or None, capture_output=True, text=True, timeout=5,
        )
        return out.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        return ""


def check_push(args, cwd):
    if "--no-verify" in args:
        return ("push with --no-verify", "Let the hooks run.")
    if any(a in ("-f", "--force", "--force-with-lease") or a.startswith("--force") for a in args):
        return ("force-push", "Hand the force-push to the user in your report.")
    refs = [a for a in args if not a.startswith("-")]
    targets = [r.split(":")[-1].removeprefix("refs/heads/") for r in refs[1:]]
    if any(r.startswith("+") for r in refs):
        return ("force-push", "Hand the force-push to the user in your report.")
    if any(t in PROTECTED for t in targets) or (not targets and current_branch(cwd) in PROTECTED):
        return ("push to a protected branch", "Push your own branch and open a PR.")
    oversized = size_rules.size_problems(cwd, ["origin/dev...HEAD"], "HEAD")
    if oversized:
        return oversized[0]
    if not ci_stamp.is_fresh(cwd):
        return (
            "push without a passing local CI run on this commit",
            "Run `python3 .claude/hooks/ci_local.py` (Docker or Node 24, any platform), then push.",
        )
    return None


def has_signoff(args):
    return any(a in ("-s", "--signoff") or (a.startswith("-") and not a.startswith("--") and "s" in a[1:]) for a in args)


def stages_everything(args):
    return any(a == "--all" or (a.startswith("-") and not a.startswith("--") and "a" in a[1:]) for a in args)


def check_commit(args, cwd=""):
    if "--no-verify" in args or "-n" in args:
        return ("commit with --no-verify", "Fix what the hooks report.")
    for message in commit_messages(args):
        bad = forbidden_in(message)
        if bad:
            return (f"commit text contains {bad!r}", "Remove it, no AI attribution and no em dash.")
        lines = [line for line in message.splitlines() if line.strip()]
        subject = lines[0] if lines else ""
        trailers_only = all(line.startswith("Signed-off-by:") for line in lines[1:])
        if not re.match(RULES["commit_pattern"], subject) or not trailers_only:
            return ("commit message format", "One line: `type(scope): desc`, no body, type in feat|fix|docs|evol|test|chore, scope in core|api|web|mobile|infra|ci|data|docs.")
    if not has_signoff(args):
        return ("commit without sign-off", "Add `-s` (git commit -s).")
    if stages_everything(args):
        return ("commit with -a", "Stage with `git add`, review the staged diff, then commit.")
    if not review_stamp.is_fresh(cwd):
        return (
            "commit without a zenith-review of the staged diff",
            "Run the `zenith-review` skill on `git diff --cached`, fix what it finds, then `python3 .claude/hooks/review_stamp.py`.",
        )
    return None


def new_branch_name(sub, args):
    if sub == "checkout" and "-b" in args:
        return args[args.index("-b") + 1] if args.index("-b") + 1 < len(args) else None
    if sub == "switch" and ("-c" in args or "--create" in args):
        flag = "-c" if "-c" in args else "--create"
        return args[args.index(flag) + 1] if args.index(flag) + 1 < len(args) else None
    if sub == "worktree" and args[:1] == ["add"] and "-b" in args:
        return args[args.index("-b") + 1] if args.index("-b") + 1 < len(args) else None
    return None


def check_git(args, cwd):
    cwd = git_directory(args, cwd)
    args = strip_global_options(args)
    if not args:
        return None
    sub, rest = args[0], args[1:]
    if sub == "push":
        return check_push(rest, cwd)
    if sub == "commit":
        return check_commit(rest, cwd)
    name = new_branch_name(sub, rest)
    if name and not re.match(RULES["branch_pattern"], name):
        return ("branch name format", "Name it `<trigram>/#<issue>/<desc>`, e.g. `mbo/#11/ci-pipeline`.")
    return None


def check(command, cwd=""):
    for segment in split_segments(command_text(command)):
        if segment[0] == "cd" and len(segment) > 1:
            cwd = resolve(cwd, segment[1])
            continue
        if segment[0] == "git":
            verdict = check_git(segment[1:], cwd)
        elif segment[0] == "gh" and segment[1:3] in (["pr", "create"], ["pr", "edit"]):
            verdict = check_pr(segment[3:])
        else:
            verdict = None
        if verdict:
            return verdict
    return None


if __name__ == "__main__":
    payload = read_payload()
    command = command_of(payload)
    if "git" in command or "gh" in command:
        verdict = check(command, payload.get("cwd", ""))
        if verdict:
            block(*verdict)
