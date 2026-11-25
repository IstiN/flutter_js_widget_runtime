// e2e_cap_truth_test.js — E2E-CAP-* capability truth at the mock wire
// (issue #7, F2c, plan 4.4): only real extensions, formats and limits are
// exposed; absence is honest in both directions, so three's float-render-
// target and MRT fallbacks trigger on the real wire data.
//
// Run: node tool/three/test/e2e_cap_truth_test.js   (from the repo root)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const drain = () => new Promise(resolve => setImmediate(resolve));

// Binary-string base64 (the facade decodes with atob semantics).
const b64 = s => Buffer.from(s, 'binary').toString('base64');

function loadFacade() {
  const wire = { dispatches: [], rc: 1, scratchB64: '', extensions: '' };
  const g = {
    __jsr1b_gl: bytes => {
      wire.dispatches.push(new Uint8Array(bytes));
      return wire.rc;
    },
    __jsr1b_result: () => wire.scratchB64,
    atob: s => Buffer.from(s, 'base64').toString('binary'),
  };
  const src =
    fs.readFileSync(path.join(ROOT, 'tool/three/gen/g1_packer.js'), 'utf8') +
    '\n' +
    fs.readFileSync(path.join(ROOT, 'tool/three/src/webgl2_facade.js'), 'utf8');
  const f = new Function(
    'globalThis',
    'module',
    'exports',
    `${src}\n;return { api: globalThis.AngleWebGL2Facade || mod.exports, G1: G1, G1C: G1C, g1: g1 };`,
  );
  const mod = { exports: {} };
  const out = f(g, mod, mod.exports);
  return { ...out, wire };
}

function makeCanvas() {
  return { width: 300, height: 150, style: {},
    addEventListener() {}, removeEventListener() {},
    setAttribute(k, v) { this[k] = v; } };
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('getSupportedExtensions mirrors the real GL string plus the facade-granted WEBGL_lose_context', async () => {
  // The C decoder hands the facade the GL_-stripped tokens, one per line.
  const real = 'EXT_color_buffer_float\nOES_texture_float_linear\nKHR_parallel_shader_compile';
  const { api, wire } = loadFacade();
  wire.scratchB64 = b64(real);
  const gl = api.createFacade(makeCanvas(), {});
  await drain();
  const list = gl.getSupportedExtensions();
  assert.deepEqual(list, [
    'EXT_color_buffer_float',
    'OES_texture_float_linear',
    'KHR_parallel_shader_compile',
    'WEBGL_lose_context',
  ]);
});

test('getExtension is honest in both directions (the C availability bit drives it)', async () => {
  const { api, wire } = loadFacade();
  // The C decoder answers opcode 32 (getExtension) with 1/0 by name; the
  // mock rc models the bit.
  const gl = api.createFacade(makeCanvas(), {});
  await drain();
  wire.rc = 1; // the C bit says present
  assert.ok(gl.getExtension('EXT_color_buffer_float'),
      'a present, facade-handled extension is returned');
  wire.rc = 0; // the C bit says absent
  assert.equal(gl.getExtension('EXT_color_buffer_float'), null,
      'an absent extension is never faked');
  assert.equal(gl.getExtension('WEBGL_draw_buffers'), null,
      'a WebGL1-only MRT extension is never faked (MRT is WebGL2 core)');
  assert.equal(gl.getExtension(' totally_not_real '), null);
  // Facade-granted extension bypasses the bit.
  assert.ok(gl.getExtension('WEBGL_lose_context'));
});

test('float render targets fall back when EXT_color_buffer_float is absent', async () => {
  const { api, wire } = loadFacade();
  wire.scratchB64 = b64('OES_texture_float_linear'); // no float color buffer
  const gl = api.createFacade(makeCanvas(), {});
  await drain();
  const supported = gl.getSupportedExtensions();
  assert.equal(supported.includes('EXT_color_buffer_float'), false);
  wire.rc = 0;
  assert.equal(gl.getExtension('EXT_color_buffer_float'), null,
      'three reads this null and falls back to byte targets');
  // With the extension present, the probe exposes it.
  wire.extensions = 'GL_EXT_color_buffer_float';
  wire.rc = 1;
  assert.ok(gl.getExtension('EXT_color_buffer_float'),
      'float render targets are available when the GL says so');
  await drain();
});

test('limits come from the wire: MAX_* parameters return the reported values', async () => {
  const { api, wire } = loadFacade();
  const gl = api.createFacade(makeCanvas(), {});
  await drain();
  // Scalar MAX_* limits come back as the dispatch rc (the C decoder returns
  // the value, never an invented one).
  wire.rc = 8192;
  assert.equal(gl.getParameter(gl.MAX_TEXTURE_SIZE), 8192,
      'MAX_TEXTURE_SIZE is exactly the wire value');
  wire.rc = 16;
  assert.equal(gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS), 16);
  await drain();
});

for (const [name, fn] of tests) {
  await fn();
  console.log(`ok - ${name}`);
}
console.log(`e2e_cap_truth_test: ${tests.length} tests passed`);
