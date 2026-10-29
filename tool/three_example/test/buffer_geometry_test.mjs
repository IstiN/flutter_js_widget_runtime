import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const PREPARE = path.join(ROOT, 'tool/three_example/prepare.mjs');
const SOURCE = process.env.THREE_SRC || '/tmp/jsr-three-r186';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const examples = [
  {
    example: 'webgl_buffergeometry_uint',
    directory: 'three-buffergeometry-uint',
    html: 'a638b634348ecbd8f4c5fcf0889d04dab6c950e652569cab2486429f206dc457',
    module: 'e9b52fe4a7161d6bd32d0e25612eaaa0abc8878d43cfb146782b67400b7afe86',
    source: /new THREE\.Uint8BufferAttribute/,
    packets: 1,
    render: { calls: 1, triangles: 500000, lines: 0, points: 0 }
  },
  {
    example: 'webgl_buffergeometry_indexed',
    directory: 'three-buffergeometry-indexed',
    html: '4370368307e79fcc83c43df84ba2c5f8a2624c66c8e653c8f63ae560801fc827',
    module: '99212fb6c3fcba450bd0faa33106c90eeaf09175fb3d7f002febf03a4ab76608',
    source: /new THREE\.HemisphereLight/,
    packets: 1,
    hemisphere: true,
    wireframeControl: true,
    render: { calls: 1, triangles: 200, lines: 0, points: 0 }
  },
  {
    example: 'webgl_buffergeometry_lines_indexed',
    directory: 'three-buffergeometry-lines-indexed',
    html: '2b430176ebda402ca32d86565d3bf838bdc98158dbd37b0f3e21c9ba4e8442ee',
    module: 'a09b6d9af3a93221cf73c03d389a88918d8e65270292f3e20fd64a7ce8a27135',
    source: /new THREE\.LineSegments/,
    packets: 1,
    render: { calls: 1, triangles: 0, lines: 1360, points: 0 }
  },
  {
    example: 'webgl_buffergeometry_points',
    directory: 'three-buffergeometry-points',
    html: 'ab181dd67b2e7199f062af3d83a62f425a493c88afeb3751c83d55ac5304e52f',
    module: '0ec6f6cebe58d4fe1373d9448e3ed0eb65f15312a42539ba212a961fa852fb40',
    source: /new THREE\.PointsMaterial/,
    packets: 2,
    render: { calls: 1, triangles: 0, lines: 0, points: 500000 }
  }
];

function commands(packet) {
  const bytes = Buffer.from(packet);
  const header = bytes.readUInt16LE(6);
  const count = bytes.readUInt32LE(header + 8);
  const output = [];
  let offset = header + 12;
  for (let index = 0; index < count; index++) {
    const opcode = bytes[offset];
    const length = bytes.readUInt32LE(offset + 4);
    output.push({ opcode, body: bytes.subarray(offset + 8, offset + 8 + length) });
    offset += 8 + length;
  }
  assert.equal(offset, bytes.length);
  return output;
}

function findCheckbox(tree, label) {
  if (!tree || typeof tree !== 'object') return null;
  if (tree.type === 'checkbox' && tree.label === label) return tree;
  for (const value of Object.values(tree)) {
    if (Array.isArray(value)) {
      for (const child of value) {
        const found = findCheckbox(child, label);
        if (found) return found;
      }
    } else {
      const found = findCheckbox(value, label);
      if (found) return found;
    }
  }
  return null;
}

