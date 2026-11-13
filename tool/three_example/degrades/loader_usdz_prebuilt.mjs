// QuickJS grinds for minutes inside the r186 USDLoader USDA text parse
// (baked_mesh.usda is 1.88MB ASCII; the worker sits at 100% CPU and the host
// sees a permanent loading overlay). The scene is boot-invariant, so
// generate_usdz_scenes.mjs runs the pinned USDLoader offline in Node and
// serializes the parsed group into the same J3MF-style document the 3MF
// prebuilt lane uses (world transforms baked, materials + texture REFERENCES
// kept). This module consumes that document:
//
// - USDLoader.load fetches the prebuilt bytes through the runtime host asset
//   lane via FileLoader(this.manager), preserving the official LoadingManager
//   semantics (the module renders from loadAsync, textures keep their own
//   item tracking).
// - Group/Mesh/MeshStandardMaterial objects rebuild from typed-array VIEWS
//   (zero per-vertex work in QuickJS); the embedded PNG loads through the
//   runtime TextureLoader lane as a separate pinned widget asset.
import {
  BufferAttribute, BufferGeometry, ClampToEdgeWrapping, Color, FileLoader,
  Group, LinearFilter, LinearMipmapLinearFilter, LinearMipmapNearestFilter,
  Loader, Mesh, MeshPhongMaterial, MeshStandardMaterial, MirroredRepeatWrapping,
  NearestFilter, NearestMipmapLinearFilter, NearestMipmapNearestFilter,
  RepeatWrapping, SRGBColorSpace, TextureLoader
} from 'three';

const MAGIC_J3MF = 0x464d334a;
const WRAPS = [RepeatWrapping, MirroredRepeatWrapping, ClampToEdgeWrapping];
const FILTERS = [
  NearestFilter, LinearFilter, NearestMipmapNearestFilter,
  NearestMipmapLinearFilter, LinearMipmapNearestFilter, LinearMipmapLinearFilter
];

function decodeName(bytes, start, length) {
  let name = '';
  for (let index = 0; index < length; index++) name += String.fromCharCode(bytes[start + index]);
  return name;
}

function floatView(bytes, byteOffset, elementCount) {
  const start = bytes.byteOffset + byteOffset;
  if (start % 4 === 0 && start + elementCount * 4 <= bytes.buffer.byteLength) {
    return new Float32Array(bytes.buffer, start, elementCount);
  }
  // Unaligned host buffers fall back to one aligned copy.
  return new Float32Array(bytes.slice(byteOffset, byteOffset + elementCount * 4));
}

function uint32View(bytes, byteOffset, elementCount) {
  const start = bytes.byteOffset + byteOffset;
  if (start % 4 === 0 && start + elementCount * 4 <= bytes.buffer.byteLength) {
    return new Uint32Array(bytes.buffer, start, elementCount);
  }
  return new Uint32Array(bytes.slice(byteOffset, byteOffset + elementCount * 4));
}

