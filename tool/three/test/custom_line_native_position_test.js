import assert from 'node:assert/strict';
import {
  BufferGeometry, Color, Float32BufferAttribute, Line, PerspectiveCamera,
  Scene, ShaderMaterial,
} from 'three';
import { JsrWebGLRenderer } from '../src/native_renderer.js';

const canvas = {
  isJsrThreeCanvas: true,
  engineId: 'custom-line-position-test',
  surfaceId: 'native-position-packet',
  width: 320,
  height: 200,
  clientWidth: 320,
  clientHeight: 200,
  pixelRatio: 1,
  addEventListener() {},
  removeEventListener() {},
  dispose() {},
};
const packets = [];
const renderer = new JsrWebGLRenderer({
  canvas,
  runtime: { capabilities: {}, sendR1: bytes => packets.push(bytes) },
});
const geometry = new BufferGeometry();
geometry.setAttribute('position', new Float32BufferAttribute([
  1, 2, 3, -2, 4, 1,
], 3));
geometry.setAttribute('displacement', new Float32BufferAttribute([
  0.5, -1, 2, 1, 0.25, -0.5,
], 3));
geometry.setAttribute('customColor', new Float32BufferAttribute([
  1, 0, 0, 0, 1, 0,
], 3));
const material = new ShaderMaterial({
  uniforms: {
    amplitude: { value: 2 },
    color: { value: new Color(1, 1, 1) },
    opacity: { value: 1 },
  },
  vertexShader: 'uniform float amplitude; void main(){vec3 p=position+displacement*amplitude;}',
  fragmentShader: 'void main(){gl_FragColor=vec4(1.);}',
});
const line = new Line(geometry, material);
const scene = new Scene();
scene.add(line);
const camera = new PerspectiveCamera();
camera.position.z = 10;

let nativeCalls = 0;
let nativeEnabled = true;
globalThis.__jsrLineWalkBytes = (name, bytes) => {
  assert.equal(name, 'three.linePositions');
  nativeCalls++;
  const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
  assert.equal(values[0], 2);
  assert.equal(values.length, 22);
  values[2] = 0;
  if (!nativeEnabled) return;
  const count = values[0] * 3;
  for (let i = 0; i < count; i++) {
    values[4 + count * 2 + i] = values[4 + i] + values[4 + count + i] * values[1];
  }
  values[2] = 1;
};

renderer.render(scene, camera);
const adapted = renderer._adaptedShaderDraws.get(line).geometry;
assert.deepEqual(Array.from(adapted.attributes.position.array), [2, 0, 7, 0, 4.5, 0]);
assert.equal(nativeCalls, 1);

material.uniforms.amplitude.value = -1;
renderer.render(scene, camera);
assert.deepEqual(Array.from(adapted.attributes.position.array), [0.5, 3, 1, -3, 3.75, 1.5]);
assert.equal(nativeCalls, 2);

nativeEnabled = false;
material.uniforms.amplitude.value = 3;
renderer.render(scene, camera);
assert.deepEqual(Array.from(adapted.attributes.position.array), [2.5, -1, 9, 1, 4.75, -0.5]);
assert.equal(nativeCalls, 3, 'the status-zero fallback must still probe natively');

delete globalThis.__jsrLineWalkBytes;
await new Promise(resolve => setTimeout(resolve, 0));
renderer.dispose();
await new Promise(resolve => setTimeout(resolve, 0));
assert.ok(packets.length > 0);
console.log('custom line native positions: exact arithmetic, amplitude updates and status-zero JS fallback PASS');
