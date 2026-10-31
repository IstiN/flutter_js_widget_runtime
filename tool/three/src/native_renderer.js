import {
  ACESFilmicToneMapping, AgXToneMapping, BackSide, BoxGeometry, BufferGeometry, CineonToneMapping, Color, CubeReflectionMapping, CubeRefractionMapping,
  CustomToneMapping, DataTexture, DoubleSide, DynamicDrawUsage, EquirectangularReflectionMapping, Float32BufferAttribute, FrontSide, Frustum, LinearFilter,
  LinearToneMapping, LineBasicMaterial, Matrix4, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial,
  MirroredRepeatWrapping, NeutralToneMapping, NearestFilter, NearestMipmapNearestFilter,
  NearestMipmapLinearFilter, NoToneMapping, NormalBlending, CustomBlending, PointsMaterial, HalfFloatType, RedFormat,
  ReinhardToneMapping, RGBAFormat, RepeatWrapping, SRGBColorSpace, UVMapping, UnsignedByteType,
  Vector3
} from 'three';
import { unsupported, requireFinite } from './errors.js';
import { getThreeRuntime } from './runtime.js';
import { isNativeCanvas2D } from './native_canvas2d.js';
import {
  OPCODE, NO_SHADOW, cameraCommand, clippingCommand, command, disposeResourceCommand, disposeSurfaceCommand,
  drawBatchCommand, encodeEnvelope, frameCommand, geometryCommand, lightCommand,
  materialCommand, nodeCommand, removeBatchCommand, removeNodeCommand, resourceId,
  textureCommand
} from './r1.js';

const ATTR_NAMES = ['position', 'normal', 'uv', 'color'];
// Every upstream tone mapping constant has an R1 fragment implementation
// (shaders/three_r1.frag, three.js r186 tonemapping_pars_fragment math).
const TONE_MAPPINGS = new Set([NoToneMapping, LinearToneMapping, ReinhardToneMapping,
  CineonToneMapping, ACESFilmicToneMapping, CustomToneMapping, AgXToneMapping, NeutralToneMapping]);
const MAX_INSTANCES = 1000000;
const MAX_BATCH_PARTS = 1024;
const RESOURCE_KIND = { geometry: 1, texture: 2, material: 3, node: 4, light: 5, camera: 6 };
const ZERO = new Vector3();
const UP = new Vector3(0, 1, 0);
const _position = new Vector3();
const _target = new Vector3();
const _direction = new Vector3();
const _frustum = new Frustum();
const _frustumMatrix = new Matrix4();
const objectTokens = new WeakMap();
let nextToken = 1;

function token(object) {
  if (!object || (typeof object !== 'object' && typeof object !== 'function')) return 0;
  let value = objectTokens.get(object);
  if (!value) { value = nextToken++; objectTokens.set(object, value); }
  return value;
}

function finiteArray(values, name) {
  for (let i = 0; i < values.length; i++) requireFinite(values[i], name);
}

function matrixSignature(matrix) { return matrix.elements.join(','); }

function cachedMatrixEquals(cached, matrix) {
  if (!cached) return false;
  const elements = matrix.elements;
  for (let index = 0; index < 16; index++) {
    if (cached[index] !== elements[index]) return false;
  }
  return true;
}


function attributeVersionKey(attribute) {
  if (!attribute) return -1;
  return (attribute.version || 0) + (attribute.data ? attribute.data.version * 65536 : 0);
}
function attributeSignature(attribute) {
  if (!attribute) return '-';
  return [attribute.id, attribute.version, attribute.itemSize, attribute.normalized ? 1 : 0,
    attribute.count, token(attribute.array), attribute.data ? attribute.data.version : 0,
    attribute.data ? token(attribute.data.array) : 0, attribute.offset || 0].join(':');
}

// FNV-1a over an attribute's raw element storage. Upstream helpers
// (SpotLightHelper/CameraHelper/...) rewrite their geometry EVERY update()
// and set needsUpdate even when the light did not move, so attribute.version
// bumps on frames whose byte content is IDENTICAL. The signature cache below
// hashes the storage when version changes and treats a matching hash as
// unchanged, skipping the full 200KB+ re-upload those helpers used to cause
// on every frame.
function attributeContentHash(array) {
  if (!array || !array.length) return 0;
  let hash = 0x811c9dc5;
  const n = array.length;
  for (let i = 0; i < n; i++) {
    hash ^= array[i] | 0;
    hash = (hash * 0x01000193) | 0;
  }
  return hash >>> 0;
}

// DynamicDrawUsage is an explicit upstream hint that a version bump normally
// represents new pixels/vertices, not a helper rewriting identical content.
// CPU morph/skinning sets the private flag for the same reason. Hashing those
// arrays twice per frame (once to disprove reuse, once to rebuild the cache)
// is pure QuickJS overhead and is especially costly for draw-range buffers.
function volatileAttribute(attribute) {
  return !!attribute && (attribute._r1DynamicContent === true || attribute.usage === DynamicDrawUsage);
}

function geometrySignature(geometry, primitive, mode) {
  const attributes = ATTR_NAMES.map(name => attributeSignature(geometry.attributes[name])).join('|');
  const index = geometry.index;
  const range = geometry.drawRange || { start: 0, count: Infinity };
  return [primitive, mode, attributes, index ? attributeSignature(index) : '-', range.start, range.count].join(';');
}

function sourceRange(geometry, vertexCount) {
  const range = geometry.drawRange || { start: 0, count: Infinity };
  const source = geometry.index ? geometry.index.array : null;
  const available = source ? source.length : vertexCount;
  if (!Number.isInteger(range.start) || range.start < 0 || (range.count !== Infinity && (!Number.isInteger(range.count) || range.count < 0))) throw new Error('three.invalid: geometry drawRange');
  const start = Math.max(0, Math.min(available, range.start));
  const count = Math.min(range.count === Infinity ? available - start : range.count, available - start);
  if (!Number.isInteger(count) || count < 0) throw new Error('three.invalid: geometry drawRange');
  return { start, count, available };
}

function sourceIndices(geometry, vertexCount) {
  const range = sourceRange(geometry, vertexCount);
  const source = geometry.index ? geometry.index.array : null;
  const result = new Array(range.count);
  for (let i = 0; i < range.count; i++) result[i] = source ? source[range.start + i] : range.start + i;
  return result;
}

// Matches THREE's denormalize() scaling for normalized integer attributes.
function normalizedAttributeScale(array) {
  if (array instanceof Int8Array) return 1 / 127;
  if (array instanceof Int16Array) return 1 / 32767;
  if (array instanceof Int32Array) return 1 / 2147483647;
  if (array instanceof Uint8Array || array instanceof Uint8ClampedArray) return 1 / 255;
  if (array instanceof Uint16Array) return 1 / 65535;
  if (array instanceof Uint32Array) return 1 / 4294967295;
  return 0;
}

function attributeFloats(attribute, vertexCount, components, name, vertexOffset = 0) {
  if (!attribute) return null;
  if (typeof attribute.getComponent !== 'function' || attribute.isGLBufferAttribute) unsupported('rawGLAttribute', name);
  if (attribute.itemSize !== components || attribute.count < vertexOffset + vertexCount) throw new Error(`three.invalid: ${name} attribute must have ${components} components per vertex`);
  const total = vertexCount * components;
  const values = new Float32Array(total);
  const array = attribute.array;
  const componentOffset = vertexOffset * components;
  // Fast path: a plain (non-interleaved) typed array is read by direct
  // indexing. Calling attribute.getComponent per component costs ~13.5M
  // QuickJS calls on the 500k-triangle integer-buffergeometry example and
  // dominated its load time; integer arrays are always finite, so the
  // strict finite check is only needed for float input.
  if (array && !attribute.isInterleavedBufferAttribute && array.length >= componentOffset + total) {
    if (attribute.normalized) {
      const scale = normalizedAttributeScale(array);
      if (scale) {
        const signed = array instanceof Int8Array || array instanceof Int16Array || array instanceof Int32Array;
        for (let i = 0; i < total; i++) {
          const value = array[componentOffset + i] * scale;
          values[i] = signed ? Math.max(value, -1) : value;
        }
        return values;
      }
    } else if (array instanceof Float32Array || array instanceof Float64Array) {
      for (let i = 0; i < total; i++) {
        const value = array[componentOffset + i];
        requireFinite(value, `${name} attribute`);
        values[i] = value;
      }
      return values;
    } else {
      for (let i = 0; i < total; i++) values[i] = array[componentOffset + i];
      return values;
    }
  }
  for (let i = 0; i < vertexCount; i++) {
    for (let c = 0; c < components; c++) {
      const value = attribute.getComponent(vertexOffset + i, c);
      requireFinite(value, `${name} attribute`);
      values[i * components + c] = value;
    }
  }
  return values;
}

function prepareIndices(geometry, primitive, mode, vertexCount) {
  // Skip materializing the sequential [0..vertexCount) index array for a
  // full-range non-indexed draw only to discard it again below.
  if (!geometry.index && mode !== 'line' && geometry.drawRange.start === 0 && geometry.drawRange.count === Infinity) {
    if ((primitive === 0 && vertexCount % 3 !== 0) || (primitive === 1 && vertexCount % 2 !== 0)) {
      throw new Error('three.invalid: primitive vertex count is not aligned');
    }
    return null;
  }
  let source = sourceIndices(geometry, vertexCount);
  if (mode === 'line') {
    if (source.length < 2) throw new Error('three.invalid: Line needs at least two vertices');
    const expanded = new Array((source.length - 1) * 2);
    for (let i = 0; i < source.length - 1; i++) {
      expanded[i * 2] = source[i];
      expanded[i * 2 + 1] = source[i + 1];
    }
    source = expanded;
  }
  if (!geometry.index && mode !== 'line' && geometry.drawRange.start === 0 && geometry.drawRange.count === Infinity) source = null;
  if (source) {
    for (const index of source) if (!Number.isInteger(index) || index < 0 || index >= vertexCount) throw new Error('three.invalid: geometry index is outside vertexCount');
    if ((primitive === 0 && source.length % 3 !== 0) || (primitive === 1 && source.length % 2 !== 0)) throw new Error('three.invalid: primitive index count is not aligned');
  } else if ((primitive === 0 && vertexCount % 3 !== 0) || (primitive === 1 && vertexCount % 2 !== 0)) {
    throw new Error('three.invalid: primitive vertex count is not aligned');
  }
  return source;
}

function prepareWireIndices(geometry, vertexCount) {
  const source = sourceIndices(geometry, vertexCount);
  const position = geometry.attributes.position;
  const positionKeys = new Array(vertexCount);
  const edges = new Set();
  const result = [];
  const vertexKey = index => {
    let key = positionKeys[index];
    if (key === undefined) {
      key = [position.getComponent(index, 0), position.getComponent(index, 1), position.getComponent(index, 2)].join(',');
      positionKeys[index] = key;
    }
    return key;
  };
  const addEdge = (a, b) => {
    const aKey = vertexKey(a);
    const bKey = vertexKey(b);
    const key = aKey <= bKey ? `${aKey}|${bKey}` : `${bKey}|${aKey}`;
    if (edges.has(key)) return;
    edges.add(key);
    result.push(a, b);
  };
  for (let i = 0; i < source.length; i += 3) {
    const a = source[i];
    const b = source[i + 1];
    const c = source[i + 2];
    addEdge(a, b);
    addEdge(b, c);
    addEdge(c, a);
  }
  if (result.length > 12000000) throw new Error('three.invalid: wireIndexCount exceeds 12000000');
  return result;
}

function textureFlags(texture) {
  const nearestMin = texture.minFilter === NearestFilter || texture.minFilter === NearestMipmapNearestFilter || texture.minFilter === NearestMipmapLinearFilter;
  return (texture.colorSpace === SRGBColorSpace ? 1 : 0) |
    (texture.flipY ? 2 : 0) |
    (texture.magFilter === NearestFilter ? 4 : 0) |
    (nearestMin ? 8 : 0) |
    (texture.generateMipmaps ? 16 : 0) |
    (texture.wrapS === RepeatWrapping || texture.wrapS === MirroredRepeatWrapping ? 32 : 0) |
    (texture.wrapT === RepeatWrapping || texture.wrapT === MirroredRepeatWrapping ? 64 : 0);
}

function textureSignature(texture) {
  const image = texture.image;
  return [texture.version, texture.source ? texture.source.version : 0, token(image),
    image && token(image.data), image && image.width, image && image.height,
    image && image.encoding, image && image.mime, texture.colorSpace, texture.flipY,
    texture.magFilter, texture.minFilter, texture.generateMipmaps, texture.wrapS, texture.wrapT,
    texture.format, texture.type].join('|');
}

// Composes the per-map UV transform exactly like upstream
// WebGLMaterials.refreshTransformUniform: updateMatrix() when matrixAutoUpdate,
// then the column-major Matrix3 elements feed the R1 v4 material tail.
function uvTransformElements(texture) {
  if (!texture) return null;
  if (texture.matrixAutoUpdate) texture.updateMatrix();
  const elements = texture.matrix && texture.matrix.elements;
  if (!Array.isArray(elements) || elements.length !== 9) unsupported('textureTransform', 'uv transform requires a 3x3 matrix');
  for (let i = 0; i < 9; i++) requireFinite(elements[i], 'uv transform matrix');
  return elements;
}

function materialKind(material) {
  if (material._r1Background) return 10;
  if (material.isMeshBasicMaterial) return 0;
  if (material.isMeshLambertMaterial) return 1;
  if (material.isMeshStandardMaterial) return 2;
  if (material.isLineBasicMaterial && !material.isLineDashedMaterial) return 3;
  if (material.isPointsMaterial) return 4;
  if (material.isMeshPhongMaterial) return 5;
  if (material.isMeshNormalMaterial) return 6;
  if (material.isShadowMaterial) return 7;
  // R1 v5: SpriteMaterial rides the unlit meshBasic shading path (its map,
  // color, opacity, fog and alphaTest semantics are basic's); MeshTonMaterial
  // is a gradient-ramped Lambert; MeshMatcapMaterial is an unlit matcap lookup.
  if (material.isSpriteMaterial) return 0;
  if (material.isMeshToonMaterial) return 8;
  if (material.isMeshMatcapMaterial) return 9;
  unsupported('material', material.type || 'unknown material');
}

function supportsEmissive(material) {
  return material.isMeshLambertMaterial || material.isMeshPhongMaterial ||
    (material.isMeshStandardMaterial) ||
    material.isMeshToonMaterial;
}