function rebuild(buffer, url) {
  const view = new DataView(buffer);
  if (buffer.byteLength < 16 || view.getUint32(0, true) !== MAGIC_J3MF) {
    throw new Error(`three: USDZ prebuilt lane has no prebuilt scene for ${url} (expected J3MF v1; raw .3mf pins stay on the offline lane)`);
  }
  const version = view.getUint32(4, true);
  if (version !== 1) throw new Error(`three: unsupported prebuilt USDZ scene version ${version}`);
  const meshCount = view.getUint32(8, true);
  const textureCount = view.getUint32(12, true);
  const bytes = new Uint8Array(buffer);
  let offset = 16;
  const textures = [];
  for (let index = 0; index < textureCount; index++) {
    const urlLength = view.getUint32(offset, true); offset += 4;
    const textureUrl = decodeName(bytes, offset, urlLength); offset += urlLength;
    const colorSpaceSrgb = view.getUint8(offset++) === 1;
    const wrapS = WRAPS[view.getUint8(offset++)];
    const wrapT = WRAPS[view.getUint8(offset++)];
    const magFilter = FILTERS[view.getUint8(offset++)];
    const minFilter = FILTERS[view.getUint8(offset++)];
    const generateMipmaps = view.getUint8(offset++) === 1;
    if (!wrapS || !wrapT || magFilter === undefined || minFilter === undefined) {
      throw new Error(`three: prebuilt USDZ texture sampler out of range for ${textureUrl}`);
    }
    const texture = new TextureLoader(this?.manager).load(textureUrl);
    if (colorSpaceSrgb) texture.colorSpace = SRGBColorSpace;
    texture.wrapS = wrapS;
    texture.wrapT = wrapT;
    texture.magFilter = magFilter;
    texture.minFilter = minFilter;
    texture.generateMipmaps = generateMipmaps;
    textures.push(texture);
  }
  const group = new Group();
  for (let index = 0; index < meshCount; index++) {
    const nameLength = view.getUint32(offset, true); offset += 4;
    const name = decodeName(bytes, offset, nameLength); offset += nameLength;
    const materialKind = view.getUint32(offset, true); offset += 4;
    const colorHex = view.getUint32(offset, true); offset += 4;
    const opacity = view.getFloat32(offset, true); offset += 4;
    const transparent = view.getUint8(offset++) === 1;
    const vertexColors = view.getUint8(offset++) === 1;
    const flatShading = view.getUint8(offset++) === 1;
    const roughness = view.getFloat32(offset, true); offset += 4;
    const metalness = view.getFloat32(offset, true); offset += 4;
    const textureIndex = view.getInt32(offset, true); offset += 4;
    const params = {
      color: new Color(colorHex),
      opacity,
      transparent,
      vertexColors,
      flatShading
    };
    const geometry = new BufferGeometry();
    const attributes = [
      ['position', 3], ['normal', 3], ['color', 3], ['uv', 2]
    ];
    let positionCount = 0;
    for (const [attributeName, itemSize] of attributes) {
      const count = view.getUint32(offset, true); offset += 4;
      const absoluteOffset = view.getUint32(offset, true); offset += 4;
      if (!count) continue;
      geometry.setAttribute(attributeName, new BufferAttribute(floatView(bytes, absoluteOffset, count * itemSize), itemSize));
      if (attributeName === 'position') positionCount = count;
    }
    if (!positionCount) throw new Error(`three: prebuilt USDZ mesh "${name}" has no positions`);
    const hasIndex = view.getUint8(offset++) === 1;
    const indexCount = view.getUint32(offset, true); offset += 4;
    const indexOffset = view.getUint32(offset, true); offset += 4;
    if (hasIndex) geometry.setIndex(new BufferAttribute(uint32View(bytes, indexOffset, indexCount), 1));
    geometry.computeBoundingSphere();
    const material = materialKind === 1
      ? new MeshStandardMaterial({ ...params, roughness, metalness })
      : new MeshPhongMaterial(params);
    if (textureIndex >= 0) {
      const map = textures[textureIndex];
      if (!map) throw new Error(`three: prebuilt USDZ mesh "${name}" references missing texture #${textureIndex}`);
      material.map = map;
    }
    const mesh = new Mesh(geometry, material);
    mesh.name = name;
    group.add(mesh);
  }
  group.userData.jsrPrebuilt = true;
  return group;
}

export class USDLoader extends Loader {

  constructor(manager) {
    super(manager);
    this.availableExtensions = [];
  }

  setPath(path) {
    this.path = path;
    return this;
  }

  load(url, onLoad, onProgress, onError) {
    const loader = new FileLoader(this.manager);
    loader.setPath(this.path).setRequestHeader(this.requestHeader).setResponseType('arraybuffer');
    loader.load(url, buffer => {
      if (console.time) console.time('jsr.3mf.prebuilt');
      try {
        const group = rebuild.call(this, buffer, url);
        if (console.timeEnd) console.timeEnd('jsr.3mf.prebuilt');
        // Texture items issued during rebuild keep the manager busy, so this
        // matches the stock lane: onLoad(group) first, manager.onLoad when the
        // bin and every texture finished.
        onLoad(group);
      } catch (error) {
        console.error(`three: USDZ prebuilt lane failed for ${url}`, error);
        if (onError) onError(error);
        this.manager.itemError(url);
      }
    }, onProgress, error => {
      console.error(`three: USDZ prebuilt fetch failed for ${url}`, error);
      if (onError) onError(error);
    });
  }

}
