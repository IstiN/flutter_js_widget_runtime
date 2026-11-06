import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

// First-bind hitch regression for webgl_loader_imagebitmap: the example
// uploads six planet textures in one burst; with default mipmap state every
// TEXTURE packet also flagged host-side CPU mip generation (R1 textureFlags
// bit 0x10) plus the staged-mip lane. The prepare-time CanvasTexture facade
// wrap now produces mipless textures (generateMipmaps=false,
// minFilter=LinearFilter) for this example only. This boot drives the REAL
// reprepared widget and asserts every emitted TEXTURE command carries the
// mipless flags and a base-level-only payload (512x512 RGBA8 in this
// harness's bounded image-decode lane).

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const OUT = path.join(ROOT, 'example/widgets/three-loader-imagebitmap');
const native = await readFile(path.join(ROOT, 'assets/three/jsr_three_native.js'), 'utf8');
const [html, module, widgetJs] = await Promise.all([
  readFile(path.join(OUT, 'original.html')),
  readFile(path.join(OUT, 'official_module.js')),
  readFile(path.join(OUT, 'widget.js'), 'utf8')
]);

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
{
  const open = /<script\b[^>]*\btype="module"[^>]*>/i.exec(html.toString('latin1'));
  const start = open.index + open[0].length;
  const direct = html.subarray(start, html.indexOf('</script>', start));
  assert.deepEqual(module, direct, 'saved module is the exact original byte span');
  const manifest = await readFile(path.join(OUT, 'prepare_manifest.json'), 'utf8').then(JSON.parse);
  assert.equal(sha(direct), manifest.outputs['official_module.js'].sha256);
  assert.equal(manifest.example, 'webgl_loader_imagebitmap');
}

const renders = [];
const states = [];
const packets = [];
const rafs = new Map();
const timers = [];
let nextRaf = 0;
let now = 1000;
const jsr = {
  instanceId: 'imagebitmap-boot-test',
  _handler: null,
  render(tree) { renders.push(JSON.parse(JSON.stringify(tree))); },
  exportState(state) { states.push(JSON.parse(JSON.stringify(state))); },
  onEvent(handler) { this._handler = handler; },
  requestAnimationFrame(callback) { const id = ++nextRaf; rafs.set(id, callback); return id; },
  cancelAnimationFrame(id) { rafs.delete(id); },
  hostCallBinary(name, bytes) { assert.equal(name, 'three.r1'); packets.push(Buffer.from(bytes)); },
  async hostCall(name, args) {
    // Bounded software decode lane: the harness answers every image decode
    // with a fixed 512x512 RGBA frame (the official source is a JPEG; the
    // R1 lane hands the renderer raw RGBA8 either way).
    if (name === 'three.canvas2d' && args && args.action === 'decodeImage') {
      const width = 512;
      const height = 512;
      return {
        ...args,
        width,
        height,
        data: Buffer.alloc(width * height * 4, 200).toString('base64')
      };
    }
    if (name === 'three.asset') return null;
    throw new Error(`unexpected host call ${name}`);
  }
};
const context = vm.createContext({
  jsr, console, performance, sendMessage() {}, TextEncoder, TextDecoder,
  setTimeout(callback, ms) { timers.push({ callback, at: now + (ms || 0) }); return timers.length; },
  clearTimeout() {}
});
vm.runInContext(native, context, { filename: 'jsr_three_native.js' });
vm.runInContext('globalThis.THREE = THREE;', context);
vm.runInContext(widgetJs, context, { filename: 'widget.js' });

const tick = () => new Promise(resolve => setImmediate(resolve));
await tick();
await tick();

function commands(packet) {
  const bytes = packet;
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

// Drive the boot sequence past the example's three addImage timers (300/600/
// 900ms) and three addImageBitmap timers (1300/1600/1900ms): pump the rAF
// loop, firing due timers on the way, until all six textures are uploaded.
let textures = [];
for (let round = 0; round < 400; round++) {
  now += 16;
  // Official timers are one-shot (the six scheduled addImage/addImageBitmap
  // loads): fire each exactly once at its due time.
  for (let index = timers.length - 1; index >= 0; index--) {
    if (timers[index].at <= now) timers.splice(index, 1)[0].callback(now);
  }
  const callbacks = [...rafs.values()];
  rafs.clear();
  callbacks.forEach(callback => callback(now));
  await tick();
  if (round % 8 === 7) {
    await tick();
    textures = packets.flatMap(packet => commands(packet)).filter(command => command.opcode === 2);
    if (textures.length >= 6) break;
  }
}
textures = packets.flatMap(packet => commands(packet)).filter(command => command.opcode === 2);
// Six planet uploads; the first carries the R1 id-0 wrap (0xFFFFFFFF, R1
// reserves 0 for null).
assert.equal(textures.length, 6, `six planet TEXTURE commands were emitted (got ${textures.length})`);

let payloadBytes = 0;
let rawLane = 0;
let encodedLane = 0;
for (const texture of textures) {
  const body = texture.body;
  const width = body.readUInt32LE(8);
  const height = body.readUInt32LE(12);
  const encoding = body.readUInt32LE(16);
  const flags = body.readUInt32LE(20);
  const dataLength = body.readUInt32LE(24);
  assert.equal(flags & 0x10, 0, 'TEXTURE flags carry NO generateMipmaps bit (0x10)');
  assert.equal(flags & 0x8, 0, 'TEXTURE flags carry NO nearest-min-filter bit (LinearFilter)');
  assert.equal(flags & 0x4, 0, 'TEXTURE flags carry NO nearest-mag-filter bit');
  if (encoding === 0) {
    // ImageBitmap facade lane: host-decoded raw RGBA8 base level only.
    assert.equal(dataLength, width * height * 4,
      'raw-lane payload is base level only (no appended mip chain)');
    rawLane++;
  } else {
    // Image lane: the encoded JPEG crosses to the host decoder as-is; no
    // JS-side mip chain is appended either way.
    assert.equal(encoding, 2, 'encoded lane carries the pinned JPEG (encoding 2)');
    assert.ok(dataLength > 0 && dataLength < width * height * 4,
      'encoded-lane payload is the compressed source, not a mip-expanded chain');
    encodedLane++;
  }
  payloadBytes += dataLength;
}
assert.equal(rawLane, 3, 'three textures ride the raw RGBA decode lane');
assert.equal(encodedLane, 3, 'three textures ride the encoded JPEG passthrough lane');

// The cubes themselves draw: after the six uploads the steady per-frame R1
// packet carries one NODE command per added cube (the facade only republishes
// exportState on DOM/stats changes, so renderer stats snapshots lag here).
const lastFrameCommands = commands(packets.at(-1));
const nodeCommands = lastFrameCommands.filter(command => command.opcode === 4).length;
assert.ok(nodeCommands >= 6, `all six cubes submit NODE draw commands (got ${nodeCommands})`);
assert.ok(packets.some(packet => commands(packet).some(command => command.opcode === 6)),
  'camera stream emitted at boot');

console.log(JSON.stringify({
  ok: true,
  widgetSha256: sha(Buffer.from(widgetJs, 'utf8')),
  textureCommands: textures.length,
  miplessFlags: true,
  rawLaneTextures: rawLane,
  encodedLaneTextures: encodedLane,
  perTexturePayloadBytes: [...new Set(textures.map(t => t.body.readUInt32LE(24)))],
  totalTexturePayloadBytes: payloadBytes,
  cubeNodeCommands: nodeCommands
}, null, 2));
