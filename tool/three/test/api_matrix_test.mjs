// API matrix snapshot test: regenerates tool/three/api_matrix.json from the
// pinned examples + facade support map and diffs it against the committed
// snapshot. Any drift (new pinned example, facade capability change, class
// added to the map) fails here — update the snapshot consciously with
// `node tool/three/api_matrix.mjs --write` and review the diff.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');

const { matrix } = await import('../api_matrix.mjs');
const committed = JSON.parse(
  await readFile(path.join(ROOT, 'tool/three/api_matrix.json'), 'utf8')
);

// Timestamps are excluded from the comparison on purpose.
const strip = m => JSON.stringify({ ...m, generatedAt: undefined, rows: m.rows.map(r => ({ ...r })) });
assert.equal(
  strip(matrix),
  strip(committed),
  'api matrix drifted: regenerate with `node tool/three/api_matrix.mjs --write` and review'
);

// Every prepared registry id must appear in the matrix with a row.
for (const row of committed.rows) {
  if (row.prepared) {
    assert.equal(
      matrix.rows.some(r => r.id === row.id && r.prepared),
      true,
      `prepared example ${row.id} disappeared from the matrix`
    );
  }
}
console.log(
  `api matrix ok: ${committed.totals.examples} examples, ` +
  `${committed.totals.supported} supported, ${committed.totals.prepared} prepared`
);
