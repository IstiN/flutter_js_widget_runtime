import assert from 'node:assert/strict';
import {
  BufferGeometry, Color, Float32BufferAttribute, PerspectiveCamera, Points,
  Scene, ShaderMaterial,
} from 'three';
import { JsrWebGLRenderer } from '../src/native_renderer.js';

const canvas = {
  isJsrThreeCanvas: true,
  engineId: 'custom-attribute-test',
  surfaceId: 'retained-materials',
  width: 640,
  height: 360,
  clientWidth: 640,
  clientHeight: 360,
  pixelRatio: 2,
  addEventListener() {},
  removeEventListener() {},
  dispose() {},
};
const packets = [];
const renderer = new JsrWebGLRenderer({
  canvas,
  runtime: { capabilities: {}, sendR1: bytes => packets.push(bytes) },
});
const count = 10000;
const geometry = new BufferGeometry();
geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(count * 3), 3));
geometry.setAttribute('ca', new Float32BufferAttribute(new Float32Array(count * 3), 3));
const sizes = new Float32BufferAttribute(
  Float32Array.from({ length: count }, (_, index) => 10 + index % 10), 1,
);
geometry.setAttribute('size', sizes);
const material = new ShaderMaterial({
  uniforms: { color: { value: new Color(1, 1, 1) } },
  vertexShader: 'attribute float size; attribute vec3 ca; void main(){gl_PointSize=size;}',
  fragmentShader: 'void main(){gl_FragColor=vec4(1.);}',
  transparent: true,
});
const points = new Points(geometry, material);
const scene = new Scene();
scene.add(points);
const camera = new PerspectiveCamera();

renderer.render(scene, camera);
const first = renderer._adaptedShaderDraws.get(points);
assert.ok(first);
assert.ok(Array.isArray(first.material));
assert.equal(first.material.length, 8);
assert.ok(first.materialKey.endsWith('|grouped'));
assert.equal(renderer._state.materials.size, 8);
const firstGeometry = first.geometry;
const firstMaterials = first.material.slice();
const firstSizes = firstMaterials.map(entry => entry.size);

for (let frame = 1; frame <= 4; frame++) {
  for (let index = 0; index < count; index++) sizes.array[index] += 0.25;
  sizes.needsUpdate = true;
  renderer.render(scene, camera);
  const current = renderer._adaptedShaderDraws.get(points);
  assert.strictEqual(current.geometry, firstGeometry, 'frame rebuilt the grouped geometry');
  assert.strictEqual(current.material, first.material, 'frame replaced the material array');
  assert.ok(current.material.every((entry, index) => entry === firstMaterials[index]),
    `frame ${frame} allocated a new native PointsMaterial`);
  assert.equal(renderer._state.materials.size, 8, 'native material ids grew per frame');
}
assert.ok(firstMaterials.some((entry, index) => entry.size !== firstSizes[index]),
  'animated group mean sizes stopped updating');

// Let the renderer's per-task envelope batch flush, then release listeners.
await new Promise(resolve => setTimeout(resolve, 0));
renderer.dispose();
await new Promise(resolve => setTimeout(resolve, 0));
assert.ok(packets.length > 0);
console.log('custom point materials: retained 8 ids and geometry across 5 animated frames; mean sizes still update PASS');
