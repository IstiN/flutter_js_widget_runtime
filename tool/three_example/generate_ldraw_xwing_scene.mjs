// Regenerate the prebuilt merged X-wing scene consumed by
// degrades/ldraw_xwing_prebuilt.mjs (webgl_renderer_pathtracer).
//
// Usage: node tool/three_example/generate_ldraw_xwing_scene.mjs /tmp/jsr-three-r186
//
// QuickJS spends ~12-20s parsing + building the 1.4MB MPD and another
// multi-second block merging it (mergeObject clones + applyMatrix4 over every
// part). None of that changes per boot: this script runs the pinned r186
// LDrawLoader + LDrawUtils.mergeObject offline in Node and serializes the
// merged meshes (LineSegments skipped — the official module hides them) into a
// small header + typed-array blob. The degrade rebuilds Group/Mesh/
// MeshStandardMaterial objects from views over that blob in microseconds, and
// the official module's rotation/material traverse runs unchanged on top.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const source = process.argv[2];
if (!source) throw new Error('usage: generate_ldraw_xwing_scene.mjs <three-r186-source>');
const { LDrawLoader } = await import(pathToFileURL(path.join(source, 'examples/jsm/loaders/LDrawLoader.js')));
const { LDrawConditionalLineMaterial } = await import(pathToFileURL(path.join(source, 'examples/jsm/materials/LDrawConditionalLineMaterial.js')));
const { LDrawUtils } = await import(pathToFileURL(path.join(source, 'examples/jsm/utils/LDrawUtils.js')));

// The loader reads the MPD through FileLoader -> fetch. Serve the pinned
// widget bytes from memory so no network is used.
const input = 'example/widgets/three-renderer-pathtracer/models__ldraw__officialLibrary__models__7140-1-X-wingFighter.mpd_Packed.mpd';
const output = 'example/widgets/three-renderer-pathtracer/ldraw_xwing_scene.bin';
const mpdBytes = await readFile(input);
const mpdName = 'models/7140-1-X-wingFighter.mpd_Packed.mpd';
const realFetch = globalThis.fetch;
const RealRequest = globalThis.Request;
const isMpdUrl = url => typeof url === 'string' && (url === mpdName || url.endsWith(`/${mpdName}`));
// FileLoader wraps every url in `new Request(...)` before fetch, and Node's
// Request rejects relative urls. Stub exactly the pinned MPD request; real
// requests pass through.
globalThis.Request = class {
  constructor(input, init) {
    const url = typeof input === 'string' ? input : input && input.url;
    if (isMpdUrl(url)) {
      this.url = url;
      this.headers = new Headers(init && init.headers);
      this.signal = init && init.signal;
      return;
    }
    return new RealRequest(input, init);
  }
};
globalThis.fetch = (input_, init) => {
  const url = typeof input_ === 'string' ? input_ : input_ && input_.url;
  if (isMpdUrl(url)) {
    return Promise.resolve(new Response(mpdBytes, { status: 200, headers: { 'Content-Type': 'text/plain' } }));
  }
  return realFetch(input_, init);
};
globalThis.ProgressEvent = class {
  constructor(type, init = {}) {
    this.type = type;
    this.lengthComputable = Boolean(init.lengthComputable);
    this.loaded = init.loaded || 0;
    this.total = init.total || 0;
  }
};

const t0 = performance.now();
const rawGroup = await new LDrawLoader()
  .setConditionalLineMaterial(LDrawConditionalLineMaterial)
  .setPath('models/ldraw/officialLibrary/')
  .loadAsync(mpdName);
const parseMs = Math.round(performance.now() - t0);
const merged = LDrawUtils.mergeObject(rawGroup);
const mergeMs = Math.round(performance.now() - t0 - parseMs);
if (merged.userData.numConstructionSteps === undefined) throw new Error('mergeObject did not return an LDraw group');

const meshes = [];
merged.traverse(object => {
  if (!object.isMesh || object.isLineSegments) return;
  const position = object.geometry.getAttribute('position');
  if (!position || position.itemSize !== 3) throw new Error('merged mesh is missing its position attribute');
  meshes.push({
    name: object.material.name || 'ldraw-material',
    color: object.material.color.getHex(),
    emissive: [object.material.emissive.r, object.material.emissive.g, object.material.emissive.b],
    roughness: object.material.roughness,
    metalness: object.material.metalness,
    opacity: object.material.opacity,
    transparent: object.material.transparent,
    position,
    normal: object.geometry.getAttribute('normal') || null,
    colorAttribute: object.geometry.getAttribute('color') || null,
    uvAttribute: object.geometry.getAttribute('uv') || null
  });
});
if (meshes.length === 0 || meshes.length > 256) throw new Error(`unexpected merged mesh count ${meshes.length}`);

