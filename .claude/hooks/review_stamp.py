import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import ci_stamp  # noqa: E402

STAMP_NAME = "zenith-review-ok"


def index_tree(cwd):
    return ci_stamp.git(cwd, "write-tree")


def stamp_path(cwd):
    relative = ci_stamp.git(cwd, "rev-parse", "--git-path", STAMP_NAME)
    return Path(cwd or ".") / relative if relative else None


def write(cwd):
    tree, path = index_tree(cwd), stamp_path(cwd)
    if tree and path:
        path.write_text(tree)
    return bool(tree and path)


def is_fresh(cwd):
    tree, path = index_tree(cwd), stamp_path(cwd)
    if not tree or not path or tree == ci_stamp.head_tree(cwd):
        return True
    return path.is_file() and path.read_text().strip() == tree


def main():
    root = ci_stamp.git(".", "rev-parse", "--show-toplevel")
    if not root:
        sys.exit("not inside the Zenith git repository")
    if ci_stamp.git(root, "diff", "--name-only"):
        sys.exit("unstaged changes: stage everything with git add, the stamp covers the staged tree")
    if not write(root):
        sys.exit("could not stamp the staged tree")
    print("review recorded: commit is unlocked for this staged tree")


if __name__ == "__main__":
    main()
