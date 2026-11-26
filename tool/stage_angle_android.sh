#!/bin/bash
# F3a Android: stage the pinned ANGLE libraries (libEGL_angle.so,
# libGLESv2_angle.so) and the libangle_1b.so shim per ABI into the jniLibs
# source dir of the example app (example/build/angle-jniLibs — inside the
# gitignored build/ tree, binaries are never committed, REG-SUPPLY-1).
# CI job angle-android-apk runs this before `flutter build apk --debug`;
# a local device run does the same.
#
# Usage: bash tool/stage_angle_android.sh
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
OUT_ROOT="$REPO/packages/jsr_three_angle/native/angle/out"
STAGE="$REPO/example/build/angle-jniLibs"

staged=0
for pair in android-arm64:arm64-v8a android-armv7:armeabi-v7a android-x86_64:x86_64; do
  platform="${pair%%:*}"
  abi="${pair##*:}"
  src="$OUT_ROOT/$platform"
  if [[ -f "$src/libangle_1b.so" ]]; then
    mkdir -p "$STAGE/$abi"
    cp "$src/libEGL_angle.so" "$src/libGLESv2_angle.so" "$src/libangle_1b.so" "$STAGE/$abi/"
    echo "staged $platform -> $STAGE/$abi"
    staged=$((staged + 1))
  else
    echo "skip $platform (no build in $src — the APK carries no ANGLE for $abi)"
  fi
done

if ((staged == 0)); then
  echo "no ANGLE android builds staged — run tool/build_angle.sh per ABI first" >&2
  exit 1
fi
ls -la "$STAGE"/*/
