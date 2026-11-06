import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { decodeVrmlAsset } from '../asset_decode.mjs';

// The prepare-time VRML lane serializes the scene with scene.toJSON().
// VRMLLoader pins its Background group at renderOrder = -Infinity, which
// JSON.stringify writes as `null`; ObjectLoader then restores renderOrder =
// null and the strict R1 finite render-order guard rejects every node
// command ("node renderOrder must be finite"), leaving webgl_loader_vrml
// black. decodeVrmlAsset must serialize the same finite symmetric sentinels
// the renderer itself uses for +/-Infinity render order.

const require = createRequire(import.meta.url);
// node_modules/three is the pinned r186 tree (symlinked for node tests);
// its package.json is not exported, so resolve the symlink target directly.
const source = await realpath(path.join(path.dirname(require.resolve('three')), '..'));

const wrlBytes = await readFile(path.join(source, 'examples/models/vrml/house.wrl'));
const payload = JSON.parse((await decodeVrmlAsset(source, wrlBytes, 'models/vrml/house.wrl')).toString('utf8'));

assert.equal(payload.jsrPreparedVrml, true, 'prepared VRML payload marker');
assert.equal(payload.warning, null, 'house.wrl parses at prepare time without warnings');

const renderOrders = [];
(function walk(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) { node.forEach(walk); return; }
  if (typeof node.renderOrder === 'number') renderOrders.push(node.renderOrder);
  Object.values(node).forEach(walk);
})(payload.scene);

assert.ok(renderOrders.length > 0, 'serialized scene contains renderOrder fields');
assert.equal(renderOrders.length, renderOrders.filter(Number.isFinite).length,
  'no serialized renderOrder may be non-finite (JSON would encode it as null)');
assert.ok(renderOrders.includes(-1e30),
  'VRMLLoader Background group must serialize as the finite -1e30 sentinel, not null');
assert.ok(!renderOrders.includes(null) && renderOrders.every(value => value !== null),
  'no null renderOrder survives serialization');

// Runtime lane parity: ObjectLoader must restore every renderOrder as a
// finite number.
const THREE = await import(path.join(source, 'build/three.module.js'));
const scene = new THREE.ObjectLoader().parse(payload.scene);
let visited = 0;
scene.traverse(object => {
  visited++;
  assert.equal(typeof object.renderOrder, 'number', 'restored renderOrder is a number');
  assert.ok(Number.isFinite(object.renderOrder), `restored renderOrder is finite on ${object.type}`);
});
assert.ok(visited > 1, 'ObjectLoader restored the VRML node tree');

// Sanity anchor for the regression: raw JSON would have lost -Infinity.
assert.equal(JSON.parse(JSON.stringify({ renderOrder: -Infinity })).renderOrder, null,
  'documents the lossy JSON encoding this fix guards against');

// -1e30 keeps the R1 float32 v7 node-command tail finite.
assert.ok(Number.isFinite(-1e30) && Math.abs(-1e30) < Number.MAX_VALUE,
  'sentinel stays inside the finite float32 protocol boundary');
assert.equal(THREE.REVISION, '186', 'pinned source revision');

// Quota regression: elevationGrid1.wrl (90x90 ElevationGrid heightfield) is the
// biggest pinned VRML scene. The old 2,000,000-char quota silently replaced it
// with the 649B "model omitted" placeholder, so the lil-gui asset dropdown
// switched to an empty scene. The measured serialization is 6,832,305 chars —
// the quota (now 8,000,000) must admit it with headroom while a genuinely
// oversized scene still degrades with an explicit warning.
const grid1Bytes = await readFile(path.join(source, 'examples/models/vrml/elevationGrid1.wrl'));
const grid1Started = performance.now();
const grid1Raw = (await decodeVrmlAsset(source, grid1Bytes, 'models/vrml/elevationGrid1.wrl')).toString('utf8');
const grid1DecodeMs = performance.now() - grid1Started;
assert.ok(grid1Raw.length < 8000000, 'grid1 payload stays inside the prepare quota');
const grid1Payload = JSON.parse(grid1Raw);
assert.equal(grid1Payload.jsrPreparedVrml, true, 'grid1 payload marker');
assert.equal(grid1Payload.warning, null,
  'the 6.8M-char elevationGrid1 serialization must no longer be quota-dropped');
const grid1Scene = new THREE.ObjectLoader().parse(grid1Payload.scene);
const grid1Meshes = [];
grid1Scene.traverse(object => {
  if (object.isMesh) grid1Meshes.push(object.geometry.getAttribute('position').count);
});
assert.equal(grid1Meshes.length, 1, 'grid1 restores exactly one heightfield mesh');
assert.equal(grid1Meshes[0], 47526, 'grid1 heightfield vertex count 47,526');
let grid1Geometry = null;
grid1Scene.traverse(object => { if (!grid1Geometry && object.isMesh) grid1Geometry = object.geometry; });
assert.ok(grid1Geometry, 'grid1 mesh found in the restored scene');
const grid1Tris = grid1Geometry.index ? grid1Geometry.index.count / 3 : grid1Geometry.getAttribute('position').count / 3;
assert.equal(grid1Tris, 15842, 'grid1 heightfield triangle count 15,842 (89x89 quads)');

// elevationGrid2 (small 120-vertex heightfield) keeps its healthy decode and
// also carries the surrounding frame mesh the .wrl defines (561 verts).
const grid2Bytes = await readFile(path.join(source, 'examples/models/vrml/elevationGrid2.wrl'));
const grid2Payload = JSON.parse(
  (await decodeVrmlAsset(source, grid2Bytes, 'models/vrml/elevationGrid2.wrl')).toString('utf8'));
assert.equal(grid2Payload.warning, null, 'grid2 parses without warnings');
const grid2Scene = new THREE.ObjectLoader().parse(grid2Payload.scene);
const grid2Meshes = [];
grid2Scene.traverse(object => {
  if (!object.isMesh) return;
  const geometry = object.geometry;
  grid2Meshes.push({
    verts: geometry.getAttribute('position').count,
    tris: geometry.index ? geometry.index.count / 3 : geometry.getAttribute('position').count / 3
  });
});
assert.ok(grid2Meshes.length >= 1, 'ObjectLoader restores grid2 meshes');
assert.ok(grid2Meshes.some(mesh => mesh.verts === 120 && mesh.tris === 40),
  'grid2 heightfield mesh is 120 verts / 40 tris');
assert.ok(grid2Meshes.every(mesh => mesh.verts + mesh.tris > 0), 'no dropped grid2 geometry');

// V8 baseline for the in-isolate cost estimate: JSON.parse of the 6.8M-char
// payload. The QuickJS isolate number is measured separately (jsr_widget bench,
// see the boot test log) because the prepare-time export runs on V8.
const v8ParseStarted = performance.now();
JSON.parse(grid1Raw);
const v8ParseMs = performance.now() - v8ParseStarted;

console.log(`vrml_prepare_test: ${visited} nodes restored, renderOrders ${JSON.stringify([...new Set(renderOrders)])}; ` +
  `grid1 ${grid1Raw.length} chars warn=null verts=47526 tris=15842 decodeMs=${grid1DecodeMs.toFixed(0)} ` +
  `v8JsonParseMs=${v8ParseMs.toFixed(0)}; grid2 ${JSON.stringify(grid2Meshes)}`);
