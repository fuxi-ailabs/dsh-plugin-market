---
name: verification-native-lib-needs-ld-library-path-for-provenance
description: When a library imports a C-extension like talib that needs a native .so, set LD_LIBRARY_PATH to include $MIGBOT_NATIVE_DEPS_PREFIX/lib before run-stage so the provenance import probe inherits it
stage: verification
scope: platform
---

When a PyPI library's source imports a C-extension (e.g., `import talib`) that loads
a native shared library (e.g., `libta-lib.so.0`), the verifier's provenance probe
(`importlib.import_module` in `_probe_installed_wheel`) inherits the verifier process's
environment. If `LD_LIBRARY_PATH` does not include the native deps lib path, the import
fails and provenance verification reports `verified=False`.

Fix: set `LD_LIBRARY_PATH` inline before running `run-stage`:
```
NATIVE_DEPS_LIB="$MIGBOT_NATIVE_DEPS_PREFIX/lib" \
LD_LIBRARY_PATH="$NATIVE_DEPS_LIB:$LD_LIBRARY_PATH" \
python3 .../orchestrate_thirdlibrary_migration.py run-stage ...
```

The native lib (`libta-lib.so.0`) is found at `$MIGBOT_NATIVE_DEPS_PREFIX/lib` which
points to the migration-native-envs deps/lib directory. The verifier's test run phase
already sets this for native tests, but the provenance probe uses `os.environ` directly
and needs the caller to have it set.
