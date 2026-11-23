from repo import forbidden_in, git


def added_lines(diff):
    path = None
    for line in diff.splitlines():
        if line.startswith("+++ "):
            path = line[6:] if line.startswith("+++ b/") else None
        elif line.startswith("+"):
            yield path, line[1:]


def forbidden_hits(diff):
    hits = []
    for path, text in added_lines(diff):
        bad = forbidden_in(text)
        if bad:
            hits.append(f"{path}: added line contains {bad!r}")
    return hits


def message_hits(root, revision_range):
    bad = forbidden_in(git(root, "log", "--format=%B", revision_range) or "")
    return [f"commit message contains {bad!r}"] if bad else []
