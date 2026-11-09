#!/usr/bin/env bash
set -euo pipefail
native_dir=$1
shift
export LD_LIBRARY_PATH="$native_dir${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
exec "$@"