function validateMaterial(material) {
  if (material.isShaderMaterial || material.isRawShaderMaterial) unsupported('ShaderMaterial', 'arbitrary shaders require 1B');
  if (material.isMeshPhysicalMaterial && !material._r1PhysicalWarned) {
    // Physical is Standard plus clearcoat/transmission/sheen/iridescence:
    // R1 keeps the Standard PBR base and drops the physical-only lobes.
    material._r1PhysicalWarned = true;
    console.warn('three: R1 shades MeshPhysicalMaterial as MeshStandardMaterial (physical-only lobes dropped).');
  }
  if (material.wireframe && !(material.isMeshBasicMaterial || material.isMeshLambertMaterial || material.isMeshPhongMaterial || material.isMeshNormalMaterial || (material.isMeshStandardMaterial) || material.isMeshToonMaterial || material.isMeshMatcapMaterial)) unsupported('wireframe', 'R1 wireframe requires a mesh material');
  if (material.wireframe && (material.wireframeLinewidth !== 1 || material.wireframeLinecap !== 'round' || material.wireframeLinejoin !== 'round')) unsupported('wireframeStyle', 'R1 supports one-pixel round wireframe lines');
  if (material.blending === CustomBlending) unsupported('materialBlending');
  if (material.alphaHash || material.premultipliedAlpha || material.colorWrite === false || material.stencilWrite) unsupported('materialState', 'alphaHash/premultipliedAlpha/colorWrite/stencil');
  if (material.polygonOffset && !material._r1PolygonOffsetWarned) {
    // DecalGeometry enables polygon offset after the click. R1 has no factor/
    // units depth-state lane; keep drawing the decal with the base depth state
    // instead of rejecting every subsequent animation frame.
    material._r1PolygonOffsetWarned = true;
    console.warn('three: R1 drops material.polygonOffset (depth bias stays disabled).');
  }
  if (Object.prototype.hasOwnProperty.call(material, 'onBeforeCompile')) unsupported('onBeforeCompile', 'arbitrary shaders require 1B');
  // alphaMap, envMap (R1 v4), matcap and gradientMap (R1 v5) ride the
  // material texture slots; the rest of the upstream map family stays 1B.
  const maps = ['aoMap', 'emissiveMap', 'lightMap', 'clearcoatMap', 'transmissionMap'];
  if (!material.isMeshNormalMaterial) maps.push('displacementMap');
  for (const name of maps) if (material[name]) unsupported('materialTexture', `${material.type}.${name}`);
  // Visual-detail slots R1 can drop without changing the example's point:
  // degrade with a once-per-material warning instead of killing every frame.
  for (const name of ['specularMap']) {
    if (material[name]) {
      const key = `${material.type}.${name}`;
      material._r1DroppedMaps || (material._r1DroppedMaps = {});
      if (!material._r1DroppedMaps[key]) {
        material._r1DroppedMaps[key] = true;
        console.warn(`three: R1 drops ${key} (unsupported); base shading kept.`);
      }
      material[name] = null;
    }
  }
  if (material.envMap && !(material.isMeshBasicMaterial || material.isMeshLambertMaterial ||
      (material.isMeshStandardMaterial) || material.isMeshPhongMaterial)) {
    unsupported('materialTexture', `${material.type}.envMap`);
  }
  // R1 v6: tangentless (derivative TBN) normal mapping on the lit mesh
  // materials; explicit tangent attributes stay outside the profile.
  if (material.isMeshNormalMaterial) material.displacementMap = null;
  if (material.isMeshNormalMaterial && (material.normalMap || material.bumpMap)) {
    // NormalMaterial's whole point is the normal visualization itself;
    // dropping its rarely-used normal/bump detail map keeps the example.
    material.normalMap = null;
    material.bumpMap = null;
  }
  if ((material.normalMap || material.bumpMap) && !(material.isMeshLambertMaterial || material.isMeshPhongMaterial ||
      (material.isMeshStandardMaterial))) {
    unsupported('materialTexture', `${material.type}.normalMap/bumpMap`);
  }
  if (material.bumpMap && !Number.isFinite(material.bumpScale)) {
    throw new Error('three.invalid: material bumpScale must be finite');
  }
  if ((material.roughnessMap || material.metalnessMap) &&
      !(material.isMeshStandardMaterial)) {
    unsupported('materialTexture', `${material.type}.roughnessMap/metalnessMap`);
  }
  if (material.normalMap && material.normalScale &&
      (!Number.isFinite(material.normalScale.x) || !Number.isFinite(material.normalScale.y))) {
    throw new Error('three.invalid: material normalScale must be finite');
  }
  if (material.matcap && !material.isMeshMatcapMaterial) unsupported('materialTexture', `${material.type}.matcap`);
  if (material.gradientMap && !material.isMeshToonMaterial) unsupported('materialTexture', `${material.type}.gradientMap`);
  if (!supportsEmissive(material) && material.emissive &&
      (material.emissive.r !== 0 || material.emissive.g !== 0 || material.emissive.b !== 0)) {
    unsupported('emissiveMaterial', `${material.type} has no upstream emissive support`);
  }
}

// Bounded lowerings for the small, fixed shader/line profiles used by the
// official examples. They produce ordinary R1 geometry/materials rather than
// pretending to execute arbitrary GLSL. Unrecognised shaders still take the
// loud ShaderMaterial capability error in validateMaterial().
function adaptationWarn(material, key, message) {
  if (material[key]) return;
  material[key] = true;
  console.warn(`three: ${message}`);
}

function adaptedLineMaterial(source, vertexColors) {
  return new LineBasicMaterial({
    color: source.color || new Color(0xffffff),
    opacity: source.opacity === undefined ? 1 : source.opacity,
    transparent: !!source.transparent,
    vertexColors,
    side: source.side,
    depthTest: source.depthTest,
    depthWrite: source.depthWrite,
    blending: source.blending,
    alphaTest: source.alphaTest || 0,
    fog: source.fog
  });
}

function adaptedAttributeVersion(attribute) {
  return attribute ? `${attribute.id}:${attributeVersionKey(attribute)}:${token(attribute.array)}` : '-';
}

