// ut_gl_1_test.js — UT-GL-* (issue #7, F2 facade completeness, plan 4.4):
// EVERY method of tool/three/webgl2_g1_methods.json (224) is exercised
// through the real facade + real generated packer against a mock
// __jsr1b_gl/__jsr1b_result wire, and the F2b facade behaviors are pinned:
// batching (flush triggers + [u32 0][u32 count] framing), isContextLost from
// the real context state, getSupportedExtensions from the (mock) real
// extension string, and honest extension absence.
//
// Run: node tool/three/test/ut_gl_1_test.js   (from the repo root)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const METHODS = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'tool/three/webgl2_g1_methods.json'), 'utf8'),
).methods;

const drain = () => new Promise(resolve => setImmediate(resolve));

// Loads packer + facade into one function scope with a sandbox globalThis
// carrying the mock wire. Returns { api, wire, G1, G1C }.
function loadFacade() {
  const wire = { dispatches: [], rc: 0, scratchB64: '' };
  const g = {
    __jsr1b_gl: bytes => {
      wire.dispatches.push(new Uint8Array(bytes)); // the view is call-scoped
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

const u32 = (b, o) => Buffer.from(b.buffer, b.byteOffset, b.byteLength).readUInt32LE(o);
const i32 = (b, o) => Buffer.from(b.buffer, b.byteOffset, b.byteLength).readInt32LE(o);

// Decodes a captured dispatch: single command or [0][count][commands...].
function decode(bytes) {
  const op = u32(bytes, 0);
  if (op !== 0) return [{ opcode: op, body: bytes.subarray(4) }];
  const count = u32(bytes, 4);
  const commands = [];
  let off = 8;
  for (let i = 0; i < count; i++) {
    const cmdOp = u32(bytes, off);
    commands.push({ opcode: cmdOp, start: off });
    off += 4;
    // walk args using the JSON format string
    const m = METHODS.find(x => x.opcode === cmdOp);
    assert.ok(m, `decoded unknown opcode ${cmdOp}`);
    for (const ch of m.args) {
      const len = u32(bytes, off);
      off += 4;
      if (ch === 's' || ch === 'b') off += Math.min(len, bytes.length - off);
    }
  }
  assert.equal(off, bytes.length, 'batch must end exactly after the last command');
  return commands;
}

const ARG_DEFAULTS = {
  u: 1,
  i: 1,
  f: 1.5,
  s: 'u_color',
  b: new Uint8Array([1, 2, 3, 4]), // real blob body (exact wire walk)
};

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('every one of the 224 methods is callable and produces a well-formed dispatch', async () => {
  const { api, wire } = loadFacade();
  const gl = api.createFacade({}, {});
  // The default-FB MSAA init queues its one-time infra commands; flush them
  // so the per-method accounting starts from an empty queue.
  await drain();
  const locationOps = new Set([66, 67, 68]); // getUniformLocation/getAttribLocation/getFragDataLocation
  for (const m of METHODS) {
    const before = wire.dispatches.length;
    const args = [...m.args].map(ch => ARG_DEFAULTS[ch]);
    assert.equal(typeof gl[m.name], 'function', `facade exposes ${m.name}`);
    if ('stub' in m) {
      // The three facade-handled stubs never dispatch and never throw.
      gl[m.name].apply(gl, args);
      assert.equal(wire.dispatches.length, before, `${m.name} is facade-handled`);
      continue;
    }
    // Set the mock rc BEFORE the call: the flush answers synchronously.
    wire.rc = m.ret === 'void' ? 0 : m.ret === 'name' ? 42 : m.ret === 'u32' ? 9 : 7;
    if (locationOps.has(m.opcode) && m.name !== 'getUniformLocation') wire.rc = 3;
    // A 12-byte scratch (the C decoder always fills what the scratch readers
    // parse) and a KNOWN extension name (unknown names never reach the wire).
    wire.scratchB64 = 'AAAAAAAAAAAAAAAA'; // 12 zero bytes
    const extArgs = m.name === 'getExtension' ? ['EXT_color_buffer_float'] : args;
    const out = gl[m.name].apply(gl, extArgs);
    if (m.ret === 'void' && m.opcode !== 2 && m.opcode !== 3) {
      // Queued: nothing on the wire until the frame-boundary flush.
      assert.equal(wire.dispatches.length, before, `${m.name} queues (no per-call dispatch)`);
      await drain();
      assert.equal(wire.dispatches.length, before + 1, `${m.name} flushed once at the frame boundary`);
      assert.equal(out, 0, `${m.name} returns the queued rc 0`);
    } else {
      // Data-returning calls and the void finish/flush pair flush
      // synchronously (contract triggers 1 and 2).
      assert.equal(wire.dispatches.length, before + 1, `${m.name} flushed synchronously`);
      if (m.ret === 'name') assert.ok(out && out.__g1name === wire.rc, `${m.name} wraps the GL name`);
    }
    const commands = decode(wire.dispatches.at(-1));
    assert.equal(commands.at(-1).opcode, m.opcode, `${m.name} is the last command of its dispatch`);
    wire.rc = 0;
  }
  const stats = gl.__stats;
  assert.equal(Object.keys(stats.missing).length, 0, 'no missing g1 methods');
  assert.equal(stats.stubThrows, 0, 'no stub throws');
});

test('batching: 500 draw calls flush once at the frame boundary with exact framing', async () => {
  const { api, wire } = loadFacade();
  const gl = api.createFacade({}, {});
  await drain(); // flush the one-time MSAA init
  const baseline = wire.dispatches.length;
  for (let i = 0; i < 500; i++) gl.drawArrays(gl.TRIANGLES, 0, 3);
  assert.equal(wire.dispatches.length, baseline, 'no per-call JSON on ordinary frames');
  await drain();
  assert.equal(wire.dispatches.length, baseline + 1, 'exactly one flush per render');
  const batch = wire.dispatches.at(-1);
  const commands = decode(batch);
  assert.equal(commands.length, 500);
  assert.equal(u32(batch, 0), 0, 'batch header opcode 0');
  assert.equal(u32(batch, 4), 500, 'batch header count');
  await drain();
  assert.equal(wire.dispatches.length, baseline + 1, 'an empty queue flushes nothing (no second dispatch)');
  assert.equal(gl.__stats.flushes, baseline + 1, 'every dispatch is one flush (MSAA init + the frame)');
  assert.equal(gl.__stats.dispatchCalls, baseline + 1);
});

test('batching: a data-returning call flushes the queue and answers the batch', async () => {
  const { api, wire } = loadFacade();
  const gl = api.createFacade({}, {});
  await drain(); // the one-time MSAA init leaves the wire
  for (let i = 0; i < 10; i++) gl.drawArrays(gl.TRIANGLES, 0, 3);
  wire.rc = 0x0502; // GL_INVALID_OPERATION
  assert.equal(gl.getError(), 0x0502, 'getError answers the whole batch');
  const commands = decode(wire.dispatches.at(-1));
  assert.equal(commands.length, 11, 'queue + the data-returning command in ONE dispatch');
  assert.equal(commands.at(-1).opcode, 1, 'getError is the last command');
  await drain();
  assert.equal(wire.dispatches.length, 2, 'the frame boundary has nothing left to flush');
});

test('batching: finish and flush flush immediately', async () => {
  for (const trigger of ['finish', 'flush']) {
    const { api, wire } = loadFacade();
    const gl = api.createFacade({}, {});
    await drain(); // MSAA init out of the way
    const baseline = wire.dispatches.length;
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl[trigger]();
    assert.equal(wire.dispatches.length, baseline + 1, `${trigger} flushes synchronously`);
    assert.equal(decode(wire.dispatches.at(-1)).length, 2);
  }
});

test('isContextLost reads the real context state', async () => {
  const { api, wire } = loadFacade();
  const gl = api.createFacade({}, {});
  await drain(); // MSAA init out of the way
  assert.equal(gl.isContextLost(), false);
  const ext = gl.getExtension('WEBGL_lose_context');
  assert.ok(ext, 'WEBGL_lose_context is offered');
  ext.loseContext();
  assert.equal(gl.isContextLost(), true);
  ext.restoreContext();
  assert.equal(gl.isContextLost(), false);
  // The no-current-surface dispatch sentinel marks the context lost too.
  wire.rc = -0x7fffffff;
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  await drain();
  wire.rc = 0;
  assert.equal(gl.isContextLost(), true, 'the dispatch sentinel marks the loss');
});

test('getSupportedExtensions comes from the real extension string', async () => {
  const { api, wire } = loadFacade();
  const gl = api.createFacade({}, {});
  wire.scratchB64 = Buffer.from('EXT_color_buffer_float\nOES_texture_float_linear\nARB_clip_control\n', 'binary').toString('base64');
  const list = gl.getSupportedExtensions();
  assert.deepEqual(list, [
    'EXT_color_buffer_float',
    'OES_texture_float_linear',
    'ARB_clip_control',
    'WEBGL_lose_context',
  ]);
});

test('extension absence follows the documented semantics', async () => {
  const { api, wire } = loadFacade();
  const gl = api.createFacade({}, {});
  wire.rc = 1;
  assert.ok(gl.getExtension('EXT_color_buffer_float'), 'advertised -> object');
  wire.rc = 0;
  assert.equal(gl.getExtension('EXT_color_buffer_float'), null, 'not advertised -> null');
  assert.equal(gl.getExtension('GL_EXT_color_buffer_float'), null, 'GL_-prefixed WebGL names are never granted');
  assert.equal(gl.getExtension('totally_bogus_extension'), null, 'unknown names never fake success');
  wire.rc = 1;
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  assert.ok(dbg && dbg.UNMASKED_RENDERER_WEBGL, 'debug renderer info carries its constants when advertised');
});

test('uniform location identity: -1 -> null, 0 is a valid location', async () => {
  const { api, wire } = loadFacade();
  const gl = api.createFacade({}, {});
  wire.rc = -1;
  assert.equal(gl.getUniformLocation({}, 'missing'), null);
  wire.rc = 0;
  assert.equal(gl.getUniformLocation({}, 'u_color').__g1name, 0, 'location 0 is valid (wrapValid)');
  wire.rc = 42;
  assert.equal(gl.getUniformLocation({}, 'u_x').__g1name, 42);
});

test('creator identity: the same GL name wraps to the same JS object', () => {
  const { api, wire } = loadFacade();
  const gl = api.createFacade({}, {});
  wire.rc = 7;
  const a = gl.createBuffer();
  const b = gl.createBuffer();
  assert.equal(a.__g1name, 7);
  assert.equal(a, b, 'wrapper cache gives browser-style identity');
  assert.equal(String(a), '[object WebGLBuffer]');
});

test('a deleted GL object loses its wrapper identity (a reused name wraps '
    + 'fresh)', () => {
  const { api, wire } = loadFacade();
  const gl = api.createFacade({}, {});
  wire.rc = 7;
  const fb1 = gl.createFramebuffer();
  gl.deleteFramebuffer(fb1);
  // The mock allocator answers every create with the same name (name
  // reuse, as ANGLE does after a delete): the wrapper must be FRESH — a
  // stale wrapper makes wrapper-comparing trackers skip the real bind of
  // the recreated object.
  const fb2 = gl.createFramebuffer();
  assert.equal(fb2.__g1name, fb1.__g1name, 'the mock reuses the name');
  assert.notEqual(fb2, fb1, 'the recreated object wraps fresh');
});

test('readPixels splits reads bigger than the G1 scratch cap into row strips '
    + 'and assembles them (UT-GL-READBACK-1)', async () => {
  const { api, wire, g1 } = loadFacade();
  const gl = api.createFacade({}, {});
  await drain(); // MSAA init out of the way
  const baseline = wire.dispatches.length;
  const origRead = g1.readPixels;
  // Mock the C scratch: every strip's rows are stamped with their absolute
  // GL row index (y + r) — proves the strips reassemble in order.
  g1.readPixels = function (x, y, w, h, fmt, type) {
    const rc = origRead.call(g1, x, y, w, h, fmt, type);
    const rowBytes = w * 8; // RGBA HALF_FLOAT
    const buf = Buffer.alloc(rowBytes * h);
    for (let r = 0; r < h; r++) {
      buf.fill((y + r) & 0xff, r * rowBytes, (r + 1) * rowBytes);
    }
    wire.scratchB64 = buf.toString('base64');
    return rc;
  };
  const W = 320, H = 180;
  const dst = new Uint16Array(W * H * 4); // what three.js readRenderTargetPixels passes
  gl.readPixels(0, 0, W, H, gl.RGBA, gl.HALF_FLOAT, dst);
  // rowBytes = 320*8 = 2560 -> strips of 25 rows (65536/2560), 8 dispatches
  const rowBytes = W * 8;
  const rowsPerStrip = Math.floor(65536 / rowBytes);
  const strips = Math.ceil(H / rowsPerStrip);
  assert.equal(wire.dispatches.length, baseline + strips,
    `one dispatch per ${rowsPerStrip}-row strip (${strips} strips)`);
  const bytes = new Uint8Array(dst.buffer);
  for (let y = 0; y < H; y++) {
    const row = bytes.subarray(y * rowBytes, (y + 1) * rowBytes);
    let wrong = 0;
    for (let i = 0; i < row.length; i++) if (row[i] !== (y & 0xff)) wrong++;
    assert.equal(wrong, 0, `strip rows reassemble in order (row ${y})`);
  }
  // a read under the cap stays ONE dispatch (no strip overhead)
  const before = wire.dispatches.length;
  const small = new Uint16Array(16 * 16 * 4);
  gl.readPixels(0, 0, 16, 16, gl.RGBA, gl.HALF_FLOAT, small);
  assert.equal(wire.dispatches.length, before + 1, 'a small read is a single dispatch');
  g1.readPixels = origRead;
});

test('the facade still works when the sink is cleared (locked per-command behavior)', async () => {
  const { api, wire, G1 } = loadFacade();
  const gl = api.createFacade({}, {});
  await drain(); // MSAA init out of the way
  const baseline = wire.dispatches.length;
  G1.setSink(null);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  assert.equal(wire.dispatches.length, baseline + 2, 'one dispatch per command without the sink');
  assert.equal(u32(wire.dispatches.at(-2), 0), 183, 'raw drawArrays opcode on the wire');
});

for (const [name, fn] of tests) {
  await fn();
  console.log(`ok - ${name}`);
}
console.log(`ut_gl_1_test: ${tests.length} tests passed (${METHODS.length} methods swept)`);
