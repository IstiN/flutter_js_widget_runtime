import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from '../../three/node_modules/esbuild/lib/main.js';
import { applyCustomAttributeAnimationFastPath } from '../degrades/custom_attribute_animation_fast_path.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const cases = [
  ['webgl_custom_attributes_points', 'three-custom-attributes-points'],
  ['webgl_buffergeometry_custom_attributes_particles', 'three-buffergeometry-custom-attributes-particles'],
  ['webgl_custom_attributes_points3', 'three-custom-attributes-points3'],
];
const outputs = new Map();
for (const [example, directory] of cases) {
  const original = await readFile(path.join(ROOT, 'example/widgets', directory, 'official_module.js'));
  const output = applyCustomAttributeAnimationFastPath(original, example);
  outputs.set(example, output.toString('utf8'));
  // Parse the exact prepared module without resolving imports or executing DOM.
  await transform(output.toString('utf8'), { loader: 'js', format: 'esm', target: 'es2020' });
  assert.ok(output.length > original.length, `${example}: fast path was not applied`);
}
assert.throws(() => applyCustomAttributeAnimationFastPath(Buffer.from('drifted'), cases[0][0]), /update anchor drifted/);

function block(source, startAnchor, endAnchor) {
  const start = source.indexOf(startAnchor);
  assert.ok(start >= 0, `missing block start: ${startAnchor}`);
  const end = source.indexOf(endAnchor, start);
  assert.ok(end > start, `missing block end: ${endAnchor}`);
  return source.slice(start, end);
}

function phaseTables(count) {
  const sin = new Float64Array(count);
  const cos = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    const phase = 0.1 * i;
    sin[i] = Math.sin(phase);
    cos[i] = Math.cos(phase);
  }
  return { sin, cos };
}

function verifySineSizes(example, count, expectedSize, vertices1 = count) {
  const source = outputs.get(example);
  assert.ok(source.includes('let sizeSinPhases;'));
  assert.ok(source.indexOf('let sizeSinPhases;') >= 0 &&
    source.indexOf('let sizeSinPhases;') < source.indexOf('function init()'),
    `${example}: phase tables must be visible to animate(), not local to init()`);
  assert.ok(source.includes('const sizeTimeSin = Math.sin( time );') || source.includes('const sizeTimeSin = Math.sin( 0.6 * time );'));
  const endAnchor = example === 'webgl_buffergeometry_custom_attributes_particles'
    ? '\n\t\t\t\tgeometry.attributes.size.needsUpdate'
    : '\n\t\t\t\tattributes.size.needsUpdate';
  const body = block(source, '\t\t\t\tconst sizeTimeSin', endAnchor);
  const attributes = { size: { array: new Float32Array(count) } };
  if (example === 'webgl_custom_attributes_points3') {
    attributes.size.array.fill(40, vertices1);
  }
  const sizes = new Float32Array(count);
  const { sin, cos } = phaseTables(count);
  const run = example === 'webgl_buffergeometry_custom_attributes_particles'
    ? new Function('sizes', 'sizeSinPhases', 'sizeCosPhases', 'time', 'particles', body)
    : new Function('attributes', 'sizeSinPhases', 'sizeCosPhases', 'time', 'vertices1', body);
  for (const time of [0, 0.317, 2.71, 19.3, 120.25]) {
    if (example === 'webgl_buffergeometry_custom_attributes_particles') {
      run(sizes, sin, cos, time, count);
    } else {
      run(attributes, sin, cos, time, vertices1);
    }
    const actual = example === 'webgl_buffergeometry_custom_attributes_particles' ? sizes : attributes.size.array;
    for (let i = 0; i < count; i++) {
      assert.ok(Math.abs(actual[i] - expectedSize(i, time)) < 0.00001,
        `${example}: size mismatch at i=${i}, time=${time}: ${actual[i]} != ${expectedSize(i, time)}`);
    }
  }
}

verifySineSizes('webgl_custom_attributes_points', 1000,
  (i, time) => 14 + 13 * Math.sin(0.1 * i + time));
verifySineSizes('webgl_buffergeometry_custom_attributes_particles', 1000,
  (i, time) => 10 * (1 + Math.sin(0.1 * i + time)));
verifySineSizes('webgl_custom_attributes_points3', 1000,
  (i, time) => i < 600 ? Math.max(0, 26 + 32 * Math.sin(0.1 * i + 0.6 * time)) : 40, 600);

console.log('custom attribute prepared math fast paths: syntax, anchored transforms, and sine parity PASS');
