import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

// Boot regression for the webgl_loader_vrml quota drop: elevationGrid1.wrl
// (90x90 ElevationGrid, 47,526 verts, 6.8M-char prepared JSON) used to be
// replaced by the 649B "model omitted" placeholder, so driving the official
// lil-gui asset dropdown to elevationGrid1 rendered an empty scene. This boot
// drives the REAL reprepared widget (externalized 6.8MB asset through the
// three.asset host lane) to both elevationGrid scenes and asserts the R1
// draw counts: grid1 15,842 triangles (89x89 quads), grid2 40 (its heightfield
// mesh; the surrounding 960-triangle frame mesh draws as its own call).

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const OUT = path.join(ROOT, 'example/widgets/three-loader-vrml');
const native = await readFile(path.join(ROOT, 'assets/three/jsr_three_native.js'), 'utf8');
const [html, module, widgetJs, externalAssets] = await Promise.all([
  readFile(path.join(OUT, 'original.html')),
  readFile(path.join(OUT, 'official_module.js')),
  readFile(path.join(OUT, 'widget.js'), 'utf8'),
  readFile(path.join(OUT, 'assets.json'), 'utf8').then(JSON.parse)
]);

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
{
  const open = /<script\b[^>]*\btype="module"[^>]*>/i.exec(html.toString('latin1'));
  const start = open.index + open[0].length;
  const direct = html.subarray(start, html.indexOf('</script>', start));
  assert.deepEqual(module, direct, 'saved module is the exact original byte span');
  const manifest = await readFile(path.join(OUT, 'prepare_manifest.json'), 'utf8').then(JSON.parse);
  assert.equal(sha(direct), manifest.outputs['official_module.js'].sha256);
  assert.equal(manifest.example, 'webgl_loader_vrml');
  const grid1 = externalAssets.assets.find(asset => asset.url === 'models/vrml/elevationGrid1.wrl');
  assert.ok(grid1, 'elevationGrid1 ships as an externalized asset');
  assert.equal(grid1.bytes, 6832353, 'grid1 payload is the decoded 6.8M-char scene, not the 649B placeholder');
}

const externalFiles = new Map(externalAssets.assets.map(asset => [asset.url, {
  file: asset.file,
  mime: asset.mime
}]));
const externalCache = new Map();

const renders = [];
const states = [];
const packets = [];
const rafs = new Map();
const timers = new Map();
let nextRaf = 0;
let nextTimer = 0;
const jsr = {
  instanceId: 'vrml-boot-test',
  _handler: null,
  render(tree) { renders.push(JSON.parse(JSON.stringify(tree))); },
  exportState(state) { states.push(JSON.parse(JSON.stringify(state))); },
  onEvent(handler) { this._handler = handler; },
  requestAnimationFrame(callback) { const id = ++nextRaf; rafs.set(id, callback); return id; },
  cancelAnimationFrame(id) { rafs.delete(id); },
  hostCallBinary(name, bytes) { assert.equal(name, 'three.r1'); packets.push(Buffer.from(bytes)); },
  async hostCall(name, args) {
    if (name === 'three.asset') {
      const url = args && args.url;
      const entry = externalFiles.get(url);
      if (!entry) throw new Error(`unexpected asset request ${url}`);
      let bytes = externalCache.get(url);
      if (!bytes) {
        bytes = await readFile(path.join(OUT, entry.file));
        externalCache.set(url, bytes);
      }
      return { data: bytes.toString('base64'), mime: entry.mime };
    }
    if (name === 'three.canvas2d') return new Promise(() => {});
    throw new Error(`unexpected host call ${name}`);
  }
};
const context = vm.createContext({
  jsr, console, performance, sendMessage() {}, TextEncoder, TextDecoder,
  setTimeout(callback) { const id = ++nextTimer; timers.set(id, callback); return id; },
  clearTimeout(id) { timers.delete(id); }
});
vm.runInContext(native, context, { filename: 'jsr_three_native.js' });
vm.runInContext('globalThis.THREE = THREE; Math.random = () => 0.375;', context);
const bootStarted = performance.now();
vm.runInContext(widgetJs, context, { filename: 'widget.js' });
const tick = () => new Promise(resolve => setImmediate(resolve));

