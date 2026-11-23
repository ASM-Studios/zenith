import subprocess
import sys
import unittest
from pathlib import Path
from unittest import mock

SCRIPTS = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS))

import diff_scan  # noqa: E402
import issue_create  # noqa: E402
import pr_open  # noqa: E402
import review_pr  # noqa: E402
import smoke  # noqa: E402

DASH = chr(0x2014)
TRAILER = "Co-Authored" + "-By: someone"
DIFF = (
    "diff --git a/a.py b/a.py\n--- a/a.py\n+++ b/a.py\n@@ -1 +1,2 @@\n"
    f"-removed {DASH}\n kept\n+clean line\n+bad {DASH} line\n"
    f"diff --git a/b.md b/b.md\n--- a/b.md\n+++ b/b.md\n+{TRAILER}\n"
)


def done(stdout="", returncode=0):
    return subprocess.CompletedProcess([], returncode, stdout, "")


class DiffScan(unittest.TestCase):
    def test_reads_only_added_lines_with_their_file(self):
        self.assertEqual(
            list(diff_scan.added_lines(DIFF)),
            [("a.py", "clean line"), ("a.py", f"bad {DASH} line"), ("b.md", TRAILER)],
        )

    def test_flags_forbidden_text_on_added_lines_only(self):
        hits = diff_scan.forbidden_hits(DIFF)
        self.assertEqual(len(hits), 2)
        self.assertTrue(hits[0].startswith("a.py:"))
        self.assertTrue(hits[1].startswith("b.md:"))

    def test_a_clean_diff_has_no_hit(self):
        self.assertEqual(diff_scan.forbidden_hits("+++ b/a.py\n+fine\n"), [])


class IssueCreate(unittest.TestCase):
    def test_accepts_a_commit_style_title(self):
        self.assertIsNone(issue_create.check_issue("chore(ci): add scripts", "body"))

    def test_rejects_a_title_without_type_and_scope(self):
        self.assertIn("title", issue_create.check_issue("add scripts", "body"))

    def test_rejects_forbidden_text_in_the_body(self):
        self.assertIn("contains", issue_create.check_issue("chore(ci): add", f"a {DASH} b"))

    def test_reads_the_issue_number_from_its_url(self):
        self.assertEqual(issue_create.number_of("https://github.com/ASM-Studios/zenith/issues/120\n"), 120)

    def test_detects_a_body_that_github_altered(self):
        with mock.patch.object(issue_create, "gh", return_value=done("a \\`code\\`\n")):
            self.assertFalse(issue_create.body_matches(1, "a `code`"))
        with mock.patch.object(issue_create, "gh", return_value=done("a `code`\r\n")):
            self.assertTrue(issue_create.body_matches(1, "a `code`\n"))

    def test_attaches_the_issue_id_to_the_parent(self):
        calls = []

        def fake(*args):
            calls.append(args)
            return done("777\n")

        with mock.patch.object(issue_create, "gh", side_effect=fake):
            self.assertTrue(issue_create.link_parent(120, 87))
        self.assertIn("sub_issue_id=777", calls[1])
        self.assertTrue(any("issues/87/sub_issues" in arg for arg in calls[1]))


