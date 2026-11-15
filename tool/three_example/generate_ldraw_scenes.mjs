// Generate the 17 official webgl_loader_ldraw models with selectable normal
// sets, shared quantized attributes, and offline parsing. Runtime rehydrates.
// Usage: node tool/three_example/generate_ldraw_scenes.mjs /tmp/jsr-three-r186
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const source = process.argv[2];
if (!source) throw new Error('usage: generate_ldraw_scenes.mjs <three-r186-source>');
const root = process.cwd();
const outputDirectory = 'example/widgets/three-loader-ldraw';
const inputDirectory = path.join(source, 'examples/models/ldraw/officialLibrary/models');
const names = [
  'car.ldr_Packed.mpd', '1621-1-LunarMPVVehicle.mpd_Packed.mpd',
  '889-1-RadarTruck.mpd_Packed.mpd', '4838-1-MiniVehicles.mpd_Packed.mpd',
  '4915-1-MiniConstruction.mpd_Packed.mpd', '4918-1-MiniFlyers.mpd_Packed.mpd',
  '5935-1-IslandHopper.mpd_Packed.mpd', '30023-1-Lighthouse.ldr_Packed.mpd',
  '30051-1-X-wingFighter-Mini.mpd_Packed.mpd', '30054-1-AT-ST-Mini.mpd_Packed.mpd',
  '4489-1-AT-AT-Mini.mpd_Packed.mpd', '4494-1-Imperial Shuttle-Mini.mpd_Packed.mpd',
  '6965-1-TIEIntercep_4h4MXk5.mpd_Packed.mpd', '6966-1-JediStarfighter-Mini.mpd_Packed.mpd',
  '7140-1-X-wingFighter.mpd_Packed.mpd', '10174-1-ImperialAT-ST-UCS.mpd_Packed.mpd',
  '6156-1-WindowBrick.mpd_Packed.mpd'
];
const { LDrawLoader } = await import(pathToFileURL(path.join(source, 'examples/jsm/loaders/LDrawLoader.js')));
const { LDrawConditionalLineMaterial } = await import(pathToFileURL(path.join(source, 'examples/jsm/materials/LDrawConditionalLineMaterial.js')));
const files = new Map();
await Promise.all(names.map(async name => files.set(`models/${name}`, await readFile(path.join(inputDirectory, name)))));
const realFetch = globalThis.fetch;
const RealRequest = globalThis.Request;
const resolve = input => {
  const url = typeof input === 'string' ? input : input?.url;
  const name = files.has(url) ? url : url && [...files.keys()].find(key => url.endsWith(`/${key}`));
  return name ? files.get(name) : null;
};
globalThis.Request = class {
  constructor(input, init) {
    if (resolve(input)) {
      this.url = typeof input === 'string' ? input : input.url;
      this.headers = new Headers(init?.headers);
      this.signal = init?.signal;
      return;
    }
    return new RealRequest(input, init);
  }
};
globalThis.fetch = (input, init) => {
  const bytes = resolve(input);
  return bytes ? Promise.resolve(new Response(bytes, { status: 200 })) : realFetch(input, init);
};
globalThis.ProgressEvent = class {
  constructor(type, init = {}) {
    this.type = type;
    this.lengthComputable = !!init.lengthComputable;
    this.loaded = init.loaded || 0;
    this.total = init.total || 0;
  }
};

