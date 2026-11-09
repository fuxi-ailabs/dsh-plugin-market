---
name: cython-ext-no-rpath-needs-ld-library-path
description: When a Cython/native extension wheel has no RPATH for its bundled DT_NEEDED .so (e.g. lib<name>.so in site-packages/<pkg>/), the verifier's provenance import and pytest both fail on musl/HongMeng because the linker won't find it; set LD_LIBRARY_PATH before run-stage.
stage: verification
scope: platform
---

On HarmonyOS (musl libc), `dlopen` of a `.so` with a `DT_NEEDED` entry resolves that
dependency strictly via the dynamic linker search path (`LD_LIBRARY_PATH`, ld-musl.conf,
defaults) — NOT via `PYTHONPATH`, `RTLD_GLOBAL` preload, or `os.environ` set at runtime.
glibc-style `RTLD_GLOBAL` symbol fallback does not work on musl.

When the build stage produces a wheel whose Cython extension (`<pkg>.cpython-312-aarch64-linux-ohos.so`)
references a bundled native lib (`lib<name>.so`) by `DT_NEEDED` but embeds NO `RPATH`/`RUNPATH`
pointing at `$ORIGIN` or the sibling dir, then:

- `import <pkg>` fails with `Error loading shared library lib<name>.so: No such file or directory`.
- The verifier's provenance check (`importlib.import_module`) fails → `host_error`, blocking
  test execution entirely. The error message names the missing `.so` but may be misleading
  ("file does not exist" when it actually exists but is off the linker path).

The fix is a run-stage-time workaround (not a wheel/site-packages edit — those are forbidden
by the gate): `export LD_LIBRARY_PATH=<venv-site-packages>/<pkg>:/storage/Users/currentUser/usr/local/lib`
before invoking `run-stage`. The verifier's `_run_local` (env=None) inherits the parent env,
so both the provenance import and pytest subprocesses resolve `lib<name>.so`. Pointing at the
venv's stable `<pkg>` dir works because the verifier force-reinstalls the same wheel there;
the `wheel_site` run-id path is dynamic and cannot be hardcoded.

Do NOT try: `ctypes.CDLL(abs_path, RTLD_GLOBAL)` before import (musl ignores it for DT_NEEDED),
`os.environ['LD_LIBRARY_PATH']=...` at runtime (read only at process start), chmod of the .so
(hmdfs caps "others" bits to 0; file owned by file_manager uid, agent is a different uid),
or writing the `.so` into a system lib path (framework_readonly_guard blocks writes outside
/storage/Users/currentUser/cache).

Root cause is a build-stage gap: the wheel should embed `RPATH=$ORIGIN` so the bundled lib is
found relative to the extension. Record a follow-up for the build stage; the LD_LIBRARY_PATH
export is the verification-stage workaround.

Confirmed on apriltag-python 3.4.5 (libapriltag.so, no RPATH). Likely affects any Cython/native
wrapper that bundles a sibling .so without setting RPATH during the build.