function proceduralVertexGeometry(source) {
  const drawRange = source.drawRange || { start: 0, count: Infinity };
  const range = { start: drawRange.start, count: drawRange.count };
  const count = range.count;
  if (count % 3 !== 0 || count > 4000000) throw new Error('three.invalid: procedural vertex count');
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const bits = new ArrayBuffer(4);
  const floats = new Float32Array(bits);
  const uints = new Uint32Array(bits);
  const floatBits = value => { floats[0] = value; return uints[0]; };
  const uintFloat = value => { uints[0] = value >>> 0; return floats[0]; };
  const hash = value => {
    let x = value >>> 0;
    x = (x + (x << 10)) >>> 0;
    x = (x ^ (x >>> 6)) >>> 0;
    x = (x + (x << 3)) >>> 0;
    x = (x ^ (x >>> 11)) >>> 0;
    x = (x + (x << 15)) >>> 0;
    return x >>> 0;
  };
  const random = (lower, delta, x, y) => {
    let m = hash((floatBits(x) ^ hash(floatBits(y))) >>> 0);
    m = ((m & 0x007fffff) | 0x3f800000) >>> 0;
    return lower + delta * (uintFloat(m) - 1);
  };
  const vector = (lower, upper, index, out, offset) => {
    const delta = upper - lower;
    out[offset] = random(lower, delta, index, 0);
    out[offset + 1] = random(lower, delta, index, 1);
    out[offset + 2] = random(lower, delta, index, 2);
  };
  const center = new Float32Array(3);
  const jitter = new Float32Array(3);
  for (let vertex = 0; vertex < count; vertex++) {
    const id = range.start + vertex;
    const triangle = Math.floor(id / 3);
    vector(-1, 1, triangle, center, 0);
    vector(-1 / 64, 1 / 64, id, jitter, 0);
    vector(0.25, 1, triangle, colors, vertex * 3);
    positions[vertex * 3] = center[0] + jitter[0];
    positions[vertex * 3 + 1] = center[1] + jitter[1];
    positions[vertex * 3 + 2] = center[2] + jitter[2];
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function dashedGeometry(source, lineSegments, material) {
  const position = source.attributes.position;
  const color = source.attributes.color;
  const distances = source.attributes.lineDistance;
  const scale = material.scale === undefined ? 1 : material.scale;
  const dash = material.dashSize === undefined ? 1 : material.dashSize;
  const gap = material.gapSize === undefined ? 1 : material.gapSize;
  if (![scale, dash, gap].every(Number.isFinite) || scale <= 0 || dash < 0 || gap < 0 || dash + gap <= 0) {
    throw new Error('three.invalid: dashed line scale/dashSize/gapSize');
  }
  const range = sourceRange(source, position.count);
  const indices = sourceIndices(source, position.count).slice(range.start, range.start + range.count);
  const segmentCount = lineSegments ? Math.floor(indices.length / 2) : indices.length - 1;
  const positions = [];
  const colors = [];
  const period = dash + gap;
  let cumulative = 0;
  const append = (a, b, ia, ib, t0, t1) => {
    for (let c = 0; c < 3; c++) {
      const av = position.getComponent(ia, c);
      const bv = position.getComponent(ib, c);
      positions.push(av + (bv - av) * t0);
    }
    for (let c = 0; c < 3; c++) {
      const av = position.getComponent(ia, c);
      const bv = position.getComponent(ib, c);
      positions.push(av + (bv - av) * t1);
    }
    if (color) {
      const components = color.itemSize;
      for (const t of [t0, t1]) {
        for (let c = 0; c < components; c++) {
          const av = color.getComponent(ia, c);
          const bv = color.getComponent(ib, c);
          colors.push(av + (bv - av) * t);
        }
      }
    }
  };
  for (let segment = 0; segment < segmentCount; segment++) {
    const ia = indices[lineSegments ? segment * 2 : segment];
    const ib = indices[lineSegments ? segment * 2 + 1 : segment + 1];
    const length = Math.hypot(
      position.getComponent(ib, 0) - position.getComponent(ia, 0),
      position.getComponent(ib, 1) - position.getComponent(ia, 1),
      position.getComponent(ib, 2) - position.getComponent(ia, 2)
    );
    if (!(length > 0)) continue;
    const start = distances ? distances.getComponent(ia, 0) * scale :
      (lineSegments ? 0 : cumulative * scale);
    const scaledLength = length * scale;
    const end = start + scaledLength;
    let cursor = start;
    let guard = 0;
    while (cursor < end - 1e-7 && guard++ < 4000000) {
      const phase = ((cursor % period) + period) % period;
      const visible = phase <= dash;
      const boundary = visible ? cursor + dash - phase : cursor + period - phase;
      const next = Math.min(end, Math.max(cursor + 1e-7, boundary));
      if (visible) append(ia, ib, ia, ib,
        (cursor - start) / scaledLength, (next - start) / scaledLength);
      cursor = next;
      if (positions.length / 3 > 4000000) throw new Error('three.invalid: dashed line vertex quota');
    }
    cumulative += length;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  if (color) geometry.setAttribute('color', new Float32BufferAttribute(colors, color.itemSize));
  geometry.computeBoundingSphere();
  return geometry;
}

function fatLineGeometry(source) {
  const start = source.attributes.instanceStart;
  const end = source.attributes.instanceEnd;
  if (!start || !end || start.itemSize !== 3 || end.itemSize !== 3) return null;
  const count = Math.min(start.count, end.count);
  if (!Number.isInteger(count) || count <= 0 || count > 2000000) throw new Error('three.invalid: fat line segment count');
  const positions = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    for (let c = 0; c < 3; c++) {
      positions[i * 6 + c] = start.getComponent(i, c);
      positions[i * 6 + 3 + c] = end.getComponent(i, c);
    }
  }
  const colorStart = source.attributes.instanceColorStart;
  const colorEnd = source.attributes.instanceColorEnd;
  let colors = null;
  if (colorStart && colorEnd && colorStart.itemSize === 3 && colorEnd.itemSize === 3) {
    colors = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      for (let c = 0; c < 3; c++) {
        colors[i * 6 + c] = colorStart.getComponent(i, c);
        colors[i * 6 + 3 + c] = colorEnd.getComponent(i, c);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  if (colors) geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function selectiveLineGeometry(source) {
  const position = source.attributes.position;
  const sourceColor = source.attributes.vertColor;
  const visible = source.attributes.visible;
  const indices = sourceIndices(source, position.count);
  const positions = [];
  const colors = [];
  for (let i = 0; i + 1 < indices.length; i += 2) {
    const a = indices[i], b = indices[i + 1];
    if (visible.getComponent(a, 0) <= 0 && visible.getComponent(b, 0) <= 0) continue;
    for (const index of [a, b]) {
      for (let c = 0; c < 3; c++) positions.push(position.getComponent(index, c));
      for (let c = 0; c < 3; c++) colors.push(sourceColor.getComponent(index, c));
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

let sharedPointDisc = null;
function pointDiscTexture() {
  if (sharedPointDisc) return sharedPointDisc;
  const size = 32;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (x + 0.5) / size - 0.5, dy = (y + 0.5) / size - 0.5;
    const offset = (y * size + x) * 4;
    data[offset] = data[offset + 1] = data[offset + 2] = 255;
    data[offset + 3] = Math.hypot(dx, dy) <= 0.475 ? 255 : 0;
  }
  sharedPointDisc = new DataTexture(data, size, size);
  sharedPointDisc.needsUpdate = true;
  return sharedPointDisc;
}

function sideValue(side) {
  if (side === FrontSide) return 0;
  if (side === BackSide) return 1;
  if (side === DoubleSide) return 2;
  throw new Error('three.invalid: material side');
}

export class JsrWebGLRenderer {
  constructor(parameters = {}) {
    this.isWebGLRenderer = true;
    this.isJsrThreeRenderer = true;
    this.runtime = parameters.runtime || getThreeRuntime(false);
    if (parameters.context != null) unsupported('rawWebGL', 'native R1 does not accept a caller-provided GL context');
    const canvas = parameters.canvas || this.runtime.createCanvas('main');
    if (!canvas.isJsrThreeCanvas) unsupported('canvas', 'native WebGLRenderer requires jsr.three.createCanvas()');
    if (canvas.renderer && canvas.renderer !== this && !canvas.renderer._disposed) throw new Error('three.surface: canvas already has an active renderer');
    this.domElement = canvas;
    canvas.renderer = this;
    this.capabilities = Object.assign({}, this.runtime.capabilities, {
      rawWebGL: false,
      isWebGL2: false,
      backend: 'flutterGpu',
      features: Object.freeze({ geometry: true, textures: true, lambert: true, standard: true, phong: true, normal: true, emissive: true, hemisphereLight: true, spotLight: true, clipping: true, wireframe: true, toneMapping: true, fogExp2: true, textureTransform: true, alphaMap: true, envMap: true, sprite: true, pointLightShadow: true, toonMaterial: true, matcapMaterial: true, cubeEnvMap: true, dataTexture: true, rawWebGL: false, shaderMaterial: false })
    });
    this.outputColorSpace = SRGBColorSpace;
    this.toneMapping = NoToneMapping;
    this.toneMappingExposure = 1;
    this.autoClear = true;
    this.autoClearColor = true;
    this.autoClearDepth = true;
    this.autoClearStencil = true;
    this.sortObjects = true;
    this.clippingPlanes = [];
    this.localClippingEnabled = false;
    this.shadowMap = { enabled: false, autoUpdate: true, needsUpdate: false };
    this._manualShadowRevision = 0;
    this._autoShadowRevision = 0;
    this._shadowCullingKey = null;
    this._cachedCulledShadowNodeIds = [];
    this.xr = { enabled: false };
    this.info = {
      autoReset: true,
      render: { frame: 0, calls: 0, triangles: 0, points: 0, lines: 0 },
      memory: { geometries: 0, textures: 0 },
      programs: [],
      reset: () => { this.info.render.calls = 0; this.info.render.triangles = 0; this.info.render.points = 0; this.info.render.lines = 0; }
    };
    this._clearColor = new Color(0x000000);
    this._clearAlpha = 1; // upstream WebGLRenderer clears opaque black by default
    this._pixelRatio = canvas.pixelRatio || 1;
    this._width = canvas.clientWidth || canvas.width;
    this._height = canvas.clientHeight || canvas.height;
    this._disposed = false;
    this._animationLoop = null;
    this._animationHandle = null;
    this._pendingDisposals = [];
    this._resources = new Map();
    this._geometryModes = new Map();
    this._geometryResourceKeys = new Map();
    this._geometryResourceOwners = new Map();
    this._nextGeometryAlias = 0x80000000;
    this._canvasTextures = new Map();
    this._canvasRefreshHandle = null;
    this._adaptedLineDraws = new WeakMap();
    this._adaptedShaderDraws = new WeakMap();
    this._lastScene = null;
    this._lastCamera = null;
    this._state = canvas._r1State || (canvas._r1State = {
      sequence: 0,
      geometries: new Map(), textures: new Map(), materials: new Map(),
      nodes: new Map(), batches: new Map(), lights: new Map(), cameras: new Map(),
      clippings: new Map()
    });
  }

  getContext() { unsupported('rawWebGL', 'WebGLRenderer.getContext() is a 1B capability'); }
  getContextAttributes() { unsupported('rawWebGL', 'WebGLRenderer.getContextAttributes() is a 1B capability'); }
  getPixelRatio() { return this._pixelRatio; }
  getSize(target) { return target && target.set ? target.set(this._width, this._height) : { width: this._width, height: this._height }; }
  getDrawingBufferSize(target) { return target && target.set ? target.set(this.domElement.width, this.domElement.height) : { width: this.domElement.width, height: this.domElement.height }; }
  getClearColor(target) { return target && target.copy ? target.copy(this._clearColor) : this._clearColor.clone(); }
  getClearAlpha() { return this._clearAlpha; }

  setPixelRatio(value) {
    if (!Number.isFinite(value) || value <= 0 || value > 16) throw new Error('three.invalid: pixel ratio must be within (0,16]');
    this._pixelRatio = value;
    this.setSize(this._width, this._height, false);
  }

  setSize(width, height, updateStyle = true) {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 0 || height < 0 || width > 16384 || height > 16384) throw new Error('three.invalid: renderer size must be within 0..16384');
    this._width = width;
    this._height = height;
    this.domElement._setSize(width, height, this._pixelRatio, updateStyle);
  }

  setClearColor(color, alpha = 1) {
    this._clearColor.set(color);
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw new Error('three.invalid: clear alpha');
    this._clearAlpha = alpha;
  }

  setClearAlpha(alpha) {
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw new Error('three.invalid: clear alpha');
    this._clearAlpha = alpha;
  }

  setViewport() { /* R1 presents the whole surface; retained as an API-compatible no-op. */ }
  setScissor() { /* R1 presents the whole surface; retained as an API-compatible no-op. */ }
  setScissorTest() { /* R1 presents the whole surface; retained as an API-compatible no-op. */ }
  setRenderTarget(target) { if (target !== null && target !== undefined) unsupported('renderTarget', 'R1 renders only the attached surface'); }
  getRenderTarget() { return null; }
  clear() { /* Resource/frame commands, rather than GL clear calls, define native presentation. */ }
  clearDepth() { /* Each R1 frame carries its own depth attachment; retained as an API-compatible no-op (webgl_sprites calls it between its two per-tick renders). */ }
  clearColor() { /* See clear(): the frame background defines presentation. */ }

  setAnimationLoop(callback) {
    if (callback !== null && typeof callback !== 'function') throw new TypeError('three.invalid: animation loop callback');
    if (this._animationHandle !== null) {
      this.runtime.cancelAnimationFrame(this._animationHandle);
      this._animationHandle = null;
    }
    this._animationLoop = callback;
    if (!callback || this._disposed) return;
    const tick = time => {
      if (this._disposed || this._animationLoop !== callback) return;
      this._animationHandle = this.runtime.requestAnimationFrame(tick);
      callback(time);
    };
    this._animationHandle = this.runtime.requestAnimationFrame(tick);
  }

  _mapSet(map, id, value) {
    const transaction = this._transaction;
    if (transaction) {
      let entries = transaction.get(map);
      if (!entries) {
        entries = new Map();
        transaction.set(map, entries);
      }
      if (!entries.has(id)) entries.set(id, [map.has(id), map.get(id)]);
    }
    map.set(id, value);
  }

  _mapDelete(map, id) {
    const transaction = this._transaction;
    if (transaction) {
      let entries = transaction.get(map);
      if (!entries) {
        entries = new Map();
        transaction.set(map, entries);
      }
      if (!entries.has(id)) entries.set(id, [map.has(id), map.get(id)]);
    }
    return map.delete(id);
  }

  _geometryResourceId(geometry, primitive, mode) {
    const baseId = resourceId(geometry);
    const key = `${baseId}:${primitive}:${mode}`;
    const cached = this._geometryResourceKeys.get(key);
    if (cached !== undefined) return cached;
    let id = baseId;
    if (this._geometryResourceOwners.has(id)) {
      const first = this._nextGeometryAlias;
      do {
        id = this._nextGeometryAlias;
        this._nextGeometryAlias = id === 0xfffffffe ? 0x80000000 : id + 1;
        if (this._nextGeometryAlias === first) throw new Error('three.invalid: geometry resource aliases exhausted');
      } while (this._geometryResourceOwners.has(id));
    }
    this._geometryResourceKeys.set(key, id);
    this._geometryResourceOwners.set(id, key);
    return id;
  }

  _releaseGeometryResource(id) {
    const key = this._geometryResourceOwners.get(id);
    if (key === undefined) return;
    this._geometryResourceOwners.delete(id);
    this._geometryResourceKeys.delete(key);
  }

  _listen(resource, type, map, id) {
    if (!resource || !resource.addEventListener) return;
    const previous = this._resources.get(resource);
    if (previous) {
      if (type === 'geometries' && !previous.ids.includes(id)) previous.ids.push(id);
      return;
    }
    const kinds = { geometries: RESOURCE_KIND.geometry, textures: RESOURCE_KIND.texture, materials: RESOURCE_KIND.material, nodes: RESOURCE_KIND.node };
    const item = { type, id, ids: [id], listener: null };
    item.listener = () => {
      this._unlisten(resource);
      if (type === 'textures') this._unwatchCanvasTexture(resource);
      for (const resourceId of item.ids) {
        if (type === 'geometries') {
          this._releaseGeometryResource(resourceId);
          this._mapDelete(this._geometryModes, resourceId);
        }
        if (!this._state[type].has(resourceId)) continue;
        this._mapDelete(this._state[type], resourceId);
        const disposal = { id: resourceId, kind: kinds[type] };
        if (type === 'nodes' && this._mapDelete(this._state.batches, resourceId)) disposal.batch = true;
        this._pendingDisposals.push(disposal);
      }
    };
    resource.addEventListener('dispose', item.listener);
    this._resources.set(resource, item);
    if (this._transactionListens) this._transactionListens.push(resource);
  }

  _unlisten(resource) {
    const item = this._resources.get(resource);
    if (!item) return;
    resource.removeEventListener('dispose', item.listener);
    this._resources.delete(resource);
  }

  _unlistenAll() {
    for (const [resource, item] of this._resources) {
      if (resource.removeEventListener) resource.removeEventListener('dispose', item.listener);
    }
    this._resources.clear();
  }

  _nextVersion(map, id, signature) {
    const old = map.get(id);
    if (old && old.signature === signature) return null;
    const version = old ? old.version + 1 : 1;
    if (version > 0xffffffff) throw new Error('three.invalid: resource version exhausted');
    return { signature, version };
  }

  _unwatchCanvasTexture(texture) {
    const entry = this._canvasTextures.get(texture);
    if (!entry) return;
    entry.unlisten();
    this._canvasTextures.delete(texture);
  }

  _watchCanvasTexture(texture, canvas) {
    const previous = this._canvasTextures.get(texture);
    if (previous && previous.canvas === canvas) return previous;
    if (previous) this._unwatchCanvasTexture(texture);
    const entry = { texture, canvas, adoptedVersion: 0, unlisten: null };
    entry.unlisten = canvas._addReadyListener(() => {
      if (this._disposed || this._canvasTextures.get(texture) !== entry) return;
      if (this._adoptCanvasTexture(entry)) this._scheduleCanvasRefresh();
    });
    this._canvasTextures.set(texture, entry);
    return entry;
  }

  _adoptCanvasTexture(entry) {
    const canvas = entry.canvas;
    if (!canvas._ready || !canvas._rgba || entry.adoptedVersion === canvas._readyVersion) return false;
    entry.adoptedVersion = canvas._readyVersion;
    entry.texture.userData.jsrCanvas2D = canvas;
    entry.texture.source.data = {
      width: canvas.width,
      height: canvas.height,
      data: new Uint8Array(canvas._rgba),
      encoding: 0,
      encoded: false
    };
    entry.texture.needsUpdate = true;
    return true;
  }

  _scheduleCanvasRefresh() {
    if (this._disposed || this._canvasRefreshHandle !== null || !this._lastScene || !this._lastCamera) return;
    this._canvasRefreshHandle = true;
    Promise.resolve().then(() => {
      if (this._disposed || !this._lastScene || !this._lastCamera) {
        this._canvasRefreshHandle = null;
        return;
      }
      try {
        this.render(this._lastScene, this._lastCamera);
      } finally {
        this._canvasRefreshHandle = null;
      }
    });
  }

  _canvasForTexture(texture) {
    // Plain THREE.Texture with a canvas image (webgl_panorama_cube slices its
    // atlas through 2D canvases) is just as canvas-backed as CanvasTexture.
    if (isNativeCanvas2D(texture.image)) return texture.image;
    if (!texture.isCanvasTexture) return null;
    const canvas = texture.userData && texture.userData.jsrCanvas2D;
    return isNativeCanvas2D(canvas) ? canvas : null;
  }

  _ensureTexture(texture, commands, role = 'map') {
    if (!texture) return 0;
    if (!texture.isTexture) unsupported('texture', 'material map is not a THREE.Texture');
    if (!texture.isCubeTexture && (texture.isDataArrayTexture || texture.isData3DTexture || texture.isCompressedTexture || texture.isVideoTexture || texture.isFramebufferTexture || texture.isDepthTexture || texture.isExternalTexture)) unsupported('textureType', texture.type);
    if (texture.isCubeTexture && role !== 'envMap') unsupported('textureMapping', `R1 ${role} requires a plain 2D texture`);
    const canvas = this._canvasForTexture(texture);
    if (texture.isCanvasTexture && !canvas) unsupported('canvas2d.source', 'native CanvasTexture requires a Flutter canvas2d image');
    if (canvas) {
      const entry = this._watchCanvasTexture(texture, canvas);
      this._adoptCanvasTexture(entry);
      if (!canvas._ready) return 0;
    }
    // The env lane samples one equirect 2D texture (R1 v4) or the six-face
    // cube atlas (R1 v5, CubeReflectionMapping only — refraction and PMREM
    // stay 1B); map/alphaMap/matcap/gradientMap stay plain UV-mapped 2D
    // textures.
    const mappingOk = role === 'envMap'
      ? texture.mapping === EquirectangularReflectionMapping || texture.mapping === UVMapping ||
        (texture.isCubeTexture && (texture.mapping === CubeReflectionMapping ||
          // Refraction degrades to the reflection sampler with a warning.
          texture.mapping === CubeRefractionMapping))
      : texture.mapping === UVMapping;
    if (!mappingOk) unsupported('textureMapping', role === 'envMap'
      ? 'R1 envMap supports EquirectangularReflectionMapping on a single 2D texture or CubeReflectionMapping faces'
      : undefined);
    if (texture.premultiplyAlpha || (texture.mipmaps && texture.mipmaps.length)) unsupported('textureState', 'premultiplyAlpha/custom mipmaps');
    // Upstream clamps anisotropy to the device maximum; the native sampler
    // maximum is 1 (flutter_gpu has no anisotropic filtering), so any value
    // degrades to exactly that clamp rather than being rejected.
    if (Number.isFinite(texture.anisotropy) === false || texture.anisotropy < 0) unsupported('textureState', 'anisotropy must be a nonnegative number');
    if (texture.channel !== 0) unsupported('textureChannel', 'R1 maps texture channel 0 only');
    if (texture.isCubeTexture && texture.mapping === CubeRefractionMapping && !texture._r1RefractionWarned) {
      texture._r1RefractionWarned = true;
      console.warn('three: R1 samples CubeRefractionMapping as reflection (refraction stays 1B).');
    }
    if (texture.isCubeTexture) return this._ensureCubeTexture(texture, commands);
    const image = texture.image;
    if (!image || !image.data) return 0;
    const id = resourceId(texture);
    const frameCached = this._frameTextures.get(id);
    if (frameCached !== undefined) return frameCached;
    this._listen(texture, 'textures', this._state.textures, id);
    const signature = textureSignature(texture);
    const changed = this._nextVersion(this._state.textures, id, signature);
    if (!changed) {
      this._frameTextures.set(id, id);
      return id;
    }
    const data = image.data;
    if (!(data instanceof Uint8Array) && !ArrayBuffer.isView(data)) throw new Error('three.invalid: texture data must be a typed array');
    let bytes = data instanceof Uint8Array ? data : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    if (bytes.length > 64 * 1024 * 1024) throw new Error('three.invalid: texture exceeds 64 MiB');
    let encoding = image.encoding;
    let width = image.width || 0;
    let height = image.height || 0;
    if (encoding === undefined) {
      const mime = String(image.mime || '').toLowerCase();
      if (texture.isDataTexture || image.encoded === false) encoding = 0;
      else if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) encoding = 1;
      else if (bytes.length >= 2 && bytes[0] === 255 && bytes[1] === 216) encoding = 2;
      else if (mime.includes('png')) encoding = 1;
      else if (mime.includes('jpeg') || mime.includes('jpg')) encoding = 2;
      else encoding = 0;
    }
    if (encoding === 0) {
      if (texture.format !== RGBAFormat && texture.format !== RedFormat) unsupported('textureFormat', 'R1 raw textures require RGBA8 or R8/UnsignedByteType');
            if (texture.type === HalfFloatType) {
        if (texture.format !== RGBAFormat || !(data instanceof Uint16Array) || width * height * 4 !== data.length) {
          throw new Error('three.invalid: half-float raw textures must be RGBA Uint16 data with matching dimensions');
        }
        const expanded = new Uint8Array(width * height * 4);
        for (let i = 0; i < data.length; i++) {
          const bits = data[i];
          const exponent = (bits >> 10) & 0x1f;
          const mantissa = bits & 0x3ff;
          let value;
          if (exponent === 0) value = mantissa / 16777216;
          else if (exponent === 31) value = mantissa || (bits & 0x8000) ? 0 : 1;
          else {
            value = (1 + mantissa / 1024) * Math.pow(2, exponent - 15);
            if (bits & 0x8000) value = -value;
          }
          const scaled = value <= 0 ? 0 : value >= 1 ? 255 : value * 255 + 0.5;
          expanded[i] = scaled;
        }
        bytes = expanded;
      } else if (texture.type !== UnsignedByteType) unsupported('textureFormat', 'R1 raw textures require RGBA8 or R8/UnsignedByteType');
      if (!width || !height) throw new Error('three.invalid: raw texture dimensions must be nonzero');
      if (texture.format === RedFormat) {
        if (width * height !== bytes.length) throw new Error('three.invalid: R8 raw texture dimensions/data length');
        // Expand one luminance byte per texel (e.g. MeshTonMaterial
        // gradientMap rows) into RGBA8; the shader reads .r.
        const expanded = new Uint8Array(width * height * 4);
        for (let i = 0; i < width * height; i++) {
          expanded[i * 4] = bytes[i];
          expanded[i * 4 + 1] = bytes[i];
          expanded[i * 4 + 2] = bytes[i];
          expanded[i * 4 + 3] = 255;
        }
        bytes = expanded;
      } else if (width * height * 4 !== bytes.byteLength) {
        throw new Error('three.invalid: raw RGBA8 texture dimensions/data length');
      }
    } else if (encoding !== 1 && encoding !== 2) unsupported('textureEncoding', encoding);
    if (encoding !== 0 && bytes.length === 0) throw new Error('three.invalid: encoded texture bytes must be nonempty');
    commands.push(textureCommand(id, changed.version, width, height, encoding, textureFlags(texture), bytes));
    this._mapSet(this._state.textures, id, { signature, version: changed.version, object: texture });
    this._frameTextures.set(id, id);
    return id;
  }

  // R1 v5 cube lane: CubeTexture.image is six +X,-X,+Y,-Y,+Z,-Z faces. Each
  // face must already carry raw RGBA8 `{ data, width, height }` (DataTexture
  // faces or loader-decoded pixels); the host re-packs them into a 3x2 atlas
  // and samples by major-axis selection on the reflect vector. Cube mipmaps
  // would blend across the atlas seams, so the mipmap bit is dropped.
  _ensureCubeTexture(texture, commands) {
    const faces = texture.image;
    if (!Array.isArray(faces) || faces.length !== 6) unsupported('textureType', 'R1 cube textures require exactly six faces');
    const id = resourceId(texture);
    const frameCached = this._frameTextures.get(id);
    if (frameCached !== undefined) return frameCached;
    this._listen(texture, 'textures', this._state.textures, id);
    const signature = textureSignature(texture);
    const changed = this._nextVersion(this._state.textures, id, signature);
    if (!changed) {
      this._frameTextures.set(id, id);
      return id;
    }
    const width = faces[0].width;
    const height = faces[0].height;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      throw new Error('three.invalid: cube face dimensions');
    }
    const expected = width * height * 4;
    const payload = new Uint8Array(expected * 6);
    for (let face = 0; face < 6; face++) {
      const image = faces[face];
      const data = image && image.data;
      if (!data || image.width !== width || image.height !== height) {
        throw new Error('three.invalid: cube faces must share raw RGBA8 dimensions');
      }
      const bytes = data instanceof Uint8Array ? data : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      if (bytes.length !== expected) throw new Error('three.invalid: cube face payload must be raw RGBA8');
      payload.set(bytes, face * expected);
    }
    const flags = textureFlags(texture) & ~0x10 | 0x80;
    commands.push(textureCommand(id, changed.version, width, height, 0, flags, payload));
    this._mapSet(this._state.textures, id, { signature, version: changed.version, object: texture });
    this._frameTextures.set(id, id);
    return id;
  }

  _ensureMaterial(material, commands) {
    if (material._r1EnvFromScene) {
      material.envMap = this._sceneEnvironment || null;
      if (!this._sceneEnvironment) material._r1EnvFromScene = false;
    } else if (this._sceneEnvironment && !material.envMap &&
        (material.isMeshBasicMaterial || material.isMeshLambertMaterial ||
         material.isMeshPhongMaterial || material.isMeshStandardMaterial)) {
      material.envMap = this._sceneEnvironment;
      material._r1EnvFromScene = true;
    }
    const kind = materialKind(material);
    validateMaterial(material);
    const id = resourceId(material);
    const frameCached = this._frameMaterials.get(id);
    if (frameCached !== undefined) return frameCached;
    this._listen(material, 'materials', this._state.materials, id);
    const mapId = this._ensureTexture(material.map || null, commands);
    const alphaMapId = this._ensureTexture(material.alphaMap || null, commands);
    const envMapId = this._ensureTexture(material.envMap || null, commands, 'envMap');
    const matcapId = material.isMeshMatcapMaterial ? this._ensureTexture(material.matcap || null, commands, 'matcap') : (material.matcap ? unsupported('materialTexture', `${material.type}.matcap`) : 0);
    const gradientMapId = material.isMeshToonMaterial ? this._ensureTexture(material.gradientMap || null, commands, 'gradientMap') : (material.gradientMap ? unsupported('materialTexture', `${material.type}.gradientMap`) : 0);
    const normalMapId = this._ensureTexture(material.normalMap || null, commands, 'map');
    const normalScaleX = material.normalMap && material.normalScale ? material.normalScale.x : 1;
    const normalScaleY = material.normalMap && material.normalScale ? material.normalScale.y : 1;
    const bumpMapId = this._ensureTexture(material.bumpMap || null, commands, 'map');
    const bumpScale = material.bumpMap && material.bumpScale !== undefined ? material.bumpScale : 1;
    const roughnessMapId = this._ensureTexture(material.roughnessMap || null, commands, 'map');
    const metalnessMapId = this._ensureTexture(material.metalnessMap || null, commands, 'map');
    const spriteRotation = material.isSpriteMaterial ? material.rotation : 0;
    if (spriteRotation && !Number.isFinite(spriteRotation)) throw new Error('three.invalid: material sprite rotation must be finite');
    const mapUvMatrix = uvTransformElements(material.map || null);
    const alphaMapUvMatrix = uvTransformElements(material.alphaMap || null);
    // Lambert/Phong have no envMapIntensity (they use reflectivity): default 1.
    const envMapIntensity = material.envMap && material.envMapIntensity !== undefined ? material.envMapIntensity : 1;
    if (!Number.isFinite(envMapIntensity) || envMapIntensity < 0) throw new Error('three.invalid: material envMapIntensity must be finite and nonnegative');
    const color = material.color || new Color(0xffffff);
    const opacity = material.opacity === undefined ? 1 : material.opacity;
    const roughness = material.roughness === undefined ? 0 : material.roughness;
    const metalness = material.metalness === undefined ? 0 : material.metalness;
    const alphaTest = material.alphaTest || 0;
    const pointSize = material.size === undefined ? 1 : material.size;
    const specular = kind === 5 ? material.specular : null;
    const shininess = kind === 5 ? material.shininess : 0;
    const emissive = supportsEmissive(material) ? material.emissive : null;
    const emissiveIntensity = emissive ? material.emissiveIntensity : 1;
    requireFinite(color.r, 'material color'); requireFinite(color.g, 'material color'); requireFinite(color.b, 'material color');
    if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1 || !Number.isFinite(roughness) || roughness < 0 || roughness > 1 || !Number.isFinite(metalness) || metalness < 0 || metalness > 1 || !Number.isFinite(alphaTest) || alphaTest < 0 || alphaTest > 1 || !Number.isFinite(pointSize) || pointSize <= 0) throw new Error('three.invalid: material scalar range');
    if (specular) {
      requireFinite(specular.r, 'material specular'); requireFinite(specular.g, 'material specular'); requireFinite(specular.b, 'material specular');
      if (!Number.isFinite(shininess) || shininess < 0) throw new Error('three.invalid: material shininess must be finite and nonnegative');
    }
    if (emissive) {
      requireFinite(emissive.r, 'material emissive'); requireFinite(emissive.g, 'material emissive'); requireFinite(emissive.b, 'material emissive');
      if (!Number.isFinite(emissiveIntensity) || emissiveIntensity < 0) throw new Error('three.invalid: material emissiveIntensity must be finite and nonnegative');
    }
    const side = sideValue(material.side);
    const flags = (material.vertexColors ? 1 : 0) | (material.flatShading ? 2 : 0) | (material.transparent ? 4 : 0) | (material.depthTest ? 8 : 0) | (material.depthWrite ? 16 : 0) | (material.wireframe ? 32 : 0) | (material.sizeAttenuation === false ? 64 : 0) | ((material.blending || 0) << 7);
    const clip = this._resolveClipping(material, commands);
    const signature = [kind, mapId, material.map ? this._state.textures.get(resourceId(material.map))?.version || 0 : 0,
      flags, side, color.r, color.g, color.b, opacity, roughness, metalness, alphaTest, pointSize,
      specular ? specular.r : 0, specular ? specular.g : 0, specular ? specular.b : 0, shininess,
      emissive ? emissive.r : 0, emissive ? emissive.g : 0, emissive ? emissive.b : 0, emissiveIntensity, material.version,
      clip.signature, clip.flags, alphaMapId, envMapId, envMapIntensity,
      mapUvMatrix ? mapUvMatrix.join(',') : 'I', alphaMapUvMatrix ? alphaMapUvMatrix.join(',') : 'I',
      matcapId, gradientMapId, spriteRotation, normalMapId, normalScaleX, normalScaleY, bumpMapId, bumpScale, roughnessMapId, metalnessMapId].join('|');
    const changed = this._nextVersion(this._state.materials, id, signature);
    if (changed) {
      commands.push(materialCommand(id, changed.version, kind, mapId, flags, side, color, opacity, roughness, metalness, alphaTest, pointSize, specular, shininess, emissive, emissiveIntensity, clip.id, clip.flags,
        { alphaMapId, envMapId, envMapIntensity, mapUvMatrix, alphaMapUvMatrix },
        { matcapId, gradientMapId, rotation: spriteRotation },
        { normalMapId, normalScaleX, normalScaleY, bumpMapId, bumpScale, roughnessMapId, metalnessMapId }));
      this._mapSet(this._state.materials, id, { signature, version: changed.version, object: material });
    }
    this._frameMaterials.set(id, id);
    return id;
  }

  _resolveClipping(material, commands) {
    const localPlanes = this.localClippingEnabled && Array.isArray(material.clippingPlanes)
      ? material.clippingPlanes
      : null;
    const planes = [];
    if (this.clippingPlanes.length) planes.push(...this.clippingPlanes);
    if (localPlanes) planes.push(...localPlanes);
    if (!planes.length) return { id: 0, flags: 0, signature: 'none' };
    if (planes.length > 16) unsupported('clippingPlanes', 'R1 supports at most 16 clipping planes');
    const normalized = planes.map(plane => {
      if (!plane || plane.isPlane !== true) {
        throw new Error('three.invalid: clipping planes must be THREE.Plane instances');
      }
      const length = Math.hypot(plane.normal.x, plane.normal.y, plane.normal.z);
      if (!Number.isFinite(length) || length <= 0) {
        throw new Error('three.invalid: clipping plane normal must be finite and nonzero');
      }
      if (!Number.isFinite(plane.constant)) {
        throw new Error('three.invalid: clipping plane constant must be finite');
      }
      return {
        normalX: plane.normal.x / length,
        normalY: plane.normal.y / length,
        normalZ: plane.normal.z / length,
        constant: plane.constant / length
      };
    });
    const signature = normalized.map(plane =>
      `${plane.normalX}:${plane.normalY}:${plane.normalZ}:${plane.constant}`).join('|');
    // One in-place set per material (clipping ids share the material's id but
    // live in the CLIPPING command namespace): GUI plane drags bump the
    // version instead of accumulating content-keyed sets forever.
    const id = resourceId(material);
    const changed = this._nextVersion(this._state.clippings, id, signature);
    if (changed) {
      commands.push(clippingCommand(id, changed.version, normalized));
      this._mapSet(this._state.clippings, id, { signature, version: changed.version });
    }
    const flags = (material.clipIntersection ? 1 : 0) | (material.clipShadows ? 2 : 0);
    return { id, flags, signature };
  }

  // Per-geometry signature cache. Rebuilding the signature string for every
  // drawable on every frame is pure QuickJS string churn (~tens of KB of
  // garbage per frame — the dominant cost of a static scene's traverse).
  // Fast path: no attribute/index version moved since last frame -> reuse
  // the string. Slow path: a version moved -> hash that attribute's storage;
  // an identical hash means a helper set needsUpdate with the same content
  // (see attributeContentHash) -> still reuse the string, just refresh the
  // cached versions. Only genuinely different content rebuilds the string.
  _geometrySignatureCached(geometry, primitive, mode, includeWire) {
    let cache = this._geometrySignatureCache ? null : null;
    const store = this._geometrySignatureCache || (this._geometrySignatureCache = new Map());
    cache = store.get(geometry);
    const range = geometry.drawRange || { start: 0, count: Infinity };
    if (cache && cache.primitive === primitive && cache.mode === mode &&
        cache.wire === (includeWire ? 1 : 0) && cache.rangeStart === range.start &&
        cache.rangeCount === range.count) {
      let reuse = true;
      let refreshed = false;
      const names = ATTR_NAMES;
      for (let i = 0; i < names.length; i++) {
        const attribute = geometry.attributes[names[i]];
        const version = attributeVersionKey(attribute);
        if (version !== cache.versions[i]) {
          if (attribute && !volatileAttribute(attribute) && attributeContentHash(attribute.array) === cache.hashes[i]) {
            cache.versions[i] = version;
            refreshed = true;
          } else {
            reuse = false;
            break;
          }
        }
      }
      if (reuse) {
        const index = geometry.index;
        const indexVersion = index ? index.version : -1;
        if (indexVersion !== cache.versions[4]) {
          if (index && !volatileAttribute(index) && attributeContentHash(index.array) === cache.hashes[4]) {
            cache.versions[4] = indexVersion;
            refreshed = true;
          } else {
            reuse = false;
          }
        }
      }
      if (reuse) return cache.sig;
    }
    const versions = [-1, -1, -1, -1, -1];
    const hashes = [0, 0, 0, 0, 0];
    for (let i = 0; i < ATTR_NAMES.length; i++) {
      const attribute = geometry.attributes[ATTR_NAMES[i]];
      if (attribute) {
        versions[i] = attributeVersionKey(attribute);
        hashes[i] = volatileAttribute(attribute) ? 0 : attributeContentHash(attribute.array);
      }
    }
    if (geometry.index) {
      versions[4] = geometry.index.version;
      hashes[4] = volatileAttribute(geometry.index) ? 0 : attributeContentHash(geometry.index.array);
    }
    const sig = `${geometrySignature(geometry, primitive, mode)};wire:${includeWire ? 1 : 0}`;
    store.set(geometry, { primitive, mode, wire: includeWire ? 1 : 0, rangeStart: range.start, rangeCount: range.count, versions, hashes, sig });
    return sig;
  }

  _uploadAttribute(upload, slot, attribute, vertexCount, components, name, vertexOffset) {
    const entries = upload.attributes || (upload.attributes = []);
    const old = entries[slot];
    if (old && old.attribute === attribute && old.array === (attribute ? attribute.array : null) &&
        old.version === attributeVersionKey(attribute) && old.vertexCount === vertexCount &&
        old.components === components && old.vertexOffset === vertexOffset) return old.values;
    const values = attributeFloats(attribute, vertexCount, components, name, vertexOffset);
    entries[slot] = { attribute, array: attribute ? attribute.array : null,
      version: attributeVersionKey(attribute), vertexCount, components, vertexOffset, values };
    return values;
  }

  _ensureGeometry(geometry, primitive, mode, commands, wireframe = false) {    if (!geometry || !geometry.isBufferGeometry) unsupported('geometry', 'only BufferGeometry is supported');
    if (geometry.isInstancedBufferGeometry) unsupported('instancedGeometry');
    if (geometry.index && (!geometry.index.array || geometry.index.isGLBufferAttribute)) unsupported('rawGLAttribute', 'index');

    const position = geometry.attributes.position;
    if (!position) throw new Error('three.invalid: position attribute is required');
    const sourceVertexCount = position.count;
    if (!Number.isInteger(sourceVertexCount) || sourceVertexCount <= 0 || sourceVertexCount > 4000000) throw new Error('three.invalid: vertexCount');
    const id = this._geometryResourceId(geometry, primitive, mode);
    const old = this._state.geometries.get(id);
    const includeWire = primitive === 0 && (wireframe || (old && old.hasWireIndices));
    const range = sourceRange(geometry, sourceVertexCount);
    // A non-indexed draw range is a contiguous vertex window. Upload only
    // that window instead of the full capacity backing store (the official
    // draw-range example allocates 250k line vertices but uses only a few
    // hundred). Group offsets remain relative to the original range below.
    const sliceRange = !geometry.index && !includeWire && mode !== 'line' && range.count > 0 &&
      (range.start !== 0 || range.count !== sourceVertexCount);
    const vertexOffset = sliceRange ? range.start : 0;
    const vertexCount = sliceRange ? range.count : sourceVertexCount;
    if (sliceRange && ((primitive === 0 && vertexCount % 3 !== 0) || (primitive === 1 && vertexCount % 2 !== 0))) {
      throw new Error('three.invalid: primitive draw-range vertex count is not aligned');
    }
    const frameCached = this._frameGeometries.get(id);
    if (frameCached && (!wireframe || frameCached.hasWireIndices)) return frameCached;
    this._listen(geometry, 'geometries', this._state.geometries, id);
    this._mapSet(this._geometryModes, id, { primitive, mode });
    const signature = this._geometrySignatureCached(geometry, primitive, mode, includeWire);
    const changed = this._nextVersion(this._state.geometries, id, signature);
    if (!changed) {
      const cached = this._state.geometries.get(id);
      const result = {
        id, vertexCount, drawCount: cached.drawCount, indexed: cached.indexed,
        rangeStart: cached.rangeStart, rangeCount: cached.rangeCount, sourceCount: cached.sourceCount,
        hasWireIndices: cached.hasWireIndices, wireDrawCount: cached.wireDrawCount
      };
      this._frameGeometries.set(id, result);
      return result;
    }
    const uploadStore = this._geometryUploadCache || (this._geometryUploadCache = new Map());
    let upload = uploadStore.get(geometry);
    if (!upload || upload.primitive !== primitive || upload.mode !== mode ||
        upload.rangeStart !== range.start || upload.rangeCount !== range.count) {
      upload = { primitive, mode, rangeStart: range.start, rangeCount: range.count };
      uploadStore.set(geometry, upload);
    }
    const color = geometry.attributes.color;
    const attributes = {
      position: this._uploadAttribute(upload, 0, position, vertexCount, 3, 'position', vertexOffset),
      normal: this._uploadAttribute(upload, 1, geometry.attributes.normal, vertexCount, 3, 'normal', vertexOffset),
      uv: this._uploadAttribute(upload, 2, geometry.attributes.uv, vertexCount, 2, 'uv', vertexOffset),
      color: color ? this._uploadAttribute(upload, 3, color, vertexCount, color.itemSize, 'color', vertexOffset) : null
    };
    if (color && color.itemSize !== 3 && color.itemSize !== 4) throw new Error('three.invalid: color attribute must have 3 or 4 components');
    const index = geometry.index;
    let indices = null;
    if (!sliceRange) {
      const reusable = upload.indices && upload.index === index &&
        upload.indexArray === (index ? index.array : null) &&
        upload.indexVersion === attributeVersionKey(index);
      if (reusable) indices = upload.indices;
      else {
        indices = prepareIndices(geometry, primitive, mode, sourceVertexCount);
        upload.index = index; upload.indexArray = index ? index.array : null;
        upload.indexVersion = attributeVersionKey(index); upload.indices = indices;
      }
    }
    const wireIndices = includeWire ? prepareWireIndices(geometry, sourceVertexCount) : null;
    const indexCount = indices ? indices.length : 0;
    if (indexCount > 12000000) throw new Error('three.invalid: indexCount');
    commands.push(geometryCommand(id, changed.version, primitive, vertexCount, attributes, indices, wireIndices));
    const drawCount = indices ? indexCount : vertexCount;
    const cached = {
      signature, version: changed.version, object: geometry, drawCount,
      indexed: !!indices, rangeStart: range.start, rangeCount: range.count, sourceCount: range.available,
      hasWireIndices: !!wireIndices, wireDrawCount: wireIndices ? wireIndices.length : 0
    };
    this._mapSet(this._state.geometries, id, cached);
    const result = {
      id, vertexCount, drawCount, indexed: cached.indexed,
      rangeStart: range.start, rangeCount: range.count, sourceCount: range.available,
      hasWireIndices: cached.hasWireIndices, wireDrawCount: cached.wireDrawCount
    };
    this._frameGeometries.set(id, result);
    return result;
  }

  _updateNode(object, id, parentId, geometryId, materialId, visible, objectKind, commands, spriteCenter) {
    const matrix = object.matrixWorld;
    const castShadow = object.castShadow === true && !object.isSprite;
    const receiveShadow = object.receiveShadow === true && !object.isSprite;
    const old = this._state.nodes.get(id);
    const unchanged = old && old.parentId === parentId &&
      old.geometryId === geometryId && old.materialId === materialId &&
      old.visible === visible && old.objectKind === objectKind &&
      old.castShadow === castShadow && old.receiveShadow === receiveShadow &&
      old.spriteCenterX === spriteCenter.x && old.spriteCenterY === spriteCenter.y &&
      cachedMatrixEquals(old.matrix, matrix);
    if (!unchanged) {
      finiteArray(matrix.elements, 'matrixWorld');
      requireFinite(spriteCenter.x, 'sprite center');
      requireFinite(spriteCenter.y, 'sprite center');
      commands.push(nodeCommand(id, parentId, geometryId, materialId, visible, objectKind, matrix,
        { cast: castShadow, receive: receiveShadow }, spriteCenter));
      this._mapSet(this._state.nodes, id, {
        parentId, geometryId, materialId, visible, objectKind,
        castShadow, receiveShadow, matrix: matrix.elements.slice(), object,
        spriteCenterX: spriteCenter.x, spriteCenterY: spriteCenter.y
      });
    }
  }

  _removeBatch(id, commands) {
    if (!this._mapDelete(this._state.batches, id)) return;
    commands.push(removeBatchCommand(id));
  }

  _instanceData(object, materials) {
    // Transparent instanced meshes are accepted since the wave-3 instancing
    // batch: one blended draw per material part, ordered inside the
    // transparent bucket at the node/material level by the draw planner.
    // Exact per-instance back-to-front sorting inside one draw is NOT
    // implemented (the GPU rasterizes all instances of a part in one
    // call); scenes that need it must split instances across meshes, like
    // the dual-paraboloid point-shadow approximation is documented as
    // bounded rather than exact.
    if (object.morphTexture) unsupported('morphTargets', 'instanced morph textures');
    const count = object.count;
    if (!Number.isInteger(count) || count < 0 || count > MAX_INSTANCES) throw new Error(`three.invalid: InstancedMesh.count must be within 0..${MAX_INSTANCES}`);
    const attribute = object.instanceMatrix;
    if (!attribute || !attribute.isInstancedBufferAttribute || attribute.isGLBufferAttribute || attribute.itemSize !== 16) throw new Error('three.invalid: instanceMatrix must be a 16-component InstancedBufferAttribute');
    const array = attribute.array;
    if (!array || !ArrayBuffer.isView(array) || typeof array.length !== 'number') throw new Error('three.invalid: instanceMatrix array');
    if (!Number.isInteger(attribute.count) || attribute.count < 0 || count > attribute.count) throw new Error('three.invalid: InstancedMesh.count exceeds instanceMatrix capacity');
    const valueCount = count * 16;
    if (valueCount > array.length) throw new Error('three.invalid: instanceMatrix payload is outside its array bounds');
    let colors = null;
    let colorCount = 0;
    let colorAttribute = null;
    if (object.instanceColor) {
      colorAttribute = object.instanceColor;
      if (!colorAttribute || !colorAttribute.isInstancedBufferAttribute || colorAttribute.isGLBufferAttribute || colorAttribute.itemSize !== 3) {
        throw new Error('three.invalid: instanceColor must be a 3-component InstancedBufferAttribute');
      }
      if (!colorAttribute.array || !ArrayBuffer.isView(colorAttribute.array)) throw new Error('three.invalid: instanceColor array');
      if (!Number.isInteger(colorAttribute.count) || count > colorAttribute.count) {
        throw new Error('three.invalid: InstancedMesh.count exceeds instanceColor capacity');
      }
      colorCount = count * 3;
      if (colorCount > colorAttribute.array.length) {
        throw new Error('three.invalid: instanceColor payload is outside its array bounds');
      }
      colors = colorAttribute.array;
    }
    return {
      count, array, valueCount, colors, colorCount,
      signature: [
        attribute.version, token(attribute), token(array), attribute.count,
        colors ? `${colorAttribute.version}:${token(colors)}:${colorAttribute.count}` : 'nocolor'
      ].join(':')
    };
  }

  _ensureBatchParts(object, geometry, materials, commands) {
    if (object.isInstancedMesh && !Array.isArray(object.material)) {
      return [{ geometryId: geometry.id, materialId: this._ensureMaterial(materials[0], commands), offset: 0, count: geometry.drawCount }];
    }
    const groups = object.geometry.groups;
    if (!groups || groups.length === 0) unsupported('multiMaterialGroups', 'material arrays require BufferGeometry.groups');
    if (groups.length > MAX_BATCH_PARTS) throw new Error(`three.invalid: batch partCount exceeds ${MAX_BATCH_PARTS}`);
    const rangeEnd = geometry.rangeStart + geometry.rangeCount;
    const parts = [];
    for (const group of groups) {
      if (!group || !Number.isInteger(group.start) || group.start < 0 || !Number.isInteger(group.count) || group.count < 0) throw new Error('three.invalid: geometry group start/count');
      if (!Number.isInteger(group.materialIndex) || group.materialIndex < 0 || group.materialIndex >= materials.length) throw new Error('three.invalid: geometry group materialIndex');
      if (group.start > geometry.sourceCount || group.count > geometry.sourceCount - group.start) throw new Error('three.invalid: geometry group is outside geometry bounds');
      if (group.start % 3 !== 0) throw new Error('three.invalid: triangle group start is not aligned');
      if (group.count % 3 !== 0) throw new Error('three.invalid: triangle group count is not aligned');
      const groupEnd = group.start + group.count;
      const start = Math.min(rangeEnd, Math.max(geometry.rangeStart, group.start));
      const end = Math.min(rangeEnd, Math.max(geometry.rangeStart, groupEnd));
      const count = Math.max(0, end - start);
      if (count % 3 !== 0) throw new Error('three.invalid: clipped triangle group count is not aligned');
      const offset = start - geometry.rangeStart;
      if (offset > geometry.drawCount || count > geometry.drawCount - offset) throw new Error('three.invalid: batch part is outside the uploaded geometry');
      parts.push({
        geometryId: geometry.id,
        materialId: this._ensureMaterial(materials[group.materialIndex], commands),
        offset, count
      });
    }
    return parts;
  }

  _ensureBatch(object, id, geometry, materials, commands) {
    const simpleInstanced = object.isInstancedMesh && !Array.isArray(object.material);
    const instance = object.isInstancedMesh ? this._instanceData(object, materials) : null;
    let simpleMaterialId = 0;
    const previous = this._state.batches.get(id);
    if (simpleInstanced) {
      simpleMaterialId = this._ensureMaterial(materials[0], commands);
      const attribute = object.instanceMatrix;
      const colorAttribute = object.instanceColor || null;
      const geometryState = this._state.geometries.get(geometry.id);
      const materialState = this._state.materials.get(simpleMaterialId);
      if (previous && previous.simpleInstanced && previous.object === object &&
          previous.geometry === object.geometry && previous.geometryVersion === geometryState.version &&
          previous.material === materials[0] && previous.materialVersion === materialState.version &&
          previous.instanceMatrix === attribute && previous.instanceVersion === attribute.version &&
          previous.instanceAttributeCount === attribute.count && previous.instanceArray === attribute.array &&
          previous.instanceColor === colorAttribute &&
          previous.instanceColorVersion === (colorAttribute ? colorAttribute.version : 0) &&
          previous.instanceColorArray === (colorAttribute ? colorAttribute.array : null) &&
          previous.instanceColorCapacity === (colorAttribute ? colorAttribute.count : 0) &&
          previous.instanceCount === object.count && previous.parts.length === 1 &&
          previous.parts[0].geometryId === geometry.id && previous.parts[0].materialId === simpleMaterialId &&
          previous.parts[0].offset === 0 && previous.parts[0].count === geometry.drawCount) {
        this._listen(object, 'nodes', this._state.nodes, id);
        return { primitive: 0, parts: previous.parts, instanceCount: object.count };
      }
    }
    const parts = simpleInstanced ? [{
      geometryId: geometry.id, materialId: simpleMaterialId, offset: 0, count: geometry.drawCount
    }] : this._ensureBatchParts(object, geometry, materials, commands);
    const partSignature = parts.map(part => [part.geometryId, part.materialId, part.offset, part.count].join(':')).join('|');
    const signature = `${instance ? `1:${instance.count}:${instance.signature}` : '0:1:-'};${partSignature}`;
    const changed = this._nextVersion(this._state.batches, id, signature);
    if (changed) {
      if (instance) {
        for (let i = 0; i < instance.valueCount; i++) requireFinite(instance.array[i], 'instanceMatrix');
        if (instance.colors) {
          for (let i = 0; i < instance.colorCount; i++) requireFinite(instance.colors[i], 'instanceColor');
        }
      }
      const count = instance ? instance.count : 1;
      commands.push(drawBatchCommand(
        id, changed.version, count,
        instance ? (instance.colors ? 3 : 1) : 0,
        parts, instance ? instance.array : null, instance ? instance.colors : null
      ));
      this._mapSet(this._state.batches, id, {
        signature, version: changed.version, object, parts, simpleInstanced,
        geometry: object.geometry, geometryVersion: this._state.geometries.get(geometry.id).version,
        material: simpleInstanced ? materials[0] : null,
        materialVersion: simpleInstanced ? this._state.materials.get(simpleMaterialId).version : 0,
        instanceMatrix: instance ? object.instanceMatrix : null,
        instanceVersion: instance ? object.instanceMatrix.version : 0,
        instanceAttributeCount: instance ? object.instanceMatrix.count : 0,
        instanceArray: instance ? instance.array : null,
        instanceColor: instance ? (object.instanceColor || null) : null,
        instanceColorVersion: instance && object.instanceColor ? object.instanceColor.version : 0,
        instanceColorArray: instance && object.instanceColor ? object.instanceColor.array : null,
        instanceColorCapacity: instance && object.instanceColor ? object.instanceColor.count : 0,
        instanceCount: instance ? instance.count : 0
      });
    }
    this._listen(object, 'nodes', this._state.nodes, id);
    return { primitive: 0, parts, instanceCount: instance ? instance.count : 1 };
  }

  /// CPU morph targets: blend the base position/normal attributes with the
  /// mesh's morphTargetInfluences in place. The ordinary attribute
  /// version/hash lane then uploads the result, so morphing needs no
  /// protocol or shader changes. Shared geometry with per-mesh influences
  /// is unsupported upstream-style (last writer wins), matching the
  /// examples' single-mesh usage.
  _applyMorphTargets(object) {
    const geometry = object.geometry;
    const influences = object.morphTargetInfluences;
    if (!geometry || !geometry.morphAttributes || !influences || !influences.length) return;
    const morphPositions = geometry.morphAttributes.position;
    const morphNormals = geometry.morphAttributes.normal;
    if ((!morphPositions || !morphPositions.length) && (!morphNormals || !morphNormals.length)) return;
    if (!geometry._r1MorphBase) {
      geometry._r1MorphBase = {
        position: geometry.attributes.position.array.slice(),
        normal: geometry.attributes.normal ? geometry.attributes.normal.array.slice() : null,
        key: ''
      };
    }
    const base = geometry._r1MorphBase;
    const key = influences.join(',');
    // Cloned meshes commonly share both geometry and an AnimationObjectGroup
    // (601 horses / 25 distinct influence sets in shadowmap_performance).
    // Only the first shared-geometry submission is uploaded per frame, so
    // recomputing a previously seen influence set cannot affect the frame.
    // Dedup those CPU blends while retaining the existing first-mesh R1
    // shared-geometry semantics.
    const frameMorphs = this._frameMorphKeys;
    if (frameMorphs) {
      let keys = frameMorphs.get(geometry);
      if (!keys) { keys = new Set(); frameMorphs.set(geometry, keys); }
      if (keys.has(key)) return;
      keys.add(key);
    }

    if (base.key === key) return;
    base.key = key;
    const relative = !!geometry.morphTargetsRelative;
    let baseInfluence = 1;
    if (!relative) for (let i = 0; i < influences.length; i++) baseInfluence -= influences[i];
    const blend = (attributeName, targets, baseArray) => {
      const attribute = geometry.attributes[attributeName];
      if (!attribute || !targets || !targets.length || !baseArray) return;
      const out = attribute.array;
      const count = out.length;
      for (let i = 0; i < count; i++) {
        let value = relative ? baseArray[i] : baseArray[i] * baseInfluence;
        for (let t = 0; t < targets.length && t < influences.length; t++) {
          const weight = influences[t];
          if (weight === 0) continue;
          const source = targets[t].array;
          value += weight * (relative ? source[i] : source[i]);
        }
        out[i] = value;
      }
      attribute._r1DynamicContent = true;
      attribute.version++;
    };
    if (morphPositions && morphPositions.length) blend('position', morphPositions, base.position);
    if (morphNormals && morphNormals.length && base.normal) blend('normal', morphNormals, base.normal);
  }

  /// CPU skeletal animation: B_i = bindMatrixInverse * boneMatrix_i *
  /// bindMatrix composed once per frame, then a typed-array weighted blend
  /// per vertex. Same upload lane as CPU morphing; GPU skinning remains a
  /// possible later optimization for very large meshes.
  _applySkining(object) {
    const geometry = object.geometry;
    const skeleton = object.skeleton;
    if (!geometry || !skeleton) return;
    skeleton.update();
    const position = geometry.attributes.position;
    if (!position) return;
    if (!geometry._r1SkinBase) {
      geometry._r1SkinBase = {
        position: position.array.slice(),
        normal: geometry.attributes.normal ? geometry.attributes.normal.array.slice() : null
      };
    }
    const base = geometry._r1SkinBase;
    const boneCount = skeleton.bones.length;
    const boneMatrices = skeleton.boneMatrices;
    const skinIndex = geometry.attributes.skinIndex;
    const skinWeight = geometry.attributes.skinWeight;
    const morphKey = geometry._r1MorphBase ? geometry._r1MorphBase.key : '';
    let cache = object._r1SkinCache;
    if (!cache || cache.boneMatrices.length !== boneCount * 16) {
      cache = { boneMatrices: new Float32Array(boneCount * 16), valid: false };
      object._r1SkinCache = cache;
    }
    let unchanged = cache.valid && cache.geometry === geometry &&
      cache.skinIndex === skinIndex && cache.skinIndexArray === skinIndex.array &&
      cache.skinWeight === skinWeight && cache.skinWeightArray === skinWeight.array &&
      cache.skinIndexVersion === skinIndex.version && cache.skinWeightVersion === skinWeight.version &&
      cache.morphKey === morphKey && cachedMatrixEquals(cache.bindMatrix, object.bindMatrix) &&
      cachedMatrixEquals(cache.bindMatrixInverse, object.bindMatrixInverse);
    if (unchanged) {
      for (let i = 0; i < boneMatrices.length; i++) {
        if (cache.boneMatrices[i] !== boneMatrices[i]) { unchanged = false; break; }
      }
    }
    // Paused mixers and duplicate render() calls still invoke skeleton.update,
    // but identical bone/bind state must not re-skin and re-upload every vertex.
    if (unchanged) return;
    const readAccessor = (attribute) => {
      const interleaved = !!attribute.isInterleavedBufferAttribute;
      let scale = 1;
      if (attribute.normalized) {
        const array = attribute.array;
        if (array instanceof Uint8Array) scale = 1 / 255;
        else if (array instanceof Uint16Array) scale = 1 / 65535;
        else if (array instanceof Uint32Array) scale = 1 / 4294967295;
        else if (array instanceof Int8Array) scale = 1 / 127;
        else if (array instanceof Int16Array) scale = 1 / 32767;
        else if (array instanceof Int32Array) scale = 1 / 2147483647;
      }
      return {
        array: attribute.array,
        stride: interleaved ? attribute.data.stride : attribute.itemSize,
        offset: interleaved ? attribute.offset : 0,
        scale
      };
    };
    let skin = base.skin;
    if (!skin || skin.index !== skinIndex || skin.weight !== skinWeight ||
        skin.indexArray !== skinIndex.array || skin.weightArray !== skinWeight.array ||
        skin.indexVersion !== skinIndex.version || skin.weightVersion !== skinWeight.version) {
      const si = readAccessor(skinIndex);
      const sw = readAccessor(skinWeight);
      const indices = new Int32Array(position.count * 4);
      const weights = new Float32Array(position.count * 4);
      for (let v = 0, offset = 0; v < position.count; v++, offset += 4) {
        const indexOffset = v * si.stride + si.offset;
        const weightOffset = v * sw.stride + sw.offset;
        for (let k = 0; k < 4; k++) {
          indices[offset + k] = si.array[indexOffset + k] * 16;
          weights[offset + k] = sw.array[weightOffset + k] * sw.scale;
        }
      }
      skin = { index: skinIndex, weight: skinWeight,
        indexArray: skinIndex.array, weightArray: skinWeight.array,
        indexVersion: skinIndex.version, weightVersion: skinWeight.version,
        indices, weights };
      base.skin = skin;
    }
    const indices = skin.indices;
    const weights = skin.weights;
    if (!this._r1SkinMatrices || this._r1SkinMatrices.length < boneCount * 16) {
      this._r1SkinMatrices = new Float32Array(boneCount * 16);
    }
    const B = this._r1SkinMatrices;
    const tmpA = this._r1SkinTmpA || (this._r1SkinTmpA = new object.bindMatrix.constructor());
    const tmpB = this._r1SkinTmpB || (this._r1SkinTmpB = new object.bindMatrix.constructor());
    for (let b = 0; b < boneCount; b++) {
      tmpA.fromArray(skeleton.boneMatrices, b * 16);
      tmpB.multiplyMatrices(object.bindMatrixInverse, tmpA);
      tmpA.multiplyMatrices(tmpB, object.bindMatrix);
      B.set(tmpA.elements, b * 16);
    }
    const basePos = base.position;
    const outPos = position.array;
    const normal = geometry.attributes.normal;
    const baseNormal = base.normal;
    const outNormal = normal ? normal.array : null;
    for (let v = 0, p3 = 0, w4 = 0; v < position.count; v++, p3 += 3, w4 += 4) {
      const x = basePos[p3], y = basePos[p3 + 1], z = basePos[p3 + 2];
      const nx = baseNormal ? baseNormal[p3] : 0;
      const ny = baseNormal ? baseNormal[p3 + 1] : 0;
      const nz = baseNormal ? baseNormal[p3 + 2] : 0;
      let ox = 0, oy = 0, oz = 0, onx = 0, ony = 0, onz = 0;
      for (let k = 0; k < 4; k++) {
        const w = weights[w4 + k];
        if (w === 0) continue;
        const m = indices[w4 + k];
        ox += w * (B[m] * x + B[m + 4] * y + B[m + 8] * z + B[m + 12]);
        oy += w * (B[m + 1] * x + B[m + 5] * y + B[m + 9] * z + B[m + 13]);
        oz += w * (B[m + 2] * x + B[m + 6] * y + B[m + 10] * z + B[m + 14]);
        if (outNormal) {
          onx += w * (B[m] * nx + B[m + 4] * ny + B[m + 8] * nz);
          ony += w * (B[m + 1] * nx + B[m + 5] * ny + B[m + 9] * nz);
          onz += w * (B[m + 2] * nx + B[m + 6] * ny + B[m + 10] * nz);
        }
      }
      outPos[p3] = ox; outPos[p3 + 1] = oy; outPos[p3 + 2] = oz;
      if (outNormal) {
        const length = Math.sqrt(onx * onx + ony * ony + onz * onz) || 1;
        outNormal[p3] = onx / length;
        outNormal[p3 + 1] = ony / length;
        outNormal[p3 + 2] = onz / length;
      }
    }
    position._r1DynamicContent = true;
    position.version++;
    if (normal) { normal._r1DynamicContent = true; normal.version++; }
    cache.geometry = geometry;
    cache.skinIndex = skinIndex; cache.skinIndexArray = skinIndex.array;
    cache.skinWeight = skinWeight; cache.skinWeightArray = skinWeight.array;
    cache.skinIndexVersion = skinIndex.version; cache.skinWeightVersion = skinWeight.version;
    cache.morphKey = morphKey;
    cache.bindMatrix = object.bindMatrix.elements.slice();
    cache.bindMatrixInverse = object.bindMatrixInverse.elements.slice();
    cache.boneMatrices.set(boneMatrices);
    cache.valid = true;
  }

  _adaptLineDraw(object) {
    const source = object.geometry;
    const material = object.material;
    if (!source || !material || Array.isArray(material)) return null;
    const fat = object.isLineSegments2 === true;
    const dashed = material.isLineDashedMaterial === true || (fat && material.dashed === true);
    if (!fat && !dashed) return null;
    const attrs = source.attributes;
    const signature = fat ? [
      'fat', adaptedAttributeVersion(attrs.instanceStart), adaptedAttributeVersion(attrs.instanceEnd),
      adaptedAttributeVersion(attrs.instanceColorStart), adaptedAttributeVersion(attrs.instanceColorEnd),
      material.color ? `${material.color.r}:${material.color.g}:${material.color.b}` : '-',
      material.vertexColors, material.dashed, material.dashScale, material.dashSize, material.gapSize,
      material.opacity, material.transparent, material.version
    ].join('|') : [
      'dash', adaptedAttributeVersion(attrs.position), adaptedAttributeVersion(attrs.color),
      adaptedAttributeVersion(source.index), adaptedAttributeVersion(attrs.lineDistance),
      source.drawRange.start, source.drawRange.count, material.scale, material.dashSize, material.gapSize,
      material.color ? `${material.color.r}:${material.color.g}:${material.color.b}` : '-',
      material.opacity, material.transparent, material.version
    ].join('|');
    const previous = this._adaptedLineDraws.get(object);
    if (previous && previous.source === source && previous.sourceMaterial === material && previous.signature === signature) {
      return { geometry: previous.geometry, material: previous.material, lineSegments: fat || object.isLineSegments };
    }
    let geometry;
    let adaptedMaterial;
    if (fat) {
      geometry = fatLineGeometry(source);
      if (!geometry) return null;
      const vertexColors = !!geometry.attributes.color && material.vertexColors !== false;
      adaptedMaterial = adaptedLineMaterial(material, vertexColors);
      if (material.dashed === true) {
        geometry = dashedGeometry(geometry, true, {
          scale: material.dashScale === undefined ? 1 : material.dashScale,
          dashSize: material.dashSize === undefined ? 1 : material.dashSize,
          gapSize: material.gapSize === undefined ? 1 : material.gapSize
        });
      }
      adaptationWarn(material, '_r1FatLineWarned',
        'R1 lowers Line2/LineSegments2 to native line segments; linewidth and alphaToCoverage are dropped.');
    } else {
      geometry = dashedGeometry(source, !!object.isLineSegments, material);
      adaptedMaterial = adaptedLineMaterial(material, !!source.attributes.color);
    }
    if (previous) {
      if (previous.geometry !== geometry && previous.geometry !== source) previous.geometry.dispose();
      if (previous.material !== adaptedMaterial) previous.material.dispose();
    }
    this._adaptedLineDraws.set(object, { source, sourceMaterial: material, signature, geometry, material: adaptedMaterial });
    return { geometry, material: adaptedMaterial, lineSegments: fat || object.isLineSegments };
  }

  _adaptShaderDraw(object) {
    const source = object.geometry;
    const material = object.material;
    if (!source || !material || Array.isArray(material) || !(material.isShaderMaterial || material.isRawShaderMaterial)) return null;
    const attrs = source.attributes;
    const uniforms = material.uniforms || {};
    let kind = null;
    if (!attrs.position && material.isRawShaderMaterial &&
        String(material.vertexShader).includes('pseudoRandomVec3') &&
        String(material.vertexShader).includes('gl_VertexID')) kind = 'procedural';
    else if (object.isLineSegments && attrs.position && attrs.vertColor && attrs.visible &&
        String(material.fragmentShader).includes('vVisible')) kind = 'selective';
    else if (object.isPoints && attrs.position && (attrs.customColor || attrs.size || attrs.scale)) kind = 'points';
    else if (object.isMesh && attrs.position && attrs.normal && attrs.customColor && attrs.displacement &&
        uniforms.amplitude && String(material.vertexShader).includes('amplitude')) kind = 'tessellation';
    if (!kind) return null;
    const amplitude = kind === 'tessellation' ? Number(uniforms.amplitude.value) : 0;
    const sizeAttribute = kind === 'points' ? (attrs.size || attrs.scale || null) : null;
    let meanSize = 1;
    if (sizeAttribute) {
      let total = 0;
      for (let i = 0; i < sizeAttribute.count; i++) {
        const value = sizeAttribute.getComponent(i, 0);
        requireFinite(value, 'point size attribute');
        total += value;
      }
      meanSize = sizeAttribute.count ? total / sizeAttribute.count : 1;
      if (!(meanSize > 0)) meanSize = 0.001;
    }
    const uniformColor = uniforms.color && uniforms.color.value;
    const signature = [
      kind, adaptedAttributeVersion(attrs.position), adaptedAttributeVersion(attrs.normal),
      adaptedAttributeVersion(attrs.color), adaptedAttributeVersion(attrs.customColor),
      adaptedAttributeVersion(attrs.vertColor), adaptedAttributeVersion(attrs.visible),
      adaptedAttributeVersion(attrs.displacement), adaptedAttributeVersion(sizeAttribute),
      adaptedAttributeVersion(source.index), source.drawRange.start, source.drawRange.count,
      amplitude, meanSize, material.version, material.opacity, material.transparent,
      uniformColor && uniformColor.isColor ? `${uniformColor.r}:${uniformColor.g}:${uniformColor.b}` : '-',
      uniforms.pointTexture && uniforms.pointTexture.value ? resourceId(uniforms.pointTexture.value) : 0,
      uniforms.alphaTest ? uniforms.alphaTest.value : 0
    ].join('|');
    const previous = this._adaptedShaderDraws.get(object);
    if (previous && previous.source === source && previous.sourceMaterial === material && previous.signature === signature) {
      return { geometry: previous.geometry, material: previous.material, lineSegments: kind === 'selective' ? true : undefined };
    }
    let geometry;
    let adaptedMaterial;
    if (kind === 'procedural') {
      geometry = proceduralVertexGeometry(source);
      adaptedMaterial = new MeshBasicMaterial({ vertexColors: true, side: material.side, fog: material.fog });
      adaptationWarn(material, '_r1ProceduralWarned',
        'R1 evaluates the bounded gl_VertexID procedural shader into native position/color attributes.');
    } else if (kind === 'selective') {
      geometry = selectiveLineGeometry(source);
      adaptedMaterial = adaptedLineMaterial(material, true);
      adaptationWarn(material, '_r1SelectiveWarned',
        'R1 lowers the selective-draw visibility shader to filtered native line segments.');
    } else if (kind === 'points') {
      if (attrs.customColor) {
        geometry = new BufferGeometry();
        geometry.setAttribute('position', attrs.position);
        geometry.setAttribute('color', attrs.customColor);
        geometry.setDrawRange(source.drawRange.start, source.drawRange.count);
        geometry.boundingSphere = source.boundingSphere;
      } else geometry = source;
      let map = uniforms.pointTexture && uniforms.pointTexture.value;
      let alphaTest = uniforms.alphaTest ? Number(uniforms.alphaTest.value) : 0;
      if (!map && String(material.fragmentShader).includes('gl_PointCoord')) {
        map = pointDiscTexture();
        if (!alphaTest) alphaTest = 0.5;
      }
      adaptedMaterial = new PointsMaterial({
        color: uniformColor && uniformColor.isColor ? uniformColor : new Color(0xffffff),
        size: meanSize,
        sizeAttenuation: true,
        map: map || null,
        alphaTest,
        vertexColors: !!(attrs.customColor || attrs.color),
        transparent: !!material.transparent,
        opacity: material.opacity,
        depthTest: material.depthTest,
        depthWrite: material.depthWrite,
        blending: material.blending,
        fog: material.fog
      });
      adaptationWarn(material, '_r1PointShaderWarned',
        'R1 lowers the bounded point shader; per-point sizes are represented by their current mean.');
    } else {
      const count = attrs.position.count;
      if (!previous || previous.kind !== kind || previous.geometry.attributes.position.count !== count) {
        geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(count * 3), 3));
        geometry.setAttribute('normal', attrs.normal);
        geometry.setAttribute('color', new Float32BufferAttribute(new Float32Array(count * 3), 3));
        geometry.setDrawRange(source.drawRange.start, source.drawRange.count);
      } else geometry = previous.geometry;
      const positions = geometry.attributes.position;
      const colors = geometry.attributes.color;
      for (let i = 0; i < count; i++) {
        const nx = attrs.normal.getComponent(i, 0);
        const ny = attrs.normal.getComponent(i, 1);
        const nz = attrs.normal.getComponent(i, 2);
        const displacement = attrs.displacement.getComponent(i, 0) * amplitude;
        for (let c = 0; c < 3; c++) {
          const normal = c === 0 ? nx : c === 1 ? ny : nz;
          positions.array[i * 3 + c] = attrs.position.getComponent(i, c) + normal * displacement;
        }
        const shade = 0.4 + Math.max(0, (nx + ny + nz) / Math.sqrt(3));
        for (let c = 0; c < 3; c++) colors.array[i * 3 + c] = attrs.customColor.getComponent(i, c) * shade;
      }
      positions._r1DynamicContent = true;
      colors._r1DynamicContent = true;
      positions.needsUpdate = true;
      colors.needsUpdate = true;
      geometry.computeBoundingSphere();
      adaptedMaterial = previous && previous.kind === kind ? previous.material :
        new MeshBasicMaterial({ vertexColors: true, side: material.side, fog: material.fog });
      adaptationWarn(material, '_r1TessellationWarned',
        'R1 evaluates the tessellation displacement shader on the CPU and bakes its bounded directional color.');
    }
    if (previous) {
      if (previous.geometry !== geometry && previous.geometry !== source) previous.geometry.dispose();
      if (previous.material !== adaptedMaterial) previous.material.dispose();
    }
    this._adaptedShaderDraws.set(object, { kind, source, sourceMaterial: material, signature, geometry, material: adaptedMaterial });
    return { geometry, material: adaptedMaterial, lineSegments: kind === 'selective' ? true : undefined };
  }

  _adaptDrawable(object) {
    return this._adaptLineDraw(object) || this._adaptShaderDraw(object);
  }

  _ensureNode(object, parentId, commands, drawVisible) {
    const id = resourceId(object);
    const materialVisible = !object.material || object.material.visible !== false;
    const visible = !!object.visible && materialVisible;
    const batched = !!object.isInstancedMesh || !!(object.isMesh && Array.isArray(object.material));
    const spriteCenter = object.isSprite
      ? (object.center || { x: 0.5, y: 0.5 })
      : { x: 0.5, y: 0.5 };
    if ((!drawVisible || !materialVisible) && !object.isLight && !object.isCamera) {
      const objectKind = this._objectKind(object);
      if (!batched) this._removeBatch(id, commands);
      this._updateNode(object, id, parentId, 0, 0, visible, objectKind, commands, spriteCenter);
      return { id, draw: null };
    }
    if (object.isInstancedMesh && object.count === 0) {
      if (object.userData && object.userData.jsrRetainEmptyBatch) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        if (materials.some(material => material.wireframe)) unsupported('wireframeBatch', 'R1 wireframe requires a single-material non-instanced Mesh');
        const geometry = this._ensureGeometry(object.geometry, 0, 'triangles', commands);
        this._ensureBatch(object, id, geometry, materials, commands);
      } else {
        this._removeBatch(id, commands);
      }
      this._updateNode(object, id, parentId, 0, 0, visible, 1, commands, spriteCenter);
      return { id, draw: null };
    }
    let geometryId = 0;
    let materialId = 0;
    let objectKind = 0;
    let draw = null;
    let batch = null;
    if (object.isSprite) {
      // R1 v5 sprite lane: the shared upstream quad (positions in
      // [-0.5, 0.5]², unit UVs) billboards against the camera in the vertex
      // stage using the node world matrix columns as the sprite scale; the
      // SpriteMaterial rides the unlit meshBasic shading path. Sprites never
      // cast or receive shadows (upstream Object3D docs).
      if (Array.isArray(object.material)) unsupported('multiMaterial', 'R1 sprites take a single material');
      const material = object.material;
      if (!material || !material.isSpriteMaterial) unsupported('material', 'R1 sprites require a SpriteMaterial');
      const geometry = this._ensureGeometry(object.geometry, 0, 'triangles', commands);
      geometryId = geometry.id;
      materialId = this._ensureMaterial(material, commands);
      objectKind = 4;
      draw = { primitive: 0, count: geometry.drawCount };
    } else if (object.isMesh || object.isLine || object.isLineSegments || object.isPoints) {
      const sourceGeometry = object.geometry;
      const sourcePosition = sourceGeometry && sourceGeometry.attributes.position;
      if (sourcePosition && sourceRange(sourceGeometry, sourcePosition.count).count === 0) {
        if (!batched) this._removeBatch(id, commands);
        this._updateNode(object, id, parentId, 0, 0, visible, this._objectKind(object), commands, spriteCenter);
        return { id, draw: null };
      }
      this._applyMorphTargets(object);
      if (object.isSkinnedMesh) this._applySkining(object);
      if (object.isBatchedMesh || object.isSprite) unsupported('objectType', object.type);
      if (object.isLineLoop) unsupported('LineLoop');
      const adapted = this._adaptDrawable(object);
      const material = adapted ? adapted.material : object.material;
      const renderGeometry = adapted ? adapted.geometry : object.geometry;
      if (adapted) {
        const adaptedPosition = renderGeometry.attributes.position;
        if (!adaptedPosition || sourceRange(renderGeometry, adaptedPosition.count).count === 0) {
          if (!batched) this._removeBatch(id, commands);
          this._updateNode(object, id, parentId, 0, 0, visible, this._objectKind(object), commands, spriteCenter);
          return { id, draw: null };
        }
      }
      if (!material || (Array.isArray(material) && material.length === 0)) throw new Error('three.invalid: drawable has no material');
      let primitive = 0;
      let mode = 'triangles';
      objectKind = 1;
      if (adapted && adapted.lineSegments !== undefined) {
        primitive = 1;
        mode = adapted.lineSegments ? 'lines' : 'line';
        objectKind = 2;
      } else if (object.isPoints) { primitive = 2; mode = 'points'; objectKind = 3; }
      else if (object.isLine || object.isLineSegments) {
        primitive = 1;
        mode = object.isLineSegments ? 'lines' : 'line';
        objectKind = 2;
      }
      if (Array.isArray(material) && primitive !== 0) unsupported('multiMaterial', 'R1 material arrays require triangle meshes');
      const materials = Array.isArray(material) ? material : [material];
      const wireframe = primitive === 0 && materials.some(item => item.wireframe);
      if (batched && wireframe) unsupported('wireframeBatch', 'R1 wireframe requires a single-material non-instanced Mesh');
      const geometry = this._ensureGeometry(renderGeometry, primitive, mode, commands, wireframe);
      if (batched) {
        batch = { geometry, materials };
      } else {
        geometryId = geometry.id;
        materialId = this._ensureMaterial(material, commands);
        draw = { primitive: wireframe ? 1 : primitive, count: wireframe ? geometry.wireDrawCount : geometry.drawCount };
      }
    } else if (object.isLight || object.isCamera) {
      return null;
    } else if (object.isInstancedMesh || object.isBatchedMesh) {
      unsupported('objectType', object.type);
    }
    if (!batched) this._removeBatch(id, commands);
    this._updateNode(object, id, parentId, geometryId, materialId, visible, objectKind, commands, spriteCenter);
    if (batch) draw = this._ensureBatch(object, id, batch.geometry, batch.materials, commands);
    return { id, draw };
  }

  _objectKind(object) {
    if (object.isMesh) return 1;
    if (object.isSprite) return 4;
    if (object.isPoints) return 3;
    if (object.isLine || object.isLineSegments) return 2;
    return 0;
  }

  _ensureLight(light, commands) {
    let type;
    if (light.isAmbientLight) type = 0;
    else if (light.isDirectionalLight) type = 1;
    else if (light.isPointLight) type = 2;
    else if (light.isHemisphereLight) type = 3;
    else if (light.isSpotLight) type = 4;
    else if (light.type === 'SunLight') type = 1; // addons/lights/SunLight: directional towards the origin
    else unsupported('light', light.type);
    const id = resourceId(light);
    light.getWorldPosition(_position);
    _direction.set(0, 0, 0);
    if (light.type === 'SunLight') {
      _target.set(0, 0, 0);
      _direction.copy(_position).sub(_target).normalize();
    } else if (light.isDirectionalLight || light.isSpotLight) {
      light.target.updateMatrixWorld(true);
      _target.setFromMatrixPosition(light.target.matrixWorld);
      _direction.copy(_position).sub(_target).normalize();
    } else if (light.isHemisphereLight) {
      // THREE uses the normalized world position as the hemisphere direction;
      // translation is directional state, not a point-light location/target.
      _direction.copy(_position).normalize();
    }
    const groundColor = light.isHemisphereLight ? light.groundColor : null;
    const spot = light.isSpotLight
      ? { angle: light.angle, penumbra: light.penumbra, distance: light.distance, decay: light.decay }
      : null;
    const signature = [type, light.color.r, light.color.g, light.color.b, light.intensity,
      _position.x, _position.y, _position.z, _direction.x, _direction.y, _direction.z,
      groundColor ? groundColor.r : 0, groundColor ? groundColor.g : 0,
      groundColor ? groundColor.b : 0,
      spot ? spot.angle : 0, spot ? spot.penumbra : 0, spot ? spot.distance : 0, spot ? spot.decay : 0].join('|');
    const old = this._state.lights.get(id);
    if (!old || old.signature !== signature) {
      if (!Number.isFinite(light.intensity) || light.intensity < 0) throw new Error('three.invalid: light intensity');
      finiteArray([light.color.r, light.color.g, light.color.b, _position.x, _position.y, _position.z, _direction.x, _direction.y, _direction.z], 'light');
      if (groundColor) finiteArray([groundColor.r, groundColor.g, groundColor.b], 'light groundColor');
      commands.push(lightCommand(id, type, light.color, light.intensity, _position, _direction, groundColor, spot));
      this._mapSet(this._state.lights, id, { signature, object: light });
    }
    return id;
  }

  _ensureCamera(camera, commands) {
    if (!camera || (!camera.isPerspectiveCamera && !camera.isOrthographicCamera)) unsupported('camera', 'R1 supports perspective and orthographic cameras');
    const id = resourceId(camera);
    finiteArray(camera.matrixWorld.elements, 'camera matrixWorld');
    finiteArray(camera.matrixWorldInverse.elements, 'camera matrixWorldInverse');
    finiteArray(camera.projectionMatrix.elements, 'camera projectionMatrix');
    const signature = [camera.isPerspectiveCamera ? 0 : 1, matrixSignature(camera.matrixWorldInverse), matrixSignature(camera.projectionMatrix), matrixSignature(camera.matrixWorld)].join('|');
    const old = this._state.cameras.get(id);
    if (!old || old.signature !== signature) {
      commands.push(cameraCommand(id, camera.isPerspectiveCamera ? 0 : 1, camera.matrixWorldInverse, camera.projectionMatrix, camera.matrixWorld));
      this._mapSet(this._state.cameras, id, { signature, object: camera });
    }
    return id;
  }

  _background(scene) {
    const background = scene.background;
    if (background === null || background === undefined) return { r: this._clearColor.r, g: this._clearColor.g, b: this._clearColor.b, a: this._clearAlpha };
    if (background.isTexture) return { r: 0, g: 0, b: 0, a: 1 }; // skybox mesh overdraws the clear
    if (!background.isColor) unsupported('backgroundTexture', 'R1 accepts a Color, Texture or null background');
    return { r: background.r, g: background.g, b: background.b, a: 1 };
  }

  // scene.background = Texture/CubeTexture: an injected BackSide box with
  // the dedicated background material kind (shader samples by view ray).
  _ensureBackgroundNode(scene, camera, commands, seenNodes) {
    const background = scene.background;
    if (!background || !background.isTexture) return;
    const ready = background.isCubeTexture
      ? Array.isArray(background.image) && background.image.length === 6 && background.image.every(face => face && face.data)
      : !!(background.image && background.image.data);
    if (!ready) return; // wait for the async faces just like material maps
    if (!this._backgroundMesh) {
      const material = new MeshBasicMaterial({ side: BackSide, depthWrite: false, fog: false });
      material._r1Background = true;
      const geometry = new BoxGeometry(2, 2, 2);
      geometry.clearGroups(); // single-material skybox must not split into batch parts
      this._backgroundMesh = new Mesh(geometry, material);
      this._backgroundMesh.frustumCulled = false;
    }
    const mesh = this._backgroundMesh;
    mesh.material.envMap = background;
    camera.getWorldPosition(_position);
    mesh.position.copy(_position);
    mesh.scale.setScalar(Math.max(0.001, (camera.near || 0.1) * 2));
    mesh.updateMatrixWorld(true);
    const result = this._ensureNode(mesh, resourceId(scene), commands, true);
    if (result) seenNodes.add(result.id);
  }

  _fog(scene) {
    const fog = scene.fog;
    if (fog === null || fog === undefined) {
      return { mode: 0, color: { r: 0, g: 0, b: 0 }, near: 0, far: 0, density: 0 };
    }
    if (fog.isFogExp2) {
      finiteArray([fog.color.r, fog.color.g, fog.color.b, fog.density], 'fog');
      if (fog.density < 0) throw new Error('three.invalid: FogExp2 density must be nonnegative');
      return { mode: 2, color: fog.color, near: 0, far: 0, density: fog.density };
    }
    if (!fog.isFog) unsupported('fogType', 'R1 supports linear Fog and FogExp2');
    finiteArray([fog.color.r, fog.color.g, fog.color.b, fog.near, fog.far], 'fog');
    if (fog.near < 0 || fog.far <= fog.near) throw new Error('three.invalid: fog requires 0 <= near < far');
    return { mode: 1, color: fog.color, near: fog.near, far: fog.far, density: 0 };
  }

  _shadow(scene, light, viewCamera) {
    if (!this.shadowMap.enabled) return NO_SHADOW;
    if (!light || !light.shadow || !light.shadow.camera || !light.shadow.mapSize) return NO_SHADOW;
    const shadow = light.shadow;
    const width = Math.floor(shadow.mapSize.x);
    const height = Math.floor(shadow.mapSize.y);
    if (light.isPointLight) return this._pointShadow(light, shadow, width, height);
    if (light.isSunLight) {
      // SunLight is not a DirectionalLight and has no target. Its addon
      // shadow computes two CSM cascades; R1 has one map, so use the first
      // (near) cascade rather than silently dropping the shadow altogether.
      shadow.updateMatrices(light, viewCamera);
      if (!light._r1SunShadowWarned) {
        light._r1SunShadowWarned = true;
        console.warn('three: R1 uses the first SunLight shadow cascade (second cascade dropped).');
      }
      const cascadeCamera = shadow.getCamera(0);
      // getMatrix(0) targets a two-tile WebGPU atlas. Rebuild the same
      // cascade transform without a viewport so it covers R1's one full map.
      const matrix = shadow._r1SingleMatrix || (shadow._r1SingleMatrix = new Matrix4());
      const frustum = shadow._r1SingleFrustum || (shadow._r1SingleFrustum = new Frustum());
      shadow._updateMatrix(cascadeCamera, matrix, frustum);
      return this._directionalShadowMetadata(shadow, width, height, matrix, cascadeCamera);
    }
    light.target.updateMatrixWorld(true);
    shadow.camera.updateProjectionMatrix();
    shadow.updateMatrices(light);
    return this._directionalShadowMetadata(shadow, width, height);
  }

  _shadowContentRevision(manual) {
    if (manual) return this._manualShadowRevision;
    if (this._shadowContentChanged) {
      this._autoShadowRevision = (this._autoShadowRevision + 1) >>> 0;
      if (this._autoShadowRevision === 0) this._autoShadowRevision = 1;
    }
    return this._autoShadowRevision;
  }

  // Shared bias/normalBias/radius/manual-revision state for the projected
  // (directional + spot) shadow lane; camera stays set so the renderer can
  // frustum-cull shadow casters.
  _directionalShadowMetadata(shadow, width, height, matrix = shadow.matrix, camera = shadow.camera) {
    const manual = this.shadowMap.autoUpdate === false;
    if (manual && this.shadowMap.needsUpdate === true) {
      this._manualShadowRevision = (this._manualShadowRevision + 1) >>> 0;
      if (this._manualShadowRevision === 0) this._manualShadowRevision = 1;
      this.shadowMap.needsUpdate = false;
    }
    let refreshCulling = true;
    if (manual) {
      const key = this._manualShadowRevision + '|' + width + '|' + height + '|' +
        shadow.bias + '|' + shadow.normalBias + '|' + matrix.elements.join(',');
      refreshCulling = key !== this._shadowCullingKey;
      this._shadowCullingKey = key;
    }
    return {
      width, height, bias: shadow.bias, normalBias: shadow.normalBias,
      radius: shadow.radius, matrix, camera,
      contentRevision: this._shadowContentRevision(manual),
      refreshCulling
    };
  }

  // R1 v5 point-light shadow lane — an HONEST dual-paraboloid approximation,
  // not upstream's six-face cube map:
  // - The shadow matrix carries the light VIEW matrix (camera at the light
  //   looking toward the world origin), not bias*projection*view. The shadow
  //   pass warps light-space positions onto the two paraboloid disks
  //   (front = z <= 0 hemisphere, back = z >= 0) and stores the light-space
  //   distance per texel; the main pass samples the matching face by
  //   major-hemisphere selection on (fragment - light).
  // - Depth is normalized with far = light.distance || shadow.camera.far and
  //   fragments beyond far are treated as unoccluded.
  // - The paraboloid warp happens per vertex, so very large caster triangles
  //   shear near the silhouette; upstream-quality geometry needs the 1B lane.
  // - There is no meaningful 2D frustum for a hemisphere, so point-light
  //   shadow casters are never frustum-culled (culling data stays empty).
  _pointShadow(light, shadow, width, height) {
    const manual = this.shadowMap.autoUpdate === false;
    if (manual && this.shadowMap.needsUpdate === true) {
      this._manualShadowRevision = (this._manualShadowRevision + 1) >>> 0;
      if (this._manualShadowRevision === 0) this._manualShadowRevision = 1;
      this.shadowMap.needsUpdate = false;
    }
    light.getWorldPosition(_position);
    const far = light.distance || shadow.camera.far;
    const view = new Matrix4();
    view.lookAt(_position, ZERO, UP);
    // view must carry the translation -R*lightPos; Matrix4.lookAt only
    // produces the rotation rows.
    _target.copy(_position).negate().applyMatrix4(view);
    view.setPosition(_target);
    if (!Number.isFinite(far) || far <= 0) throw new Error('three.invalid: point shadow far must be positive');
    finiteArray(view.elements, 'point shadow view');
    return {
      width, height, bias: shadow.bias, normalBias: shadow.normalBias,
      radius: shadow.radius, matrix: view, camera: null,
      contentRevision: this._shadowContentRevision(manual),
      refreshCulling: false,
      pointShadow: { active: 1, x: _position.x, y: _position.y, z: _position.z, far }
    };
  }

  _emit(commands) {
    const canvas = this.domElement;
    const sequence = this._state.sequence + 1;
    const bytes = encodeEnvelope(commands, canvas.engineId, canvas.surfaceId, sequence);
    this.runtime.sendR1(bytes);
    this._state.sequence = sequence;
  }

  render(scene, camera) {
    const previousPending = this._pendingDisposals.slice();
    const previousSequence = this._state.sequence;
    this._transaction = new Map();
    this._transactionListens = [];
    try {
      const result = this._render(scene, camera);
      this._transaction = null;
      this._transactionListens = null;
      this.domElement._r1State = this._state;
      return result;
    } catch (error) {
      const transaction = this._transaction;
      const listened = this._transactionListens;
      this._transaction = null;
      this._transactionListens = null;
      for (const resource of listened) this._unlisten(resource);
      for (const [map, entries] of transaction) {
        for (const [id, previous] of entries) {
          if (previous[0]) map.set(id, previous[1]);
          else map.delete(id);
        }
      }
      this._state.sequence = previousSequence;
      this._pendingDisposals = previousPending;
      throw error;
    }
  }

  _render(scene, camera) {
    if (this._disposed) throw new Error('three.surface: renderer is disposed');
    if (this.domElement.disposed) throw new Error('three.surface: canvas is disposed');
    if (!scene || !scene.isScene) throw new Error('three.invalid: render requires a Scene');
    if (this.outputColorSpace !== SRGBColorSpace) unsupported('outputColorSpace', 'native R1 requires SRGBColorSpace');
    if (!TONE_MAPPINGS.has(this.toneMapping)) unsupported('toneMapping', `${this.toneMapping} is not an upstream tone mapping constant`);
    if (this.xr.enabled) unsupported('xr');
    if (scene.overrideMaterial) unsupported('sceneFeature', 'overrideMaterial is outside R1 v1');
    // scene.environment becomes the default envMap for env-less materials.
    this._sceneEnvironment = scene.environment && scene.environment.isTexture ? scene.environment : null;
    if (!Array.isArray(this.clippingPlanes)) throw new Error('three.invalid: renderer.clippingPlanes must be an array');
    if (this.clippingPlanes.length > 16) unsupported('clippingPlanes', 'R1 supports at most 16 clipping planes');
    if (!camera || (!camera.isPerspectiveCamera && !camera.isOrthographicCamera)) unsupported('camera', 'R1 supports perspective and orthographic cameras');
    if (scene.matrixWorldAutoUpdate === true) scene.updateMatrixWorld();
    if (camera.parent === null && camera.matrixWorldAutoUpdate === true) {
      camera.updateMatrixWorld();
    }
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    this._frameGeometries = new Map();
    this._frameMaterials = new Map();
    this._frameTextures = new Map();
    this._frameMorphKeys = new Map();
    const commands = [];
    const pending = this._pendingDisposals.splice(0);
    for (const item of pending) {
      if (item.batch) commands.push(removeBatchCommand(item.id));
      commands.push(disposeResourceCommand(item.id, item.kind));
    }
    const seenNodes = new Set();
    const seenLights = new Set();
    // Multi-scene composition (webgl_sprites renders a perspective scene then
    // an ortho HUD scene in the same tick): retire only nodes/lights owned by
    // THE SCENE BEING RENDERED. Unscoped retirement made the two passes
    // delete each other's nodes every tick, so the perspective scene never
    // survived to presentation.
    const renderedSceneId = resourceId(scene);
    let shadowLight = null;
    const retiredNodes = [];
    const parents = new Map();
    const drawVisibility = new Map();
    let draws = 0;
    let triangles = 0;
    let lines = 0;
    let points = 0;
    const culledNodeIds = [];
    const shadowCandidates = [];
    this._ensureBackgroundNode(scene, camera, commands, seenNodes);
    _frustumMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_frustumMatrix);
    scene.traverseVisible(object => {
      // THREE.LOD selects the active level per frame; upstream WebGLRenderer
      // does the same in projectObject before visibility is flattened.
      if (object.isLOD) object.update(camera);
      const parentVisible = object.parent ? (drawVisibility.get(object.parent) ?? true) : true;
      const visibleHere = parentVisible && !!object.visible && (!object.material || object.material.visible !== false);
      drawVisibility.set(object, visibleHere);
      if (object.isLight) {
        if (object.visible) {
          const lightId = this._ensureLight(object, commands);
          seenLights.add(lightId);
          const lightEntry = this._state.lights.get(lightId);
          if (lightEntry) lightEntry.sceneId = renderedSceneId;
        }
        if (!shadowLight && object.visible && object.castShadow &&
            (object.isDirectionalLight || object.isSpotLight || object.isPointLight || object.isSunLight)) {
          shadowLight = object;
        }
        parents.set(object, parents.get(object.parent) || 0);
        return;
      }
      if (object.isCamera) { parents.set(object, parents.get(object.parent) || 0); return; }
      const parentId = parents.get(object.parent) || 0;
      if (!visibleHere) {
        // Hidden source/reference meshes must not become permanent zero-draw
        // native nodes. Existing nodes retire once below; re-showing recreates.
        parents.set(object, parentId);
        return;
      }
      const result = this._ensureNode(object, parentId, commands, visibleHere);
      if (result) {
        seenNodes.add(result.id);
        const nodeEntry = this._state.nodes.get(result.id);
        if (nodeEntry) nodeEntry.sceneId = renderedSceneId;
        parents.set(object, result.id);
        // Upstream sprites never cast shadows, so they stay out of the
        // shadow scan even with a user-set castShadow flag.
        if (result.draw && object.castShadow && !object.isSprite) shadowCandidates.push(object);
        const culled = result.draw && object.frustumCulled && !_frustum.intersectsObject(object);
        if (culled) culledNodeIds.push(result.id);
        if (!culled && result.draw && result.draw.parts) {
          if (result.draw.instanceCount > 0) {
            for (const part of result.draw.parts) {
              if (part.count === 0) continue;
              draws++;
              triangles += part.count / 3 * result.draw.instanceCount;
            }
          }
        } else if (!culled && result.draw) {
          draws++;
          if (result.draw.primitive === 0) triangles += result.draw.count / 3;
          else if (result.draw.primitive === 1) lines += result.draw.count / 2;
          else points += result.draw.count;
        }
      } else parents.set(object, parentId);
    });
    for (const [id, node] of this._state.nodes) {
      if (!seenNodes.has(id) && node.sceneId === renderedSceneId) {
        this._removeBatch(id, commands);
        commands.push(removeNodeCommand(id));
        this._mapDelete(this._state.nodes, id);
        retiredNodes.push(node.object);
      }
    }
    for (const [id] of this._state.lights) {
      if (!seenLights.has(id) && this._state.lights.get(id)?.sceneId === renderedSceneId) {
        commands.push(disposeResourceCommand(id, RESOURCE_KIND.light));
        this._mapDelete(this._state.lights, id);
      }
    }
    const cameraId = this._ensureCamera(camera, commands);
    const background = this._background(scene);
    const fog = this._fog(scene);
    // Camera-only renders sample the existing shadow map; scene resource or
    // light changes advance one revision per submitted frame. This replaces
    // the host's broad contentRevision fallback, which also changed for
    // camera upserts and forced needless shadow redraws.
    this._shadowContentChanged = false;
    for (const item of commands) {
      if (item.opcode !== OPCODE.CAMERA) { this._shadowContentChanged = true; break; }
    }
    const shadow = this._shadow(scene, shadowLight, camera);
    const culledShadowNodeIds = shadow.camera && shadow.refreshCulling === false
      ? this._cachedCulledShadowNodeIds : [];
    if (shadow.camera && shadow.refreshCulling !== false) {
      _frustumMatrix.multiplyMatrices(shadow.camera.projectionMatrix, shadow.camera.matrixWorldInverse);
      _frustum.setFromProjectionMatrix(_frustumMatrix);
      for (const object of shadowCandidates) {
        if (object.frustumCulled && !_frustum.intersectsObject(object)) {
          culledShadowNodeIds.push(resourceId(object));
        }
      }
      this._cachedCulledShadowNodeIds = culledShadowNodeIds;
    }
    if (!Number.isFinite(this.toneMappingExposure) || this.toneMappingExposure <= 0) throw new Error('three.invalid: exposure must be positive finite');
    finiteArray([background.r, background.g, background.b, background.a], 'background');
    const shadowLightType = shadow === NO_SHADOW || !shadowLight
      ? 0
      : shadowLight.isSpotLight ? 2 : (shadowLight.isPointLight ? 3 : 1);
    const pointShadow = shadowLight && shadowLight.isPointLight && shadow !== NO_SHADOW && shadow.pointShadow
      ? shadow.pointShadow
      : null;
    if (shadowLight && shadowLight.isPointLight && shadow !== NO_SHADOW && !pointShadow) {
      throw new Error('three.invalid: point light shadow matrix is required');
    }
    commands.push(frameCommand(resourceId(scene), cameraId, background, this.toneMappingExposure, fog, shadow, culledNodeIds, culledShadowNodeIds, shadowLightType, this.toneMapping, pointShadow));
    this._emit(commands);
    this._lastScene = scene;
    this._lastCamera = camera;
    for (const object of retiredNodes) this._unlisten(object);
    this.info.render.frame++;
    this.info.render.calls = draws;
    this.info.render.triangles = triangles;
    this.info.render.lines = lines;
    this.info.render.points = points;
    this.info.memory.geometries = this._state.geometries.size;
    this.info.memory.textures = this._state.textures.size;
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this.setAnimationLoop(null);
    this._canvasRefreshHandle = null;
    for (const texture of Array.from(this._canvasTextures.keys())) this._unwatchCanvasTexture(texture);
    this._lastScene = null;
    this._lastCamera = null;
    const commands = [];
    const sent = new Set();
    const dispose = (id, kind) => {
      const key = `${kind}:${id}`;
      if (!sent.has(key)) { sent.add(key); commands.push(disposeResourceCommand(id, kind)); }
    };
    for (const [id] of this._state.batches) commands.push(removeBatchCommand(id));
    for (const [id] of this._state.geometries) dispose(id, RESOURCE_KIND.geometry);
    for (const [id] of this._state.textures) dispose(id, RESOURCE_KIND.texture);
    for (const [id] of this._state.materials) dispose(id, RESOURCE_KIND.material);
    for (const [id] of this._state.nodes) dispose(id, RESOURCE_KIND.node);
    for (const [id] of this._state.lights) dispose(id, RESOURCE_KIND.light);
    for (const [id] of this._state.cameras) dispose(id, RESOURCE_KIND.camera);
    commands.push(disposeSurfaceCommand());
    try { this._emit(commands); } finally {
      this._unlistenAll();
      this._state.geometries.clear(); this._state.textures.clear(); this._state.materials.clear();
      this._state.nodes.clear(); this._state.batches.clear(); this._state.lights.clear(); this._state.cameras.clear();
      this.domElement.dispose();
      if (this.domElement.renderer === this) this.domElement.renderer = null;
    }
  }
}

export { JsrWebGLRenderer as WebGLRenderer };
