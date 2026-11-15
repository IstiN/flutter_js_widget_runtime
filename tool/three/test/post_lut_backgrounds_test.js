// Focused r186 LUTPass/background-composer regressions. This builds source in
// memory only; it never replaces the shared assets/three bundles.
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
  stdin: {
    contents: "export * from '../src/native_entry.js'; export { ClearPass } from '../../three_example/degrades/backgrounds_clear_native.mjs';",
    resolveDir: HERE,
    sourcefile: 'post-lut-backgrounds-test-entry.js',
  },
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
  instanceId: 'post-lut-backgrounds-test',
  hostCallBinary(name, bytes) {
    packets.push(Buffer.from(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength)));
  },
  async hostCall(name) { throw new Error(`unexpected host call ${name}`); },
  render() {}, requestAnimationFrame() { return 1; }, cancelAnimationFrame() {}
};
const context = vm.createContext({ jsr, console, TextEncoder, TextDecoder, sendMessage() {}, setTimeout, clearTimeout });
vm.runInContext(result.outputFiles[0].text, context, { filename: 'native-source-test.js' });
const T = context.THREE;
const adapt = T.postShaderAdaptation;

const source = vm.runInContext(`(() => {
  const data = new Uint8Array(8 * 4);
  for (let i = 0; i < 8; i++) {
    data[i * 4] = 10 + i; data[i * 4 + 1] = 20 + i;
    data[i * 4 + 2] = 30 + i; data[i * 4 + 3] = 255;
  }
  const lut = new THREE.Data3DTexture(data, 2, 2, 2);
  lut.needsUpdate = true;
  const tDiffuse = new THREE.DataTexture(new Uint8Array([40, 50, 60, 255]), 1, 1);
  tDiffuse.needsUpdate = true;
  return { lut, tDiffuse };
})()`, context);
const graded = adapt({
  uniforms: {
    lut: { value: source.lut }, lutSize: { value: 2 },
    tDiffuse: { value: source.tDiffuse }, intensity: { value: 0.375 },
  },
}, 'uniformsampler3Dlut;floathalfPixelWidth=0.5/lutSize;');
assert.equal(graded.op, 17);
assert.equal(graded.map, source.tDiffuse);
assert.equal(graded.left[0], 17);
assert.equal(graded.left[1], 2);
assert.equal(graded.left[2], 0.375);
assert.equal(graded.right.image.width, 4);
assert.equal(graded.right.image.height, 2);
const atlas = graded.right.image.data;
// source z/y/x order -> atlas y/(z*size+x), with no color-space conversion.
for (const [z, y, x, value] of [[0, 0, 0, 10], [1, 0, 0, 14], [0, 1, 1, 13], [1, 1, 1, 17]]) {
  const offset = (y * 4 + z * 2 + x) * 4;
  assert.equal(atlas[offset], value, `atlas z=${z} y=${y} x=${x}`);
  assert.equal(atlas[offset + 3], 255);
}
assert.equal(adapt({
  uniforms: { lut: { value: null }, lutSize: { value: 0 }, tDiffuse: { value: source.tDiffuse }, intensity: { value: 1 } },
}, 'sampler3Dlut;halfPixelWidth').right, null, 'pending LUT stays a native pass-through');

const canvas = jsr.three.createCanvas('post-backgrounds');
const renderer = new T.WebGLRenderer({ canvas });
renderer.autoClear = false;
const rt = new T.WebGLRenderTarget(4, 4);
let clearBackground;
let clearFlags = 0;
const background = renderer._background.bind(renderer);
renderer._background = scene => {
  const value = background(scene);
  clearBackground = { ...value };
  return value;
};
const targetSpec = renderer._frameTargetSpec.bind(renderer);
renderer._frameTargetSpec = commands => {
  const value = targetSpec(commands);
  clearFlags = value.flags;
  return value;
};
const clearPass = new T.ClearPass(0x0000ff, 0.5);
clearPass.renderToScreen = false;
clearPass.render(renderer, null, rt);
assert.deepEqual(clearBackground, { r: 0, g: 0, b: 1, a: 0.5 });
assert.equal(clearFlags & 1, 1, 'clear-only pass carries clearColor');
assert.equal(clearFlags & 2, 2, 'clear-only pass carries clearDepth');
assert.equal(renderer.getClearAlpha(), 1, 'ClearPass restores renderer alpha');
assert.equal(renderer.getClearColor(new T.Color()).getHex(), 0, 'ClearPass restores renderer color');

