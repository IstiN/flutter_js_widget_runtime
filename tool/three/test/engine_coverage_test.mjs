// Engine API coverage snapshot test: regenerates
// tool/three/engine_coverage.json from the pinned three.js build exports
// merged with the R1 facade support map, and diffs it against the committed
// snapshot. Any drift (new three.js pin, facade capability change, explicit
// classification) fails here — update the snapshot consciously with
// `node tool/three/engine_coverage.mjs --write` and review the diff.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');

const { matrix } = await import('../engine_coverage.mjs');
const committed = JSON.parse(
  await readFile(path.join(ROOT, 'tool/three/engine_coverage.json'), 'utf8')
);

const strip = (m) =>
  JSON.stringify({ ...m, generatedAt: undefined });
assert.equal(
  strip(matrix),
  strip(committed),
  'engine coverage drifted: regenerate with `node tool/three/engine_coverage.mjs --write` and review'
);

assert.equal(
  committed.totals.engineExports,
  matrix.totals.engineExports,
  'engine export count changed — did the three.js pin move?'
);
console.log(
  `engine coverage ok: ${committed.totals.engineExports} exports, ` +
  `${committed.totals.renderHonored} render-honored ` +
  `(${committed.totals.renderHonoredPct}%), ` +
  `quickjs-usable ${committed.totals.quickjsUsablePct}%`
);
