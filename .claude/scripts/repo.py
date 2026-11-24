import subprocess
import sys
from pathlib import Path

HOOKS = Path(__file__).resolve().parent.parent / "hooks"
sys.path.insert(0, str(HOOKS))

from ci_stamp import git  # noqa: E402
from gh_rules import check_pr  # noqa: E402
from git_message import forbidden_in  # noqa: E402
from hookio import RULES  # noqa: E402
from size_rules import size_problems  # noqa: E402

REPO = "ASM-Studios/zenith"

__all__ = ["REPO", "RULES", "check_pr", "forbidden_in", "gh", "git", "main_checkout", "size_problems", "toplevel"]


def gh(*args):
    return subprocess.run(["gh", *args], capture_output=True, text=True)


def toplevel(cwd="."):
    root = git(cwd, "rev-parse", "--show-toplevel")
    return Path(root) if root else None


def main_checkout(cwd="."):
    common = git(cwd, "rev-parse", "--path-format=absolute", "--git-common-dir")
    return Path(common).parent if common else None
