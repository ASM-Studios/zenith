import json
import os
import shlex
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FAKE = Path(__file__).resolve().parent / "fake_gh.py"


def session(*messages):
    env = dict(os.environ, ZENITH_GH=f"{shlex.quote(sys.executable)} {shlex.quote(str(FAKE))}")
    done = subprocess.run(
        [sys.executable, str(ROOT / "mcp" / "zenith_gh.py")],
        input="\n".join(json.dumps(m) for m in messages) + "\n",
        capture_output=True, text=True, env=env, timeout=30,
    )
    return [json.loads(line) for line in done.stdout.splitlines()]


class Server(unittest.TestCase):
    def test_handshake_and_tool_list_stay_small(self):
        replies = session(
            {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}},
            {"jsonrpc": "2.0", "method": "notifications/initialized"},
            {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
        )
        self.assertEqual(len(replies), 2)
        tools = replies[1]["result"]["tools"]
        self.assertEqual([t["name"] for t in tools], ["zenith_pr_board", "zenith_ci_failure"])
        self.assertLess(len(json.dumps(tools)), 1000)

    def test_board_reports_red_when_any_check_failed(self):
        reply = session({"jsonrpc": "2.0", "id": 3, "method": "tools/call",
                         "params": {"name": "zenith_pr_board", "arguments": {}}})[0]
        board = json.loads(reply["result"]["content"][0]["text"])
        self.assertEqual(board, [{"url": "https://github.com/ASM-Studios/zenith/pull/1",
                                  "title": "feat(a): b", "base": "dev", "draft": False, "ci": "red"}])

    def test_failure_returns_only_error_lines(self):
        reply = session({"jsonrpc": "2.0", "id": 4, "method": "tools/call",
                         "params": {"name": "zenith_ci_failure", "arguments": {"repo": "zenith", "run_id": "9"}}})[0]
        errors = json.loads(reply["result"]["content"][0]["text"])["first_errors"]
        self.assertEqual(errors, ["job | ERROR: build timed out"])

    def test_unknown_tool_is_an_error_result(self):
        reply = session({"jsonrpc": "2.0", "id": 5, "method": "tools/call",
                         "params": {"name": "nope", "arguments": {}}})[0]
        self.assertTrue(reply["result"]["isError"])


if __name__ == "__main__":
    unittest.main()
