import sys
from pathlib import Path

HOOKS = Path(__file__).resolve().parent.parent / "hooks"
sys.path.insert(0, str(HOOKS))

from ci_stamp import git  # noqa: E402
from hookio import RULES  # noqa: E402

__all__ = ["RULES", "git", "main_checkout", "toplevel"]


def toplevel(cwd="."):
    root = git(cwd, "rev-parse", "--show-toplevel")
    return Path(root) if root else None


def main_checkout(cwd="."):
    common = git(cwd, "rev-parse", "--path-format=absolute", "--git-common-dir")
    return Path(common).parent if common else None
