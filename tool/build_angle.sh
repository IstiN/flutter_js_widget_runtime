#!/bin/bash
# Reproducible ANGLE build for the 1B backend (docs/angle_1b.md).
# Produces libEGL + libGLESv2 dylibs from source (BSD-3-clause ANGLE).
# Usage: bash tool/build_angle.sh [--clean]
# Prerequisites: Xcode (Metal Toolchain component), git, ~15 GB disk.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$ROOT/third_party/angle-build"
DEPOT_TOOLS="$ROOT/third_party/depot_tools"
export PATH="$DEPOT_TOOLS:$PATH"
export DEPOT_TOOLS_UPDATE=0

if [[ "${1:-}" == "--clean" ]]; then
  rm -rf "$BUILD_DIR/out"
  echo 'removed third_party/angle-build/out'
fi

# 1. depot_tools (pinned shallow clone; update_depot_tools bootstraps cipd+python).
if [[ ! -x "$DEPOT_TOOLS/gclient" ]]; then
  git clone --depth 1 https://chromium.googlesource.com/chromium/tools/depot_tools.git "$DEPOT_TOOLS"
fi
"$DEPOT_TOOLS/update_depot_tools" || true

# 2. ANGLE checkout (gclient sync; fetch only on first run).
if [[ ! -f "$BUILD_DIR/BUILD.gn" ]]; then
  mkdir -p "$BUILD_DIR"
  (cd "$BUILD_DIR" && fetch --no-history angle)
fi

# 3. Metal toolchain (ANGLE macOS compiles .metal shaders; one-time download).
if ! xcrun -f metal >/dev/null 2>&1; then
  xcodebuild -downloadComponent MetalToolchain
fi

# 4. GN args: Metal-only, static, release, arm64 (see docs/angle_1b.md decision 7).
ARGS='is_debug=false target_cpu="arm64" is_component_build=false
angle_enable_vulkan=false angle_enable_gl=false angle_enable_metal=true
angle_enable_d3d11=false angle_enable_d3d9=false angle_enable_null=false
angle_enable_swiftshader=false angle_enable_retrace=false'

(cd "$BUILD_DIR" && gn gen out/Release --args="$ARGS")
(cd "$BUILD_DIR" && autoninja -C out/Release libEGL libGLESv2)

ls -la "$BUILD_DIR/out/Release/libEGL.dylib" "$BUILD_DIR/out/Release/libGLESv2.dylib"
echo 'ANGLE build OK — stage with: cp third_party/angle-build/out/Release/{libEGL,libGLESv2}.dylib native/angle/'
