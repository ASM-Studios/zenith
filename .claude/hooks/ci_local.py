import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import ci_stamp  # noqa: E402

DOCKER_BUILD = ["docker", "build", "-f", "Dockerfile.ci", "--progress=plain", "-t", "zenith-ci", "."]
DOCKER_SOCKET = ["-v", "/var/run/docker.sock:/var/run/docker.sock", "-e", "TESTCONTAINERS_RYUK_DISABLED=true"]
LINUX_NETWORK = ["--network", "host", "-e", "TESTCONTAINERS_HOST_OVERRIDE=localhost"]
DESKTOP_NETWORK = [
    "--add-host", "host.docker.internal:host-gateway",
    "-e", "TESTCONTAINERS_HOST_OVERRIDE=host.docker.internal",
]


def docker_run():
    network = LINUX_NETWORK if sys.platform.startswith("linux") else DESKTOP_NETWORK
    return ["docker", "run", "--rm", *DOCKER_SOCKET, *network, "zenith-ci"]


NATIVE_CI = [["npm", "ci"], ["npm", "run", "check"]]


def run(command, cwd):
    exe = shutil.which(command[0])
    return subprocess.run([exe or command[0], *command[1:]], cwd=cwd).returncode == 0


def docker_ready(cwd):
    return bool(shutil.which("docker")) and subprocess.run(
        ["docker", "info"], cwd=cwd, capture_output=True
    ).returncode == 0


def node_ready():
    return bool(shutil.which("node") and shutil.which("npm")) and subprocess.run(
        ["node", "-e", "process.exit(Number(process.versions.node.split('.')[0]) >= 24 ? 0 : 1)"]
    ).returncode == 0


def main():
    root = ci_stamp.git(".", "rev-parse", "--show-toplevel")
    if not root:
        sys.exit("not inside the Zenith git repository")
    if ci_stamp.git(root, "status", "--porcelain"):
        sys.exit("working tree is not clean: commit or stash first, the stamp covers the committed tree")
    if docker_ready(root):
        passed = run(DOCKER_BUILD, root) and run(docker_run(), root)
    elif node_ready():
        passed = all(run(step, root) for step in NATIVE_CI)
    else:
        sys.exit("need Docker (running) or Node 24 with npm: install one, see CONTRIBUTING.md")
    if not passed:
        sys.exit("local CI failed: fix it, commit, and run this again")
    ci_stamp.write(root)
    print("local CI passed: push is unlocked for this commit tree")


if __name__ == "__main__":
    main()
