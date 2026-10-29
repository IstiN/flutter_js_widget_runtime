import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const OUT = path.join(ROOT, 'example/widgets/three-minecraft');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

const [html, savedModule, widget, native, manifestBytes, atlas] = await Promise.all([
  readFile(path.join(OUT, 'original.html')),
  readFile(path.join(OUT, 'official_module.js')),
  readFile(path.join(OUT, 'widget.js'), 'utf8'),
  readFile(path.join(ROOT, 'assets/three/three.native.js'), 'utf8'),
  readFile(path.join(OUT, 'prepare_manifest.json')),
  readFile(path.join(OUT, 'atlas.png'))
]);
const manifest = JSON.parse(manifestBytes.toString('utf8'));

// Independent direct extraction check: the saved module is the exact byte span.
const open = /<script\b[^>]*\btype="module"[^>]*>/i.exec(html.toString('latin1'));
assert.ok(open, 'official module opening tag');
const start = open.index + open[0].length;
const end = html.indexOf('</script>', start);
assert.ok(end > start);
const direct = html.subarray(start, end);
assert.deepEqual(savedModule, direct);
assert.equal(sha(direct), manifest.outputs['official_module.js'].sha256);
assert.equal(sha(html), manifest.outputs['original.html'].sha256);
assert.equal(manifest.build.offline, true);
assert.equal(manifest.build.remoteResolution, false);
assert.equal(manifest.tools.node, '>=22', 'manifest is host-Node independent');
assert.ok(manifest.facade.exports.includes('Timer'));
assert.ok(manifest.facade.exports.includes('WebGLRenderer'));
assert.ok(!Object.keys(manifest.inputs).some(name => name.startsWith('source/src/')),
  'widget must not contain a second core copy');
for (const addon of [
  'source/examples/jsm/controls/FirstPersonControls.js',
  'source/examples/jsm/math/ImprovedNoise.js',
  'source/examples/jsm/utils/BufferGeometryUtils.js'
]) assert.ok(manifest.inputs[addon], addon);
assert.ok(!manifest.inputs['source/examples/jsm/libs/stats.module.js']);

const renders = [];
const states = [];
const packets = [];
const rafs = new Map();
let nextRaf = 0;
let decodedAtlas = null;
let closedBitmaps = 0;
class TestOffscreenCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this._drawn = false;
  }

  getContext(type) {
    assert.equal(type, '2d');
    return {
      clearRect: () => { this._drawn = false; },
      drawImage: () => { this._drawn = true; }
    };
  }
}
async function testCreateImageBitmap(blob) {
  decodedAtlas = Buffer.from(await blob.arrayBuffer());
  return {
    width: 16,
    height: 32,
    close() { closedBitmaps++; }
  };
}
const jsr = {
  instanceId: 'prepare-test',
  render(tree) { renders.push(tree); },
  exportState(state) { states.push(JSON.parse(JSON.stringify(state))); },
  requestAnimationFrame(callback) {
    const id = ++nextRaf;
    rafs.set(id, callback);
    return id;
  },
  cancelAnimationFrame(id) { rafs.delete(id); },
  hostCallBinary(name, bytes) {
    assert.equal(name, 'three.r1');
    packets.push(bytes.byteLength);
  },
  async hostCall(name) { throw new Error(`unexpected host call ${name}`); }
};
const context = vm.createContext({
  jsr,
  console,
  performance,
  sendMessage() {},
  TextEncoder,
  TextDecoder,
  OffscreenCanvas: TestOffscreenCanvas,
  createImageBitmap: testCreateImageBitmap,
  Blob,
  atob,
  setTimeout,
  clearTimeout
});
vm.runInContext(native, context, { filename: 'three.native.js' });
vm.runInContext('globalThis.THREE = THREE;', context);
vm.runInContext(widget, context, { filename: 'widget.js' });

