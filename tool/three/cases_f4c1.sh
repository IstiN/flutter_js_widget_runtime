#!/bin/bash
# cases_f4c1.sh — the F4c1 harness entry (issue #8, segment F4c1).
#
#   bash tool/three/cases_f4c1.sh web       — the Chrome WebGL2 reference leg
#           (tool/three/cases_f4c1/ref_f4c1_web.cjs over the committed core
#           bundle + the shared widget checkpoint program).
#   bash tool/three/cases_f4c1.sh compare   — the 1B-vs-web tier measurement
#           (corpus diff_1b.cjs tiers over $JSR_F4C1_DIR/oneb_*.rgba vs
#           web_*.rgba; the Dart tests write the 1B dumps first).
#
# Tier summary line: F4C1_SUMMARY total=<n> identical=<n> tolerance=<n>
# fail=<n> missing=<n> — exit 1 on FAIL.
set -u
cd "$(dirname "$0")/../.."

MODE="${1:-web}"
export JSR_WEBGL_REF_CHANNEL="${JSR_WEBGL_REF_CHANNEL:-chrome}"
export JSR_F4C1_DIR="${JSR_F4C1_DIR:-/tmp/f4c1}"

if [ "$MODE" = "compare" ]; then
  node tool/three/cases_f4c1/ref_f4c1_web.cjs compare --dir "$JSR_F4C1_DIR"
  exit $?
fi

# Web leg: Playwright from /tmp/node_modules (installed once — the same
# convention as showcase_1b.sh and corpus_1b.sh); channel 'chrome' needs no
# browser download, chromium does.
if [ ! -d /tmp/node_modules/playwright ]; then
  echo '[f4c1] playwright not found; installing to /tmp/node_modules'
  npm install playwright --prefix /tmp --no-audit --no-fund >/dev/null 2>&1 || {
    echo '[f4c1] playwright install failed — the web leg will FAIL'
  }
fi
node tool/three/cases_f4c1/ref_f4c1_web.cjs web --dir "$JSR_F4C1_DIR"
exit $?
