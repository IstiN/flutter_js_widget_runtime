#!/bin/bash
# Build native/angle/libangle_1b.dylib — the ANGLE 1B shim (M1 EGL/IOSurface
# path + M2 G1 binary GL dispatch).
# Usage: bash native/angle/build.sh   (from the repo root)
set -euo pipefail
cd "$(dirname "$0")"

OUT=libangle_1b.dylib
clang -dynamiclib -O2 -Wall -Wextra \
  -framework CoreFoundation -framework IOSurface -framework CoreVideo \
  -I. -Igen \
  -install_name @rpath/libangle_1b.dylib \
  -o "$OUT" angle_1b.c angle_1b_dispatch.c angle_1b_demo.c

# Ad-hoc sign so dlopen from Dart/Flutter works on arm64.
codesign -s - --force "$OUT"

ls -la "$OUT"
echo "build.sh: OK"
