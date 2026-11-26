#!/bin/bash
# cases_f4b.sh — F4b web leg (issue #8, segment F4b, E2E-ALPHA-2 + the web
# determinism battery): the shared battery (cases_f4b/f4b_case_source.js)
# runs the core cinematic pipeline (stock UnrealBloomPass) in a bare
# Playwright-driven Chrome page — real WebGL2, no ANGLE lane, no Dart proxy
# (ref_f4b_cases.cjs probes the direct-web contract per run).
#
# Summary line: F4B_SUMMARY checks=<n> pass=<n> — exit 1 unless every check
# passes. Channel: JSR_WEBGL_REF_CHANNEL (default chrome; chromium where no
# Chrome install exists).
set -u
cd "$(dirname "$0")/../.."

if [ ! -d /tmp/node_modules/playwright ]; then
  echo '[f4b] playwright not found; installing to /tmp/node_modules'
  npm install playwright --prefix /tmp --no-audit --no-fund >/dev/null 2>&1 || {
    echo '[f4b] playwright install failed — the web leg will FAIL'
  }
fi

OUT=$(node tool/three/cases_f4b/ref_f4b_cases.cjs 2>&1) || {
  echo "$OUT"
  echo '[f4b] FAIL: web leg exited nonzero'
  exit 1
}
echo "$OUT"

SUMMARY=$(echo "$OUT" | sed -n 's/^F4B_SUMMARY checks=\([0-9]*\) pass=\([0-9]*\)$/\1 \2/p')
CHECKS=$(echo "$SUMMARY" | cut -d' ' -f1)
PASS=$(echo "$SUMMARY" | cut -d' ' -f2)
if [ -z "$CHECKS" ] || [ "$CHECKS" -lt 1 ] || [ "$CHECKS" != "$PASS" ]; then
  echo '[f4b] FAIL: not every battery check passed on web'
  exit 1
fi
echo "[f4b] PASS: $PASS/$CHECKS checks green on real WebGL2"
exit 0
