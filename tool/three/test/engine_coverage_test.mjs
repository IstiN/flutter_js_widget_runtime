// Evidence gate (issue #8 AC13, F4h): the two committed matrices may promote
// a row to "works on native 1B" only with green-test evidence. This test
// reads the two GENERATED files and fails when
//   1. a total does not equal the count over the rows,
//   2. a row whose status/verdict claims native-1B success has no evidence
//      object (engine_coverage lane '1b' rows; api_matrix oneB rows),
//   3. the evidence names a test file that does not exist or a test id the
//      file does not contain,
//   4. a promoted addon symbol's module is missing from the pinned three
//      tree (the same source the other tests use: THREE_SRC or
//      /tmp/jsr-three-r186; JSR-owned modules resolve inside the repo),
//   5. the committed engine_coverage.json drifted from its generator
//      (api_matrix drift is covered by test/api_matrix_test.mjs).
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const THREE_SRC = path.resolve(
  process.env.THREE_SRC || '/tmp/jsr-three-r186'
);

const api = JSON.parse(
  await readFile(path.join(ROOT, 'tool/three/api_matrix.json'), 'utf8')
);
const coverage = JSON.parse(
  await readFile(path.join(ROOT, 'tool/three/engine_coverage.json'), 'utf8')
);

// --- evidence bookkeeping ----------------------------------------------------
const fileCache = new Map();
async function contentOf(rel) {
  if (!fileCache.has(rel)) {
    fileCache.set(rel, await readFile(path.join(ROOT, rel), 'utf8'));
  }
  return fileCache.get(rel);
}

async function assertEvidence(where, evidence) {
  assert.ok(
    evidence && typeof evidence === 'object'
      && Array.isArray(evidence.ids) && evidence.ids.length > 0
      && Array.isArray(evidence.tests) && evidence.tests.length > 0,
    `${where}: evidence must be { ids: [...], tests: [...] }`
  );
  const blobs = [];
  for (const rel of evidence.tests) {
    const file = path.join(ROOT, rel);
    assert.ok(
      existsSync(file),
      `${where}: evidence test file missing: ${rel}`
    );
    blobs.push([rel, await contentOf(rel)]);
  }
  for (const id of evidence.ids) {
    const hit = blobs.find(([, text]) => text.includes(id));
    assert.ok(
      hit,
      `${where}: evidence id ${id} is not contained in any named test file (${evidence.tests.join(', ')})`
    );
  }
}

function moduleFile(row) {
  const mod = row.module;
  assert.ok(typeof mod === 'string' && mod.length > 0, `${row.symbol}: module path missing`);
  return mod.startsWith('tool/')
    ? path.join(ROOT, mod)
    : path.join(THREE_SRC, mod);
}

// --- 1. totals equal the counts over the rows --------------------------------
test('api_matrix totals equal the counts over the rows', () => {
  const count = (fn) => api.rows.filter(fn).length;
  const expected = {
    examples: api.rows.length,
    supported: count((r) => r.verdict === 'supported'),
    blocked: count((r) => r.verdict === 'blocked'),
    webLane: count((r) => r.verdict === 'web-lane'),
    unknownApi: count((r) => r.verdict === 'unknown-api'),
    prepared: count((r) => r.prepared),
    oneBSupported: count((r) => r.oneB === 'supported'),
    oneBDocumentedLimit: count((r) => r.oneB === 'documented-limit'),
  };
  for (const [key, value] of Object.entries(expected)) {
    assert.equal(
      api.totals[key], value,
      `api_matrix totals.${key} = ${api.totals[key]}, rows say ${value}`
    );
  }
});

