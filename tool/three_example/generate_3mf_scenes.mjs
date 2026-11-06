// Regenerate the prebuilt 3MF scenes consumed by
// degrades/loader_3mf_prebuilt.mjs (webgl_loader_3mf / webgl_loader_3mf_materials).
//
// Usage: node tool/three_example/generate_3mf_scenes.mjs /tmp/jsr-three-r186
//
// QuickJS spends 45-80s per boot inside the 3MF lane's xml_dom parse (the
// cube_gears model XML alone is 2MB; truck is 20MB) before the official
// ThreeMFLoader finishes building meshes/materials. None of that changes per
// boot: this script runs the pinned r186 ThreeMFLoader offline in Node and
// serializes the parsed group (world transforms baked, materials + texture
// REFERENCES kept) into a header + typed-array blob per asset. The degrade
// rebuilds Group/Mesh/MeshPhongMaterial objects from views over that blob and
// loads the extracted textures through the runtime TextureLoader lane, so the
// official manager.onLoad semantics (both modules render from it) are kept.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const source = process.argv[2];
if (!source) throw new Error('usage: generate_3mf_scenes.mjs <three-r186-source>');
const ROOT = path.resolve(path.dirname(fileURLToPath2(import.meta.url)), '../..');

function fileURLToPath2(url) {
  return new URL(url).pathname.replace(/^\/([A-Z]:)/, '$1');
}

// Mirrors the prepare.mjs registry pins (webgl_loader_3mf / _materials).
// spinal implant (30.8MB merged beam-lattice geometry) and volumetric (its
// volumetric extension crashes the pinned r186 loader's build phase) stay on
// their raw .3mf pins: neither is a boot asset (the official module loads
// cube_gears at boot; the others are dropdown-reachable), and prebuilding
// them would triple the widget payload or cannot be produced at all.
const WIDGETS = [
  {
    directory: 'three-loader-3mf',
    assets: ['cube_gears', 'facecolors', 'multipletextures', 'pyramid', 'truck', 'variable voronoi', 'vertexcolors']
  },
  {
    directory: 'three-loader-3mf-materials',
    assets: ['truck']
  }
];

const { ThreeMFLoader } = await import(pathToFileURL(path.join(source, 'examples/jsm/loaders/3MFLoader.js')));
const { unzipSync } = await import(pathToFileURL(path.join(source, 'examples/jsm/libs/fflate.module.js')));

// --- offline parse stubs ----------------------------------------------------
// ThreeMFLoader reads the zip with pure-JS fflate and builds textures through
// TextureLoader + Blob/object-URLs. Node has no DOM Blob: stub Blob and
// URL.createObjectURL and keep the recorded bytes so texture REFERENCES can be
// extracted as standalone widget assets (matched back to their zip paths by
// content hash — createObjectURL does not carry the zip path).
class JsrBlob {
  constructor(parts, options = {}) {
    let length = 0;
    for (const part of parts) length += part.byteLength;
    this._bytes = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) {
      this._bytes.set(new Uint8Array(part.buffer ?? part, part.byteOffset ?? 0, part.byteLength), offset);
      offset += part.byteLength;
    }
    this.type = options.type || '';
  }
  arrayBuffer() { return this._bytes.buffer.slice(0, this._bytes.byteLength); }
}
const blobBytes = new Map();
let blobCounter = 0;
class JsrURL {
  static createObjectURL(blob) {
    const name = `blob:jsr-3mf-texture-${blobCounter++}`;
    blobBytes.set(name, blob._bytes);
    return name;
  }
  static revokeObjectURL() { /* bytes stay recorded; extraction happens below */ }
}
globalThis.Blob = JsrBlob;
globalThis.URL = JsrURL;
// ImageLoader needs a DOM to hand its placeholder <img> out; the decode never
// completes offline, which is fine — the placeholder Texture only carries the
// sampler/wrap parameters this script serializes.
globalThis.document = {
  createElementNS() {
    const listeners = new Map();
    return {
      addEventListener(type, callback) { listeners.set(type, callback); },
      removeEventListener(type) { listeners.delete(type); },
      dispatchEvent(event) { listeners.get(event.type)?.call(this, event); },
      src: ''
    };
  }
};
const { JsrDOMParser } = await import(pathToFileURL(path.join(ROOT, 'tool/three_example/vendor/xml_dom.js')));
// The r186 loader finds resources with querySelectorAll('colorgroup') — in a
// browser CSS type selectors match by LOCAL name, so prefixed extension
// elements (<m:colorgroup>, <m:texture2dgroup> in the Microsoft material
// namespace) still match. xml_dom matches qualified tag names, which would
// drop facecolors/multipletextures resources and bake empty scenes. Strip the
// extension prefix offline so the offline parse sees exactly what the browser
// demo's DOM sees.
class PrefixStrippingDOMParser {
  parseFromString(string, type) {
    const stripped = string.replace(/<(\/?)m:/g, '<$1').replace(/ xmlns:m="[^"]*"/g, '');
    return new JsrDOMParser().parseFromString(stripped, type);
  }
}
globalThis.DOMParser = PrefixStrippingDOMParser;