function serialize(group, smoothGroup, model) {
  // LDrawLoader stores part placement in position/quaternion/scale and lets
  // the first render update object.matrix. Serializing before that update
  // collapses every part to the origin despite otherwise valid geometry.
  group.updateMatrixWorld(true);
  smoothGroup.updateMatrixWorld(true);
  const nodes = [], materials = [], geometries = [], chunks = [];
  const materialIds = new Map(), geometryIds = new Map();
  const smoothObjects = [];
  smoothGroup.traverse(object => smoothObjects.push(object));
  let blobLength = 0, objectIndex = 0;
  const material = value => {
    if (materialIds.has(value.uuid)) return materialIds.get(value.uuid);
    const id = materials.length;
    materialIds.set(value.uuid, id);
    materials.push({
      kind: value.isMeshStandardMaterial ? 'standard' : 'line',
      name: value.name || '', color: (value.color || value.uniforms?.diffuse?.value)?.getHex() ?? 0xffffff,
      roughness: value.roughness ?? 0.5, metalness: value.metalness ?? 0,
      opacity: value.opacity, transparent: value.transparent,
      depthWrite: value.depthWrite, side: value.side,
      vertexColors: value.vertexColors,
      polygonOffset: value.polygonOffset,
      polygonOffsetFactor: value.polygonOffsetFactor,
      polygonOffsetUnits: value.polygonOffsetUnits
    });
    return id;
  };
  const attribute = (name, value) => {
    if (!value) return null;
    if (value.itemSize > 4 || value.array.length % value.itemSize) throw new Error(`invalid ${name} attribute`);
    const source = value.array;
    const offset = blobLength;
    let encoded, record;
    if (name === 'position' || name === 'control0' || name === 'control1') {
      encoded = new Int16Array(source.length);
      const center = [], scale = [];
      for (let component = 0; component < value.itemSize; component++) {
        let min = Infinity, max = -Infinity;
        for (let index = component; index < source.length; index += value.itemSize) {
          min = Math.min(min, source[index]); max = Math.max(max, source[index]);
        }
        const c = (min + max) * 0.5;
        const s = max > min ? (max - min) / 65534 : 1;
        center.push(c); scale.push(s);
        for (let index = component; index < source.length; index += value.itemSize) {
          encoded[index] = Math.max(-32767, Math.min(32767, Math.round((source[index] - c) / s)));
        }
      }
      record = { encoding: 'int16', center, scale };
    } else if (name === 'normal' || name === 'smoothNormal' || name === 'direction') {
      encoded = new Int8Array(source.length);
      for (let index = 0; index < source.length; index++) encoded[index] = Math.round(Math.max(-1, Math.min(1, source[index])) * 127);
      record = { encoding: 'int8' };
    } else if (name === 'color') {
      encoded = new Uint8Array(source.length);
      for (let index = 0; index < source.length; index++) encoded[index] = Math.round(Math.max(0, Math.min(1, source[index])) * 255);
      record = { encoding: 'uint8' };
    } else {
      encoded = source instanceof Float32Array ? source : Float32Array.from(source);
      record = { encoding: 'float32' };
    }
    const bytes = new Uint8Array(encoded.buffer, encoded.byteOffset, encoded.byteLength);
    chunks.push(bytes); blobLength += bytes.byteLength;
    return { ...record, offset, count: value.count, itemSize: value.itemSize };
  };
  const geometry = (value, smoothValue) => {
    const key = `${value.uuid}|${smoothValue?.uuid || ''}`;
    if (geometryIds.has(key)) return geometryIds.get(key);
    const id = geometries.length;
    geometryIds.set(key, id);
    const attributes = {};
    for (const name of ['position', 'normal', 'color', 'uv', 'control0', 'control1', 'direction']) {
      const record = attribute(name, value.getAttribute(name));
      if (record) attributes[name] = record;
    }
    const smoothNormal = attribute('smoothNormal', smoothValue?.getAttribute('normal'));
    if (smoothNormal) attributes.smoothNormal = smoothNormal;
    let index = null;
    if (value.index) {
      const array = new Uint32Array(value.index.array);
      index = { offset: blobLength, count: array.length };
      chunks.push(new Uint8Array(array.buffer));
      blobLength += array.byteLength;
    }
    geometries.push({ attributes, index, groups: value.groups });
    return id;
  };
  group.traverse(object => {
    const smoothObject = smoothObjects[objectIndex++];
    nodes.push({
      name: object.name || '', parent: object.parent ? object.parent.userData.__ldrawId ?? -1 : -1,
      kind: object.isMesh ? 'mesh' : object.isLineSegments ? 'line' : 'group',
      conditional: !!object.isConditionalLine,
      matrix: object.matrix.elements,
      buildingStep: object.userData.buildingStep,
      geometry: object.geometry ? geometry(object.geometry, smoothObject?.geometry) : -1,
      materials: object.material ? (Array.isArray(object.material) ? object.material : [object.material]).map(material) : []
    });
    object.userData.__ldrawId = nodes.length - 1;
  });
  if (objectIndex !== smoothObjects.length) throw new Error(`${model}: flat/smooth scene graphs differ`);
  group.traverse(object => delete object.userData.__ldrawId);
  const header = {
    magic: 'JLDR', version: 2, model,
    numBuildingSteps: group.userData.numBuildingSteps || 1,
    nodes, materials, geometries
  };
  let blobStart = 0, headerBytes;
  for (let pass = 0; pass < 8; pass++) {
    headerBytes = new TextEncoder().encode(JSON.stringify(header));
    const next = 8 + headerBytes.length;
    if (next === blobStart) break;
    const delta = next - blobStart;
    for (const geometry of header.geometries) {
      for (const attribute of Object.values(geometry.attributes)) attribute.offset += delta;
      if (geometry.index) geometry.index.offset += delta;
    }
    blobStart = next;
    if (pass === 7) throw new Error('header relocation did not converge');
  }
  const output = new Uint8Array(blobStart + blobLength);
  const view = new DataView(output.buffer);
  view.setUint32(0, 0x52444c4a, true);
  view.setUint32(4, headerBytes.length, true);
  output.set(headerBytes, 8);
  let cursor = blobStart;
  for (const chunk of chunks) { output.set(chunk, cursor); cursor += chunk.length; }
  return output;
}

