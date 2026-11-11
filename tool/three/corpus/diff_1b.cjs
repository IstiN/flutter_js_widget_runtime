#!/usr/bin/env node
// diff_1b.cjs — M4 corpus pixel diff (same tier logic as compare_1b_render.sh):
//   exit 0 + TIER PASS_IDENTICAL  hashes equal
//   exit 0 + TIER PASS_TOLERANCE  >= 99% of pixels within per-channel d<=2 (RGB)
//   exit 1 + TIER FAIL            otherwise
// Usage: node tool/three/corpus/diff_1b.cjs <a.rgba> <b.rgba> [w] [h]
'use strict';
const fs = require('fs');
const [, , aPath, bPath, wArg, hArg] = process.argv;
const W = Number(wArg || 320), H = Number(hArg || 240);
if (!aPath || !bPath) { console.error('usage: diff_1b.cjs <a.rgba> <b.rgba>'); process.exit(2); }
const a = fs.readFileSync(aPath);
const b = fs.readFileSync(bPath);
if (a.length !== W * H * 4 || b.length !== W * H * 4) {
  console.log('DIFF_ERROR buffer size a=' + a.length + ' b=' + b.length + ' expected ' + W * H * 4);
  process.exit(1);
}
let maxDelta = 0, diffPx = 0, passPx = 0;
const min = [W, H], max = [-1, -1];
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4;
    let dmax = 0;
    for (let c = 0; c < 3; c++) {
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
console.log('DIFF differingPixels=' + diffPx + '/' + (W * H) + ' maxChannelDelta=' + maxDelta +
  ' matchingPct=' + pct.toFixed(4) + ' differingBBox=' + bbox);
process.exit(pct >= 99.0 ? 0 : 1);
