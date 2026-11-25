from ci_stamp import git

DEFAULT_BASE = "origin/dev"
IGNORED = {"origin", "origin/HEAD", "origin/master", DEFAULT_BASE}


def commits_between(cwd, base, head):
    count = git(cwd, "rev-list", "--count", f"{base}..{head}")
    return int(count) if count is not None else None


def pushed_ancestors(cwd, own):
    refs = git(cwd, "for-each-ref", "--format=%(refname:short)", "refs/remotes/origin") or ""
    candidates = [ref for ref in refs.splitlines() if ref not in IGNORED and ref != f"origin/{own}"]
    return [ref for ref in candidates if commits_between(cwd, "HEAD", ref) == 0]


def stack_base(cwd):
    own = git(cwd, "rev-parse", "--abbrev-ref", "HEAD") or ""
    best, best_count = DEFAULT_BASE, commits_between(cwd, DEFAULT_BASE, "HEAD")
    for ref in pushed_ancestors(cwd, own):
        count = commits_between(cwd, ref, "HEAD")
        if count and best_count is not None and count < best_count:
            best, best_count = ref, count
    return best
