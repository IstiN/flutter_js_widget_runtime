import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const PREPARE = path.join(ROOT, 'tool/three_example/prepare.mjs');
const OUT = path.join(ROOT, 'example/widgets/three-geometry-colors');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

function prepareFailure(args, expected) {
  const result = spawnSync(process.execPath, [PREPARE, ...args], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  assert.notEqual(result.status, 0, args.join(' '));
  assert.match(result.stderr, expected);
}

prepareFailure(['webgl_geometry_cube'], /Expected exactly one supported example/);
prepareFailure(['webgl_geometry_colors', '--source'], /--source requires a directory/);
prepareFailure(['webgl_geometry_colors', '--unknown'], /Expected exactly one supported example/);
prepareFailure([
  'webgl_geometry_colors', '--source', path.join(ROOT, 'missing-three-source')
], /ENOENT/);
const wrongSource = await mkdtemp(path.join(tmpdir(), 'jsr-three-wrong-source-'));
try {
  await writeFile(path.join(wrongSource, 'package.json'), '{"version":"0.186.0"}\n');
  prepareFailure([
    'webgl_geometry_colors', '--source', wrongSource
  ], /Expected three\.js 0\.186\.1 \(r186\), got 0\.186\.0/);
} finally {
  await rm(wrongSource, { recursive: true, force: true });
}

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
assert.equal(sha(direct), '013a5e27a5bc9eb1a117c1fb95db429d508e8c67e40768e7de50bdecfa57de9f');
assert.equal(sha(direct), manifest.outputs['official_module.js'].sha256);
assert.equal(sha(html), manifest.outputs['original.html'].sha256);
assert.equal(manifest.id, 'three-geometry-colors');
assert.equal(manifest.example, 'webgl_geometry_colors');
assert.equal(manifest.build.offline, true);
assert.equal(manifest.build.remoteResolution, false);
assert.equal(manifest.outputs['atlas.png'], undefined);
assert.ok(!Object.keys(manifest.inputs).some(name => name.startsWith('source/src/')));
assert.ok(!Object.keys(manifest.inputs).some(name => name.includes('/textures/')));
assert.ok(!manifest.inputs['source/examples/jsm/libs/stats.module.js']);
assert.ok(manifest.inputs['source/examples/webgl_geometry_colors.html']);
assert.match(savedModule.toString('utf8'), /new THREE\.MeshPhongMaterial/);
assert.match(savedModule.toString('utf8'), /new THREE\.CanvasTexture/);
assert.match(savedModule.toString('utf8'), /wireframe: true/);

const renders = [];
const states = [];
const packets = [];
const rafs = new Map();
const canvasRequests = [];
let nextRaf = 0;
const jsr = {
  instanceId: 'colors-prepare-test',
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
  hostCall(name, args) {
    if (name === 'three.canvas2d') {
      canvasRequests.push(args);
      return new Promise(() => {});
    }
    throw new Error(`unexpected host call ${name}`);
  }
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
await Promise.resolve();

assert.equal(renders.length, 1);
assert.equal(renders[0].canvasId, 'main');
assert.equal(renders[0].engineId, 'colors-prepare-test');
assert.equal(jsr.three._runtime.canvases.size, 1, 'local 2D canvas creates no THREE surface');
assert.equal(canvasRequests.length, 1);
assert.equal(canvasRequests[0].engineId, 'colors-prepare-test');
assert.equal(canvasRequests[0].surfaceId, 'main#1');
assert.equal(canvasRequests[0].width, 128);
assert.equal(canvasRequests[0].height, 128);
assert.equal(canvasRequests[0].commands.length, 1);
assert.equal(canvasRequests[0].commands[0].op, 'fillRect');
assert.equal(canvasRequests[0].commands[0].width, 128);
assert.equal(canvasRequests[0].commands[0].height, 128);
assert.equal(canvasRequests[0].commands[0].style.kind, 'radial');
assert.equal(canvasRequests[0].commands[0].style.stops.length, 2);
assert.equal(states.at(-1).example, 'webgl_geometry_colors');
assert.equal(states.at(-1).mounted, true);
assert.deepEqual(states.at(-1).assets, {});

const callbacks = [...rafs.values()];
rafs.clear();
assert.equal(callbacks.length, 1);
callbacks[0](performance.now());
assert.equal(packets.length, 1, 'official Phong/wireframe scene emits a native R1 frame');
assert.ok(packets[0].length > 1000);
assert.equal(renders.length, 1, 'animation causes no render-tree churn');

let mouseMoves = 0;
context.document.addEventListener('mousemove', event => {
  mouseMoves++;
  assert.equal(event.clientX, 12);
  assert.equal(event.clientY, 13);
});
jsr.three._dispatchEvent('main', {
  type: 'pointermove', pointerId: 7, pointerType: 'mouse',
  pageX: 12, pageY: 13
});
assert.equal(mouseMoves, 1, 'pointer movement adapts to the official mousemove listener');

console.log(JSON.stringify({
  ok: true,
  moduleSha256: sha(direct),
  widgetSha256: manifest.outputs['widget.js'].sha256,
  canvasCount: 1,
  nativeCanvasRequests: canvasRequests.length,
  r1Bytes: packets[0].length,
  nativePhongWireframe: true,
  mouseMoves
}, null, 2));
