#!/bin/bash
# cases_f4i.sh — F4i downstream host proof, web leg (issue #8, segment F4i,
# AC15): the committed core cinematic module + the committed pinned three +
# the staged stock r186 AfterimagePass + the shared proof program in one
# Chrome session; the preview image, the arbitrary-frame screenshot and the
# PNG-sequence capture must be hash-equal at the bloom, DOF and temporal
# checkpoints; the missing-capability session must fail the export with the
# named error cinematic.notCapturable before any file is written.
#
# The native 1B leg is the Dart test test/angle1b/f4i_host_proof_test.dart
# (CI job quality-macos) — same program, same checkpoints.
#
# Summary line: F4I_SUMMARY checkpoints=3 equal=<k> — exit 1 unless every
# checkpoint is hash-equal and the missing-capability export failed cleanly.
set -u
cd "$(dirname "$0")/../.."

STAGE=/tmp/f4i

# Playwright (channel chrome: the system Chrome of the CI image; override
# with JSR_WEBGL_REF_CHANNEL=chromium where no Chrome.app exists).
if [ ! -d /tmp/node_modules/playwright ]; then
  echo '[f4i] playwright not found; installing to /tmp/node_modules'
  npm install playwright --prefix /tmp --no-audit --no-fund >/dev/null 2>&1 || {
    echo '[f4i] FAIL: playwright install failed — the web leg cannot run'
    exit 1
  }
fi

# esbuild for the staged AfterimagePass bundle (the tool/three devDependency
# when installed, else npm ci).
if [ ! -x tool/three/node_modules/.bin/esbuild ]; then
  npm ci --prefix tool/three >/dev/null 2>&1 || { echo '[f4i] FAIL: npm ci tool/three failed'; exit 1; }
fi

AFTERIMAGE="$STAGE/afterimage_f4i.js"
node tool/three/cinematic_host_proof/stage_afterimage.mjs --out "$AFTERIMAGE" || exit 1

OUT="$STAGE/web"
rm -rf "$OUT" "${OUT}_nocap"
node tool/three/cinematic_host_proof/ref_f4i_web.cjs --afterimage "$AFTERIMAGE" --out "$OUT"
RC=$?
SUMMARY=$(ls "$OUT" 2>/dev/null | grep -c '^frame_[0-9]\{4\}\.png$' || true)
if [ "$RC" -ne 0 ]; then
  echo "[f4i] FAIL: web leg exited $RC"
  exit "$RC"
fi
echo "[f4i] PASS: web proof green, $SUMMARY PNG files written"
exit 0
