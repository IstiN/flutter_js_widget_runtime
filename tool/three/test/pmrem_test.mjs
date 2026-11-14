import test from 'node:test';
import assert from 'node:assert/strict';
import { prefilterSparseEquirect } from '../src/native_pmrem.js';

test('sparse HDR prefilter preserves a point light and spreads its energy', () => {
  const width = 16;
  const height = 8;
  const data = new Float32Array(width * height * 4);
  const sourceIndex = (3 * width + 11) * 4;
  data[sourceIndex] = data[sourceIndex + 1] = data[sourceIndex + 2] = 27490;
  data[sourceIndex + 3] = 1;
  const result = prefilterSparseEquirect({ data, width, height });
  assert.ok(result);
  assert.equal(result.width, 16);
  assert.equal(result.height, 8);
  let nonzero = 0;
  let total = 0;
  for (let i = 0; i < result.data.length; i += 4) {
    if (result.data[i] > 0) nonzero++;
    total += result.data[i];
  }
  assert.ok(nonzero > 1, 'the point light must not remain one isolated texel');
  assert.ok(total > 0);
});

test('sparse half-float HDR sources use the native half decoder', () => {
  const width = 16;
  const height = 8;
  const data = new Uint16Array(width * height * 4);
  // 100.0 in IEEE binary16; the rest of the environment is black.
  data[(3 * width + 11) * 4] = 0x5640;
  data[(3 * width + 11) * 4 + 1] = 0x5640;
  data[(3 * width + 11) * 4 + 2] = 0x5640;
  const result = prefilterSparseEquirect({ data, width, height }, true);
  assert.ok(result);
  assert.equal(result.ambient, 0);
  assert.ok(result.data.some(value => Number.isFinite(value) && value > 0));
});

test('ordinary HDR photographs retain the direct-sampling degrade', () => {
  const width = 8;
  const height = 8;
  const data = new Float32Array(width * height * 4).fill(20);
  assert.equal(prefilterSparseEquirect({ data, width, height }), null);
});

test('a bright surround is not mistaken for a sparse point source', () => {
  const width = 16;
  const height = 8;
  const data = new Float32Array(width * height * 4).fill(20);
  data[(3 * width + 11) * 4] = 100;
  assert.equal(prefilterSparseEquirect({ data, width, height }), null);
});

test('clamped sparse RGBE bytes are also prefiltered', () => {
  const width = 64;
  const height = 32;
  const data = new Uint8Array(width * height * 4);
  data.fill(255);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i + 1] = data[i + 2] = 0;
  }
  const sourceIndex = (3 * width + 11) * 4;
  data[sourceIndex] = data[sourceIndex + 1] = data[sourceIndex + 2] = 255;
  const result = prefilterSparseEquirect({ data, width, height });
  assert.ok(result);
  assert.ok(result.scale > 1);
  assert.ok(result.ambient > 0);
});

test('non-HDR and malformed images are not prefiltered', () => {
  assert.equal(prefilterSparseEquirect(null), null);
  assert.equal(prefilterSparseEquirect({ data: new Uint8Array(4), width: 1, height: 1 }), null);
});
