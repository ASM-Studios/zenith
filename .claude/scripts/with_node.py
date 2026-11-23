import os
import shutil
import subprocess
import sys
from pathlib import Path

from repo import main_checkout, toplevel

MIN_MAJOR = 24
NODE = "node.exe" if os.name == "nt" else "node"


def node_major(node):
    try:
        done = subprocess.run(
            [str(node), "-p", "process.versions.node.split('.')[0]"], capture_output=True, text=True, timeout=10
        )
    except (OSError, subprocess.SubprocessError):
        return None
    out = done.stdout.strip()
    return int(out) if done.returncode == 0 and out.isdigit() else None


def candidate_dirs(cwd, path):
    on_path = shutil.which("node", path=path)
    roots = dict.fromkeys(r for r in (toplevel(cwd), main_checkout(cwd)) if r)
    return ([Path(on_path).parent] if on_path else []) + [r / ".devenv" / "profile" / "bin" for r in roots]


def find_node_dir(cwd=".", path=None):
    for directory in candidate_dirs(cwd, path):
        node = directory / NODE
        if node.is_file() and (node_major(node) or 0) >= MIN_MAJOR:
            return directory
    return None


def node_command(command, cwd=".", environ=None):
    environ = dict(os.environ if environ is None else environ)
    directory = find_node_dir(cwd, environ.get("PATH"))
    if directory:
        environ["PATH"] = f"{directory}{os.pathsep}{environ.get('PATH', '')}"
        return list(command), environ
    if shutil.which("devenv", path=environ.get("PATH")):
        return ["devenv", "shell", "--", *command], environ
    return None, environ


def run(command, cwd=".", **kwargs):
    argv, env = node_command(command, cwd)
    if argv is None:
        sys.exit("need Node 24: install it or devenv, see CONTRIBUTING.md")
    exe = shutil.which(argv[0], path=env.get("PATH")) or argv[0]
    return subprocess.run([exe, *argv[1:]], cwd=cwd, env=env, **kwargs)


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: with_node.py <command> [args...]")
    sys.exit(run(sys.argv[1:]).returncode)


if __name__ == "__main__":
    main()
