#!/bin/bash
# compare_1b_render.sh — M3 exit gate (docs/angle_1b.md, issue #8/#7):
# run the REAL three.js r186 scene through the G1 dispatch decoder into ANGLE
# (tool/three/run_1b_render.dart, two fresh surfaces) and in real headless
# Chrome WebGL2 (tool/three/ref_1b_scene.cjs), then hash-compare.
#
#   PASS_IDENTICAL   1B hash === Web hash (FNV-1a over the raw RGBA readback)
#   PASS_TOLERANCE   not identical, but >= 99.0% of pixels within d<=2 per
#                    RGB channel (alpha excluded: the 1B IOSurface readback is
#                    opaque BGRA alpha=255, the Web canvas may keep alpha=0 in
#                    untouched corners; the scene itself writes alpha=255)
#   FAIL             otherwise
#
# The tier printed is always the real outcome — never faked. Run from the
# repo root: bash tool/three/compare_1b_render.sh
set -u

cd "$(dirname "$0")/../.."

echo '== [1/3] 1B harness: three r186 -> g1_packer -> webgl2_facade -> a1b_gl_dispatch (ANGLE Metal), two fresh surfaces =='
OUT_1B=$(dart run tool/three/run_1b_render.dart 2>/dev/null) || {
  echo 'FAIL: 1B harness exited nonzero (see stderr above)'
  exit 1
}
echo "$OUT_1B" | grep -E '^1B_RUN|^1B_DETERMINISTIC' || true

H1=$(echo "$OUT_1B" | sed -n 's/^1B_RUN1 hash=0x\([0-9a-f]*\) .*/\1/p')
H2=$(echo "$OUT_1B" | sed -n 's/^1B_RUN2 hash=0x\([0-9a-f]*\) .*/\1/p')
DET=$(echo "$OUT_1B" | sed -n 's/^1B_DETERMINISTIC //p')

echo '== [2/3] Web reference: same scene byte-identical in headless Chrome WebGL2 =='
OUT_WEB=$(node tool/three/ref_1b_scene.cjs 2>/dev/null) || {
  echo 'FAIL: web reference exited nonzero (see stderr above)'
  exit 1
}
echo "$OUT_WEB" | grep -E '^WEB ' || true

HW=$(echo "$OUT_WEB" | sed -n 's/^WEB hash=0x\([0-9a-f]*\) .*/\1/p')

echo '== [3/3] comparison =='
if [ -z "$H1" ] || [ -z "$H2" ] || [ -z "$HW" ]; then
  echo 'FAIL: could not parse one or more hashes'
  echo "  1B_run1='$H1' 1B_run2='$H2' web='$HW'"
  exit 1
fi
echo "hash trio: 1B_run1=0x$H1 1B_run2=0x$H2 WEB=0x$HW"

if [ "$DET" != 'true' ]; then
  echo 'FAIL: the two 1B runs are not hash-identical (nondeterministic pipeline)'
  exit 1
fi

if [ "$H1" = "$HW" ]; then
  echo 'TIER: PASS_IDENTICAL'
  exit 0
fi

# Not identical: per-pixel diff report (RGB channels; see header note on alpha).
node --input-type=commonjs - <<'NODE'
const fs = require('fs');
const W = 320, H = 240;
const a = fs.readFileSync('/tmp/angle1b_run1.rgba');
const b = fs.readFileSync('/tmp/angle1b_web.rgba');
if (a.length !== W * H * 4 || b.length !== W * H * 4) {
  console.log('DIFF_ERROR buffer size a=' + a.length + ' b=' + b.length);
  process.exit(1);
}
let maxDelta = 0, diffPx = 0, passPx = 0;
const min = [W, H], max = [-1, -1];
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4;
    let dmax = 0;
    for (let c = 0; c < 3; c++) { // RGB only
      const d = Math.abs(a[o + c] - b[o + c]);
      if (d > dmax) dmax = d;
    }
    if (dmax > maxDelta) maxDelta = dmax;
    if (dmax > 2) {
      diffPx++;
      if (x < min[0]) min[0] = x;
      if (y < min[1]) min[1] = y;
      if (x > max[0]) max[0] = x;
      if (y > max[1]) max[1] = y;
    } else {
      passPx++;
    }
  }
}
const pct = (passPx * 100) / (W * H);
const bbox = diffPx > 0 ? min[0] + ',' + min[1] + '-' + max[0] + ',' + max[1] : 'none';
console.log('DIFF differingPixels=' + diffPx + '/' + (W * H) + ' maxChannelDelta=' + maxDelta + ' withinPct=' + pct.toFixed(4) + ' differingBBox=' + bbox);
process.exit(pct >= 99.0 ? 0 : 1);
NODE
RC=$?
if [ "$RC" -eq 0 ]; then
  echo 'TIER: PASS_TOLERANCE'
  exit 0
fi
echo 'TIER: FAIL'
exit 1