// Boot settles the initial house.wrl load (inline asset, promise lane).
await tick();
await tick();
await tick();
assert.ok(rafs.size >= 1, 'official animate loop is scheduled');
const pump = async frames => {
  for (let index = 0; index < frames; index++) {
    await tick();
    const callbacks = [...rafs.values()];
    rafs.clear();
    if (callbacks.length === 1) callbacks[0](performance.now());
  }
};
await pump(4);
const houseTriangles = states.at(-1).renderer.triangles;
assert.ok(houseTriangles > 1000, `booted house scene draws (${houseTriangles} triangles)`);

function findDropdown(tree) {
  if (!tree || typeof tree !== 'object') return null;
  if (tree.type === 'dropdown' && tree.label === 'asset') return tree;
  for (const value of Object.values(tree)) {
    const found = findDropdown(value);
    if (found) return found;
  }
  return null;
}

// The facade renders the GUI tree once (no per-frame render churn), so the
// dropdown lives in the boot capture, not in later renders.
const dropdown = renders.map(tree => findDropdown(tree)).find(Boolean);
assert.ok(dropdown, 'official lil-gui asset dropdown is rendered');
assert.equal(dropdown.value, 'house', 'dropdown defaults to the official house asset');

async function driveAsset(value, now) {
  const from = states.at(-1).renderer.triangles;
  assert.ok(dropdown.items.includes(value), `dropdown lists ${value}`);
  jsr._handler(dropdown.onChanged, { value });
  // The external-asset fetch + ObjectLoader parse chain spans several
  // microtask turns; pump frames until the exported renderer stats react.
  for (let attempt = 0; attempt < 60; attempt++) {
    await tick();
    const callbacks = [...rafs.values()];
    rafs.clear();
    if (callbacks.length >= 1) callbacks.forEach(callback => callback(now + attempt * 16));
    if (states.at(-1).renderer.triangles !== from) return;
  }
  assert.notEqual(states.at(-1).renderer.triangles, from, `scene swapped to ${value}`);
}

await driveAsset('elevationGrid1', performance.now());
const grid1 = states.at(-1).renderer;
assert.equal(grid1.calls, 1, 'elevationGrid1 submits the heightfield draw call');
assert.equal(grid1.triangles, 15842, 'elevationGrid1 renders 15,842 triangles (89x89 quads)');

await driveAsset('elevationGrid2', performance.now());
const grid2 = states.at(-1).renderer;
// 40 (120-vert heightfield) + 960 (the .wrl's surrounding frame mesh, 561 verts):
// the official scene draws both meshes, so the composed count is 1000.
assert.equal(grid2.triangles, 1000,
  'elevationGrid2 renders heightfield 40 + frame mesh 960 triangles');
assert.equal(grid2.calls, 2, 'elevationGrid2 submits both mesh draw calls');

// Back to the dropped-scene regression anchor: house still switches cleanly.
await driveAsset('house', performance.now());
assert.ok(states.at(-1).renderer.triangles > 1000, 'switching back to house restores its scene');

console.log(JSON.stringify({
  ok: true,
  widgetSha256: sha(Buffer.from(widgetJs, 'utf8')),
  bootMs: Number((performance.now() - bootStarted).toFixed(0)),
  houseTriangles,
  elevationGrid1: { calls: grid1.calls, triangles: grid1.triangles, verts: 47526 },
  elevationGrid2: { calls: grid2.calls, triangles: grid2.triangles, verts: 120, frameMeshTris: 960 },
  externalAssetBytes: 6832353
}, null, 2));
