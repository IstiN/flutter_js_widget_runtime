#!/bin/bash
# Reproducible ANGLE build for the 1B backend (ADR-0002 / issue #7).
# Always checks out the PINNED revision from tool/three/pins/angle_pin.json
# (never a floating main) and writes the SHA256 of every output next to the
# artifact.
#
# Usage: bash tool/build_angle.sh --platform <id> --out <dir> [--clean]
#   Platform ids: macos-arm64 ios-arm64 android-arm64 android-armv7 android-x86_64
# Prerequisites: Xcode (Metal Toolchain component; macos/ios), Android NDK
#   (android targets), git, ~15 GB disk, python3.
#
# Built in this run: macos-arm64 (F2, CI job quality-macos, cached by the
# hash of angle_pin.json); android-arm64/armv7/x86_64 and ios-arm64 (F3).
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
PIN="$REPO/tool/three/pins/angle_pin.json"
BUILD_DIR="$REPO/third_party/angle-build"
DEPOT_TOOLS="$REPO/third_party/depot_tools"
OUT_DIR=""
PLATFORM=""
CLEAN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --platform) PLATFORM="$2"; shift 2 ;;
    --out) OUT_DIR="$2"; shift 2 ;;
    --clean) CLEAN=1; shift ;;
    *) echo "unknown argument: $1" >&2; exit 1 ;;
  esac
done

[[ -n "$PLATFORM" ]] || { echo '--platform <id> is required' >&2; exit 1; }
[[ -n "$OUT_DIR" ]] || { echo '--out <dir> is required' >&2; exit 1; }

PLATFORM_JSON=$(python3 - "$PIN" "$PLATFORM" <<'PY'
import json, sys
pin, platform = sys.argv[1], sys.argv[2]
data = json.load(open(pin))
if platform not in data.get("gn", {}):
    print(f"unknown platform id: {platform}", file=sys.stderr)
    sys.exit(1)
print(data["gn"][platform].replace('\\"', '"'))
PY
)
REVISION=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['revision'])" "$PIN")
SOURCE=$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['source'])" "$PIN")

echo "ANGLE pin: $REVISION ($PLATFORM)"
echo "GN args:   $PLATFORM_JSON"

# F3b iOS: chromium's //build/config/apple/mobile_config.gni requires
# target_environment for target_os=ios (run 45743144553 failed the assert
# 'target_environment must be in ["simulator", "device", "catalyst"]').
# The pin records the upstream-equivalent compilation args; the DEVICE
# environment is injected here at gn-gen time. A simulator environment is
# never built: the size evidence (SIZE-IOS-1) is the device slice, and the
# simulator build of the example runs the stock Flutter toolchain.
if [[ "$PLATFORM" == ios-* ]]; then
  # ios_enable_code_signing=false: the CI runner has no signing identity
  # (run 45748149398: find_signing_identity.py found 0 identities). The
  # frameworks stay unsigned here; the example embed phase ad-hoc signs
  # them at app-build time, which is all local loading needs.
  PLATFORM_JSON="$PLATFORM_JSON target_environment=\"device\" ios_enable_code_signing=false"
  echo "GN args:   $PLATFORM_JSON  (target_environment injected for ios)"
fi

if [[ "$CLEAN" == 1 ]]; then
  rm -rf "$BUILD_DIR"
  echo "removed $BUILD_DIR"
fi

# 1. depot_tools (pinned shallow clone; update_depot_tools bootstraps cipd+python).
if [[ ! -x "$DEPOT_TOOLS/gclient" ]]; then
  git clone --depth 1 https://chromium.googlesource.com/chromium/tools/depot_tools.git "$DEPOT_TOOLS"
fi
export PATH="$DEPOT_TOOLS:$PATH"
# No DEPOT_TOOLS_UPDATE=0 here: a fresh depot_tools clone must bootstrap
# (cipd + python3_bin_reldir.txt) or gclient dies with "python3_bin_reldir.txt
# not found" — exactly what CI's first ANGLE run hit.
"$DEPOT_TOOLS/update_depot_tools" || true

