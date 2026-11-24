import sys
import unittest
from pathlib import Path
from unittest import mock

HOOKS = Path(__file__).resolve().parent.parent / "hooks"
sys.path.insert(0, str(HOOKS))

import size_rules  # noqa: E402


def lines(count):
    return "line\n" * count


class ParseNumstat(unittest.TestCase):
    def test_parse_numstat_reads_added_removed_and_path(self):
        self.assertEqual(size_rules.parse_numstat("3\t1\tsrc/a.ts\n"), [(3, 1, "src/a.ts")])

    def test_parse_numstat_skips_binary_files(self):
        text = "-\t-\tlogo.png\n2\t0\tsrc/a.ts"
        self.assertEqual(size_rules.parse_numstat(text), [(2, 0, "src/a.ts")])


class Counted(unittest.TestCase):
    def test_counted_drops_package_lock_at_any_depth_and_drizzle_migrations(self):
        entries = [
            (1, 1, "package-lock.json"),
            (1, 1, "apps/api/package-lock.json"),
            (1, 1, "apps/api/drizzle/0002_x.sql"),
            (1, 1, "src/a.ts"),
        ]
        self.assertEqual(size_rules.counted(entries), [(1, 1, "src/a.ts")])


class TotalLines(unittest.TestCase):
    def test_total_lines_sums_added_plus_removed(self):
        self.assertEqual(size_rules.total_lines([(3, 1, "a.ts"), (2, 4, "b.py")]), 10)


class GrownCodeFiles(unittest.TestCase):
    def test_grown_code_files_returns_code_files_where_added_exceeds_removed(self):
        entries = [(5, 1, "a.ts"), (4, 0, "b.tsx"), (2, 1, "c.js"), (3, 0, "d.py")]
        self.assertEqual(size_rules.grown_code_files(entries), ["a.ts", "b.tsx", "c.js", "d.py"])

    def test_grown_code_files_ignores_a_shrunk_file(self):
        self.assertEqual(size_rules.grown_code_files([(1, 4, "a.ts")]), [])

    def test_grown_code_files_ignores_a_file_with_as_many_lines_added_as_removed(self):
        self.assertEqual(size_rules.grown_code_files([(4, 4, "a.ts")]), [])

    def test_grown_code_files_ignores_markdown_files(self):
        self.assertEqual(size_rules.grown_code_files([(9, 0, "README.md")]), [])


class SizeProblems(unittest.TestCase):
    def stub_git(self, numstat, content=""):
        def run(cwd, *args):
            return numstat if args[0] == "diff" else content

        patcher = mock.patch.object(size_rules, "git", side_effect=run)
        stub = patcher.start()
        self.addCleanup(patcher.stop)
        return stub

    def problems(self, numstat, content=""):
        self.stub_git(numstat, content)
        return size_rules.size_problems("/repo", ["dev...HEAD"])

    def test_size_problems_reports_a_diff_above_1000_lines(self):
        found = self.problems("600\t401\tsrc/a.ts", lines(10))
        self.assertEqual(len(found), 1)
        self.assertIn("1001 lines", found[0][0])

    def test_size_problems_reports_nothing_at_exactly_1000_lines(self):
        self.assertEqual(self.problems("500\t500\tsrc/a.ts", lines(10)), [])

    def test_size_problems_reports_a_grown_ts_file_of_201_lines(self):
        found = self.problems("5\t0\tsrc/a.ts", lines(201))
        self.assertEqual(len(found), 1)
        self.assertIn("src/a.ts has 201 lines", found[0][0])

    def test_size_problems_ignores_a_grown_file_of_200_lines(self):
        self.assertEqual(self.problems("5\t0\tsrc/a.ts", lines(200)), [])

    def test_size_problems_ignores_a_shrunk_file_even_with_300_lines(self):
        self.assertEqual(self.problems("0\t5\tsrc/a.ts", lines(300)), [])

    def test_size_problems_gives_every_problem_a_split_fix(self):
        found = self.problems("600\t401\tsrc/a.ts\n5\t0\tsrc/b.ts", lines(201))
        self.assertEqual(len(found), 3)
        for _, fix in found:
            self.assertIn("Split it", fix)

    def test_size_problems_passes_no_renames_to_the_diff_call(self):
        stub = self.stub_git("1\t0\tsrc/a.ts", lines(10))
        size_rules.size_problems("/repo", ["dev...HEAD"])
        self.assertIn("--no-renames", stub.call_args_list[0].args)

    def test_size_problems_reports_nothing_when_git_returns_none(self):
        self.stub_git(None)
        self.assertEqual(size_rules.size_problems("/repo", ["dev...HEAD"]), [])


if __name__ == "__main__":
    unittest.main()
