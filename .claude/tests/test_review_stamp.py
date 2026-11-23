import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HOOKS = Path(__file__).resolve().parent.parent / "hooks"
sys.path.insert(0, str(HOOKS))

import guard_git  # noqa: E402
import review_stamp  # noqa: E402

COMMIT = 'git commit -s -m "docs(docs): explain the review"'


class ReviewReport(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.repo = tmp.name
        for step in (["init", "-q"], ["config", "user.email", "a@b.c"], ["config", "user.name", "A"]):
            subprocess.run(["git", *step], cwd=self.repo, check=True)
        self.stage("base", "0")
        subprocess.run(["git", "commit", "-q", "-m", "base"], cwd=self.repo, check=True)

    def stage(self, name, text):
        (Path(self.repo) / name).write_text(text)
        subprocess.run(["git", "add", name], cwd=self.repo, check=True)

    def report(self, verdict="merge", findings=""):
        text = review_stamp.template(self.repo).replace("<merge | merge after fixes | needs rework>", verdict)
        return text + findings

    def stamp(self, text=None):
        path = Path(self.repo) / "report.txt"
        if text is not None:
            path.write_text(text)
        args = [str(path)] if text is not None else []
        return subprocess.run(
            [sys.executable, str(HOOKS / "review_stamp.py"), *args], cwd=self.repo, capture_output=True, text=True
        )

    def test_nothing_staged_needs_no_review(self):
        self.assertTrue(review_stamp.is_fresh(self.repo))

    def test_staged_change_needs_a_report(self):
        self.stage("a", "1")
        self.assertFalse(review_stamp.is_fresh(self.repo))
        self.assertIn("review", guard_git.check(COMMIT, self.repo)[0])

    def test_a_bare_stamp_call_unlocks_nothing(self):
        self.stage("a", "1")
        result = self.stamp()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("zenith-review", result.stderr)
        self.assertIsNotNone(guard_git.check(COMMIT, self.repo))

    def test_a_report_for_the_staged_tree_unlocks_the_commit(self):
        self.stage("a", "1")
        self.assertEqual(self.stamp(self.report(findings="[Minor] a:1 - naming\n")).returncode, 0)
        self.assertIsNone(guard_git.check(COMMIT, self.repo))

    def test_staging_more_after_the_review_locks_the_commit_again(self):
        self.stage("a", "1")
        self.stamp(self.report())
        self.stage("a", "2")
        self.assertIsNotNone(guard_git.check(COMMIT, self.repo))

    def test_a_report_for_another_tree_is_refused(self):
        self.stage("a", "1")
        old = self.report()
        self.stage("a", "2")
        self.assertIn("another staged tree", self.stamp(old).stderr)

    def test_a_report_missing_a_staged_file_is_refused(self):
        self.stage("a", "1")
        self.stage("docs.md", "text")
        stale = self.report().replace("- docs.md\n", "")
        self.assertIn("docs.md", self.stamp(stale).stderr)

    def test_open_blocker_or_major_findings_are_refused(self):
        self.stage("a", "1")
        for finding in ("[Blocker] a:1 - leak\n", "[Major] a:1 - wrong\n"):
            self.assertIn("Blocker or Major", self.stamp(self.report(findings=finding)).stderr)

    def test_a_verdict_other_than_merge_is_refused(self):
        self.stage("a", "1")
        self.assertIn("verdict", self.stamp(self.report(verdict="needs rework")).stderr)

    def test_the_old_hand_written_stamp_file_no_longer_unlocks(self):
        self.stage("a", "1")
        tree = review_stamp.index_tree(self.repo)
        (Path(self.repo) / ".git" / "zenith-review-ok").write_text(tree)
        self.assertFalse(review_stamp.is_fresh(self.repo))

    def test_a_docs_only_change_needs_a_report_too(self):
        self.stage("README.md", "docs")
        self.assertFalse(review_stamp.is_fresh(self.repo))


if __name__ == "__main__":
    unittest.main()