await mkdir(path.join(root, outputDirectory), { recursive: true });
for (const entry of await readdir(path.join(root, outputDirectory))) {
  if (/\.(?:flat|smooth)?\.?bin$/.test(entry)) await unlink(path.join(root, outputDirectory, entry));
}
const manifest = [];
for (const name of names) {
  const started = performance.now();
  const groups = [];
  for (const smoothNormals of [false, true]) {
    const loader = new LDrawLoader().setConditionalLineMaterial(LDrawConditionalLineMaterial).setPath('models/ldraw/officialLibrary/');
    loader.smoothNormals = smoothNormals;
    groups.push(await loader.loadAsync(`models/${name}`));
  }
  const bytes = serialize(groups[0], groups[1], `models/${name}`);
  const output = `${outputDirectory}/models__ldraw__officialLibrary__models__${name}.bin`;
  await writeFile(path.join(root, output), bytes);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  manifest.push({ url: `models/ldraw/officialLibrary/models/${name}`, output: output.replace('example/widgets/three-loader-ldraw/', '').replaceAll('/', '__'), generated: output, sha256 });
  console.log(JSON.stringify({ name, bytes: bytes.length, nodes: groups[0].children.length, ms: Math.round(performance.now() - started), sha256 }));
}
await writeFile('/tmp/ldraw-generated-assets.json', JSON.stringify(manifest, null, 2));
const rows = manifest.map(record => {
  const url = `${record.url}.bin`;
  const output = url.replaceAll('/', '__');
  return `  { url: '${url.replaceAll("'", "\\'")}', output: '${output.replaceAll("'", "\\'")}', mime: 'application/octet-stream', diagnostic: 'generated:ldrawScene', generated: '${record.generated}', sha256: '${record.sha256}' }`;
});
await writeFile(path.join(root, 'tool/three_example/degrades/ldraw_scene_manifest.mjs'),
  `// Generated by generate_ldraw_scenes.mjs from the pinned r186 packed MPDs.\nexport const ldrawSceneAssets = [\n${rows.join(',\n')}\n];\n`);
