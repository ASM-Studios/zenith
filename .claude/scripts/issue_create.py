import argparse
import re
import sys
from pathlib import Path

from repo import REPO, RULES, forbidden_in, gh


def check_issue(title, body):
    if not re.match(RULES["pr_title_pattern"], title):
        return "title must be `type(scope): desc` with the commit types and scopes"
    bad = forbidden_in(title) or forbidden_in(body)
    return f"text contains {bad!r}" if bad else None


def number_of(url):
    return int(url.strip().rstrip("/").rsplit("/", 1)[1])


def normalized(text):
    return text.replace("\r\n", "\n").strip()


def body_matches(number, body):
    shown = gh("issue", "view", str(number), "-R", REPO, "--json", "body", "--jq", ".body")
    return normalized(shown.stdout) == normalized(body)


def link_parent(number, parent):
    child = gh("api", f"repos/{REPO}/issues/{number}", "--jq", ".id")
    done = gh("api", "-X", "POST", f"repos/{REPO}/issues/{parent}/sub_issues", "-F", f"sub_issue_id={child.stdout.strip()}")
    return done.returncode == 0


def main():
    parser = argparse.ArgumentParser(description="Create an issue from a body file and check how it renders")
    parser.add_argument("title", help="type(scope): desc")
    parser.add_argument("--body-file", required=True)
    parser.add_argument("--label", action="append", default=[])
    parser.add_argument("--parent", type=int, help="issue number to attach this one to as a sub-issue")
    args = parser.parse_args()
    body = Path(args.body_file).read_text()
    problem = check_issue(args.title, body)
    if problem:
        sys.exit(problem)
    labels = [part for label in args.label for part in ("--label", label)]
    done = gh("issue", "create", "-R", REPO, "--title", args.title, "--body-file", args.body_file, *labels)
    if done.returncode != 0:
        sys.exit(done.stderr.strip() or "gh issue create failed")
    url = done.stdout.strip().splitlines()[-1]
    number = number_of(url)
    print(f"issue {url}")
    print("body ok" if body_matches(number, body) else "body differs from the file, check the rendering")
    if args.parent:
        print(f"sub-issue of #{args.parent}" if link_parent(number, args.parent) else f"could not attach to #{args.parent}")


if __name__ == "__main__":
    main()