// TextureLoader cannot decode offline: patch it so parse() still gets a
// placeholder Texture per request while we record which request each texture
// object belongs to. The loader sets colorSpace/wrap/filters after load.
const THREE = await import(pathToFileURL(path.join(source, 'build/three.module.js')));
const textureUrls = new Map();
THREE.TextureLoader.prototype.load = function (url, onLoad, onProgress, onError) {
  const texture = new THREE.Texture();
  textureUrls.set(texture, String(url));
  if (onLoad) queueMicrotask(() => onLoad(texture));
  return texture;
};

const WRAP_CODES = new Map([
  [THREE.RepeatWrapping, 0], [THREE.MirroredRepeatWrapping, 1], [THREE.ClampToEdgeWrapping, 2]
]);
const FILTER_CODES = new Map([
  [THREE.NearestFilter, 0], [THREE.LinearFilter, 1],
  [THREE.NearestMipmapNearestFilter, 2], [THREE.NearestMipmapLinearFilter, 3],
  [THREE.LinearMipmapNearestFilter, 4], [THREE.LinearMipmapLinearFilter, 5]
]);

const encoder = new TextEncoder();
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

function sanitizeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'tex';
}

function parseAsset(assetName, modelBytes) {
  blobBytes.clear();
  textureUrls.clear();
  const t0 = performance.now();
  const group = new ThreeMFLoader().parse(modelBytes);
  const parseMs = Math.round(performance.now() - t0);
  group.updateMatrixWorld(true);

  // Zip path resolution: blob bytes were copied verbatim from the zip entries,
  // so the content hash maps each recorded texture back to its zip path.
  const zip = unzipSync(new Uint8Array(modelBytes.buffer, modelBytes.byteOffset, modelBytes.byteLength));
  const zipByHash = new Map();
  for (const [entryPath, entryBytes] of Object.entries(zip)) {
    if (/\.(png|jpe?g)$/i.test(entryPath)) zipByHash.set(sha(entryBytes), entryPath);
  }

  const textures = [];
  const byUrl = new Map();
  const byZipPath = new Map();
  const resolveTexture = texture => {
    if (!texture) return -1;
    const blobUrl = textureUrls.get(texture);
    if (blobUrl === undefined) return -1;
    if (byUrl.has(blobUrl)) return byUrl.get(blobUrl);
    const bytes = blobBytes.get(blobUrl);
    if (!bytes) throw new Error(`${assetName}: texture bytes missing for ${blobUrl}`);
    const zipPath = zipByHash.get(sha(bytes));
    if (!zipPath) throw new Error(`${assetName}: extracted texture does not match any zip image entry`);
    // The same zip image can be referenced through several distinct blob
    // URLs; the runtime lane keys texture assets by file name, so dedup by
    // zip path and share one entry.
    const existing = byZipPath.get(zipPath);
    if (existing !== undefined) {
      byUrl.set(blobUrl, existing);
      return existing;
    }
    const index = textures.length;
    byUrl.set(blobUrl, index);
    byZipPath.set(zipPath, index);
    textures.push({
      zipPath,
      bytes,
      colorSpaceSrgb: texture.colorSpace === THREE.SRGBColorSpace,
      wrapS: WRAP_CODES.get(texture.wrapS),
      wrapT: WRAP_CODES.get(texture.wrapT),
      magFilter: FILTER_CODES.get(texture.magFilter),
      minFilter: FILTER_CODES.get(texture.minFilter),
      generateMipmaps: texture.generateMipmaps === true
    });
    return index;
  };

  const meshes = [];
  group.traverse(object => {
    if (!object.isMesh || !object.geometry) return;
    const geometry = object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);
    const material = object.material;
    if (!material || material.isMaterial !== true) throw new Error(`${assetName}: mesh without a single material`);
    meshes.push({
      name: object.name || material.name || '3mf-mesh',
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
      // The document stores Uint32 indices (pyramid ships Uint16Array); the
      // runtime reader always builds Uint32 views.
      index: geometry.index ? { count: geometry.index.count, array: geometry.index.array instanceof Uint32Array ? geometry.index.array : new Uint32Array(geometry.index.array) } : null
    });
  });
  // facecolors.3mf uses a resource type the pinned r186 loader reports as
  // unsupported ("THREE.3MFLoader: Unsupported resource type.") and parses to
  // an empty group — keep that parity instead of failing the whole batch.
  if (meshes.length > 4096) throw new Error(`${assetName}: unexpected mesh count ${meshes.length}`);
  if (meshes.length === 0) console.warn(`${assetName}: official loader produced no meshes (parity with the pinned r186 lane)`);
  for (const mesh of meshes) {
    if (!mesh.position || mesh.position.itemSize !== 3) throw new Error(`${assetName}: mesh without a position attribute`);
  }
  // Runtime texture fetch keys mirror the zip-relative names under a
  // models/3mf/tex/<asset>/ namespace (deterministic, per-widget pinned).
  for (const texture of textures) {
    texture.url = `models/3mf/tex/${assetName}/${path.posix.basename(texture.zipPath)}`;
    texture.file = `models__3mf__tex__${sanitizeName(assetName)}__${sanitizeName(path.posix.basename(texture.zipPath))}`;
  }
  return { parseMs, meshes, textures };
}