// Layout (little-endian):
//   'JLXS' u32 version u32 meshCount
//   per mesh: u32 nameLen utf8 u32 color f32 emissive*3 f32 roughness f32 metalness
//             f32 opacity u8 transparent
//             u32 positionCount u32 positionOffset  (byte offsets into the blob)
//             u32 normalCount u32 normalOffset
//             u32 colorCount u32 colorOffset
//             u32 uvCount u32 uvOffset
//   blob: concatenated Float32Array attribute data
const encoder = new TextEncoder();
const header = new DataView(new ArrayBuffer(12));
header.setUint32(0, 0x53584c4a, true); // 'JLXS' little-endian
header.setUint32(4, 1, true);
header.setUint32(8, meshes.length, true);
const meshEntries = [];
let entryBytes = 0;
for (const mesh of meshes) {
  const nameBytes = encoder.encode(mesh.name);
  if (nameBytes.length > 128) throw new Error(`material name too long: ${mesh.name}`);
  // Entry stride is UNPADDED (4 + name + 4 + 12 + 12 + 1 + 4*(count+offset)):
  // the reader walks exactly this shape, so no padding may appear between
  // entries. Alignment for the Float32 blob is restored with one pad after
  // the entry table; attribute offsets are absolute, so readers never see it.
  const size = 4 + nameBytes.length + 4 + 12 + 12 + 1 + 4 * 8;
  meshEntries.push({ mesh, nameBytes, size });
  entryBytes += size;
}
const blobStart = (12 + entryBytes + 3) & ~3;
let blobBytes = 0;
const entryBuffers = [];
for (const { mesh, nameBytes, size } of meshEntries) {
  const entry = new DataView(new ArrayBuffer(size));
  let offset = 0;
  entry.setUint32(offset, nameBytes.length, true); offset += 4;
  new Uint8Array(entry.buffer).set(nameBytes, offset); offset += nameBytes.length;
  entry.setUint32(offset, mesh.color & 0xffffff, true); offset += 4;
  for (const channel of mesh.emissive) { entry.setFloat32(offset, channel, true); offset += 4; }
  entry.setFloat32(offset, mesh.roughness, true); offset += 4;
  entry.setFloat32(offset, mesh.metalness, true); offset += 4;
  entry.setFloat32(offset, mesh.opacity, true); offset += 4;
  entry.setUint8(offset, mesh.transparent ? 1 : 0); offset += 1;
  for (const attribute of [mesh.position, mesh.normal, mesh.colorAttribute, mesh.uvAttribute]) {
    const count = attribute ? attribute.count : 0;
    entry.setUint32(offset, count, true); offset += 4;
    // Attribute offsets are absolute byte offsets from the document start, so
    // the runtime loader can view them without re-walking the entry table.
    entry.setUint32(offset, count ? blobStart + blobBytes : 0, true); offset += 4;
    if (attribute) blobBytes += attribute.array.byteLength;
  }
  entryBuffers.push(new Uint8Array(entry.buffer));
}
const totalBytes = blobStart + blobBytes;
const document_ = new Uint8Array(totalBytes);
let cursor = 0;
for (const part of [new Uint8Array(header.buffer), ...entryBuffers]) { document_.set(part, cursor); cursor += part.length; }
if (cursor > blobStart) throw new Error('header length mismatch');
cursor = blobStart; // skip the 0-3 alignment pad bytes after the entry table
for (const mesh of meshes) {
  for (const attribute of [mesh.position, mesh.normal, mesh.colorAttribute, mesh.uvAttribute]) {
    if (!attribute) continue;
    document_.set(new Uint8Array(attribute.array.buffer, attribute.array.byteOffset, attribute.array.byteLength), cursor);
    cursor += attribute.array.byteLength;
  }
}
if (cursor !== totalBytes) throw new Error('serialized byte count mismatch');
// Reader-shaped self-check: walk the entries exactly the way
// degrades/ldraw_xwing_prebuilt.mjs will, so any stride drift fails here
// instead of shipping a blob whose readers decode garbage.
{
  const verify = new DataView(document_.buffer, document_.byteOffset, document_.byteLength);
  if (verify.getUint32(0, true) !== 0x53584c4a || verify.getUint32(4, true) !== 1 || verify.getUint32(8, true) !== meshes.length) {
    throw new Error('self-check: header mismatch');
  }
  let walk = 12;
  for (const mesh of meshes) {
    const nameLength = verify.getUint32(walk, true);
    if (nameLength !== encoder.encode(mesh.name).length) throw new Error(`self-check: entry stride drift at ${mesh.name}`);
    walk += 4 + nameLength + 4 + 12 + 12 + 1;
    for (const attribute of [mesh.position, mesh.normal, mesh.colorAttribute, mesh.uvAttribute]) {
      const count = verify.getUint32(walk, true);
      const attributeOffset = verify.getUint32(walk + 4, true);
      if (count !== (attribute ? attribute.count : 0)) throw new Error(`self-check: count drift at ${mesh.name}`);
      if (count && (attributeOffset % 4 !== 0 || attributeOffset + count * 12 > totalBytes)) {
        throw new Error(`self-check: offset drift at ${mesh.name}`);
      }
      walk += 8;
    }
  }
  if (walk > blobStart) throw new Error('self-check: entry table overruns the blob start');
}
await writeFile(output, document_);

let vertexCount = 0;
for (const mesh of meshes) vertexCount += mesh.position.count;
console.log(JSON.stringify({
  output,
  sha256: createHash('sha256').update(document_).digest('hex'),
  bytes: totalBytes,
  meshes: meshes.length,
  vertices: vertexCount,
  names: meshes.map(mesh => mesh.name),
  nodeParseMs: parseMs,
  nodeMergeMs: mergeMs
}, null, 2));
