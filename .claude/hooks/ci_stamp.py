import subprocess
from pathlib import Path

STAMP_NAME = "zenith-ci-ok"


def git(cwd, *args):
    try:
        done = subprocess.run(["git", *args], cwd=cwd or None, capture_output=True, text=True, timeout=10)
    except (OSError, subprocess.SubprocessError):
        return None
    return done.stdout.strip() if done.returncode == 0 else None


def head_tree(cwd):
    return git(cwd, "rev-parse", "HEAD^{tree}")


def stamp_path(cwd):
    relative = git(cwd, "rev-parse", "--git-path", STAMP_NAME)
    return Path(cwd or ".") / relative if relative else None


def write(cwd):
    tree, path = head_tree(cwd), stamp_path(cwd)
    if tree and path:
        path.write_text(tree)
    return bool(tree and path)


def is_fresh(cwd):
    tree, path = head_tree(cwd), stamp_path(cwd)
    if not tree or not path:
        return True
    return path.is_file() and path.read_text().strip() == tree