// Layout (little-endian):
//   'J3MF' u32 version u32 meshCount u32 textureCount
//   per texture: u32 urlLen utf8 u8 srgb u8 wrapS u8 wrapT u8 mag u8 min u8 mipmaps
//   per mesh: u32 nameLen utf8 u32 materialKind u32 color f32 opacity
//             u8 transparent u8 vertexColors u8 flatShading
//             f32 roughness f32 metalness s32 textureIndex
//             u32 positionCount u32 positionOffset   (Float32, itemSize 3)
//             u32 normalCount u32 normalOffset       (Float32, itemSize 3)
//             u32 colorCount u32 colorOffset         (Float32, itemSize 3)
//             u32 uvCount u32 uvOffset               (Float32, itemSize 2)
//             u8 hasIndex u32 indexCount u32 indexOffset (Uint32)
//   one alignment pad, then the blob. Entry strides are UNPADDED (the reader
//   walks exactly this shape); attribute offsets are absolute byte offsets so
//   the runtime reader can build typed-array views without re-walking tables.
function serializeDocument(assetName, parsed) {
  const { meshes, textures } = parsed;
  const textureEntries = textures.map(texture => {
    const urlBytes = encoder.encode(texture.url);
    return { texture, urlBytes, size: 4 + urlBytes.length + 6 };
  });
  const meshEntries = meshes.map(mesh => {
    const nameBytes = encoder.encode(mesh.name);
    if (nameBytes.length === 0 || nameBytes.length > 512) throw new Error(`${assetName}: mesh name length out of range`);
    return { mesh, nameBytes, size: 4 + nameBytes.length + 4 + 4 + 4 + 3 + 4 + 4 + 4 + 4 * 8 + 1 + 4 + 4 };
  });
  const headerBytes = 16 + textureEntries.reduce((sum, entry) => sum + entry.size, 0) +
    meshEntries.reduce((sum, entry) => sum + entry.size, 0);
  const blobStart = (headerBytes + 3) & ~3;
  let blobBytesTotal = 0;
  const layout = [];
  const pushBlob = (array, itemSize, count) => {
    if (!count) return 0;
    const offset = blobStart + blobBytesTotal;
    const byteLength = count * itemSize * 4;
    layout.push({ array, byteLength });
    blobBytesTotal += byteLength;
    return offset;
  };
  for (const entry of meshEntries) {
    const mesh = entry.mesh;
    entry.fields = {
      positionOffset: pushBlob(mesh.position.array, 3, mesh.position.count),
      normalOffset: mesh.normal ? pushBlob(mesh.normal.array, 3, mesh.normal.count) : 0,
      colorOffset: mesh.colorAttribute ? pushBlob(mesh.colorAttribute.array, 3, mesh.colorAttribute.count) : 0,
      uvOffset: mesh.uv ? pushBlob(mesh.uv.array, 2, mesh.uv.count) : 0,
      indexOffset: mesh.index ? pushBlob(mesh.index.array, 1, mesh.index.count) : 0
    };
  }
  const totalBytes = blobStart + blobBytesTotal;
  const documentBytes = new Uint8Array(totalBytes);
  const view = new DataView(documentBytes.buffer);
  view.setUint32(0, 0x464d334a, true); // 'J3MF' little-endian
  view.setUint32(4, 1, true);
  view.setUint32(8, meshes.length, true);
  view.setUint32(12, textures.length, true);
  let cursor = 16;
  for (const { texture, urlBytes, size } of textureEntries) {
    view.setUint32(cursor, urlBytes.length, true); cursor += 4;
    documentBytes.set(urlBytes, cursor); cursor += urlBytes.length;
    view.setUint8(cursor++, texture.colorSpaceSrgb ? 1 : 0);
    view.setUint8(cursor++, texture.wrapS);
    view.setUint8(cursor++, texture.wrapT);
    view.setUint8(cursor++, texture.magFilter);
    view.setUint8(cursor++, texture.minFilter);
    view.setUint8(cursor++, texture.generateMipmaps ? 1 : 0);
    void size;
  }
  const textureTableEnd = cursor;
  for (const entry of meshEntries) {
    const mesh = entry.mesh;
    const start = cursor;
    view.setUint32(cursor, entry.nameBytes.length, true); cursor += 4;
    documentBytes.set(entry.nameBytes, cursor); cursor += entry.nameBytes.length;
    view.setUint32(cursor, mesh.materialKind, true); cursor += 4;
    view.setUint32(cursor, mesh.color, true); cursor += 4;
    view.setFloat32(cursor, mesh.opacity, true); cursor += 4;
    view.setUint8(cursor++, mesh.transparent ? 1 : 0);
    view.setUint8(cursor++, mesh.vertexColors ? 1 : 0);
    view.setUint8(cursor++, mesh.flatShading ? 1 : 0);
    view.setFloat32(cursor, mesh.roughness, true); cursor += 4;
    view.setFloat32(cursor, mesh.metalness, true); cursor += 4;
    view.setInt32(cursor, mesh.textureIndex, true); cursor += 4;
    view.setUint32(cursor, mesh.position.count, true); cursor += 4;
    view.setUint32(cursor, entry.fields.positionOffset, true); cursor += 4;
    view.setUint32(cursor, mesh.normal ? mesh.normal.count : 0, true); cursor += 4;
    view.setUint32(cursor, entry.fields.normalOffset, true); cursor += 4;
    view.setUint32(cursor, mesh.colorAttribute ? mesh.colorAttribute.count : 0, true); cursor += 4;
    view.setUint32(cursor, entry.fields.colorOffset, true); cursor += 4;
    view.setUint32(cursor, mesh.uv ? mesh.uv.count : 0, true); cursor += 4;
    view.setUint32(cursor, entry.fields.uvOffset, true); cursor += 4;
    view.setUint8(cursor++, mesh.index ? 1 : 0);
    view.setUint32(cursor, mesh.index ? mesh.index.count : 0, true); cursor += 4;
    view.setUint32(cursor, entry.fields.indexOffset, true); cursor += 4;
    if (cursor - start !== entry.size) throw new Error(`${assetName}: mesh entry stride drift at ${mesh.name}`);
  }
  if (cursor !== headerBytes) throw new Error(`${assetName}: header length mismatch`);
  cursor = blobStart;
  for (const item of layout) {
    if (!(item.array instanceof Float32Array) && !(item.array instanceof Uint32Array)) {
      throw new Error(`${assetName}: unexpected blob array type ${item.array?.constructor?.name}`);
    }
    documentBytes.set(new Uint8Array(item.array.buffer, item.array.byteOffset, item.array.byteLength), cursor);
    cursor += item.byteLength;
  }
  if (cursor !== totalBytes) throw new Error(`${assetName}: serialized byte count mismatch`);

  // Reader-shaped self-check: walk the document exactly the way
  // degrades/loader_3mf_prebuilt.mjs will, so any stride drift fails here
  // instead of shipping a blob whose reader decodes garbage.
  {
    const check = view;
    if (check.getUint32(0, true) !== 0x464d334a || check.getUint32(4, true) !== 1) throw new Error('self-check: header mismatch');
    if (check.getUint32(8, true) !== meshes.length || check.getUint32(12, true) !== textures.length) {
      throw new Error('self-check: table count mismatch');
    }
    let walk = 16;
    for (let index = 0; index < textures.length; index++) {
      const urlLength = check.getUint32(walk, true);
      if (urlLength === 0 || 4 + urlLength + 6 > totalBytes - walk) throw new Error('self-check: texture url length drift');
      let url = '';
      for (let i = 0; i < urlLength; i++) url += String.fromCharCode(documentBytes[walk + 4 + i]);
      if (url !== textures[index].url) throw new Error('self-check: texture url drift');
      walk += 4 + urlLength + 6;
    }
    if (walk !== textureTableEnd) throw new Error('self-check: texture table drift');
    const attributeShapes = [['position', 12], ['normal', 12], ['color', 12], ['uv', 8]];
    for (let index = 0; index < meshes.length; index++) {
      const mesh = meshes[index];
      const fields = meshEntries[index].fields;
      const nameLength = check.getUint32(walk, true);
      if (nameLength !== encoder.encode(mesh.name).length) throw new Error(`self-check: name drift at mesh ${index}`);
      walk += 4 + nameLength + 4 + 4 + 4 + 3 + 4 + 4 + 4;
      const counts = [mesh.position.count, mesh.normal ? mesh.normal.count : 0, mesh.colorAttribute ? mesh.colorAttribute.count : 0, mesh.uv ? mesh.uv.count : 0];
      const offsets = [fields.positionOffset, fields.normalOffset, fields.colorOffset, fields.uvOffset];
      for (let i = 0; i < 4; i++) {
        const count = check.getUint32(walk, true);
        const offset = check.getUint32(walk + 4, true);
        if (count !== counts[i]) throw new Error(`self-check: ${attributeShapes[i][0]} count drift at mesh ${index}`);
        if (count && (offset % 4 !== 0 || offset !== offsets[i] || offset + count * attributeShapes[i][1] > totalBytes)) {
          throw new Error(`self-check: ${attributeShapes[i][0]} offset drift at mesh ${index}`);
        }
        walk += 8;
      }
      const hasIndex = check.getUint8(walk, true);
      walk += 1;
      const indexCount = check.getUint32(walk, true);
      const indexOffset = check.getUint32(walk + 4, true);
      if ((hasIndex === 1) !== Boolean(mesh.index)) throw new Error(`self-check: index flag drift at mesh ${index}`);
      if (mesh.index && (indexCount !== mesh.index.count || indexOffset !== fields.indexOffset || indexOffset + indexCount * 4 > totalBytes)) {
        throw new Error(`self-check: index drift at mesh ${index}`);
      }
      walk += 8;
    }
    if (walk > blobStart) throw new Error('self-check: entry table overruns the blob start');
  }
  return documentBytes;
}

