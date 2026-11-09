"""Validate environment delivery to a new process before platform verification."""
import json
import os
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parent
CONTEXT = json.loads((ROOT / "context.json").read_text())
NATIVE_DIR = ROOT / CONTEXT["native_directory"]
NATIVE_DIR.mkdir(parents=True, exist_ok=True)

class LaunchEnvironmentTest(unittest.TestCase):
    def observe(self, inherited=None):
        env = os.environ.copy()
        env.pop("LD_LIBRARY_PATH", None)
        if inherited is not None:
            env["LD_LIBRARY_PATH"] = inherited
        code = 'import json, os; print(json.dumps(os.environ.get("LD_LIBRARY_PATH", "")))'
        result = subprocess.run(["bash", str(ROOT / "launch-verification.sh"), str(NATIVE_DIR), sys.executable, "-c", code],
                                env=env, text=True, capture_output=True, check=True)
        return json.loads(result.stdout)

    def test_native_directory_reaches_child(self):
        self.assertEqual(self.observe(), str(NATIVE_DIR))

    def test_existing_directories_are_preserved(self):
        self.assertEqual(self.observe("/opt/native/lib"), str(NATIVE_DIR) + ":/opt/native/lib")

    def test_no_empty_search_path_component(self):
        self.assertNotIn("", self.observe().split(":"))

if __name__ == "__main__":
    print("Validation scope: launcher child-process environment", flush=True)
    print("Library:", CONTEXT["library"], "Native directory:", CONTEXT["native_directory"], flush=True)
    unittest.main(verbosity=2)
