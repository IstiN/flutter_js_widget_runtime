// Regression test: the R1 bounded postprocessing lane recognises the
// official three.js FXAShader (tDiffuse + resolution + rgbNW/rgbNE corner
// tokens) and maps it to the native kind-14 op 14 instead of dropping it to
// a plain textured blit. Sobel keeps op 2 (shared uniform contract).
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
const context = vm.createContext({ console, TextEncoder, TextDecoder, sendMessage() {}, setTimeout, clearTimeout });
vm.runInContext(result.outputFiles[0].text, context, { filename: 'native-source-test.js' });
const adapt = context.THREE.postShaderAdaptation;
assert.equal(typeof adapt, 'function', 'postShaderAdaptation export');

const fakeTexture = { isTexture: true };
const fxaa = adapt(
  { uniforms: { tDiffuse: { value: fakeTexture }, resolution: { value: { x: 800, y: 600 } } } },
  'vec3 rgbNW = texture2D(tDiffuse, uv).rgb; vec3 rgbNE = texture2D(tDiffuse, uv).rgb;'
);
assert.ok(fxaa && fxaa.op === 14, `FXAA must map to op 14, got ${fxaa && fxaa.op}`);
assert.equal(fxaa.left[1], 800);
assert.equal(fxaa.left[2], 600);

const sobel = adapt(
  { uniforms: { tDiffuse: { value: fakeTexture }, resolution: { value: { x: 800, y: 600 } } } },
  'float valueGx = 0.0; float valueGy = 0.0;'
);
assert.ok(sobel && sobel.op === 2, `Sobel must keep op 2, got ${sobel && sobel.op}`);

const unknown = adapt(
  { uniforms: { tDiffuse: { value: fakeTexture } } },
  'gl_FragColor = texture2D(tDiffuse, vUv);'
);
assert.equal(unknown, null, 'Unknown shaders keep the capability-error path');

console.log('fxaa_post_test: PASS (FXAA op 14, Sobel op 2, unknown null)');
