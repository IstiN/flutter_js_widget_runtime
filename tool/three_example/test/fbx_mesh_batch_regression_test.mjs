#!/usr/bin/env node
// Focused owner-regression probe for CPU-skinned FBX uploads and BatchedMesh
// proxy retention. Builds the current native sources in memory; never rewrites
// the checked-in shared bundle or prepared examples.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { build } from '../../three/node_modules/esbuild/lib/main.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const SOURCE = process.env.THREE_SRC || '/tmp/jsr-three-r186';
const result = await build({
  absWorkingDir: ROOT,
  entryPoints: [path.join(ROOT, 'tool/three/src/native_entry.js')],
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'THREE',
  platform: 'neutral',
  target: ['es2020'],
  minify: false,
  treeShaking: true,
  define: { __THREE_DEVTOOLS__: 'undefined' },
  plugins: [{
    name: 'focused-pinned-three',
    setup(builder) {
      builder.onResolve({ filter: /^three$/ }, args => ({
        path: args.importer.startsWith(path.join(SOURCE, 'examples/'))
          ? path.join(ROOT, 'tool/three/src/native_three_shim.js')
          : path.join(SOURCE, 'src/Three.js')
      }));
      builder.onResolve({ filter: /^three\/addons\/(.+)$/ }, args => ({
        path: path.join(SOURCE, 'examples/jsm', args.path.slice('three/addons/'.length))
      }));
    }
  }]
});
const native = Buffer.from(result.outputFiles[0].contents).toString('utf8');

function emptyStats() {
  return { bytes: 0, commands: 0, geometry: 0, geometryBytes: 0,
    retainedGeometry: 0, removeNodes: 0, batches: 0, frames: 0 };
}

async function boot(directory) {
  const widgetDir = path.join(ROOT, 'example/widgets', directory);
  const assetMap = new Map();
  try {
    const manifest = JSON.parse(await readFile(path.join(widgetDir, 'assets.json'), 'utf8'));
    for (const asset of manifest.assets || []) {
      assetMap.set(asset.url, asset.file);
      for (const alias of asset.aliases || []) assetMap.set(alias, asset.file);
    }
  } catch { /* mesh_batch has no external assets */ }
  const widget = await readFile(path.join(widgetDir, 'widget.js'), 'utf8');
  const rafs = new Map();
  const ticks = [];
  const errors = [];
  const logs = [];
  let stats = emptyStats();
  let nextRaf = 0;
  let exported = null;
  let eventHandler = null;
  const jsr = {
    instanceId: `focused-${directory}`,
    render() {},
    exportState(state) { exported = state; },
    onEvent(handler) { eventHandler = handler; },
    requestAnimationFrame(callback) { const id = ++nextRaf; rafs.set(id, callback); return id; },
    cancelAnimationFrame(id) { rafs.delete(id); },
    hostCallBinary(name, bytes) {
      if (name !== 'three.r1' || !bytes) return;
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const header = view.getUint16(6, true);
      assert.equal(view.getUint16(header + 4, true), 10, 'R1 v10 retention stream');
      const count = view.getUint32(header + 8, true);
      let offset = header + 12;
      stats.bytes += bytes.byteLength;
      stats.commands += count;
      for (let index = 0; index < count; index++) {
        const opcode = view.getUint8(offset);
        const length = view.getUint32(offset + 4, true);
        if (opcode === 1) {
          stats.geometry++;
          stats.geometryBytes += length;
          if (view.getUint32(offset + 8 + 24, true) === 1) stats.retainedGeometry++;
        } else if (opcode === 5) stats.removeNodes++;
        else if (opcode === 11) stats.batches++;
        else if (opcode === 8) stats.frames++;
        offset += 8 + length;
      }
    },
    async hostCall(name, args) {
      if (name === 'three.canvas2d') return new Promise(() => {});
      if (name === 'three.asset') {
        const url = String(args && (args.url || args.path || args.src));
        const file = assetMap.get(url) || url.replaceAll('/', '__');
        const bytes = await readFile(path.join(widgetDir, file));
        return { data: bytes.toString('base64'), mime: 'application/octet-stream' };
      }
      return {};
    }
  };
  const context = vm.createContext({
    jsr, performance, sendMessage() {}, TextEncoder, TextDecoder, atob,
    setTimeout, clearTimeout, setInterval, clearInterval,
    console: {
      log: (...parts) => logs.push(parts.join(' ')),
      warn: (...parts) => logs.push(`[W] ${parts.join(' ')}`),
      error: (...parts) => { const line = parts.join(' '); logs.push(`[E] ${line}`); errors.push(line); },
      info() {}, debug() {}, time() {}, timeEnd() {}
    },
    __jsrSkinBytes(name, bytes) {
      const floats = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
      floats[3] = 1;
    }
  });
  vm.runInContext(native, context, { filename: 'focused-native.js' });
  vm.runInContext(`
    globalThis.THREE = THREE;
    globalThis.__rejections = [];
    const originalThen = Promise.prototype.then;
    Promise.prototype.then = function(ok, fail) {
      return originalThen.call(this, ok, function(error) {
        globalThis.__rejections.push(String(error && error.message ? error.message : error));
        if (fail) return fail(error);
        throw error;
      });
    };
    globalThis.__capturedBatch = null;
    const setMatrix = THREE.BatchedMesh.prototype.setMatrixAt;
    THREE.BatchedMesh.prototype.setMatrixAt = function(...args) {
      globalThis.__capturedBatch = this;
      return setMatrix.apply(this, args);
    };
    globalThis.__pinBatchProxies = () => {
      const mesh = globalThis.__capturedBatch;
      globalThis.__pinnedProxies = mesh.children.filter(child => child.userData.jsrBatchedMeshProxy);
      return globalThis.__pinnedProxies.length;
    };
    globalThis.__batchProxiesRetained = () => {
      const mesh = globalThis.__capturedBatch;
      const current = mesh.children.filter(child => child.userData.jsrBatchedMeshProxy);
      return current.length === globalThis.__pinnedProxies.length &&
        current.every((proxy, index) => proxy === globalThis.__pinnedProxies[index]);
    };
    globalThis.__editBatchData = () => {
      const mesh = globalThis.__capturedBatch;
      mesh.setMatrixAt(0, new THREE.Matrix4().makeTranslation(3, 4, 5));
      mesh.setColorAt(0, new THREE.Color(0.2, 0.4, 0.6));
    };
  `, context);
  vm.runInContext(widget, context, { filename: `${directory}.js` });
  let elapsed = 0;
  async function pump(count = 1) {
    for (let frame = 0; frame < count; frame++) {
      for (let turn = 0; turn < 4; turn++) await new Promise(resolve => setImmediate(resolve));
      const pending = [...rafs.values()];
      rafs.clear();
      assert.ok(pending.length > 0, `${directory}: RAF must remain scheduled`);
      const started = performance.now();
      for (const callback of pending) {
        try { callback(elapsed); } catch (error) { errors.push(error.stack || String(error)); }
      }
      ticks.push({ ms: performance.now() - started, ...stats });
      stats = emptyStats();
      elapsed += 16.6666666667;
      for (let turn = 0; turn < 4; turn++) await new Promise(resolve => setImmediate(resolve));
    }
  }
  for (let turn = 0; turn < 2000 && rafs.size === 0; turn++) {
    await new Promise(resolve => setImmediate(resolve));
  }
  assert.ok(rafs.size > 0, `${directory}: initial RAF`);
  return {
    context, ticks, errors, logs, pump,
    exported: () => exported,
    async change(property, value) {
      const control = exported.gui.values.find(item => item.property === property);
      assert.ok(control, `${directory}: control ${property}`);
      assert.equal(typeof eventHandler, 'function', 'GUI event handler registered');
      eventHandler(control.action, { value });
      await pump(2);
    },
    evaluate(expression) { return vm.runInContext(expression, context); },
    finish() {
      assert.deepEqual(errors, [], `${directory}: no RAF/console errors\n${logs.slice(-8).join('\n')}`);
      assert.equal(vm.runInContext('globalThis.__rejections.length', context), 0,
        vm.runInContext('JSON.stringify(globalThis.__rejections)', context));
    }
  };
}

