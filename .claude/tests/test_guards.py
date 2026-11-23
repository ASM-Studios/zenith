import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

HOOKS = Path(__file__).resolve().parent.parent / "hooks"
sys.path.insert(0, str(HOOKS))

import ci_stamp  # noqa: E402
import guard_git  # noqa: E402
import review_stamp  # noqa: E402

GOOD_COMMIT = 'git commit -s -m "fix(api): bind the session to the user"'
GOOD_BODY = "## Summary\n\nCloses #12\n\n- Bind the session\n\n## Checklist\n\n- [ ] `npm run check` passes"


class GitGuard(unittest.TestCase):
    def setUp(self):
        patcher = mock.patch.object(ci_stamp, "is_fresh", return_value=True)
        patcher.start()
        self.addCleanup(patcher.stop)
        reviewed = mock.patch.object(review_stamp, "is_fresh", return_value=True)
        reviewed.start()
        self.addCleanup(reviewed.stop)

    def blocked(self, command):
        self.assertIsNotNone(guard_git.check(command, ""), command)

    def allowed(self, command):
        self.assertIsNone(guard_git.check(command, ""), command)

    def test_push_to_protected_branch_is_blocked(self):
        self.blocked("git push origin master")
        self.blocked("git push origin HEAD:dev")
        self.blocked("git push origin refs/heads/dev")

    def test_force_push_is_blocked_in_every_spelling(self):
        for flag in ("-f", "--force", "--force-with-lease"):
            self.blocked(f"git push {flag} origin mbo/#12/feat-x")
        self.blocked("git push origin +mbo/#12/feat-x")

    def test_own_branch_push_is_allowed(self):
        self.allowed("git push -u origin mbo/#12/ci-pipeline")

    def test_no_verify_is_blocked(self):
        self.blocked("git commit -s --no-verify -m 'fix(api): b'")
        self.blocked("git push --no-verify origin mbo/#12/x")

    def test_commit_format(self):
        self.allowed(GOOD_COMMIT)
        for kind in ("feat", "fix", "docs", "evol", "test", "chore"):
            self.allowed(f'git commit -s -m "{kind}(core): add x"')
        for scope in ("core", "api", "web", "mobile", "infra", "ci", "data", "docs"):
            self.allowed(f'git commit -s -m "feat({scope}): add x"')
        self.blocked('git commit -s -m "added stuff"')
        self.blocked('git commit -s -m "fix: no scope"')
        self.blocked('git commit -s -m "hotfix(api): wrong type"')
        self.blocked('git commit -s -m "fix(panel): unknown scope"')
        self.blocked('git commit -s -m "fix(api): b" -m "a body"')

    def test_commit_needs_sign_off(self):
        self.blocked('git commit -m "fix(api): b"')
        self.allowed('git commit --signoff -m "fix(api): b"')
        self.allowed('git commit -sm "fix(api): b"')

    def test_commit_heredoc_is_read(self):
        self.allowed("git commit -s -m \"$(cat <<'EOF'\nfix(api): bind it\nEOF\n)\"")
        self.allowed("git commit -s -m \"$(cat <<'EOF'\nfix(api): bind it\n\nSigned-off-by: A B <a@b.c>\nEOF\n)\"")
        self.blocked("git commit -s -m \"$(cat <<'EOF'\nfix(api): bind it\n\nbody\nEOF\n)\"")

    def test_ai_attribution_and_em_dash_are_blocked(self):
        self.blocked("git commit -s -m \"$(cat <<'EOF'\nfix(api): b\n\nCo-Authored-By: X\nEOF\n)\"")
        self.blocked('git commit -s -m "fix(api): b \u2014 c"')

    def test_branch_names(self):
        self.allowed("git checkout -b mbo/#23/evol-api-location")
        self.allowed("git worktree add -b mbo/#11/ci-pipeline ../wt origin/dev")
        self.blocked("git checkout -b my-branch")
        self.blocked("git switch -c claude/feat-x")
        self.blocked("git checkout -b mbo/feat-x")
        self.blocked("git worktree add -b mbo/hooks ../wt origin/master")

    def test_chained_commands_are_each_checked(self):
        self.blocked("git add -A && git push origin dev")
        self.allowed("git add -A && " + GOOD_COMMIT)

    def test_global_options_do_not_hide_a_command(self):
        self.blocked("git -C ../repo push origin master")

    def test_pr_title_and_body(self):
        self.allowed(f'gh pr create --title "feat(ci): block bad git" --body "{GOOD_BODY}"')
        self.blocked('gh pr create --title "Add hooks" --body "Closes #1"')
        self.blocked('gh pr create --title "Windows: feat(ci): b" --body "Closes #1"')
        self.blocked('gh pr create --title "feat(ci): b" --body "- Block pushes"')
        self.blocked('gh pr create --title "feat(ci): b" --body "Closes #1\n- ' + "word " * 13 + '"')
        self.blocked('gh pr edit 3 --title "feat(ci): b" --body "Closes #1\n- Generated with a tool"')

    def test_unrelated_commands_pass(self):
        self.allowed("ls -la && git status")
        self.allowed("gh pr list -R ASM-Studios/zenith")


class CiStamp(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.dir.cleanup)
        self.repo = self.dir.name
        for args in (["init", "-q"], ["config", "user.email", "t@t.t"], ["config", "user.name", "t"]):
            subprocess.run(["git", *args], cwd=self.repo, check=True)
        self.commit("one")

    def commit(self, name):
        (Path(self.repo) / name).write_text(name)
        subprocess.run(["git", "add", "."], cwd=self.repo, check=True)
        subprocess.run(["git", "commit", "-q", "-m", name], cwd=self.repo, check=True)

    def test_push_is_blocked_until_ci_passed_on_this_tree(self):
        push = "git push -u origin mbo/#12/ci-pipeline"
        self.assertIn("local CI", guard_git.check(push, self.repo)[0])
        ci_stamp.write(self.repo)
        self.assertIsNone(guard_git.check(push, self.repo))

    def test_a_new_commit_invalidates_the_stamp(self):
        ci_stamp.write(self.repo)
        self.commit("two")
        self.assertFalse(ci_stamp.is_fresh(self.repo))

    def test_outside_a_repository_never_blocks(self):
        with tempfile.TemporaryDirectory() as empty:
            self.assertTrue(ci_stamp.is_fresh(empty))


class HookProcess(unittest.TestCase):
    def run_hook(self, command):
        payload = json.dumps({"tool_name": "Bash", "tool_input": {"command": command}, "cwd": "."})
        return subprocess.run(
            [sys.executable, str(HOOKS / "guard_git.py")], input=payload, capture_output=True, text=True
        )

    def test_block_exits_2_with_reason(self):
        result = self.run_hook("git push origin master")
        self.assertEqual(result.returncode, 2)
        self.assertIn("protected branch", result.stderr)

    def test_allowed_exits_0_silently(self):
        result = self.run_hook("ls")
        self.assertEqual((result.returncode, result.stderr), (0, ""))

    def test_malformed_input_never_blocks(self):
        result = subprocess.run(
            [sys.executable, str(HOOKS / "guard_git.py")], input="not json", capture_output=True, text=True
        )
        self.assertEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
