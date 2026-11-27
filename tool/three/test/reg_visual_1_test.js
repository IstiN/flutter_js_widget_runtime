// reg_visual_1_test.js — REG-VISUAL-1 / E2E-EXAMPLES acceptance-file test
// (issue #7, F2d, plan 4.4): the starter corpus gate data is complete and
// consistent. The corpus RUN itself (1B vs Chrome tiers) executes in the
// quality-macos job via tool/three/corpus_1b.sh; this test proves the
// acceptance contract: every starter id has an accepted tier, documented
// limits carry a reason that exists in docs/angle_1b.md, and the raw
// fixtures are valid corpus scenes.
//
// Run: node tool/three/test/reg_visual_1_test.js   (from the repo root)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');

const script = fs.readFileSync(path.join(ROOT, 'tool/three/corpus_1b.sh'), 'utf8');
const defaultIds = /DEFAULT_IDS="([^"]+)"/.exec(script)[1].trim().split(/\s+/);
assert.ok(defaultIds.length >= 12, `starter corpus has the named scenes + fixtures (${defaultIds.length})`);

const accepted = JSON.parse(fs.readFileSync(path.join(ROOT, 'tool/three/corpus/accepted_tiers.json'), 'utf8'));
const docs = fs.readFileSync(path.join(ROOT, 'docs/angle_1b.md'), 'utf8');

for (const id of defaultIds) {
  const entry = accepted[id];
  assert.ok(entry, `accepted tier exists for ${id}`);
  assert.ok(
    ['exact', 'tolerance', 'documented-limit'].includes(entry.tier),
    `${id}: tier is one of exact/tolerance/document`,
  );
  if (entry.tier === 'documented-limit') {
    assert.ok(entry.reason && entry.reason.length > 10, `${id}: documented-limit carries a reason`);
    assert.ok(
      docs.includes(id),
      `${id}: the documented limit appears in docs/angle_1b.md`,
    );
  } else {
    assert.ok(!entry.reason || entry.reason.length < 200, `${id}: reason optional for measured tiers`);
  }
}

// The two raw fixtures are valid corpus scenes: driver shape + draw + result.
for (const id of ['fixture-rawgl', 'fixture-readback']) {
  assert.ok(defaultIds.includes(id), `${id} is part of the starter corpus`);
  const scene = fs.readFileSync(path.join(ROOT, `tool/three/corpus/fixtures/${id}/scene.js`), 'utf8');
  assert.ok(scene.includes('__corpusBegin()'), `${id}: corpus driver begin`);
  assert.ok(scene.includes('__corpusHookThree()'), `${id}: corpus driver hook`);
  assert.ok(/drawArrays?\(/.test(scene), `${id}: issues a GL draw (draw-activity gate)`);
  assert.ok(scene.includes("ok: true"), `${id}: publishes __result ok`);
  assert.ok(scene.includes('readPixels') === (id === 'fixture-readback'), `${id}: readPixels only in the readback fixture`);
}

console.log('reg_visual_1_test.js: OK');