const native = await readFile(path.join(ROOT, 'assets/three/three.native.js'), 'utf8');
const license = await readFile(path.join(SOURCE, 'LICENSE'));
const results = [];
for (const definition of examples) {
  const verify = spawnSync(process.execPath, [
    PREPARE, definition.example, '--source', SOURCE, '--offline', '--verify'
  ], { cwd: ROOT, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  assert.equal(verify.status, 0, `${definition.example}: ${verify.stderr}`);

  const out = path.join(ROOT, 'example/widgets', definition.directory);
  const [html, savedModule, widget, manifestBytes, savedLicense] = await Promise.all([
    readFile(path.join(out, 'original.html')),
    readFile(path.join(out, 'official_module.js')),
    readFile(path.join(out, 'widget.js'), 'utf8'),
    readFile(path.join(out, 'prepare_manifest.json')),
    readFile(path.join(out, 'THREE_LICENSE'))
  ]);
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  const open = /<script\b[^>]*\btype="module"[^>]*>/i.exec(html.toString('latin1'));
  assert.ok(open, `${definition.example}: official module opening tag`);
  const start = open.index + open[0].length;
  const end = html.indexOf('</script>', start);
  assert.ok(end > start);
  const direct = html.subarray(start, end);
  assert.deepEqual(savedModule, direct);
  assert.equal(sha(direct), definition.module);
  assert.equal(sha(direct), manifest.outputs['official_module.js'].sha256);
  assert.equal(sha(html), definition.html);
  assert.equal(sha(html), manifest.outputs['original.html'].sha256);
  assert.deepEqual(savedLicense, license);
  assert.equal(manifest.id, definition.directory);
  assert.equal(manifest.example, definition.example);
  assert.equal(manifest.build.offline, true);
  assert.equal(manifest.build.remoteResolution, false);
  assert.equal(manifest.outputs['atlas.png'], undefined);
  assert.ok(manifest.inputs[`source/examples/${definition.example}.html`]);
  assert.ok(manifest.inputs['tool/three_example/stats_adapter.js']);
  assert.ok(!manifest.inputs['source/examples/jsm/libs/stats.module.js']);
  assert.ok(!Object.keys(manifest.inputs).some(name => name.startsWith('source/src/')));
  assert.ok(!Object.keys(manifest.inputs).some(name => name.includes('/textures/')));
  assert.match(savedModule.toString('utf8'), definition.source);

  const renders = [];
  const states = [];
  const packets = [];
  const rafs = new Map();
  let nextRaf = 0;
  const jsr = {
    instanceId: `${definition.directory}-prepare-test`,
    _handler: null,
    onEvent(handler) { this._handler = handler; },
    render(tree) { renders.push(tree); },
    exportState(state) { states.push(JSON.parse(JSON.stringify(state))); },
    requestAnimationFrame(callback) {
      const id = ++nextRaf;
      rafs.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) { rafs.delete(id); },
    hostCallBinary(name, bytes) {
      assert.equal(name, 'three.r1');
      packets.push(Buffer.from(bytes));
    },
    async hostCall(name) { throw new Error(`unexpected host call ${name}`); }
  };
  const context = vm.createContext({
    jsr,
    console,
    performance,
    sendMessage() {},
    TextEncoder,
    TextDecoder,
    setTimeout,
    clearTimeout
  });
  vm.runInContext(native, context, { filename: 'three.native.js' });
  vm.runInContext('globalThis.THREE = THREE;', context);
  vm.runInContext(widget, context, { filename: `${definition.example}.widget.js` });

  if (definition.wireframeControl) {
    assert.ok(renders.length >= 1);
    assert.equal(renders.at(-1).type, 'stack');
    assert.ok(renders.at(-1).children.some(node => node.type === 'three' && node.canvasId === 'main'));
  } else {
    assert.equal(renders.length, 1);
    assert.equal(renders[0].canvasId, 'main');
    assert.equal(renders[0].engineId, `${definition.directory}-prepare-test`);
  }
  assert.equal(jsr.three._runtime.canvases.size, 1);
  assert.deepEqual(states.at(-1).assets, {});
  const initialRenderCount = renders.length;
  const callbacks = [...rafs.values()];
  rafs.clear();
  assert.equal(callbacks.length, 1, `${definition.example}: one official animation loop`);
  for (const callback of callbacks) callback(performance.now());
  assert.equal(packets.length, definition.packets);
  assert.equal(renders.length, initialRenderCount, 'animation causes no render-tree churn');
  const state = states.at(-1);
  assert.equal(state.example, definition.example);
  assert.equal(state.backend, 'flutterGpu');
  assert.equal(state.canvasCount, 1);
  assert.equal(state.mounted, true);
  assert.equal(state.renderer.geometries, 1);
  assert.equal(state.renderer.textures, 0);
  for (const [key, value] of Object.entries(definition.render)) {
    assert.equal(state.renderer[key], value, `${definition.example}: renderer.${key}`);
  }
  assert.equal(state.stats.frames, definition.packets);
  assert.equal(state.stats.updates, definition.packets);
  if (definition.hemisphere) {
    const lights = packets.flatMap(commands).filter(command => command.opcode === 7);
    assert.equal(lights.length, 1);
    const light = lights[0].body;
    assert.equal(light.length, 64);
    assert.equal(light.readUInt32LE(4), 3, 'R1 light kind is HemisphereLight');
    assert.equal(light.readFloatLE(20), 3, 'official intensity is preserved');
    assert.deepEqual([24, 28, 32].map(offset => light.readFloatLE(offset)), [0, 1, 0]);
    for (const offset of [8, 12, 16, 48, 52, 56]) {
      assert.equal(light.readFloatLE(offset), 1, 'default sky/ground colors are white');
    }
  }
  results.push({
    example: definition.example,
    moduleSha256: sha(direct),
    packetBytes: packets.map(packet => packet.length),
    render: definition.render,
    textures: 0
  });
  if (definition.wireframeControl) {
    const checkbox = findCheckbox(renders.at(-1), 'wireframe');
    assert.ok(checkbox, 'official lil-gui wireframe uses a real JSR checkbox');
    assert.equal(checkbox.value, false);
    const packetCount = packets.length;
    jsr._handler(checkbox.onChanged, { value: true });
    assert.equal(findCheckbox(renders.at(-1), 'wireframe').value, true);
    assert.equal(states.at(-1).gui.values[0].value, true);
    const next = [...rafs.values()];
    rafs.clear();
    assert.equal(next.length, 1);
    for (const callback of next) callback(performance.now());
    assert.ok(packets.length > packetCount, 'wireframe changes the native material path');
  }
}

console.log(JSON.stringify({ ok: true, examples: results }, null, 2));
