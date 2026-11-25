import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HOOKS = Path(__file__).resolve().parent.parent / "hooks"
sys.path.insert(0, str(HOOKS))

import stack_base  # noqa: E402


def run(cwd, *args):
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True)


def commit(cwd, name):
    (Path(cwd) / name).write_text(name)
    run(cwd, "add", name)
    run(cwd, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-m", name)


def publish(cwd, branch):
    run(cwd, "update-ref", f"refs/remotes/origin/{branch}", "HEAD")


class StackBase(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.cwd = self.dir.name
        run(self.cwd, "init", "-b", "dev")
        commit(self.cwd, "root")
        publish(self.cwd, "dev")
        run(self.cwd, "switch", "-c", "cma/first")
        commit(self.cwd, "first")
        publish(self.cwd, "cma/first")
        run(self.cwd, "switch", "-c", "cma/second")
        commit(self.cwd, "second")

    def tearDown(self):
        self.dir.cleanup()

    def test_stack_base_is_the_pushed_branch_below_the_current_one(self):
        self.assertEqual(stack_base.stack_base(self.cwd), "origin/cma/first")

    def test_stack_base_ignores_the_remote_ref_of_the_current_branch(self):
        publish(self.cwd, "cma/second")
        commit(self.cwd, "third")

        self.assertEqual(stack_base.stack_base(self.cwd), "origin/cma/first")

    def test_stack_base_is_dev_when_no_other_branch_is_pushed_below(self):
        run(self.cwd, "update-ref", "-d", "refs/remotes/origin/cma/first")

        self.assertEqual(stack_base.stack_base(self.cwd), "origin/dev")

    def test_stack_base_takes_the_nearest_of_several_pushed_branches(self):
        publish(self.cwd, "cma/nearer")
        commit(self.cwd, "fourth")

        self.assertEqual(stack_base.stack_base(self.cwd), "origin/cma/nearer")

    def test_stack_base_skips_a_pushed_branch_that_is_not_an_ancestor(self):
        run(self.cwd, "switch", "-c", "cma/other", "origin/dev")
        commit(self.cwd, "other")
        publish(self.cwd, "cma/other")
        run(self.cwd, "switch", "cma/second")

        self.assertEqual(stack_base.stack_base(self.cwd), "origin/cma/first")


if __name__ == "__main__":
    unittest.main()
