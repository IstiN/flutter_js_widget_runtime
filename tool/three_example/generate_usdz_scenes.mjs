// Regenerate the prebuilt USDZ scene consumed by
// degrades/loader_usdz_prebuilt.mjs (webgl_loader_usdz).
//
// Usage: node tool/three_example/generate_usdz_scenes.mjs /tmp/jsr-three-r186
//
// QuickJS grinds for minutes inside the r186 USDLoader's USDA text parse
// (baked_mesh.usda alone is 1.88MB ASCII) before the module can present its
// first frame — the worker sits at 100% CPU and the host sees a permanent
// loading overlay. The scene is boot-invariant, so this script runs the
// pinned USDLoader offline in Node (V8) and serializes the parsed group into
// the same J3MF-style header + typed-array blob the 3MF prebuilt lane uses
// (world transforms baked, materials + texture REFERENCES kept). The degrade
// rebuilds Group/Mesh/MeshStandardMaterial from zero-copy views; the embedded
// PNG ships as a standalone widget asset through the runtime TextureLoader
// lane, so the official manager.onLoad semantics are preserved.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash as hash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const source = process.argv[2];
if (!source) throw new Error('usage: generate_usdz_scenes.mjs <three-r186-source>');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'example/widgets/three-loader-usdz');
const ASSET = 'saeukkang';

const { USDLoader } = await import(pathToFileURL(path.join(source, 'examples/jsm/loaders/USDLoader.js')));
const { unzipSync } = await import(pathToFileURL(path.join(source, 'examples/jsm/libs/fflate.module.js')));

// --- offline parse stubs (same idea as generate_3mf_scenes.mjs) -------------
class JsrBlob {
  constructor(parts) {
    let length = 0;
    for (const part of parts) length += part.byteLength;
    this._bytes = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) {
      this._bytes.set(new Uint8Array(part.buffer ?? part, part.byteOffset ?? 0, part.byteLength), offset);
      offset += part.byteLength;
    }
  }
}
const blobBytes = new Map();
let blobCounter = 0;
globalThis.Blob = JsrBlob;
globalThis.URL = class {
  static createObjectURL(blob) {
    const name = `blob:jsr-usdz-texture-${blobCounter++}`;
    blobBytes.set(name, blob._bytes);
    return name;
  }
  static revokeObjectURL() { /* bytes stay recorded for extraction */ }
};
// USDComposer builds `new Image()` and waits for onload; offline the stub
// fires it on the microtask and records image -> blob URL for texture REF
// extraction. No pixels are needed: the degrade re-loads the texture through
// the runtime lane.
const imageUrls = new Map();
globalThis.Image = class {
  constructor() { this._src = ''; }
  set src(value) {
    this._src = value;
    imageUrls.set(this, String(value));
    queueMicrotask(() => { if (this.onload) this.onload(); });
  }
  get src() { return this._src; }
};

const THREE = await import(pathToFileURL(path.join(source, 'build/three.module.js')));
const WRAP_CODES = new Map([
  [THREE.RepeatWrapping, 0], [THREE.MirroredRepeatWrapping, 1], [THREE.ClampToEdgeWrapping, 2]
]);
const FILTER_CODES = new Map([
  [THREE.NearestFilter, 0], [THREE.LinearFilter, 1],
  [THREE.NearestMipmapNearestFilter, 2], [THREE.NearestMipmapLinearFilter, 3],
  [THREE.LinearMipmapNearestFilter, 4], [THREE.LinearMipmapLinearFilter, 5]
]);
const encoder = new TextEncoder();
const sha = bytes => hash('sha256').update(bytes).digest('hex');

const modelBytes = await readFile(path.join(source, 'examples/models/usdz/saeukkang.usdz'));
const t0 = performance.now();
const group = await new Promise((resolve, reject) => {
  new USDLoader().parse(
    modelBytes.buffer.slice(modelBytes.byteOffset, modelBytes.byteOffset + modelBytes.byteLength),
    '',
    resolve,
    reject
  );
});
console.log(`offline USD parse: ${Math.round(performance.now() - t0)}ms`);
group.updateMatrixWorld(true);

