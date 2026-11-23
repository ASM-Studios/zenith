from pathlib import Path

GIT_VALUE_OPTIONS = {"-C", "-c", "--git-dir", "--work-tree"}


def resolve(base, target):
    path = Path(target).expanduser()
    found = path if path.is_absolute() else Path(base or ".") / path
    return str(found) if found.is_dir() else base


def strip_global_options(args):
    i = 0
    while i < len(args) and args[i].startswith("-"):
        i += 2 if args[i] in GIT_VALUE_OPTIONS else 1
    return args[i:]


def git_directory(args, cwd):
    i = 0
    while i < len(args) and args[i].startswith("-"):
        if args[i] == "-C" and i + 1 < len(args):
            cwd = resolve(cwd, args[i + 1])
        i += 2 if args[i] in GIT_VALUE_OPTIONS else 1
    return cwd
