import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const OUT = path.join(ROOT, 'example/widgets/three-lines-colors');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

const [html, savedModule, widget, native, manifestBytes] = await Promise.all([
  readFile(path.join(OUT, 'original.html')),
  readFile(path.join(OUT, 'official_module.js')),
  readFile(path.join(OUT, 'widget.js'), 'utf8'),
  readFile(path.join(ROOT, 'assets/three/three.native.js'), 'utf8'),
  readFile(path.join(OUT, 'prepare_manifest.json'))
]);
const manifest = JSON.parse(manifestBytes.toString('utf8'));

const open = /<script\b[^>]*\btype="module"[^>]*>/i.exec(html.toString('latin1'));
assert.ok(open, 'official module opening tag');
const start = open.index + open[0].length;
const end = html.indexOf('</script>', start);
assert.ok(end > start);
const direct = html.subarray(start, end);
assert.deepEqual(savedModule, direct);
assert.equal(sha(direct), 'e7e9fcee0f8140745a400a30a5d29c9ac97a13409f655b1e618cddbd2c8d406c');
assert.equal(sha(direct), manifest.outputs['official_module.js'].sha256);
assert.equal(sha(html), 'a89c2291b5497be160e6763de192df8379b2a587ff245b603e25a65593c4b584');
assert.equal(sha(html), manifest.outputs['original.html'].sha256);
assert.equal(manifest.id, 'three-lines-colors');
assert.equal(manifest.example, 'webgl_lines_colors');
assert.equal(manifest.build.offline, true);
assert.equal(manifest.build.remoteResolution, false);
assert.equal(manifest.outputs['atlas.png'], undefined);
assert.ok(!Object.keys(manifest.inputs).some(name => name.startsWith('source/src/')));
assert.ok(!Object.keys(manifest.inputs).some(name => name.includes('/textures/')));
assert.ok(!manifest.inputs['source/examples/jsm/libs/stats.module.js']);
assert.equal(
  manifest.inputs['source/examples/jsm/utils/GeometryUtils.js'].sha256,
  '649f315d948f16bf32f43b86b3d96f05c9ffe36304ca6c94cf45ea35084d9864'
);
assert.match(savedModule.toString('utf8'), /new THREE\.LineBasicMaterial/);
assert.match(savedModule.toString('utf8'), /GeometryUtils\.hilbert3D/);
assert.match(savedModule.toString('utf8'), /document\.body\.appendChild/);

const renders = [];
const states = [];
const packets = [];
const rafs = new Map();
let nextRaf = 0;
const jsr = {
  instanceId: 'lines-colors-prepare-test',
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
    packets.push(Buffer.from(bytes));
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
  setTimeout,
  clearTimeout
});
vm.runInContext(native, context, { filename: 'three.native.js' });
vm.runInContext('globalThis.THREE = THREE;', context);
vm.runInContext(widget, context, { filename: 'widget.js' });

assert.equal(renders.length, 1);
assert.equal(renders[0].canvasId, 'main');
assert.equal(renders[0].engineId, 'lines-colors-prepare-test');
assert.equal(jsr.three._runtime.canvases.size, 1);
assert.equal(context.document.body.style.touchAction, 'none');
assert.equal(context.document.body.children.length, 1);
assert.equal(context.document.body.children[0], jsr.three.getCanvas('main'));
assert.equal(states.at(-1).example, 'webgl_lines_colors');
assert.equal(states.at(-1).mounted, true);
assert.deepEqual(states.at(-1).assets, {});

const callbacks = [...rafs.values()];
rafs.clear();
assert.equal(callbacks.length, 1);
callbacks[0](performance.now());
assert.equal(packets.length, 1, 'official lines emit a native R1 frame');
assert.ok(packets[0].length > 1000);
assert.equal(renders.length, 1, 'animation causes no render-tree churn');

let bodyPointerMoves = 0;
let legacyMouseMoves = 0;
context.document.body.addEventListener('pointermove', event => {
  bodyPointerMoves++;
  assert.equal(event.clientX, 12);
  assert.equal(event.clientY, 13);
});
context.document.addEventListener('mousemove', () => { legacyMouseMoves++; });
jsr.three._dispatchEvent('main', {
  type: 'pointermove', pointerId: 7, pointerType: 'mouse', isPrimary: true,
  clientX: 12, clientY: 13
});
assert.equal(bodyPointerMoves, 1);
assert.equal(legacyMouseMoves, 1);
jsr.three._dispatchEvent('main', {
  type: 'resize', width: 800, height: 450, pixelRatio: 1
});
assert.equal(context.window.innerWidth, 800);
assert.equal(context.window.innerHeight, 450);
assert.equal(jsr.three.getCanvas('main').clientWidth, 800);
assert.equal(jsr.three.getCanvas('main').clientHeight, 450);

console.log(JSON.stringify({
  ok: true,
  moduleSha256: sha(direct),
  widgetSha256: manifest.outputs['widget.js'].sha256,
  canvasCount: 1,
  r1Bytes: packets[0].length,
  bodyPointerMoves,
  legacyMouseMoves
}, null, 2));
