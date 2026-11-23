import re
from pathlib import Path

from git_message import forbidden_in
from hookio import RULES


def option(args, names):
    for i, arg in enumerate(args):
        for name in names:
            if arg == name and i + 1 < len(args):
                return args[i + 1]
            if arg.startswith(name + "="):
                return arg.split("=", 1)[1]
    return None


CHECKBOX = re.compile(r"^- \[[ xX]\]")
CLOSES = re.compile(r"^Closes #[0-9]+$", re.M)


def check_body(body):
    if not CLOSES.search(body):
        return ("PR body without issue link", "Add a `Closes #<issue>` line.")
    for line in body.splitlines():
        if not line.startswith("- ") or CHECKBOX.match(line):
            continue
        if len(line[2:].split()) > RULES["max_bullet_words"]:
            return (
                f"PR bullet over {RULES['max_bullet_words']} words",
                "Shorten it, ideally 5 words.",
            )
    return None


def check_pr(args):
    title = option(args, ["--title", "-t"])
    body = option(args, ["--body", "-b"])
    body_file = option(args, ["--body-file", "-F"])
    if body is None and body_file and Path(body_file).is_file():
        body = Path(body_file).read_text()
    if title is not None and not re.match(RULES["pr_title_pattern"], title):
        return ("PR title format", "Use `type(scope): desc`, same types and scopes as commits.")
    for text in (title, body):
        bad = forbidden_in(text or "")
        if bad:
            return (f"PR text contains {bad!r}", "Remove it, no AI attribution and no em dash.")
    return check_body(body) if body else None
