import argparse
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
sys.path.insert(0, str(ROOT / "hooks"))

import lint_ts  # noqa: E402
import smoke  # noqa: E402


class ComposeState(unittest.TestCase):
    def test_parses_line_delimited_and_array_json(self):
        rows = [{"Service": "api"}, {"Service": "db"}]
        self.assertEqual(smoke.parse_ps("\n".join(json.dumps(r) for r in rows)), rows)
        self.assertEqual(smoke.parse_ps(json.dumps(rows)), rows)
        self.assertEqual(smoke.parse_ps(""), [])

    def test_classifies_containers(self):
        cases = [
            ({"State": "running", "Health": "healthy"}, "ready"),
            ({"State": "running", "Health": ""}, "ready"),
            ({"State": "running", "Health": "starting"}, "waiting"),
            ({"State": "running", "Health": "unhealthy"}, "failed"),
            ({"State": "exited", "ExitCode": 0}, "ready"),
            ({"State": "exited", "ExitCode": 1}, "failed"),
            ({"State": "restarting"}, "waiting"),
        ]
        for container, expected in cases:
            self.assertEqual(smoke.container_state(container), expected, container)

    def test_stops_dependents_before_their_dependencies(self):
        depends = {"api": {"migrate", "redis"}, "migrate": {"db"}, "worker": {"redis"}, "db": set(), "redis": set()}
        order = smoke.stop_order(depends)
        self.assertEqual(sorted(order), sorted(depends))
        for service, deps in depends.items():
            for dep in deps:
                self.assertLess(order.index(service), order.index(dep), f"{service} before {dep}")

    def test_stop_order_terminates_on_a_cycle(self):
        self.assertEqual(sorted(smoke.stop_order({"a": {"b"}, "b": {"a"}})), ["a", "b"])

    def test_only_a_quick_zero_exit_is_graceful(self):
        self.assertEqual(smoke.stop_verdict(200, 0), "graceful")
        self.assertIn("exit 137", smoke.stop_verdict(10_300, 137))
        self.assertIn("not graceful", smoke.stop_verdict(6000, 0))

    def test_parses_expected_log_lines(self):
        service, pattern = smoke.parse_expect("worker:worker heartbeat")
        self.assertEqual(service, "worker")
        self.assertTrue(pattern.search('{"msg":"worker heartbeat"}'))
        with self.assertRaises(argparse.ArgumentTypeError):
            smoke.parse_expect("no-pattern")


class LintHook(unittest.TestCase):
    def payload(self, path):
        return {"tool_input": {"file_path": str(path)}}

    def test_targets_existing_typescript_files_only(self):
        tmp = Path(tempfile.mkdtemp())
        for name in ("a.ts", "b.py", "node_modules/c.ts"):
            (tmp / name).parent.mkdir(parents=True, exist_ok=True)
            (tmp / name).touch()
        self.assertEqual(lint_ts.target(self.payload(tmp / "a.ts")), tmp / "a.ts")
        self.assertIsNone(lint_ts.target(self.payload(tmp / "b.py")))
        self.assertIsNone(lint_ts.target(self.payload(tmp / "node_modules/c.ts")))
        self.assertIsNone(lint_ts.target(self.payload(tmp / "missing.ts")))
        self.assertIsNone(lint_ts.target({}))

    def test_skips_silently_when_oxlint_is_not_installed(self):
        tmp = Path(tempfile.mkdtemp())
        (tmp / "a.ts").touch()
        with mock.patch.object(lint_ts, "toplevel", return_value=tmp):
            self.assertIsNone(lint_ts.lint(tmp / "a.ts"))


if __name__ == "__main__":
    unittest.main()
