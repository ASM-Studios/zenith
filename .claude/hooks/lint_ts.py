import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from hookio import read_payload  # noqa: E402
from repo import toplevel  # noqa: E402
from with_node import find_node_dir  # noqa: E402

LINTED = (".ts", ".tsx")
OXLINT = "oxlint.cmd" if os.name == "nt" else "oxlint"
MAX_LINES = 30


def target(payload):
    path = Path((payload.get("tool_input") or {}).get("file_path") or "")
    if path.suffix not in LINTED or "node_modules" in path.parts or not path.is_file():
        return None
    return path


def lint(path):
    root = toplevel(path.parent)
    oxlint = root / "node_modules" / ".bin" / OXLINT if root else None
    node_dir = find_node_dir(path.parent) if oxlint and oxlint.exists() else None
    if not node_dir:
        return None
    env = {**os.environ, "PATH": f"{node_dir}{os.pathsep}{os.environ.get('PATH', '')}"}
    command = [str(oxlint), "--type-aware", "--deny-warnings", str(path)]
    try:
        done = subprocess.run(command, cwd=root, env=env, capture_output=True, text=True, timeout=60)
    except (OSError, subprocess.SubprocessError):
        return None
    if done.returncode == 0:
        return None
    return "\n".join((done.stdout + done.stderr).strip().splitlines()[:MAX_LINES])


def main():
    path = target(read_payload())
    report = lint(path) if path else None
    if report:
        sys.stderr.write(f"oxlint found problems in {path}, fix them now:\n{report}\n")
        sys.exit(2)


if __name__ == "__main__":
    main()