class PrOpen(unittest.TestCase):
    def test_reads_the_issue_from_the_branch_name(self):
        self.assertEqual(pr_open.issue_of("mbo/#120/pr-helper-scripts"), 120)
        self.assertIsNone(pr_open.issue_of("dev"))
        self.assertIsNone(pr_open.issue_of("claude/fix"))

    def test_counts_passed_failed_and_pending_checks(self):
        rollup = [
            {"name": "lint", "status": "COMPLETED", "conclusion": "SUCCESS"},
            {"name": "test", "status": "COMPLETED", "conclusion": "FAILURE"},
            {"name": "build", "status": "IN_PROGRESS", "conclusion": ""},
            {"context": "codecov", "state": "SUCCESS"},
            {"name": "docs", "status": "COMPLETED", "conclusion": "SKIPPED"},
        ]
        self.assertEqual(pr_open.summarize(rollup), (3, ["test"], 1))

    def test_updates_the_body_of_a_pr_that_already_exists(self):
        calls = []
        pr = {"number": 5, "url": "https://github.com/ASM-Studios/zenith/pull/5"}
        with mock.patch.object(pr_open, "find_pr", return_value=pr), mock.patch.object(
            pr_open, "gh", side_effect=lambda *a: calls.append(a) or done()
        ):
            self.assertEqual(pr_open.open_or_update("b", "t", "body", "body.md"), (pr, "updated"))
        self.assertEqual(calls[0][:2], ("pr", "edit"))

    def test_leaves_an_existing_pr_alone_without_a_body_file(self):
        pr = {"number": 5, "url": "u"}
        with mock.patch.object(pr_open, "find_pr", return_value=pr), mock.patch.object(pr_open, "gh") as gh:
            self.assertEqual(pr_open.open_or_update("b", "t", "body", None), (pr, "exists"))
        gh.assert_not_called()

    def test_creates_the_pr_into_dev_when_none_exists(self):
        pr = {"number": 6, "url": "u"}
        calls = []
        with mock.patch.object(pr_open, "find_pr", side_effect=[None, pr]), mock.patch.object(
            pr_open, "gh", side_effect=lambda *a: calls.append(a) or done()
        ):
            self.assertEqual(pr_open.open_or_update("b", "t", "body", None), (pr, "created"))
        self.assertIn("dev", calls[0])

    def test_creates_the_pr_as_a_draft(self):
        pr = {"number": 6, "url": "u"}
        calls = []
        with mock.patch.object(pr_open, "find_pr", side_effect=[None, pr]), mock.patch.object(
            pr_open, "gh", side_effect=lambda *a: calls.append(a) or done()
        ):
            pr_open.open_or_update("b", "t", "body", None)
        self.assertIn("--draft", calls[0])

    def test_marks_the_open_pr_ready_for_review(self):
        calls = []
        pr = {"number": 8, "url": "u"}
        with mock.patch.object(pr_open, "find_pr", return_value=pr), mock.patch.object(
            pr_open, "gh", side_effect=lambda *a: calls.append(a) or done()
        ):
            self.assertEqual(pr_open.mark_ready("b"), pr)
        self.assertEqual(calls[0][:3], ("pr", "ready", "8"))

    def test_refuses_to_mark_ready_without_an_open_pr(self):
        with mock.patch.object(pr_open, "find_pr", return_value=None):
            with self.assertRaises(SystemExit):
                pr_open.mark_ready("b")

    def test_picks_up_a_pr_opened_by_automation_during_the_create(self):
        pr = {"number": 7, "url": "u"}
        with mock.patch.object(pr_open, "find_pr", side_effect=[None, pr]), mock.patch.object(
            pr_open, "gh", return_value=done(returncode=1)
        ):
            self.assertEqual(pr_open.open_or_update("b", "t", "body", None), (pr, "created"))

    def test_stops_when_the_pr_cannot_be_created(self):
        with mock.patch.object(pr_open, "find_pr", return_value=None), mock.patch.object(
            pr_open, "gh", return_value=done(returncode=1)
        ):
            with self.assertRaises(SystemExit):
                pr_open.open_or_update("b", "t", "body", None)


class ReviewPr(unittest.TestCase):
    def test_lists_the_conflicted_files_of_a_merge_tree_run(self):
        output = "abc123\na.ts\nb/c.ts\n\nAuto-merging a.ts\nCONFLICT (content): a.ts\n"
        self.assertEqual(review_pr.parse_conflicts(output), ["a.ts", "b/c.ts"])

    def test_flags_commit_subjects_outside_the_convention(self):
        subjects = ["feat(api): add Kp index", "wip stuff", "chore(web): x"]
        self.assertEqual(review_pr.commit_problems(subjects), ["commit subject format: 'wip stuff'"])

    def test_flags_a_pr_with_no_commit_above_the_base(self):
        self.assertEqual(len(review_pr.empty_problems([])), 1)
        self.assertEqual(review_pr.empty_problems(["feat(api): x"]), [])

    def test_reports_prs_that_conflict_with_each_other(self):
        results = [done("tree\nfile.ts\n\nmsg\n", 1)]
        with mock.patch.object(review_pr.subprocess, "run", side_effect=results):
            found = review_pr.conflicts(Path("."), {1: "ref1", 2: "ref2"})
        self.assertEqual(found, ["#1 and #2 conflict in file.ts"])

    def test_reports_nothing_for_prs_that_merge_cleanly(self):
        with mock.patch.object(review_pr.subprocess, "run", return_value=done("tree\n", 0)):
            self.assertEqual(review_pr.conflicts(Path("."), {1: "ref1", 2: "ref2"}), [])


class SmokeLogs(unittest.TestCase):
    def test_keeps_the_last_non_empty_log_lines(self):
        text = "a\n\nb\n  \nc\nd\n"
        self.assertEqual(smoke.last_lines(text, 2), ["c", "d"])

    def test_finds_services_that_restart_or_fail(self):
        containers = {
            "db": {"State": "restarting", "Health": ""},
            "api": {"State": "created"},
            "worker": {"State": "exited", "ExitCode": 1},
            "redis": {"State": "running", "Health": "healthy"},
        }
        self.assertEqual(smoke.stuck_services(containers), ["db", "worker"])


if __name__ == "__main__":
    unittest.main()
