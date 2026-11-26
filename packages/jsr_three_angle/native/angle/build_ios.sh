#!/bin/bash
# F3b iOS (issue #7 AC3 / SIZE-IOS-1): build the ANGLE 1B shim for the
# ios-arm64 DEVICE slice and stage it next to the pinned ANGLE libraries
# (staged by `tool/build_angle.sh --platform ios-arm64 --out <dir>`).
#
# Flat dylibs, not .framework bundles: the example embed step copies all
# three side by side into the app's Frameworks directory, so ANGLE's libEGL
# resolves libGLESv2 through its own module directory — the same layout the
# macOS host uses. App-Store-shaped framework wrapping belongs to
# distribution work, which is not claimed in this run (plan §9).
#
# Usage: bash packages/jsr_three_angle/native/angle/build_ios.sh [<out-dir>]
#   default out-dir: out/ios-arm64 (the CI-staged location)
set -euo pipefail
# Resolve OUT against the caller's cwd BEFORE cd-ing into the script dir:
# the CI job passes a workspace-relative path (run 45757020075 built into
# a nested duplicate path when OUT stayed relative past the cd).
OUT="${1:-out/ios-arm64}"
case "$OUT" in /*) ;; *) OUT="$PWD/$OUT" ;; esac
cd "$(dirname "$0")"

SDK=$(xcrun -sdk iphoneos --show-sdk-path)
[[ -d "$SDK" ]] || { echo "build_ios.sh: iphoneos SDK not found" >&2; exit 1; }
# The iPhoneOS SDK carries no public IOSurface header (verified Xcode 16.4 /
# iPhoneOS18.5, CI run 45753628959); angle_1b_iosurface.h detects that with
# __has_include and declares the ABI-stable subset itself.
mkdir -p "$OUT"

clang -isysroot "$SDK" -arch arm64 -mios-version-min=15.0 \
  -dynamiclib -O2 -Wall -Wextra \
  -framework CoreFoundation -framework IOSurface -framework CoreVideo \
  -I. -Igen \
  -install_name @rpath/libangle_1b.dylib \
  -o "$OUT/libangle_1b.dylib" angle_1b.c angle_1b_dispatch.c angle_1b_demo.c

codesign -s - --force --timestamp=none "$OUT/libangle_1b.dylib"

# Append the shim to the SHA256SUMS the ANGLE build wrote (REG-SUPPLY-1).
(cd "$OUT" && grep -v 'libangle_1b' SHA256SUMS > SHA256SUMS.tmp \
  && shasum -a 256 libangle_1b.dylib >> SHA256SUMS.tmp \
  && mv SHA256SUMS.tmp SHA256SUMS)

ls -la "$OUT"
echo "build_ios.sh: OK"