const zip = unzipSync(new Uint8Array(modelBytes.buffer, modelBytes.byteOffset, modelBytes.byteLength));
const zipByHash = new Map();
for (const [entryPath, entryBytes] of Object.entries(zip)) {
  if (/\.(png|jpe?g)$/i.test(entryPath)) zipByHash.set(sha(entryBytes), entryPath);
}

const textures = [];
const byUrl = new Map();
const resolveTexture = texture => {
  if (!texture) return -1;
  const blobUrl = texture.image ? imageUrls.get(texture.image) : undefined;
  if (blobUrl === undefined) return -1;
  if (byUrl.has(blobUrl)) return byUrl.get(blobUrl);
  const bytes = blobBytes.get(blobUrl);
  if (!bytes) throw new Error(`texture bytes missing for ${blobUrl}`);
  const zipPath = zipByHash.get(sha(bytes));
  if (!zipPath) throw new Error('extracted texture does not match any zip image entry');
  const index = textures.length;
  byUrl.set(blobUrl, index);
  textures.push({
    zipPath,
    bytes,
    colorSpaceSrgb: texture.colorSpace === THREE.SRGBColorSpace,
    wrapS: WRAP_CODES.get(texture.wrapS) ?? 0,
    wrapT: WRAP_CODES.get(texture.wrapT) ?? 0,
    magFilter: FILTER_CODES.get(texture.magFilter) ?? 1,
    minFilter: FILTER_CODES.get(texture.minFilter) ?? 5,
    generateMipmaps: texture.generateMipmaps !== false
  });
  return index;
};

const meshes = [];
group.traverse(object => {
  if (!object.isMesh || !object.geometry) return;
  const geometry = object.geometry.clone();
  geometry.applyMatrix4(object.matrixWorld);
  const material = object.material;
  if (!material || material.isMaterial !== true) throw new Error('mesh without a single material');
  meshes.push({
    name: object.name || material.name || 'usdz-mesh',
    materialKind: material.isMeshStandardMaterial ? 1 : 0,
    color: material.color.getHex() & 0xffffff,
    opacity: material.opacity,
    transparent: material.transparent === true,
    vertexColors: material.vertexColors === true,
    flatShading: material.flatShading === true,
    roughness: material.roughness,
    metalness: material.metalness,
    textureIndex: resolveTexture(material.map),
    position: geometry.getAttribute('position'),
    normal: geometry.getAttribute('normal') || null,
    colorAttribute: geometry.getAttribute('color') || null,
    uv: geometry.getAttribute('uv') || null,
    index: geometry.index ? { count: geometry.index.count, array: geometry.index.array instanceof Uint32Array ? geometry.index.array : new Uint32Array(geometry.index.array) } : null
  });
});
if (!meshes.length) throw new Error('USDLoader produced no meshes');
for (const mesh of meshes) {
  if (!mesh.position || mesh.position.itemSize !== 3) throw new Error('mesh without a position attribute');
  for (const [key, attribute] of [['position', mesh.position], ['normal', mesh.normal], ['uv', mesh.uv]]) {
    if (!attribute) continue;
    let bad = 0;
    for (let i = 0; i < attribute.array.length; i++) if (!Number.isFinite(attribute.array[i])) bad++;
    if (bad) console.warn(`${key}: ${bad} non-finite components (source parity)`);
  }
}
for (const texture of textures) {
  texture.url = `models/usdz/tex/${path.posix.basename(texture.zipPath)}`;
  texture.file = `models__usdz__tex__${path.posix.basename(texture.zipPath)}`;
}
console.log(`meshes=${meshes.length} textures=${textures.length}`);