const fbx = await boot('three-loader-fbx');
await fbx.pump(14);
const active = fbx.ticks.filter(tick => tick.geometryBytes > 100000);
assert.ok(active.length >= 10, `full-rate mixer expected, got ${active.length}/14 active ticks`);
const steady = active.slice(1); // first model upload is necessarily complete
assert.ok(steady.every(tick => tick.retainedGeometry === tick.geometry && tick.geometry > 0),
  `every steady dynamic FBX revision retains immutable fields: ${JSON.stringify(active)}`);
const maxGeometryBytes = Math.max(...steady.map(tick => tick.geometryBytes));
assert.ok(maxGeometryBytes < 4000000,
  `dynamic FBX geometry must drop below 4 MB (was 5,310,800), got ${maxGeometryBytes}`);
assert.ok(fbx.ticks.every(tick => tick.frames === 1), 'FBX surface frame every RAF');
fbx.finish();
console.log(JSON.stringify({ fbx: { activeTicks: active.length, maxGeometryBytes,
  activeMs: active.map(tick => Number(tick.ms.toFixed(2))) } }));

const batch = await boot('three-mesh-batch');
await batch.pump(6);
assert.ok(batch.evaluate('globalThis.__pinBatchProxies()') > 0, 'BatchedMesh proxies captured');
await batch.evaluate('globalThis.__editBatchData()');
await batch.pump(2);
assert.equal(batch.evaluate('globalThis.__batchProxiesRetained()'), true,
  'matrix/color-only edits retain proxy identities');
assert.equal(batch.ticks.at(-1).removeNodes, 0, 'matrix/color-only edit retires no nodes');

const controls = [
  ['method', 'NAIVE'], ['method', 'BATCHED'],
  ['count', 64], ['count', 256], ['dynamic', 0], ['dynamic', 64], ['dynamic', 16],
  ['transparent', false], ['transparent', true],
  ['sortObjects', false], ['sortObjects', true],
  ['perObjectFrustumCulled', false], ['perObjectFrustumCulled', true],
  ['useCustomSort', false], ['useCustomSort', true]
];
for (const [property, value] of controls) {
  await batch.change(property, value);
  const current = batch.exported().gui.values.find(item => item.property === property);
  assert.equal(current.value, value, `${property} applied`);
  assert.ok(batch.ticks.at(-1).frames > 0, `${property}=${value}: presentation frame submitted`);
  assert.ok(batch.ticks.at(-1).bytes > 0, `${property}=${value}: non-empty R1 packet`);
}
await batch.pump(4);
assert.equal(batch.ticks.at(-1).removeNodes, 0, 'steady BATCHED animation does not churn proxies');
assert.ok(batch.ticks.at(-1).batches > 0, 'retained instanced batches still update');
batch.finish();
console.log(JSON.stringify({ meshBatch: { controls: controls.length,
  finalTick: batch.ticks.at(-1), maxTickMs: Math.max(...batch.ticks.map(tick => tick.ms)) } }));
