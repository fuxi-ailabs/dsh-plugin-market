# libpng integration fixture

This is a deliberately incomplete application-side CMake configuration for a reproducible demo. It is not an upstream libpng bug. The external library is unmodified and is not vendored here; the recording uses [libpng 1.6.59](https://github.com/pnggroup/libpng/tree/v1.6.59).

Both independent Agent workspaces start with these exact files. Agent A works on `info`, Agent B on `roundtrip`. Each CMake target finds the library and includes its headers but initially omits the library link. See the parent [recording guide](../crowdmemory-coding-recording.md) for actual patches, tests, memory receipts and environment limits.

Generate the committed 2×2 RGBA input with `python3 generate-fixture.py`. The two C programs inspect actual pixels; `roundtrip` decodes, encodes and reloads through libpng, then compares all decoded bytes.

Configure with `cmake -S info -B build/info -DCMAKE_PREFIX_PATH=<libpng-prefix>`, then `cmake --build build/info`. The initial link is expected to fail. Apply the corresponding published Agent patch before running CTest. Replace `info` with `roundtrip` for B's task. The initial error and functional tests are independently rerun against clean copies in the public verification outputs.