assert.equal(context.THREE.REVISION, '186');
assert.equal(renders.length, 1, 'appendChild(renderer.domElement) mounts once');
assert.equal(renders[0].type, 'three');
assert.equal(renders[0].canvasId, 'main');
assert.equal(renders[0].engineId, 'prepare-test');
assert.equal(renders[0].surfaceId, 'main#1');
assert.equal(renders[0].generation, 1);
assert.equal(jsr.three._runtime.canvases.size, 1, 'stats creates no canvas or THREE node');
assert.equal(context.document, jsr.three.getCanvas('main').ownerDocument);
assert.equal(context.window, context.document.defaultView);
const registeredAtlas = jsr.three.resolveAsset('textures/minecraft/atlas.png');
assert.ok(registeredAtlas);
assert.deepEqual(Buffer.from(registeredAtlas.bytes), atlas);
assert.equal(states.at(-1).canvasCount, 1);
assert.equal(states.at(-1).mounted, true);
assert.equal(states.at(-1).backend, 'flutterGpu');

// Let the registered native atlas promise settle, then execute one real frame.
await new Promise(resolve => setImmediate(resolve));
const callbacks = [...rafs.values()];
rafs.clear();
assert.equal(callbacks.length, 1, 'official renderer animation loop');
for (const callback of callbacks) callback(performance.now());
assert.equal(packets.length, 1, 'native renderer emits R1 without scene JSON');
assert.ok(packets[0] > 1000);
assert.equal(renders.length, 1, 'animation causes no render-tree churn');
assert.equal(states.at(-1).stats.frames, 1);
assert.equal(states.at(-1).stats.updates, 1);
assert.equal(states.at(-1).renderer.frame, 1);
assert.ok(states.at(-1).renderer.triangles > 0);

// The runtime mirrors pointer input to ownerDocument. The example adapter must
// not forward it a second time (FirstPersonControls would decrement twice).
const mainCanvas = jsr.three.getCanvas('main');
let canvasPointerUps = 0;
let documentPointerUps = 0;
mainCanvas.addEventListener('pointerup', () => { canvasPointerUps++; });
context.document.addEventListener('pointerup', () => { documentPointerUps++; });
jsr.three._dispatchEvent('main', {
  type: 'pointerdown', pointerId: 7, pointerType: 'mouse', button: 0,
  pageX: 10, pageY: 10
});
jsr.three._dispatchEvent('main', {
  type: 'pointermove', pointerId: 7, pointerType: 'mouse', button: 0,
  pageX: 12, pageY: 13
});
jsr.three._dispatchEvent('main', {
  type: 'pointerup', pointerId: 7, pointerType: 'mouse', button: 0,
  pageX: 12, pageY: 13
});
assert.equal(canvasPointerUps, 1);
assert.equal(documentPointerUps, 1, 'pointerup reaches ownerDocument exactly once');
assert.equal(mainCanvas.hasPointerCapture(7), false);

// Exercise the same upstream ImageLoader path used by the real web bundle.
// The adapter decodes only the registered bytes into a local texture source.
const webImage = await new Promise((resolve, reject) => {
  new context.THREE.ImageLoader().load(
    'textures/minecraft/atlas.png',
    resolve,
    undefined,
    event => reject(event && event.error || event)
  );
});
assert.equal(webImage.complete, true);
assert.equal(webImage._drawn, true);
assert.deepEqual(decodedAtlas, atlas);
assert.equal(closedBitmaps, 1);
assert.equal(jsr.three._runtime.canvases.size, 1);

console.log(JSON.stringify({
  ok: true,
  moduleSha256: sha(direct),
  widgetSha256: manifest.outputs['widget.js'].sha256,
  canvasCount: 1,
  renderCalls: renders.length,
  documentPointerUps,
  localAtlasBytes: decodedAtlas.length,
  r1Bytes: packets[0],
  triangles: states.at(-1).renderer.triangles
}, null, 2));