// Official CopyShader and CubeShader uniform contracts reach the generic
// textured lowering. Their opacity must survive, and tCube must use the
// native view-ray background lane rather than mesh reflection mapping.
const copy = new T.ShaderMaterial({
  uniforms: { tDiffuse: { value: source.tDiffuse }, opacity: { value: 0.25 } },
  vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: 'uniform float opacity; uniform sampler2D tDiffuse; varying vec2 vUv; void main(){vec4 texel=texture2D(tDiffuse,vUv);gl_FragColor=opacity*texel;}',
  depthTest: false, depthWrite: false,
});
const scene = new T.Scene();
scene.add(new T.Mesh(new T.PlaneGeometry(2, 2), copy));
renderer.setRenderTarget(null);
let ensuredMaterialId = 0;
const ensureMaterial = renderer._ensureMaterial.bind(renderer);
renderer._ensureMaterial = (...args) => {
  ensuredMaterialId = ensureMaterial(...args);
  return ensuredMaterialId;
};
renderer.render(scene, new T.OrthographicCamera(-1, 1, 1, -1, 0, 1));
const firstMaterialId = ensuredMaterialId;
const copyMaterial = renderer._state.materials.get(firstMaterialId).object;
assert.equal(copyMaterial.map, source.tDiffuse);
assert.equal(copyMaterial.opacity, 0.25);
assert.equal(copyMaterial.transparent, true);
copy.uniforms.opacity.value = 0.75;
renderer.render(scene, new T.OrthographicCamera(-1, 1, 1, -1, 0, 1));
const updatedCopyMaterial = renderer._state.materials.get(ensuredMaterialId).object;
assert.equal(updatedCopyMaterial.opacity, 0.75, 'live opacity uniform creates the updated native packet');
assert.equal(updatedCopyMaterial.transparent, true);

const lutShader = new T.ShaderMaterial({
  uniforms: {
    lut: { value: source.lut }, lutSize: { value: 2 },
    tDiffuse: { value: source.tDiffuse }, intensity: { value: 0.25 },
  },
  vertexShader: copy.vertexShader,
  fragmentShader: 'uniform float lutSize; uniform sampler3D lut; varying vec2 vUv; uniform float intensity; uniform sampler2D tDiffuse; void main(){vec4 val=texture2D(tDiffuse,vUv);float halfPixelWidth=0.5/lutSize;vec3 uvw=vec3(halfPixelWidth)+val.rgb*(1.0-1.0/lutSize);gl_FragColor=vec4(mix(val,vec4(texture(lut,uvw).rgb,val.a),intensity));}',
  depthTest: false, depthWrite: false,
});
const lutScene = new T.Scene();
lutScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), lutShader));
renderer.render(lutScene, new T.OrthographicCamera(-1, 1, 1, -1, 0, 1));
let lutMaterial = renderer._state.materials.get(ensuredMaterialId).object;
assert.equal(lutMaterial._r1NativeKind, 'post');
assert.equal(lutMaterial._r1Anaglyph.left[0], 17);
assert.equal(lutMaterial._r1Anaglyph.left[2], 0.25);
assert.equal(lutMaterial._r1Anaglyph.right.image.width, 4);
lutShader.uniforms.intensity.value = 0.75;
renderer.render(lutScene, new T.OrthographicCamera(-1, 1, 1, -1, 0, 1));
lutMaterial = renderer._state.materials.get(ensuredMaterialId).object;
assert.equal(lutMaterial._r1Anaglyph.left[2], 0.75, 'live LUT intensity reaches the native packet');

const Bytes = source.tDiffuse.image.data.constructor;
const cube = new T.CubeTexture();
cube.image = Array.from({ length: 6 }, (_, face) => ({
  data: new Bytes([face * 20, 80, 120, 255]), width: 1, height: 1, encoding: 0, encoded: false,
}));
cube.needsUpdate = true;
const cubeShader = new T.ShaderMaterial({
  uniforms: { tCube: { value: cube }, tFlip: { value: -1 }, opacity: { value: 0.5 } },
  vertexShader: 'varying vec3 vWorldDirection; void main(){vWorldDirection=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: 'uniform samplerCube tCube; uniform float tFlip; uniform float opacity; varying vec3 vWorldDirection; void main(){gl_FragColor=textureCube(tCube,vec3(tFlip*vWorldDirection.x,vWorldDirection.yz))*opacity;}',
  side: T.BackSide, depthTest: false, depthWrite: false,
});
const cubeScene = new T.Scene();
cubeScene.add(new T.Mesh(new T.BoxGeometry(10, 10, 10), cubeShader));
renderer.render(cubeScene, new T.PerspectiveCamera(65, 1, 0.1, 10));
const cubeMaterial = renderer._state.materials.get(ensuredMaterialId).object;
assert.equal(cubeMaterial._r1Background, true);
assert.equal(cubeMaterial.envMap, cube);
assert.equal(cubeMaterial.reflectivity, -1, 'official CubeTexturePass tFlip reaches the native view-ray lane');
assert.equal(cubeMaterial.opacity, 0.5);
assert.equal(cubeMaterial.transparent, true);

console.log('post_lut_backgrounds_test: PASS (LUT op17 + atlas pixels, clear-only color/alpha packet, live texture/cube opacity + cube view-ray lane)');
