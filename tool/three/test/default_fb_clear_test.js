// Regression test: default-framebuffer clear semantics must match WebGL's
// preserveDrawingBuffer=false drawing-buffer invalidation. R1 reuses surface
// backing textures, so the FIRST default-fb pass of each presented batch must
// clear color+depth even when autoClear=false (otherwise previous frames'
// silhouettes persist as ghost trails, e.g. three-materials-normalmap during
// orbit drags). Later passes of the same batch keep autoClear semantics so
// multi-pass scenes still compose; preserveDrawingBuffer=true (pathtracer)
// is exempt.
import assert from 'node:assert/strict';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const SOURCE = path.resolve(process.env.THREE_SRC || '/tmp/jsr-three-r186');
const result = await build({
  absWorkingDir: ROOT,
  entryPoints: [path.join(ROOT, 'tool/three/src/native_entry.js')],
  outfile: path.join(HERE, '.native-test.js'),
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
    name: 'pinned-three-source-test',
    setup(build) {
      build.onResolve({ filter: /^three$/ }, args => ({
        path: args.importer.startsWith(path.join(SOURCE, 'examples/'))
          ? path.join(ROOT, 'tool/three/src/native_three_shim.js')
          : path.join(SOURCE, 'src/Three.js')
      }));
      build.onResolve({ filter: /^three\/addons\/(.+)$/ }, args => ({
        path: path.join(SOURCE, 'examples/jsm', args.path.slice('three/addons/'.length))
      }));
    }
  }]
});
const packets = [];
const jsr = {
  instanceId: 'fb-clear-test',
  hostCallBinary(name, bytes) {
    packets.push(Buffer.from(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)));
  },
  async hostCall(name) { throw new Error(`unexpected host call ${name}`); },
  render() {},
  requestAnimationFrame() { return 1; },
  cancelAnimationFrame() {}
};
const context = vm.createContext({ jsr, console, TextEncoder, TextDecoder, sendMessage() {}, setTimeout, clearTimeout });
vm.runInContext(result.outputFiles[0].text, context, { filename: 'native-source-test.js' });
const T = context.THREE;
const CLEAR_COLOR = 1;
const CLEAR_DEPTH = 2;

let canvasSerial = 0;
function makeRenderer(parameters = {}) {
  const canvas = jsr.three.createCanvas('main-' + (++canvasSerial));
  return new T.WebGLRenderer({ canvas, ...parameters });
}

// autoClear=false: the first default-fb pass still clears (drawing-buffer
// invalidation), the second pass composes (no clear).
{
  const renderer = makeRenderer();
  renderer.autoClear = false;
  renderer.autoClearColor = false;
  renderer.autoClearDepth = false;
  const first = renderer._frameTargetSpec([]);
  assert.equal(first.targetId, 0);
  assert.ok(first.flags & CLEAR_COLOR, `first pass must clear color, flags=${first.flags}`);
  assert.ok(first.flags & CLEAR_DEPTH, `first pass must clear depth, flags=${first.flags}`);
  const second = renderer._frameTargetSpec([]);
  assert.equal(second.flags & CLEAR_COLOR, 0, 'second pass must compose (load color)');
  assert.equal(second.flags & CLEAR_DEPTH, 0, 'second pass keeps autoClear=false depth');
}

// preserveDrawingBuffer=true (pathtracer accumulation): never force a clear.
{
  const renderer = makeRenderer({ preserveDrawingBuffer: true });
  renderer.autoClear = false;
  renderer.autoClearColor = false;
  renderer.autoClearDepth = false;
  const first = renderer._frameTargetSpec([]);
  assert.equal(first.flags & CLEAR_COLOR, 0, 'preserve=true must keep load semantics');
}

// Default autoClear=true: every pass clears (unchanged upstream semantics).
{
  const renderer = makeRenderer();
  const first = renderer._frameTargetSpec([]);
  const second = renderer._frameTargetSpec([]);
  assert.ok(first.flags & CLEAR_COLOR);
  assert.ok(second.flags & CLEAR_COLOR, 'autoClear=true keeps per-pass clears');
}

console.log('default_fb_clear_test: PASS (first-pass clear, compose, preserve exempt)');