test('engine_coverage totals equal the counts over the rows', () => {
  const engine = coverage.rows.filter((r) => r.kind !== 'addon');
  const all = coverage.rows;
  const expected = {
    engineExports: engine.length,
    addonsOneB: all.length - engine.length,
    r1Ok: engine.filter((r) => r.lane === 'r1' && r.status === 'ok').length,
    r1Bounded: engine.filter((r) => r.lane === 'r1' && r.status === 'bounded').length,
    r1No: engine.filter((r) => r.lane === 'web-only' && r.status === 'no').length,
    oneBOk: all.filter((r) => r.lane === '1b').length,
    upstreamCpu: engine.filter((r) => r.lane === 'upstream-cpu').length,
    constants: engine.filter((r) => r.lane === 'constant').length,
    nativeAbsent: engine.filter((r) => r.lane === 'native-absent').length,
    unclassified: engine.filter((r) => r.lane === 'unclassified').length,
  };
  for (const [key, value] of Object.entries(expected)) {
    assert.equal(
      coverage.totals[key], value,
      `engine_coverage totals.${key} = ${coverage.totals[key]}, rows say ${value}`
    );
  }
  // The derived headline numbers are engine-population arithmetic.
  assert.equal(coverage.totals.renderHonored, coverage.totals.r1Ok + coverage.totals.r1Bounded);
  assert.equal(coverage.totals.quickjsUsable,
    coverage.totals.renderHonored + coverage.totals.upstreamCpu + coverage.totals.constants);
});

// --- 2. every native-1B claim carries evidence -------------------------------
test('engine_coverage 1b rows carry evidence', async () => {
  const oneB = coverage.rows.filter((r) => r.lane === '1b');
  assert.ok(oneB.length > 0, 'no 1b rows: nothing is promoted');
  for (const row of oneB) {
    await assertEvidence(`engine_coverage ${row.symbol} (lane 1b)`, row.evidence);
  }
});

test('api_matrix oneB rows carry evidence', async () => {
  const promoted = api.rows.filter((r) => r.oneB != null);
  assert.ok(promoted.length > 0, 'no oneB rows: nothing is promoted');
  for (const row of promoted) {
    await assertEvidence(`api_matrix ${row.id} (oneB ${row.oneB})`, row.evidence);
  }
});

test('engine_coverage evidence-only rows carry evidence', async () => {
  // Rows that keep their lane but claim measured 1B capabilities via an
  // evidence object (HalfFloatType, WebGLRenderTarget).
  const annotated = coverage.rows.filter(
    (r) => r.kind !== 'addon' && r.lane !== '1b' && r.evidence != null
  );
  for (const row of annotated) {
    await assertEvidence(`engine_coverage ${row.symbol} (evidence)`, row.evidence);
  }
  assert.ok(annotated.length >= 2, 'expected the render-target evidence rows');
});

// --- 3./4. promoted addon modules exist in the pinned three tree -------------
test('promoted addon modules exist in the pinned three tree', () => {
  assert.ok(
    existsSync(path.join(THREE_SRC, 'build/three.module.js')),
    `pinned three tree missing at ${THREE_SRC} (set THREE_SRC; CI clones it before npm test)`
  );
  const addons = coverage.rows.filter((r) => r.kind === 'addon');
  assert.ok(addons.length > 0, 'no addon rows');
  for (const row of addons) {
    assert.ok(
      existsSync(moduleFile(row)),
      `promoted symbol ${row.symbol}: module missing at ${row.module}`
    );
  }
});

// --- 5. committed engine_coverage matches its generator ----------------------
test('engine_coverage.json matches its generator (no hand edits)', async () => {
  const { matrix } = await import('../engine_coverage.mjs');
  const strip = (m) => JSON.stringify({ ...m, generatedAt: undefined });
  assert.equal(
    strip(matrix),
    strip(coverage),
    'engine_coverage drifted: regenerate with `node tool/three/engine_coverage.mjs --write` and review'
  );
});

// Promotion bookkeeping the F4h handoff cites (17 example rows: 13 supported
// + 4 documented limits; 22 oneb symbols: 3 engine exports + 19 addons).
test('the F4h promotion set is complete', () => {
  assert.equal(api.totals.oneBSupported, 13);
  assert.equal(api.totals.oneBDocumentedLimit, 4);
  assert.equal(coverage.totals.oneBOk, 22);
  assert.equal(coverage.totals.addonsOneB, 19);
  // Guards inherited from the pre-F4h snapshot test: no export may linger
  // unclassified, and the deliberate web-lane split must stay visible.
  assert.equal(coverage.totals.unclassified, 0,
    'unclassified exports must be zero — classify new exports in engine_coverage.mjs');
  assert.ok(coverage.totals.webLane >= 1,
    'webLane tally missing — deliberate web-lane entries disappeared');
});
