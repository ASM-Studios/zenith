import argparse
import json
import re
import subprocess
import sys
import time

from env_file import ensure_env
from repo import toplevel

POLL_SECONDS = 2
STOP_LIMIT_MS = 5000
LOG_LINES = 15


def parse_ps(text):
    text = text.strip()
    if text.startswith("["):
        return json.loads(text)
    return [json.loads(line) for line in text.splitlines() if line.strip()]


def container_state(container):
    state, health, code = container.get("State"), container.get("Health", ""), container.get("ExitCode", 0)
    if state == "running":
        return {"": "ready", "healthy": "ready", "unhealthy": "failed"}.get(health, "waiting")
    if state == "exited":
        return "ready" if code == 0 else "failed"
    return "waiting"


def parse_expect(value):
    service, sep, pattern = value.partition(":")
    if not sep or not service or not pattern:
        raise argparse.ArgumentTypeError(f"expected SERVICE:PATTERN, got {value!r}")
    return service, re.compile(pattern)


def stop_order(depends):
    remaining, order = dict(depends), []
    while remaining:
        needed = {dep for deps in remaining.values() for dep in deps if dep in remaining}
        free = sorted(service for service in remaining if service not in needed) or sorted(remaining)[:1]
        order += free
        for service in free:
            remaining.pop(service)
    return order


def stop_verdict(ms, code):
    if code == 0 and ms < STOP_LIMIT_MS:
        return "graceful"
    return f"not graceful (exit {code}, {ms} ms, limit {STOP_LIMIT_MS} ms)"


class Stack:
    def __init__(self, root, project):
        self.root, self.base = root, ["docker", "compose", "-p", project]

    def run(self, *args):
        return subprocess.run([*self.base, *args], cwd=self.root, capture_output=True, text=True)

    def containers(self):
        return {c["Service"]: c for c in parse_ps(self.run("ps", "-a", "--format", "json").stdout)}

    def depends(self):
        services = json.loads(self.run("config", "--format", "json").stdout)["services"]
        return {name: set(spec.get("depends_on") or {}) for name, spec in services.items()}


def last_lines(text, count=LOG_LINES):
    return [line for line in text.splitlines() if line.strip()][-count:]


def stuck_services(containers):
    return sorted(
        name
        for name, container in containers.items()
        if container.get("State") == "restarting" or container_state(container) == "failed"
    )


def print_logs(stack, services):
    for service in services:
        print(f"logs {service}:")
        print("\n".join(last_lines(stack.run("logs", "--no-color", service).stdout)))


def wait_ready(stack, deadline):
    while True:
        states = {name: container_state(c) for name, c in stack.containers().items()}
        failed = sorted(name for name, state in states.items() if state == "failed")
        waiting = sorted(name for name, state in states.items() if state == "waiting")
        if failed or not waiting or time.monotonic() > deadline:
            return sorted(states), failed, waiting
        time.sleep(POLL_SECONDS)


def wait_log(stack, service, pattern, deadline):
    while time.monotonic() <= deadline:
        for line in stack.run("logs", "--no-color", service).stdout.splitlines():
            if pattern.search(line):
                return line.strip()[:200]
        time.sleep(POLL_SECONDS)
    return None


def check_stops(stack):
    problems = []
    running = {name for name, c in stack.containers().items() if c.get("State") == "running"}
    for service in [s for s in stop_order(stack.depends()) if s in running]:
        start = time.monotonic()
        stack.run("stop", "-t", "10", service)
        ms = int((time.monotonic() - start) * 1000)
        verdict = stop_verdict(ms, stack.containers()[service].get("ExitCode"))
        print(f"stop {service}: {verdict}")
        problems += [] if verdict == "graceful" else [service]
    return problems


def main():
    parser = argparse.ArgumentParser(description="Start the compose stack, check it, tear it down")
    parser.add_argument("--project", default="zenith-smoke")
    parser.add_argument("--expect", type=parse_expect, action="append", default=[], metavar="SERVICE:PATTERN")
    parser.add_argument("--timeout", type=int, default=180, help="seconds for readiness and each expected line")
    parser.add_argument("--no-build", action="store_true")
    parser.add_argument("--keep", action="store_true", help="leave the stack running")
    args = parser.parse_args()
    root = toplevel()
    if not root:
        sys.exit("not inside the Zenith git repository")
    ensure_env(root)
    stack = Stack(root, args.project)
    up = stack.run("up", "-d", *([] if args.no_build else ["--build"]))
    if up.returncode != 0:
        print("\n".join((up.stdout + up.stderr).splitlines()[-20:]))
        print_logs(stack, stuck_services(stack.containers()))
        stack.run("down", "-v")
        sys.exit("docker compose up failed")
    try:
        services, failed, waiting = wait_ready(stack, time.monotonic() + args.timeout)
        print(f"services: {', '.join(services)}")
        for name in failed + waiting:
            print(f"not ready {name}: {stack.containers()[name].get('Status')}")
        missing = []
        for service, pattern in args.expect:
            line = wait_log(stack, service, pattern, time.monotonic() + args.timeout)
            print(f"log {service}: {line}" if line else f"log {service}: no line matches {pattern.pattern!r}")
            missing += [] if line else [service]
        print_logs(stack, sorted(set(failed + waiting + missing)))
        problems = failed + waiting + missing + ([] if args.keep else check_stops(stack))
    finally:
        if not args.keep:
            stack.run("down", "-v")
    print("smoke passed" if not problems else f"smoke failed: {', '.join(problems)}")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