# 2. ANGLE checkout, ALWAYS at the pinned revision (pin discipline:
#    explicit fetch + checkout of the recorded 40-hex sha, never a moving
#    main; the record in docs/adr/0002-angle-pin-and-build.md binds it).
if [[ ! -f "$BUILD_DIR/BUILD.gn" ]]; then
  mkdir -p "$BUILD_DIR"
  (cd "$BUILD_DIR" && fetch --no-history angle)
fi
(cd "$BUILD_DIR" && git fetch origin "$REVISION" && git checkout --detach "$REVISION")
ACTUAL=$(cd "$BUILD_DIR" && git rev-parse HEAD)
if [[ "$ACTUAL" != "$REVISION" ]]; then
  echo "pin check failed: checkout is $ACTUAL, pin says $REVISION" >&2
  exit 1
fi

# 3. Metal toolchain (ANGLE macOS/iOS compile .metal shaders; one-time download).
if ! xcrun -f metal >/dev/null 2>&1; then
  xcodebuild -downloadComponent MetalToolchain
fi

# 4. GN gen + ninja for the requested platform (args verbatim from the pin).
OUT_CONFIG="out/$PLATFORM"
(cd "$BUILD_DIR" && gn gen "$OUT_CONFIG" --args="$PLATFORM_JSON")
(cd "$BUILD_DIR" && autoninja -C "$OUT_CONFIG" libEGL libGLESv2)

# 5. Stage outputs + SHA256 next to the artifacts (REG-SUPPLY-1).
mkdir -p "$OUT_DIR"
EXT="dylib"
if [[ "$PLATFORM" == android-* ]]; then EXT="so"; fi
for lib in libEGL libGLESv2; do
  # F3b iOS: staged by the ios-* block below (framework bundles on disk).
  if [[ "$PLATFORM" != ios-* ]]; then
    cp "$BUILD_DIR/$OUT_CONFIG/$lib.$EXT" "$OUT_DIR/"
  fi
done
if [[ "$PLATFORM" == ios-* ]]; then
  # F3b iOS (issue #7 AC3 / SIZE-IOS-1): GN's ios_framework_bundle emits
  # $lib.framework/$lib for target_os=ios. Stage the Mach-O binaries as
  # flat dylibs (re-id + ad-hoc re-sign) so the example embed step copies
  # one file per library and ANGLE's libEGL resolves libGLESv2 via its own
  # module directory — the macOS host layout.
  for lib in libEGL libGLESv2; do
    if [[ -f "$BUILD_DIR/$OUT_CONFIG/$lib.framework/$lib" ]]; then
      cp "$BUILD_DIR/$OUT_CONFIG/$lib.framework/$lib" "$OUT_DIR/$lib.dylib"
      install_name_tool -id "@rpath/$lib.dylib" "$OUT_DIR/$lib.dylib"
      codesign -s - --force --timestamp=none "$OUT_DIR/$lib.dylib"
    elif [[ -f "$BUILD_DIR/$OUT_CONFIG/$lib.dylib" ]]; then
      cp "$BUILD_DIR/$OUT_CONFIG/$lib.dylib" "$OUT_DIR/"
    else
      echo "build_angle.sh: neither $lib.framework/$lib nor $lib.dylib found in $BUILD_DIR/$OUT_CONFIG" >&2
      exit 1
    fi
  done
fi
if [[ "$PLATFORM" == android-* ]]; then
  # Android ships one merged ELF; keep the standard ANGLE names.
  echo "staged: $(ls "$OUT_DIR")"
fi
(cd "$OUT_DIR" && shasum -a 256 "libEGL.$EXT" "libGLESv2.$EXT" > SHA256SUMS)
cat "$OUT_DIR/SHA256SUMS"
echo "ANGLE build OK for $PLATFORM — staged in $OUT_DIR"
