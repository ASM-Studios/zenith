import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HOOKS = Path(__file__).resolve().parent.parent / "hooks"
sys.path.insert(0, str(HOOKS))

import ci_stamp  # noqa: E402
import guard_git  # noqa: E402
from shell_text import command_text  # noqa: E402

PUSH = "git push -u origin mbo/#12/ci-pipeline"


def git(cwd, *args):
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True)


class WorktreeGuard(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.dir.cleanup)
        root = Path(self.dir.name).resolve()
        self.main, self.tree = str(root / "main"), str(root / "tree")
        Path(self.main).mkdir()
        for args in (["init", "-q"], ["config", "user.email", "t@t.t"], ["config", "user.name", "t"]):
            git(self.main, *args)
        (Path(self.main) / "a").write_text("a")
        git(self.main, "add", ".")
        git(self.main, "commit", "-q", "-m", "one")
        git(self.main, "worktree", "add", "-q", "-b", "mbo/#12/x", self.tree)
        (Path(self.tree) / "b").write_text("b")
        git(self.tree, "add", ".")
        git(self.tree, "commit", "-q", "-m", "two")

    def test_push_after_cd_reads_the_worktree_stamp(self):
        ci_stamp.write(self.tree)
        self.assertIsNone(guard_git.check(f"cd {self.tree} && {PUSH}", self.main))

    def test_push_after_cd_ignores_a_fresh_main_stamp(self):
        ci_stamp.write(self.main)
        self.assertIn("local CI", guard_git.check(f"cd {self.tree} && {PUSH}", self.main)[0])

    def test_push_with_dash_c_reads_the_worktree_stamp(self):
        ci_stamp.write(self.tree)
        self.assertIsNone(guard_git.check(f"git -C {self.tree} push -u origin mbo/#12/x", self.main))

    def test_relative_cd_is_resolved_from_the_session_directory(self):
        ci_stamp.write(self.tree)
        self.assertIsNone(guard_git.check(f"cd ../tree && {PUSH}", self.main))

    def test_push_without_cd_still_reads_the_session_directory(self):
        ci_stamp.write(self.tree)
        self.assertIn("local CI", guard_git.check(PUSH, self.main)[0])


    def test_an_unresolvable_cd_keeps_the_session_directory(self):
        ci_stamp.write(self.tree)
        self.assertIn("local CI", guard_git.check(f"cd $UNSET_DIR && {PUSH}", self.main)[0])


class Heredocs(unittest.TestCase):
    def test_text_in_a_heredoc_is_not_a_command(self):
        self.assertIsNone(guard_git.check("cat > f <<'EOF'\ngit push origin dev\nEOF\n", ""))

    def test_commands_after_a_heredoc_are_still_checked(self):
        self.assertIsNotNone(guard_git.check("cat <<EOF\nx\nEOF\ngit push origin dev", ""))

    def test_a_newline_separates_commands(self):
        self.assertIsNotNone(guard_git.check("echo hi\ngit push origin dev", ""))

    def test_a_heredoc_inside_quotes_is_kept(self):
        command = "git commit -s -m \"$(cat <<'EOF'\nfix(api): x\nEOF\n)\""
        self.assertEqual(command_text(command), command)


if __name__ == "__main__":
    unittest.main()