const summary = [];
const seenTextures = new Set();
for (const widget of WIDGETS) {
  const widgetDir = path.join(ROOT, 'example/widgets', widget.directory);
  for (const assetName of widget.assets) {
    const modelBytes = await readFile(path.join(source, 'examples/models/3mf', `${assetName}.3mf`));
    const parsed = parseAsset(assetName, modelBytes);
    const documentBytes = serializeDocument(assetName, parsed);
    const outputName = `models__3mf__${assetName.replace(/ /g, '__')}.3mf`;
    await writeFile(path.join(widgetDir, outputName), documentBytes);
    const textureFiles = [];
    for (const texture of parsed.textures) {
      const textureKey = path.join(widgetDir, texture.file);
      if (seenTextures.has(textureKey)) throw new Error(`duplicate texture file name ${texture.file} in ${widget.directory}`);
      seenTextures.add(textureKey);
      await writeFile(path.join(widgetDir, texture.file), texture.bytes);
      textureFiles.push({
        url: texture.url,
        file: texture.file,
        bytes: texture.bytes.length,
        sha256: sha(texture.bytes),
        srgb: texture.colorSpaceSrgb,
        wrapS: texture.wrapS, wrapT: texture.wrapT,
        magFilter: texture.magFilter, minFilter: texture.minFilter,
        generateMipmaps: texture.generateMipmaps
      });
    }
    const record = {
      widget: widget.directory,
      asset: assetName,
      output: outputName,
      bytes: documentBytes.length,
      sha256: sha(documentBytes),
      meshes: parsed.meshes.length,
      textures: textureFiles,
      nodeParseMs: parsed.parseMs
    };
    summary.push(record);
    console.log(`${widget.directory}/${assetName}: ${documentBytes.length}B, ${parsed.meshes.length} meshes, ${textureFiles.length} textures, node parse ${parsed.parseMs}ms`);
  }
}
console.log('\n' + JSON.stringify(summary, null, 2));
