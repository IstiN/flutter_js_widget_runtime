import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from '../../three/node_modules/esbuild/lib/main.js';
import { applyCustomLineWalkFastPath } from '../degrades/custom_line_walk_fast_path.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const original = await readFile(path.join(ROOT,
  'example/widgets/three-custom-attributes-lines/official_module.js'));
const output = applyCustomLineWalkFastPath(original).toString('utf8');
await transform(output, { loader: 'js', format: 'esm', target: 'es2020' });
assert.ok(output.includes("globalThis.__jsrLineWalkBytes( 'three.lineWalk'"));
assert.ok(output.includes('array[ i + 2 ] += 0.3 * ( 0.5 - Math.random() );'),
  'official fallback must remain intact');
assert.throws(() => applyCustomLineWalkFastPath(Buffer.from('drifted')),
  /update anchor drifted/);

const startAnchor = "\t\t\t\tif ( typeof globalThis.__jsrLineWalkBytes === 'function' )";
const start = output.indexOf(startAnchor);
const end = output.indexOf('\n\t\t\t\tattributes.displacement.needsUpdate', start);
assert.ok(start >= 0 && end > start);
const run = new Function('array', output.slice(start, end));
const nativeRandom = Math.random;
try {
  Math.random = () => { throw new Error('native lane must not call Math.random'); };
  const values = new Float32Array(12);
  let calls = 0;
  globalThis.__jsrLineWalkBytes = (name, bytes) => {
    calls++;
    assert.equal(name, 'three.lineWalk');
    const view = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
    for (let index = 0; index < view.length; index++) view[index] += 0.25;
  };
  run(values);
  assert.equal(calls, 1);
  assert.ok(values.every(value => value === 0.25));

  delete globalThis.__jsrLineWalkBytes;
  let randomCalls = 0;
  Math.random = () => { randomCalls++; return 0.25; };
  const fallback = new Float32Array(12);
  run(fallback);
  assert.equal(randomCalls, fallback.length, 'every official random call is retained');
  assert.ok(fallback.every(value => Math.abs(value - 0.075) < 1e-6));
} finally {
  delete globalThis.__jsrLineWalkBytes;
  Math.random = nativeRandom;
}

console.log('custom line native walk: anchored transform, native call and full-rate JS fallback PASS');
