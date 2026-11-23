import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

SCRIPTS = Path(__file__).resolve().parent.parent / "scripts"
sys.path.insert(0, str(SCRIPTS))

import check_summary  # noqa: E402
import env_file  # noqa: E402
import with_node  # noqa: E402
import worktree  # noqa: E402

TEMPLATE = "POSTGRES_DB=zenith\n\n# openssl rand -hex 32\nPASSWORD_PEPPER=\nBETTER_AUTH_URL=\n# openssl rand -hex 32\nSET=kept\n"


class WithNode(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.path_bin, self.profile_bin = self.tmp / "path", self.tmp / "profile"
        for directory in (self.path_bin, self.profile_bin):
            directory.mkdir()
            (directory / with_node.NODE).touch()
        patcher = mock.patch.object(with_node, "candidate_dirs", return_value=[self.path_bin, self.profile_bin])
        patcher.start()
        self.addCleanup(patcher.stop)

    def majors(self, path_major, profile_major):
        versions = {self.path_bin / with_node.NODE: path_major, self.profile_bin / with_node.NODE: profile_major}
        return mock.patch.object(with_node, "node_major", side_effect=lambda node: versions[node])

    def test_prefers_node_24_on_path(self):
        with self.majors(24, 24):
            self.assertEqual(with_node.find_node_dir(), self.path_bin)

    def test_falls_back_to_the_devenv_profile_when_path_node_is_too_old(self):
        with self.majors(20, 24):
            self.assertEqual(with_node.find_node_dir(), self.profile_bin)

    def test_prepends_the_found_directory_to_path(self):
        with self.majors(None, 24):
            argv, env = with_node.node_command(["npm", "test"], environ={"PATH": "/usr/bin"})
        self.assertEqual(argv, ["npm", "test"])
        self.assertTrue(env["PATH"].startswith(str(self.profile_bin)))

    def test_wraps_the_command_in_devenv_shell_when_no_node_is_found(self):
        with self.majors(None, None), mock.patch.object(with_node.shutil, "which", return_value="/bin/devenv"):
            argv, _ = with_node.node_command(["npm", "test"], environ={"PATH": ""})
        self.assertEqual(argv, ["devenv", "shell", "--", "npm", "test"])

    def test_gives_up_without_node_or_devenv(self):
        with self.majors(None, None), mock.patch.object(with_node.shutil, "which", return_value=None):
            argv, _ = with_node.node_command(["npm", "test"], environ={"PATH": ""})
        self.assertIsNone(argv)


class EnvFile(unittest.TestCase):
    def test_fills_only_empty_values_announced_by_the_openssl_hint(self):
        filled = env_file.fill_secrets(TEMPLATE, token=lambda: "s3cret")
        self.assertIn("PASSWORD_PEPPER=s3cret\n", filled)
        self.assertIn("BETTER_AUTH_URL=\n", filled)
        self.assertIn("SET=kept\n", filled)
        self.assertIn("POSTGRES_DB=zenith\n", filled)

    def test_generates_a_distinct_64_hex_secret_each_time(self):
        first, second = (env_file.fill_secrets(TEMPLATE).splitlines()[3] for _ in range(2))
        self.assertRegex(first, r"^PASSWORD_PEPPER=[0-9a-f]{64}$")
        self.assertNotEqual(first, second)

    def test_never_overwrites_an_existing_env(self):
        root = Path(tempfile.mkdtemp())
        (root / ".env.example").write_text(TEMPLATE)
        (root / ".env").write_text("MINE=1\n")
        self.assertEqual(env_file.ensure_env(root), (root / ".env", False))
        self.assertEqual((root / ".env").read_text(), "MINE=1\n")

    def test_creates_env_from_the_example(self):
        root = Path(tempfile.mkdtemp())
        (root / ".env.example").write_text(TEMPLATE)
        self.assertEqual(env_file.ensure_env(root), (root / ".env", True))
        self.assertRegex((root / ".env").read_text(), r"PASSWORD_PEPPER=[0-9a-f]{64}")


class Worktree(unittest.TestCase):
    def test_builds_the_branch_from_trigram_issue_and_desc(self):
        self.assertEqual(worktree.branch_name("mbo", 88, "frugal-scripts"), "mbo/#88/frugal-scripts")

    def test_rejects_names_the_git_guard_would_block(self):
        for trigram, desc in (("mb", "x"), ("mbo", "Frugal"), ("mbo", "two words"), ("MBO", "x")):
            with self.assertRaises(SystemExit):
                worktree.branch_name(trigram, 88, desc)

    def test_places_the_worktree_next_to_the_main_checkout(self):
        self.assertEqual(worktree.worktree_path(Path("/p/Zenith"), 88), Path("/p/Zenith-worktrees/88"))


class CheckSummary(unittest.TestCase):
    def test_keeps_only_the_lines_that_signal_a_problem(self):
        output = "\x1b[31m> lint\x1b[39m\nfile.ts:1:2: error no-any\nall good\nfile.ts:1:2: error no-any\n"
        self.assertEqual(check_summary.signal_lines(output), ["file.ts:1:2: error no-any"])

    def test_falls_back_to_the_last_lines_when_nothing_matches(self):
        output = "\n".join(f"line {i}" for i in range(100))
        self.assertEqual(check_summary.signal_lines(output, limit=2), ["line 98", "line 99"])

    def test_reads_the_vitest_test_count(self):
        output = " Test Files  9 passed (9)\n      Tests  55 passed (55)\n"
        self.assertEqual(check_summary.test_count(output), "Tests 55 passed (55)")
        self.assertIsNone(check_summary.test_count("no tests"))

    def test_parses_uncovered_rows_of_the_ci_coverage_summary(self):
        markdown = "| File | Lines % | Uncovered lines |\n| --- | ---: | --- |\n| `apps/api/src/a.ts` | 50% | 3-4, 9 |\n"
        self.assertEqual(check_summary.coverage_gaps(markdown), {"apps/api/src/a.ts": "50% lines, uncovered 3-4, 9"})


if __name__ == "__main__":
    unittest.main()