// J3MF v1 layout (identical to generate_3mf_scenes.mjs — the degrade shares
// the reader): header + texture/mesh tables, then the typed-array blob.
function serializeDocument() {
  const textureEntries = textures.map(texture => {
    const urlBytes = encoder.encode(texture.url);
    return { texture, urlBytes, size: 4 + urlBytes.length + 6 };
  });
  const meshEntries = meshes.map(mesh => {
    const nameBytes = encoder.encode(mesh.name);
    return { mesh, nameBytes, size: 4 + nameBytes.length + 4 + 4 + 4 + 3 + 4 + 4 + 4 + 4 * 8 + 1 + 4 + 4 };
  });
  const headerBytes = 16 + textureEntries.reduce((sum, entry) => sum + entry.size, 0) +
    meshEntries.reduce((sum, entry) => sum + entry.size, 0);
  const segments = [];
  let blobBytesTotal = 0;
  for (const mesh of meshes) {
    for (const [key, attribute] of [['position', mesh.position], ['normal', mesh.normal], ['color', mesh.colorAttribute], ['uv', mesh.uv]]) {
      if (!attribute) continue;
      const bytes = new Uint8Array(attribute.array.buffer, attribute.array.byteOffset, attribute.array.byteLength);
      mesh[`${key}BlobOffset`] = blobBytesTotal;
      segments.push(bytes);
      blobBytesTotal += bytes.byteLength;
    }
    if (mesh.index) {
      const bytes = new Uint8Array(mesh.index.array.buffer, mesh.index.array.byteOffset, mesh.index.array.byteLength);
      mesh.indexBlobOffset = blobBytesTotal;
      segments.push(bytes);
      blobBytesTotal += bytes.byteLength;
    }
  }
  const output = new Uint8Array(headerBytes + 4 + blobBytesTotal);
  const view = new DataView(output.buffer);
  output[0] = 0x4a; output[1] = 0x33; output[2] = 0x4d; output[3] = 0x46; // J3MF
  view.setUint32(4, 1, true);
  view.setUint32(8, meshes.length, true);
  view.setUint32(12, textures.length, true);
  let offset = 16;
  for (const entry of textureEntries) {
    view.setUint32(offset, entry.urlBytes.length, true); offset += 4;
    output.set(entry.urlBytes, offset); offset += entry.urlBytes.length;
    output[offset++] = entry.texture.colorSpaceSrgb ? 1 : 0;
    output[offset++] = entry.texture.wrapS;
    output[offset++] = entry.texture.wrapT;
    output[offset++] = entry.texture.magFilter;
    output[offset++] = entry.texture.minFilter;
    output[offset++] = entry.texture.generateMipmaps ? 1 : 0;
  }
  const blobBase = headerBytes + 4;
  for (const entry of meshEntries) {
    const mesh = entry.mesh;
    view.setUint32(offset, entry.nameBytes.length, true); offset += 4;
    output.set(entry.nameBytes, offset); offset += entry.nameBytes.length;
    view.setUint32(offset, mesh.materialKind, true); offset += 4;
    view.setUint32(offset, mesh.color, true); offset += 4;
    view.setFloat32(offset, mesh.opacity, true); offset += 4;
    output[offset++] = mesh.transparent ? 1 : 0;
    output[offset++] = mesh.vertexColors ? 1 : 0;
    output[offset++] = mesh.flatShading ? 1 : 0;
    view.setFloat32(offset, mesh.roughness ?? 1, true); offset += 4;
    view.setFloat32(offset, mesh.metalness ?? 0, true); offset += 4;
    view.setInt32(offset, mesh.textureIndex, true); offset += 4;
    for (const [attribute, itemSize, key] of [
      [mesh.position, 3, 'position'], [mesh.normal, 3, 'normal'],
      [mesh.colorAttribute, 3, 'color'], [mesh.uv, 2, 'uv']
    ]) {
      view.setUint32(offset, attribute ? attribute.count : 0, true); offset += 4;
      view.setUint32(offset, attribute ? blobBase + mesh[`${key}BlobOffset`] : 0, true); offset += 4;
    }
    output[offset++] = mesh.index ? 1 : 0;
    view.setUint32(offset, mesh.index ? mesh.index.count : 0, true); offset += 4;
    view.setUint32(offset, mesh.index ? blobBase + mesh.indexBlobOffset : 0, true); offset += 4;
  }
  offset = blobBase;
  for (const segment of segments) { output.set(segment, offset); offset += segment.byteLength; }
  return output;
}

const blob = serializeDocument();
const outModel = path.join(OUT, 'models__usdz__saeukkang.usdz');
await writeFile(outModel, blob);
console.log(`wrote ${outModel} ${blob.byteLength}B sha256=${sha(blob)}`);
for (const texture of textures) {
  const outTex = path.join(OUT, texture.file);
  await writeFile(outTex, texture.bytes);
  console.log(`wrote ${outTex} ${texture.bytes.byteLength}B sha256=${sha(texture.bytes)} url=${texture.url}`);
}
