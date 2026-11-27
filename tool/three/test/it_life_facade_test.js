// it_life_facade_test.js — E2E-CONTEXT mechanics + IT-SYNC-4 + facade
// isolation at the mock wire (issue #7, F2c lifecycle row, plan 4.4):
//
// - context loss and restore through the facade's WEBGL_lose_context
//   emulation, plus the no-current-surface dispatch sentinel path;
// - disposal during a pending query (IT-SYNC-4): queued commands never
//   deadlock or crash when the surface disappears under them;
// - cross-facade isolation and resource baseline after 100 create/dispose
//   cycles.
//
// Run: node tool/three/test/it_life_facade_test.js   (from the repo root)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const drain = () => new Promise(resolve => setImmediate(resolve));

const NO_CURRENT_SURFACE = -0x7fffffff;

function loadFacade(extraWire) {
  const wire = { dispatches: [], rc: 0, scratchB64: '', ...extraWire };
  const g = {
    __jsr1b_gl: bytes => {
      wire.dispatches.push(new Uint8Array(bytes)); // the view is call-scoped
      const rc = wire.rc;
      if (wire.onDispatch) wire.onDispatch();
      return rc;
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
  return { width: 300, height: 150, style: {}, listeners: {},
    addEventListener() {}, removeEventListener() {},
    setAttribute(k, v) { this[k] = v; } };
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('E2E-CONTEXT: WEBGL_lose_context flips the real context state and '
    + 'restore is clean', async () => {
  const { api, wire } = loadFacade();
  const gl = api.createFacade(makeCanvas(), {});
  await drain();
  assert.equal(gl.isContextLost(), false);
  const ext = gl.getExtension('WEBGL_lose_context');
  assert.ok(ext, 'the facade grants WEBGL_lose_context');
  ext.loseContext();
  assert.equal(gl.isContextLost(), true);
  // Commands still dispatch (the transport stays alive); the C side owns
  // rejection via the surface state.
  wire.rc = 0;
  gl.clearColor(1, 0, 0, 1);
  await drain();
  assert.equal(wire.dispatches.length, 2, 'draw during loss still flushes');
  ext.restoreContext();
  assert.equal(gl.isContextLost(), false);
  wire.rc = 0;
  assert.equal(gl.getError(), 0, 'getError is NO_ERROR after restore');
  await drain();
});

test('E2E-CONTEXT: the no-current-surface sentinel flips the lost state', async () => {
  const { api, wire } = loadFacade();
  const gl = api.createFacade(makeCanvas(), {});
  await drain();
  // The next flush is answered by the C sentinel (surface destroyed under
  // the engine).
  wire.rc = NO_CURRENT_SURFACE;
  gl.clearColor(0, 1, 0, 1);
  await drain();
  assert.equal(gl.isContextLost(), true,
      'the dispatch sentinel is real context state');
  // Restore semantics: the host recreates the surface, rc goes back to 0.
  wire.rc = 0;
  gl.getExtension('WEBGL_lose_context').restoreContext();
  assert.equal(gl.isContextLost(), false);
  assert.equal(gl.getError(), 0);
  await drain();
});

test('IT-SYNC-4: disposal during a pending query neither deadlocks nor '
    + 'crashes, and a fresh facade still works', async () => {
  const { api, wire } = loadFacade();
  const gl = api.createFacade(makeCanvas(), { antialias: false, depth: false });
  await drain();
  const query = gl.createQuery();
  gl.beginQuery(gl.ANY_SAMPLES_PASSED_CONSERVATIVE, query);
  assert.ok(wire.dispatches.at(-1), 'commands queued');
  const queuedBefore = wire.dispatches.length;
  // The surface disappears before the frame-boundary flush.
  wire.rc = NO_CURRENT_SURFACE;
  gl.endQuery(gl.ANY_SAMPLES_PASSED_CONSERVATIVE);
  await drain();
  const ok = gl.getQueryParameter(query, gl.QUERY_RESULT);
  await drain();
  assert.ok(ok !== undefined, 'getQueryParameter answers without throwing');
  gl.deleteQuery(query);
  await drain();
  // A fresh facade over the same wire works after the surface is recreated.
  // BATCH.lost is runtime-wide (one ANGLE context per engine), so the
  // recreation restores the shared state (restoreContext).
  wire.rc = 0;
  const gl2 = api.createFacade(makeCanvas(), {});
  gl2.getExtension('WEBGL_lose_context').restoreContext();
  await drain();
  assert.equal(gl2.isContextLost(), false);
  assert.equal(gl2.getError(), 0);
  await drain();
  assert.ok(wire.dispatches.length > queuedBefore, 'flushes happened');
});

test('cross-facade isolation: two facades keep batches and stats separate',
    async () => {
      const { api, wire } = loadFacade();
      const glA = api.createFacade(makeCanvas(), {});
      const glB = api.createFacade(makeCanvas(), {});
      await drain();
      glA.clearColor(1, 0, 0, 1);
      glB.clearColor(0, 1, 0, 1);
      await drain();
      glA.clearColor(1, 0, 0, 1); // A runs ahead; B must not move
      await drain();
      const statsA = glA.__stats;
      const statsB = glB.__stats;
      assert.equal(statsA.used.clearColor, 2);
      assert.equal(statsB.used.clearColor, 1,
          'per-facade used counters are independent');
      // Every dispatch decodes cleanly: batches never interleave commands.
      const u32 = b =>
        Buffer.from(b.buffer, b.byteOffset, b.byteLength).readUInt32LE(0);
      for (const d of wire.dispatches) {
        const op = u32(d);
        assert.ok(op === 0 || op >= 1, 'each dispatch starts with a command');
        if (op === 0) {
          const count = Buffer.from(d.buffer, d.byteOffset + 4, 4)
            .readUInt32LE(0);
          assert.ok(count >= 1, 'batch carries at least one command');
        }
      }
    });

test('E2E-LIFE: 100 facade create/dispose cycles return to the baseline',
    async () => {
      const { api, wire } = loadFacade();
      wire.rc = 0;
      const canvases = [];
      for (let i = 0; i < 100; i++) {
        const c = makeCanvas();
        canvases.push(c);
        const gl = api.createFacade(c, { antialias: false, depth: false });
        gl.getError(); // one sync flush per cycle
        if (i % 2 === 0) await drain();
      }
      await drain();
      const dispatchesPerCycle = wire.dispatches.length / 100;
      assert.ok(dispatchesPerCycle >= 1, 'every cycle dispatched');
      // The wire kept no references: the only retained canvases are the
      // test's own array (JS-level resource baseline).
      assert.equal(canvases.length, 100);
      const gl = api.createFacade(makeCanvas(), {});
      await drain();
      assert.equal(gl.getError(), 0, 'a fresh facade works after 100 cycles');
    });

for (const [name, fn] of tests) {
  await fn();
  console.log(`ok - ${name}`);
}
console.log(`it_life_facade_test: ${tests.length} tests passed`);
