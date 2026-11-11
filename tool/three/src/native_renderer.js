import {
  ACESFilmicToneMapping, AgXToneMapping, BackSide, BasicDepthPacking, BoxGeometry, BufferAttribute, BufferGeometry, CineonToneMapping, Color, CubeReflectionMapping, CubeRefractionMapping,
  ClampToEdgeWrapping, CustomToneMapping, DataTexture, DoubleSide, DynamicDrawUsage, EquirectangularReflectionMapping, Float32BufferAttribute, FrontSide, Frustum, InstancedBufferAttribute, InstancedMesh, LinearFilter,
  LinearMipmapNearestFilter, LinearMipmapLinearFilter, LinearToneMapping, LineBasicMaterial, Matrix4, Mesh, MeshBasicMaterial, MeshLambertMaterial, MeshNormalMaterial, MeshStandardMaterial,
  MirroredRepeatWrapping, NeutralToneMapping, NearestFilter, NearestMipmapNearestFilter,
  NearestMipmapLinearFilter, NoToneMapping, NormalBlending, CustomBlending, AdditiveBlending, PointsMaterial, HalfFloatType, FloatType, IntType, RedFormat,
  ReinhardToneMapping, RGBAFormat, RGBAIntegerFormat, RepeatWrapping, SRGBColorSpace, UVMapping, UnsignedByteType,
  Sphere, Vector3, Vector4, WebGLCoordinateSystem, Object3D
} from 'three';
import { unsupported, requireFinite } from './errors.js';
import { getThreeRuntime } from './runtime.js';
import { isNativeCanvas2D } from './native_canvas2d.js';
import {
  MATERIAL_FLAG_COLOR_WRITE_OFF, MATERIAL_FLAG_STENCIL, OPCODE, NO_SHADOW, STENCIL_FUNC, STENCIL_OP,
  cameraCommand, clippingCommand, command, disposeResourceCommand, disposeSurfaceCommand,
  drawBatchCommand, encodeEnvelope, frameCommand, geometryCommand, lightCommand,
  materialCommand, nodeCommand, removeBatchCommand, removeNodeCommand, renderTargetCommand, resourceId,
  stencilClearCommand, textureCommand
} from './r1.js';

const ATTR_NAMES = ['position', 'normal', 'uv', 'color'];
// Every upstream tone mapping constant has an R1 fragment implementation
// (shaders/three_r1.frag, three.js r186 tonemapping_pars_fragment math).
const TONE_MAPPINGS = new Set([NoToneMapping, LinearToneMapping, ReinhardToneMapping,
  CineonToneMapping, ACESFilmicToneMapping, CustomToneMapping, AgXToneMapping, NeutralToneMapping]);
const MAX_INSTANCES = 1000000;
const MAX_BATCHED_INSTANCES = 20000;
// BatchedMesh adaptation proxies are R1-internal instanced stand-ins, not
// official scene children: the module's own raycaster already walks the
// BatchedMesh through its BVH-accelerated raycast over the retained
// instances. Leaving the default Mesh/InstancedMesh raycast on the proxies
// re-tested every proxy's full triangle range per pointermove (10 proxies x
// full LOD0 ranges ~ 2.1M triangle tests per event in QuickJS) purely to
// re-derive hits the batched raycast already produced, so proxies opt out.
const jsrBatchedMeshProxyRaycast = function () {};
const MAX_RENDER_TARGETS = 16;
const MAX_RENDER_TARGET_PIXELS = 16 * 1024 * 1024;
// Frame-target flag bit for the R1 v8 stencil lane: the frame-start stencil
// clear (value 0), mirroring upstream clear(color, depth, stencil) /
// autoClearStencil. Emitted only when the frame actually touches stencil
// state (a stencil-tail material or a clearStencil call), so stenciless
// frames keep their pre-v8 flags word. Mid-frame clears use
// OPCODE.STENCIL_CLEAR markers instead.
const FRAME_TARGET_FLAGS = Object.freeze({ clearColor: 1, clearDepth: 2, scissor: 4, viewport: 8, clearStencil: 16 });
const MAX_BATCH_PARTS = 1024;
const RESOURCE_KIND = { geometry: 1, texture: 2, material: 3, node: 4, light: 5, camera: 6, renderTarget: 7 };
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
    attribute.data ? token(attribute.data.array) : 0, attribute.offset || 0,
    token(attribute.buffer), token(attribute.buffer?._r1Data)].join(':');
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
  // Exact float32 bits when the storage is a 4-byte typed array: the previous
  // `array[i] | 0` truncation mapped EVERY sub-1.0 element to 0, so fractional
  // vertex edits (the common animated-geometry case — positions in the unit
  // cube) produced an unchanged hash and the frame skipped a REQUIRED
  // re-upload (stale geometry on screen).
  if (array.BYTES_PER_ELEMENT === 4 && array.buffer instanceof ArrayBuffer &&
      array.byteOffset % 4 === 0) {
    const words = new Uint32Array(array.buffer, array.byteOffset, array.length);
    for (let i = 0; i < n; i++) {
      hash ^= words[i];
      hash = (hash * 0x01000193) | 0;
    }
    return hash >>> 0;
  }
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
// Blend-source finiteness memoized on the SOURCE object keyed by its own
// version: morph target attributes and the pristine base copies are immutable
// in practice (MD2 loaders write them once), so each array is scanned at most
// once for the whole widget lifetime while mutable sources rescan on version
// bumps and mutable-but-unchanged versions keep their verdict.
function morphSourceFinite(attribute, count) {
  if (!attribute) return false;
  const source = attribute.array;
  if (!source || source.length < count) return false;
  if (attribute._r1MorphFiniteVersion === attribute.version) return true;
  const verdict = sourceFiniteStrict(source, count);
  if (verdict) attribute._r1MorphFiniteVersion = attribute.version;
  return verdict;
}

function baseSourceFinite(array, count) {
  if (!array || array.length < count) return false;
  if (array._r1MorphBaseFinite === true) return true;
  if (!sourceFiniteStrict(array, count)) return false;
  array._r1MorphBaseFinite = true;
  return true;
}

function sourceFiniteStrict(array, count) {
  for (let i = 0; i < count; i++) {
    const value = array[i];
    if (value !== value || value === Infinity || value === -Infinity) return false;
  }
  return true;
}

function activeTargetsFinite(active, count) {
  for (let a = 1; a < active.length; a += 2) {
    if (!morphSourceFinite(active[a], count)) return false;
  }
  return true;
}

function volatileAttribute(attribute) {
  return !!attribute && (attribute._r1DynamicContent === true || attribute.usage === DynamicDrawUsage);
}

function geometrySignature(geometry, primitive, mode, rangeOverride) {
  const attributes = ATTR_NAMES.map(name => attributeSignature(geometry.attributes[name])).join('|');
  const index = geometry.index;
  const range = rangeOverride || geometry.drawRange || { start: 0, count: Infinity };
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

// Degenerate dynamic geometry (zero-area triangles, asset-authored NaN like
// the ShadowmappableMesh.glb line primitive) may carry non-finite normals;
// upstream GPUs shade those vertices with undefined lighting. R1 bounds them
// to the zero vector instead of rejecting the whole frame, while
// position/uv/color keep the strict requireFinite contract.
function finiteOrNeutralNormal(value, name, attribute) {
  if (Number.isFinite(value)) return value;
  if (name === 'normal') {
    if (attribute && !attribute._r1DegenerateNormalWarned) {
      attribute._r1DegenerateNormalWarned = true;
      console.warn('three: R1 zeroes non-finite normal components on this degenerate geometry; position/uv/color keep the strict finite contract.');
    }
    return 0;
  }
  requireFinite(value, `${name} attribute`);
  return value;
}

function attributeFloats(attribute, vertexCount, components, name, vertexOffset = 0, reusable = null) {
  if (!attribute) return null;
  if (attribute.itemSize !== components || attribute.count < vertexOffset + vertexCount) throw new Error(`three.invalid: ${name} attribute must have ${components} components per vertex`);
  const total = vertexCount * components;
  const values = reusable && reusable.length === total ? reusable : new Float32Array(total);
  if (attribute.isGLBufferAttribute) {
    const buffer = attribute.buffer;
    const data = buffer?._r1Data;
    if (!data || data.length < (vertexOffset + vertexCount) * components) unsupported('rawGLAttribute', `${name} has no bounded software buffer data`);
    // GLBufferAttribute payload lives GPU-side upstream; the bounded lane
    // keeps one converted Float32Array per buffer content and serves every
    // drawRange window as a subarray of it. The official glbufferattribute
    // example mutates setDrawRange every frame while the buffer bytes stay
    // constant — reconverting the growing window per frame made each frame
    // an O(window) rescan (measured: presentedFps degraded 60→18 as the
    // window reached ~140k particles with ~0.9M QuickJS iterations/frame).
    // Cache identity is (buffer, data, length); bufferData() swaps _r1Data,
    // so stale content cannot survive a re-bind. The returned window is a
    // view: callers may retain it across sequences, and invalidation always
    // allocates a fresh array instead of mutating a retained one.
    let cache = attribute._r1GLFloats;
    if (!cache || cache.buffer !== buffer || cache.data !== data || cache.full.length !== data.length) {
      const scale = attribute.normalized && data instanceof Uint8Array ? 1 / 255 : 1;
      const intBytes = attribute.normalized && data instanceof Uint8Array;
      const full = new Float32Array(data.length);
      for (let i = 0; i < data.length; i++) {
        const value = data[i] * scale;
        // Integer bytes map into [0,1] and are finite by construction; float
        // payloads keep the strict finite contract with the same messages.
        full[i] = intBytes ? value : finiteOrNeutralNormal(value, name, attribute);
      }
      cache = { buffer, data, full };
      attribute._r1GLFloats = cache;
    }
    const start = vertexOffset * components;
    return cache.full.subarray(start, start + total);
  }
  if (typeof attribute.getComponent !== 'function') unsupported('rawGLAttribute', name);
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
      if (array instanceof Float32Array && attribute._r1FiniteVersion === attribute.version) {
        // The synchronous native skin kernel validated this exact version.
        // TypedArray.set performs the bulk copy without a per-float JS loop.
        if (values !== array) {
          values.set(componentOffset === 0 && total === array.length ? array :
            array.subarray(componentOffset, componentOffset + total));
        }
        return values;
      }
      for (let i = 0; i < total; i++) {
        let value = array[componentOffset + i];
        // Keep the strict finite contract without a QuickJS function call for
        // every valid component on dynamic geometry's per-frame hot path.
        if (value !== value || value === Infinity || value === -Infinity) {
          value = finiteOrNeutralNormal(value, name, attribute);
        }
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
      values[i * components + c] = finiteOrNeutralNormal(value, name, attribute);
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
  // The upload cache retains this typed buffer across animated vertex
  // uploads; geometryCommand can then copy its bytes in one operation.
  return source ? new Uint32Array(source) : null;
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
  if (!texture.isRenderTargetTexture) return elements;
  const e = elements;
  return [e[0], -e[1], e[2], e[3], -e[4], e[5], e[6], 1 - e[7], e[8]];
}

// Snapshot-tier companion of uvTransformElements: both null (identity) or
// element-wise equal. Arrays are the ones produced by uvTransformElements.
function uvElementsEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
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
  // R1 v7: MeshDepthMaterial rides the depth-viz lane (shaders/three_r1.frag
  // kind 12): grayscale linearized view depth written into the color
  // attachment, so the bounded RT lane — whose DepthTexture is aliased to the
  // RT color — still shows real depth structure (webgl_depth_texture).
  if (material.isMeshDepthMaterial) {
    // R1 v8: RGBADepthPacking is tolerated — the depth-viz lane writes linear
    // view depth into the color attachment and never samples packed RGBA, so
    // the packing flag is irrelevant. Raising a capability error here broke
    // BokehPass (three-postprocessing-dof), whose depth pre-pass override is
    // RGBADepthPacked; warn once per material instead.
    if (material.depthPacking !== BasicDepthPacking) {
      adaptationWarn(material, '_r1DepthPackingWarned',
        'R1 ignores MeshDepthMaterial.depthPacking (the depth-viz lane writes linear view depth; packed RGBA is not sampled).');
    }
    return 12;
  }
  unsupported('material', material.type || 'unknown material');
}

function supportsEmissive(material) {
  return material.isMeshLambertMaterial || material.isMeshPhongMaterial ||
    (material.isMeshStandardMaterial) ||
    material.isMeshToonMaterial;
}

function sourceTokens(source) { return String(source || '').replace(/\s+/g, ''); }

function shaderTokens(material) {
  return `${sourceTokens(material.fragmentShader)} ${sourceTokens(material.vertexShader)}`;
}

const RTT_VERTEX = 'varyingvec2vUv;voidmain(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
const RTT_SCREEN_FRAGMENT = 'varyingvec2vUv;uniformsampler2DtDiffuse;voidmain(){gl_FragColor=texture2D(tDiffuse,vUv);#include<colorspace_fragment>}';
const RTT_PROCEDURAL_FRAGMENT = 'varyingvec2vUv;uniformfloattime;voidmain(){floatr=vUv.x;if(vUv.y<0.5)r=0.0;floatg=vUv.y;if(vUv.x<0.5)g=0.0;gl_FragColor=vec4(r,g,time,1.0);}';
const ANAGLYPH_VERTEX = 'varyingvec2vUv;voidmain(){vUv=vec2(uv.x,uv.y);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
const ANAGLYPH_FRAGMENT = 'uniformsampler2DmapLeft;uniformsampler2DmapRight;varyingvec2vUv;uniformmat3colorMatrixLeft;uniformmat3colorMatrixRight;voidmain(){vec2uv=vUv;vec4colorL=texture2D(mapLeft,uv);vec4colorR=texture2D(mapRight,uv);vec3color=clamp(colorMatrixLeft*colorL.rgb+colorMatrixRight*colorR.rgb,0.,1.);gl_FragColor=vec4(color.r,color.g,color.b,max(colorL.a,colorR.a));#include<tonemapping_fragment>#include<colorspace_fragment>}';

function boundedShaderSignature(material) {
  const uniforms = material.uniforms || {};
  const textureIds = ['mapLeft', 'mapRight', 'tDiffuse'].map(name =>
    uniforms[name]?.value ? resourceId(uniforms[name].value) : 0);
  const matrices = ['colorMatrixLeft', 'colorMatrixRight'].map(name =>
    uniforms[name]?.value?.elements?.join(',') || '');
  const boundTextures = shaderTextureList(uniforms).map(texture => resourceId(texture));
  return [material.version, shaderTokens(material), ...textureIds, ...matrices, ...boundTextures].join('|');
}

function copyShaderFlags(source, target) {
  target.side = source.side;
  target.depthTest = source.depthTest;
  target.depthWrite = source.depthWrite;
  target.transparent = source.transparent;
  target.opacity = source.opacity;
  target.alphaTest = source.alphaTest;
  target.blending = source.blending;
  target.toneMapped = source.toneMapped;
  target.fog = source.fog;
  return target;
}

function shaderTextureList(uniforms) {
  const textures = [];
  for (const [name, uniform] of Object.entries(uniforms)) {
    const value = uniform && uniform.value;
    if (value?.isTexture) textures.push({ name, texture: value });
    else if (Array.isArray(value)) {
      for (const item of value) if (item?.isTexture) textures.push({ name, texture: item });
    }
  }
  // The bounded lane lowers a multi-texture shader to its FIRST bound
  // texture. For postprocess blends (e.g. AfterimagePass tOld/tNew) the
  // insertion order keeps the PREVIOUS frame and drops the current one,
  // rendering black. Rank the pass's primary input first so the lowering
  // keeps the frame being presented; secondary inputs (accumulation history
  // buffers) remain dropped and the warn string documents the loss.
  const rank = ({ name }) => (/^(tDiffuse|tNew|tInput|map)$/.test(name) ? 0 : 1);
  textures.sort((a, b) => rank(a) - rank(b));
  return textures.map((entry) => entry.texture);
}

function firstShaderTexture(uniforms) {
  return shaderTextureList(uniforms)[0] || null;
}

function basicShaderMaterial(source, options = {}) {
  const material = copyShaderFlags(source, new MeshBasicMaterial({
    color: options.color || 0xffffff,
    map: options.map || null,
    vertexColors: !!options.vertexColors
  }));
  return material;
}

function timeColorGeometry(source) {
  if (!source.attributes.position || !source.attributes.color) return null;
  const geometry = new BufferGeometry();
  for (const name of ['position', 'normal', 'uv']) {
    if (source.attributes[name]) geometry.setAttribute(name, source.attributes[name]);
  }
  geometry.setAttribute('color', new Float32BufferAttribute(new Float32Array(source.attributes.position.count * 3), 3));
  geometry.setIndex(source.index);
  geometry.setDrawRange(source.drawRange.start, source.drawRange.count);
  geometry.boundingSphere = source.boundingSphere;
  geometry._r1TimeColor = { position: source.attributes.position, color: source.attributes.color };
  return geometry;
}

function refreshTimeColorGeometry(geometry, time) {
  const source = geometry._r1TimeColor;
  if (!source) return;
  const output = geometry.attributes.color;
  for (let i = 0; i < output.count; i++) {
    const red = source.color.getComponent(i, 0) + Math.sin(source.position.getComponent(i, 0) * 10 + time) * 0.5;
    output.setXYZ(i, red, source.color.getComponent(i, 1), source.color.getComponent(i, 2));
  }
  output._r1DynamicContent = true;
  output.needsUpdate = true;
}

function displacedShaderGeometry(source, amplitude) {
  const position = source.attributes.position;
  const normal = source.attributes.normal;
  const displacement = source.attributes.displacement;
  if (!position || !normal || !displacement) return null;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(position.count * 3), 3));
  for (const name of ['normal', 'uv']) if (source.attributes[name]) geometry.setAttribute(name, source.attributes[name]);
  geometry.setIndex(source.index);
  geometry.setDrawRange(source.drawRange.start, source.drawRange.count);
  geometry._r1Displaced = { position, normal, displacement };
  refreshDisplacedShaderGeometry(geometry, amplitude);
  geometry.computeBoundingSphere();
  return geometry;
}

function refreshDisplacedShaderGeometry(geometry, amplitude) {
  const source = geometry._r1Displaced;
  if (!source) return;
  const output = geometry.attributes.position;
  for (let i = 0; i < output.count; i++) {
    const amount = source.displacement.getComponent(i, 0) * amplitude;
    output.setXYZ(i,
      source.position.getComponent(i, 0) + source.normal.getComponent(i, 0) * amount,
      source.position.getComponent(i, 1) + source.normal.getComponent(i, 1) * amount,
      source.position.getComponent(i, 2) + source.normal.getComponent(i, 2) * amount);
  }
  output._r1DynamicContent = true;
  output.needsUpdate = true;
}

function instancedShaderGeometry(source, kind) {
  const position = source.attributes.position;
  if (!position) return null;
  const perInstance = kind === 'billboards' ? sourceIndices(source, position.count) : null;
  const verticesPerInstance = perInstance ? perInstance.length : position.count;
  const instances = Math.min(source.instanceCount || 0, 2048);
  if (!instances || !verticesPerInstance) return null;
  const geometry = new BufferGeometry();
  for (const name of ['position', 'color', 'uv']) {
    const components = name === 'uv' ? 2 : 3;
    geometry.setAttribute(name, new Float32BufferAttribute(new Float32Array(instances * verticesPerInstance * components), components));
  }
  geometry._r1Instanced = { source, kind, perInstance, verticesPerInstance, capacity: instances };
  return geometry;
}

function rotateShaderQuaternion(vector, quaternion) {
  const [x, y, z, w] = quaternion;
  const cx = y * vector[2] - z * vector[1];
  const cy = z * vector[0] - x * vector[2];
  const cz = x * vector[1] - y * vector[0];
  return [
    cx * 2 * w + (y * cz - z * cy) * 2 + vector[0],
    cy * 2 * w + (z * cx - x * cz) * 2 + vector[1],
    cz * 2 * w + (x * cy - y * cx) * 2 + vector[2]
  ];
}

function hslShaderColor(scale) {
  const h = ((scale / 5) % 1 + 1) % 1;
  const clamp = value => Math.max(0, Math.min(1, value));
  return [clamp(Math.abs(h * 6 - 3) - 1), clamp(2 - Math.abs(h * 6 - 2)), clamp(Math.abs(h * 6 - 4) - 1)];
}

function refreshInstancedShaderGeometry(geometry, uniforms, object, viewMatrix) {
  const data = geometry._r1Instanced;
  if (!data) return;
  const { source, kind, perInstance, verticesPerInstance, capacity } = data;
  const attrs = source.attributes;
  let instances = Math.min(source.instanceCount || 0, capacity);
  if (!Number.isFinite(source.instanceCount) || !(source.instanceCount > 0)) {
    // Upstream clamps instanced draws to the instanced attribute lengths;
    // mirror that here so a default (Infinity) count cannot read past the
    // arrays and encode NaNs (three.js defaults instanceCount to Infinity).
    for (const name in attrs) {
      const attribute = attrs[name];
      if (attribute && attribute.isInstancedBufferAttribute) {
        instances = Math.min(instances, attribute.count);
      }
    }
  }
  const positions = geometry.attributes.position;
  const colors = geometry.attributes.color;
  const uvs = geometry.attributes.uv;
  const time = Number(uniforms.time?.value || 0);
  const sineTime = Number(uniforms.sineTime?.value || 0);
  // Exact-repeat frames (paused timeline, duplicate render() calls, coalesced
  // RAF batches) must not rewrite 36k vertices or bump upload versions. The
  // key covers source identity/versions plus the animated uniforms; a source
  // array mutated in place WITHOUT a version bump would be missed, which
  // upstream never does (InstancedBufferAttribute.needsUpdate).
  const versionKey = [
    attributeVersionKey(attrs.translate), attributeVersionKey(attrs.position),
    attributeVersionKey(attrs.uv), attributeVersionKey(attrs.color),
    attributeVersionKey(attrs.offset), attributeVersionKey(attrs.orientationStart),
    attributeVersionKey(attrs.orientationEnd), attributeVersionKey(source.index),
    instances
  ].join('|');
  const me = object && object.matrixWorld ? object.matrixWorld.elements : null;
  const ve = viewMatrix && viewMatrix.elements ? viewMatrix.elements : null;
  let unchanged = data.lastKey === versionKey && data.lastTime === time &&
    data.lastSineTime === sineTime && data.lastCount === instances;
  if (kind === 'billboards' && unchanged) {
    // The billboard offset is baked into local space through M⁻¹·Rᵥᵀ, so a
    // camera or mesh rotation alone must re-run the evaluation even when
    // every uniform is unchanged.
    if (!data.viewKey || !me || !ve) unchanged = false;

    else {
      let k = 0;
      for (const e of [me, ve]) {
        for (const base of [0, 4, 8]) {
          for (let r = 0; r < 3; r++, k++) {
            if (data.viewKey[k] !== e[base + r]) { unchanged = false; break; }
          }
          if (!unchanged) break;
        }
        if (!unchanged) break;
      }
    }
  }
  if (unchanged) return;
  if (unchanged) return;
  data.lastKey = versionKey;
  data.lastTime = time;
  data.lastSineTime = sineTime;
  data.lastCount = instances;
  if (kind === 'billboards' && me && ve) {
    // 18 slots: two matrices (mesh, view) x three linear columns x three rows.
    if (!data.viewKey) data.viewKey = new Float64Array(18);
    let k = 0;
    for (const e of [me, ve]) {
      for (const base of [0, 4, 8]) {
        for (let r = 0; r < 3; r++, k++) data.viewKey[k] = e[base + r];
      }
    }
  }
  // Plain-array fast path: instance attributes in these examples are never
  // interleaved; the getComponent fallback keeps interleaved sources correct.
  const plain = attr => attr && !attr.isInterleavedBufferAttribute &&
    attr.array && attr.array.length >= attr.count * attr.itemSize ? attr.array : null;
  const tArr = plain(attrs.translate), oArr = plain(attrs.offset);
  const osArr = plain(attrs.orientationStart), oeArr = plain(attrs.orientationEnd);
  const cArr = plain(attrs.color);
  const templateKey = `${attributeVersionKey(attrs.position)}:${attributeVersionKey(attrs.uv)}:${attributeVersionKey(source.index)}`;
  let templatePos = data.templatePos;
  let templateUv = data.templateUv;
  if (kind === 'billboards' && (!templatePos || data.templateKey !== templateKey)) {
    templatePos = new Float32Array(verticesPerInstance * 3);
    for (let v = 0; v < verticesPerInstance; v++) {
      const sv = perInstance[v];
      templatePos[v * 3] = attrs.position.getComponent(sv, 0);
      templatePos[v * 3 + 1] = attrs.position.getComponent(sv, 1);
      templatePos[v * 3 + 2] = attrs.position.getComponent(sv, 2);
    }
    templateUv = attrs.uv ? new Float32Array(verticesPerInstance * 2) : null;
    if (templateUv) {
      for (let v = 0; v < verticesPerInstance; v++) {
        const sv = perInstance[v];
        templateUv[v * 2] = attrs.uv.getComponent(sv, 0);
        templateUv[v * 2 + 1] = attrs.uv.getComponent(sv, 1);
      }
    }
    data.templatePos = templatePos;
    data.templateUv = templateUv;
    data.templateKey = templateKey;
    data.uvWritten = false;
  }
  // The official billboard vertex stage offsets the sprite in VIEW space
  // (mvPosition.xyz += position * scale AFTER the modelView transform), so
  // the sprite must NOT inherit the node scale — webgl_buffergeometry_
  // instancing_billboards scales its mesh 500x and the sprite offset has to
  // stay ~40 view units, not 20000. The corrected local position satisfies
  // M·L = M·translate + Rᵥᵀ·(position·size), i.e.
  // L = translate + (M⁻¹lin·Rᵥᵀ)·(position·size); the offset is a direction
  // vector, so the camera translation never enters. B = M⁻¹lin·Rᵥᵀ is
  // per-frame, and per instance only its columns are scaled by `size`.
  const basis = kind === 'billboards' ? _r1BillboardBasis(me, ve) : null;
  const posArr = positions.array;
  const colArr = colors.array;
  for (let instance = 0; instance < instances; instance++) {
    // translate exists only on billboards geometry; instancing geometry has
    // offset/orientationStart/orientationEnd and no translate attribute.
    const t0 = kind === 'billboards' ? (tArr ? tArr[instance * 3] : attrs.translate.getComponent(instance, 0)) : 0;
    const t1 = kind === 'billboards' ? (tArr ? tArr[instance * 3 + 1] : attrs.translate.getComponent(instance, 1)) : 0;
    const t2 = kind === 'billboards' ? (tArr ? tArr[instance * 3 + 2] : attrs.translate.getComponent(instance, 2)) : 0;
    let scale = 0;
    if (kind === 'billboards') {
      scale = Math.sin((t0 + time) * 2.1) + Math.sin((t1 + time) * 3.2) + Math.sin((t2 + time) * 4.3);
    }
    let o0 = 0, o1 = 0, o2 = 0, o3 = 1;
    if (kind === 'instancing') {
      for (let c = 0; c < 4; c++) {
        const s = osArr ? osArr[instance * 4 + c] : attrs.orientationStart.getComponent(instance, c);
        const e = oeArr ? oeArr[instance * 4 + c] : attrs.orientationEnd.getComponent(instance, c);
        const lerped = s * (1 - sineTime) + e * sineTime;
        if (c === 0) o0 = lerped;
        else if (c === 1) o1 = lerped;
        else if (c === 2) o2 = lerped;
        else o3 = lerped;
      }
      const length = Math.hypot(o0, o1, o2, o3) || 1;
      o0 /= length; o1 /= length; o2 /= length; o3 /= length;
    }
    const color = kind === 'billboards' ? hslShaderColor(scale) : null;
    const base = instance * verticesPerInstance;
    if (kind === 'billboards') {
      const size = scale * 10 + 10;
      let a0, a1, a2, b0, b1, b2, c0, c1, c2;
      if (basis) {
        // a/b/c are the COLUMNS of M_linear⁻¹·R_cam: the local-space image of
        // the view-space sprite axes, so vertex k adds cx*a_k + cy*b_k + cz*c_k.
        a0 = size * basis[0]; b0 = size * basis[1]; c0 = size * basis[2];
        a1 = size * basis[3]; b1 = size * basis[4]; c1 = size * basis[5];
        a2 = size * basis[6]; b2 = size * basis[7]; c2 = size * basis[8];
      } else {
        // Degenerate/missing matrices: keep the sprite axis-aligned instead
        // of crashing; the render walk rejects non-finite world matrices
        // before this point, so this only covers a zero-scale mesh.
        a0 = size; a1 = 0; a2 = 0; b0 = 0; b1 = size; b2 = 0; c0 = 0; c1 = 0; c2 = size;
      }
      for (let vertex = 0; vertex < verticesPerInstance; vertex++) {
        const cx = templatePos[vertex * 3], cy = templatePos[vertex * 3 + 1], cz = templatePos[vertex * 3 + 2];
        const o = (base + vertex) * 3;
        posArr[o] = t0 + cx * a0 + cy * b0 + cz * c0;
        posArr[o + 1] = t1 + cx * a1 + cy * b1 + cz * c1;
        posArr[o + 2] = t2 + cx * a2 + cy * b2 + cz * c2;
        colArr[o] = color[0];
        colArr[o + 1] = color[1];
        colArr[o + 2] = color[2];
      }
    } else {
      const cR = cArr ? cArr[instance * 3] : attrs.color.getComponent(instance, 0);
      const cG = cArr ? cArr[instance * 3 + 1] : attrs.color.getComponent(instance, 1);
      const cB = cArr ? cArr[instance * 3 + 2] : attrs.color.getComponent(instance, 2);
      const spread = Math.max(Math.abs(sineTime * 2 + 1), 0.5);
      for (let vertex = 0; vertex < verticesPerInstance; vertex++) {
        const p0 = (oArr ? oArr[instance * 3] : attrs.offset.getComponent(instance, 0)) * spread +
          attrs.position.getComponent(vertex, 0);
        const p1 = (oArr ? oArr[instance * 3 + 1] : attrs.offset.getComponent(instance, 1)) * spread +
          attrs.position.getComponent(vertex, 1);
        const p2 = (oArr ? oArr[instance * 3 + 2] : attrs.offset.getComponent(instance, 2)) * spread +
          attrs.position.getComponent(vertex, 2);
        const point = rotateShaderQuaternion([p0, p1, p2], [o0, o1, o2, o3]);
        const o = (base + vertex) * 3;
        posArr[o] = point[0];
        posArr[o + 1] = point[1];
        posArr[o + 2] = point[2];
        colArr[o] = cR + Math.sin(point[0] * 10 + time) * 0.5;
        colArr[o + 1] = cG;
        colArr[o + 2] = cB;
      }
    }
  }
  // The sprite UV map is static per source geometry: write it once instead of
  // re-marking ~295KB of unchanged UV bytes dynamic every frame.
  if (kind === 'billboards' && uvs && templateUv && !data.uvWritten) {
    const uvArr = uvs.array;
    for (let instance = 0; instance < instances; instance++) {
      const base = instance * verticesPerInstance * 2;
      for (let v = 0; v < verticesPerInstance; v++) {
        uvArr[base + v * 2] = templateUv[v * 2];
        uvArr[base + v * 2 + 1] = templateUv[v * 2 + 1];
      }
    }
    uvs._r1DynamicContent = true;
    uvs.needsUpdate = true;
    data.uvWritten = true;
  }
  geometry.setDrawRange(0, instances * verticesPerInstance);
  positions._r1DynamicContent = true;
  positions.needsUpdate = true;
  colors._r1DynamicContent = true;
  colors.needsUpdate = true;
  // One conservative culling bound per source content instead of an O(vertex)
  // computeBoundingSphere walk per frame: billboard sprites add at most
  // |scale*10+10| ≤ 40 template units through B (max |B| element × √3 loses
  // against the spectral norm), instancing spreads offsets by ≤ 3 and unit
  // quaternions preserve lengths. Both bounds dominate the real extents, so
  // frustum culling stays safe while the per-frame QuickJS walk disappears.
  if (!data.staticSphere) {
    let radius = 1e-3;
    if (kind === 'billboards') {
      let maxTranslate = 0;
      for (let i = 0; i < instances; i++) {
        const x = tArr ? tArr[i * 3] : attrs.translate.getComponent(i, 0);
        const y = tArr ? tArr[i * 3 + 1] : attrs.translate.getComponent(i, 1);
        const z = tArr ? tArr[i * 3 + 2] : attrs.translate.getComponent(i, 2);
        maxTranslate = Math.max(maxTranslate, Math.hypot(x, y, z));
      }
      let maxTemplate = 0;
      for (let v = 0; v < verticesPerInstance; v++) {
        maxTemplate = Math.max(maxTemplate, Math.hypot(
          templatePos[v * 3], templatePos[v * 3 + 1], templatePos[v * 3 + 2]));
      }
      let maxB = 0;
      if (basis) for (let i = 0; i < 9; i++) maxB = Math.max(maxB, Math.abs(basis[i]));
      radius = maxTranslate + 40 * maxTemplate * maxB * Math.sqrt(3) + 1e-3;
    } else {
      let maxOffset = 0;
      for (let i = 0; i < instances; i++) {
        const x = oArr ? oArr[i * 3] : attrs.offset.getComponent(i, 0);
        const y = oArr ? oArr[i * 3 + 1] : attrs.offset.getComponent(i, 1);
        const z = oArr ? oArr[i * 3 + 2] : attrs.offset.getComponent(i, 2);
        maxOffset = Math.max(maxOffset, Math.hypot(x, y, z));
      }
      let maxVert = 0;
      for (let i = 0; i < attrs.position.count; i++) {
        maxVert = Math.max(maxVert, Math.hypot(
          attrs.position.getComponent(i, 0), attrs.position.getComponent(i, 1),
          attrs.position.getComponent(i, 2)));
      }
      radius = maxOffset * 3 + maxVert + 1e-3;
    }
    geometry.boundingSphere = new Sphere(new Vector3(0, 0, 0), radius);
    data.staticSphere = true;
  }
}

// B = (M⁻¹)lin · Rᵥᵀ for the billboard lane. THREE Matrix4 storage is column
// major (element[c*4+r] is row r, column c). Returns a shared 9-float scratch
// (row-major 3x3); the caller consumes it before any other call.
const _r1BillboardBasisScratch = new Float32Array(9);
function _r1BillboardBasis(meshElements, viewElements) {
  if (!meshElements || !viewElements) return null;
  const m = meshElements, v = viewElements;
  const a00 = m[0], a01 = m[4], a02 = m[8];
  const a10 = m[1], a11 = m[5], a12 = m[9];
  const a20 = m[2], a21 = m[6], a22 = m[10];
  const det = a00 * (a11 * a22 - a12 * a21) - a01 * (a10 * a22 - a12 * a20) + a02 * (a10 * a21 - a11 * a20);
  if (!Number.isFinite(det) || Math.abs(det) < 1e-20) return null;
  const invDet = 1 / det;
  const i00 = (a11 * a22 - a12 * a21) * invDet;
  const i01 = (a02 * a21 - a01 * a22) * invDet;
  const i02 = (a01 * a12 - a02 * a11) * invDet;
  const i10 = (a12 * a20 - a10 * a22) * invDet;
  const i11 = (a00 * a22 - a02 * a20) * invDet;
  const i12 = (a02 * a10 - a00 * a12) * invDet;
  const i20 = (a10 * a21 - a11 * a20) * invDet;
  const i21 = (a01 * a20 - a00 * a21) * invDet;
  const i22 = (a00 * a11 - a01 * a10) * invDet;
  const out = _r1BillboardBasisScratch;
  for (let c = 0; c < 3; c++) {
    // Basis = M_linear⁻¹ · R_cam = M_linear⁻¹ · V_linearᵀ; entries pair the
    // mesh inverse with the VIEW ROW c (column-major storage: v[j*4+c]).
    const v0 = v[c], v1 = v[4 + c], v2 = v[8 + c];
    out[0 * 3 + c] = i00 * v0 + i01 * v1 + i02 * v2;
    out[1 * 3 + c] = i10 * v0 + i11 * v1 + i12 * v2;
    out[2 * 3 + c] = i20 * v0 + i21 * v1 + i22 * v2;
  }
  return out;
}

function shaderNoiseTexture(fragment) {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  const rand = (x, y) => {
    const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return value - Math.floor(value);
  };
  const mode = fragment.includes('vec3rand3=') ? 3 : fragment.includes('vec2rand2=') ? 2 : 1;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size, v = y / size;
    const a = rand(u, v), b = rand(u + 0.4, v + 0.6), c = rand(u + 0.6, v + 0.4);
    let r = a, g = a, bl = a;
    if (mode === 2) { r = 1 - a; g = (1 - a) * (1 - b); bl = a * (1 - b); }
    else if (mode === 3) { r = a; g = b; bl = c; }
    const offset = (y * size + x) * 4;
    data[offset] = r * 255; data[offset + 1] = g * 255; data[offset + 2] = bl * 255; data[offset + 3] = 255;
  }
  const texture = new DataTexture(data, size, size);
  texture.needsUpdate = true;
  return texture;
}

function monjoriTexture(time) {
  const size = 64, data = new Uint8Array(size * size * 4);
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    const x = -1 + 2 * px / (size - 1), y = -1 + 2 * py / (size - 1);
    const a = time * 40, g = 1 / 40;
    let e = 400 * (x * 0.5 + 0.5), f = 400 * (y * 0.5 + 0.5);
    let i = 200 + Math.sin(e * g + a / 150) * 20;
    let d = 200 + Math.cos(f * g / 2) * 18 + Math.cos(e * g) * 7;
    const r = Math.hypot(i - e, d - f) || 1, q = f / r;
    e = r * Math.cos(q) - a / 2; f = r * Math.sin(q) - a / 2;
    d = Math.sin(e * g) * 340 + r;
    let h = ((f + d) + a / 2) * g;
    i = Math.cos(h + r * x / 1.3) * (2 * e + a) + Math.cos(q * g * 6) * (r + h / 3);
    h = (Math.sin(f * g) * 144 - Math.sin(e * g) * 212 * x + (f - e) * q + Math.sin(r - (a + h) / 7) * 10 + i / 4) * g;
    i += Math.cos(h * 2.3 * Math.sin(a / 350 - q)) * 184 * Math.sin(q - (r * 4.3 + a / 12) * g) + Math.tan(r * g + h) * 184 * Math.cos(r * g + h);
    i = ((i / 5.6) % 256) / 64; if (i < 0) i += 4; if (i >= 2) i = 4 - i;
    d = r / 350 + Math.sin((r / 350) ** 2 * 8) * 0.52;
    const f0 = (Math.sin(a * g) + 1) / 2;
    const red = f0 * i / 1.6 * d * x + (i / 1.3 + d / 8) * d * (1 - x);
    const green = (i / 2 + d / 13) * d * x + (i / 2 + d / 18) * d * (1 - x);
    const blue = i * d;
    const offset = (py * size + px) * 4;
    data[offset] = Math.max(0, Math.min(255, red * 255));
    data[offset + 1] = Math.max(0, Math.min(255, green * 255));
    data[offset + 2] = Math.max(0, Math.min(255, blue * 255)); data[offset + 3] = 255;
  }
  const texture = new DataTexture(data, size, size);
  texture.needsUpdate = true;
  return texture;
}

function proceduralRttGeometry(geometry, time) {
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  if (!position || !uv || position.itemSize !== 3 || uv.itemSize !== 2) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < position.count; i++) {
    minX = Math.min(minX, position.getX(i)); maxX = Math.max(maxX, position.getX(i));
    minY = Math.min(minY, position.getY(i)); maxY = Math.max(maxY, position.getY(i));
  }
  if (![minX, minY, maxX, maxY].every(Number.isFinite)) return null;
  const positions = [], normals = [], uvs = [], colors = [];
  const vertices = [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]];
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 2; x++) {
      for (const [dx, dy] of vertices) {
        const u = (x + dx) / 2, v = (y + dy) / 2;
        positions.push(minX + (maxX - minX) * u, minY + (maxY - minY) * v, 0);
        normals.push(0, 0, 1); uvs.push(u, v);
        colors.push(v < 0.5 ? u : 0, u < 0.5 ? v : 0, time);
      }
    }
  }
  const result = new BufferGeometry();
  result.setAttribute('position', new Float32BufferAttribute(positions, 3));
  result.setAttribute('normal', new Float32BufferAttribute(normals, 3));
  result.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  result.setAttribute('color', new Float32BufferAttribute(colors, 3));
  result.computeBoundingSphere();
  result._r1ProceduralTime = time;
  return result;
}

function refreshProceduralRtt(geometry, time) {
  if (time === undefined) return;
  const color = geometry.attributes.color;
  for (let i = 0; i < color.count; i++) color.setZ(i, time);
  color.needsUpdate = true;
}

// ---------------------------------------------------------------------------
// GPGPU display lanes (birds + protoplanet). The CPU compute kernels live in
// degrades/gpgpu_cpu_computation.mjs (drop-in for GPUComputationRenderer);
// these lanes turn the simulated float textures back into R1 draw packets.
// Frames are keyed on Texture.version — the kernels bump needsUpdate every
// compute, so a coalesced/duplicate render tick skips the rewrite entirely.
function gpgpuFrameKey(texture) {
  return texture ? `${texture.id}:${texture.version}` : '';
}

let _protoPointsSprite = null;
function protoPointsSprite() {
  if (_protoPointsSprite) return _protoPointsSprite;
  const size = 32;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5;
      const dy = (y + 0.5) / size - 0.5;
      const r = Math.sqrt(dx * dx + dy * dy) / 0.5;
      const a = r < 1 ? (1 - r) * (1 - r) : 0;
      const o = (y * size + x) * 4;
      data[o] = 255; data[o + 1] = 255; data[o + 2] = 255;
      data[o + 3] = Math.round(a * 255);
    }
  }
  _protoPointsSprite = new DataTexture(data, size, size, RGBAFormat, UnsignedByteType);
  _protoPointsSprite.needsUpdate = true;
  return _protoPointsSprite;
}

function protoPointsGeometry(source, uniforms) {
  const cached = source._r1ProtoPointsDraw;
  if (cached) return cached;
  const uv = source.attributes.uv;
  const position = source.attributes.position;
  if (!uv || !position || uv.count < position.count) return null;
  const count = position.count;
  const width = count > 0 ? Math.round(Math.sqrt(count)) : 0;
  if (!width || width * width !== count) return null;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('color', new Float32BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(new Float32Array(count * 2), 2));
  geometry.attributes.uv.array.set(uv.array.subarray(0, count * 2));
  geometry.attributes.uv.needsUpdate = true;
  // Texel index per particle from its uv (official uv = texel/(width-1)).
  const texel = new Int32Array(count);
  const uvArr = uv.array;
  for (let i = 0; i < count; i++) {
    const tx = Math.min(width - 1, Math.max(0, Math.round(uvArr[i * 2] * (width - 1))));
    const ty = Math.min(width - 1, Math.max(0, Math.round(uvArr[i * 2 + 1] * (width - 1))));
    texel[i] = tx + ty * width;
  }
  // Manual bounding sphere: particles roam the seeded disc (~±radius); the
  // per-frame rewrite must not pay an O(N) sphere recompute.
  geometry.boundingSphere = new Sphere(new Vector3(0, 0, 0), 2000);
  source._r1ProtoPointsDraw = geometry;
  geometry._r1ProtoPoints = { source, texel, count, lastFrame: '', uniforms };
  return geometry;
}

function refreshProtoPointsGeometry(geometry, uniforms) {
  const data = geometry._r1ProtoPoints;
  const posTexture = uniforms.texturePosition?.value;
  const velTexture = uniforms.textureVelocity?.value;
  if (!data || !posTexture?.image?.data || !velTexture?.image?.data) return;
  const frame = gpgpuFrameKey(posTexture);
  if (frame === data.lastFrame) return;
  data.lastFrame = frame;
  const { texel, count } = data;
  const posData = posTexture.image.data;
  const velData = velTexture.image.data;
  const positions = geometry.attributes.position.array;
  const colors = geometry.attributes.color.array;
  // Radial ramp: orange core → blue rim over the live particle extent.
  let maxRadius = 1;
  for (let i = 0; i < count; i++) {
    const t = texel[i] * 4;
    const m = velData[t + 3];
    if (m <= 0) continue;
    const r = Math.sqrt(posData[t] * posData[t] + posData[t + 2] * posData[t + 2]);
    if (r > maxRadius) maxRadius = r;
  }
  const orange = [1.0, 0.45, 0.12];
  const blue = [0.36, 0.56, 1.0];
  for (let i = 0; i < count; i++) {
    const t = texel[i] * 4;
    const o = i * 3;
    const mass = velData[t + 3];
    if (mass <= 0) {
      // Dead particle: park below the frustum far plane (official discards).
      positions[o] = 0; positions[o + 1] = -1e6; positions[o + 2] = 0;
      colors[o] = 0; colors[o + 1] = 0; colors[o + 2] = 0;
      continue;
    }
    positions[o] = posData[t];
    positions[o + 1] = posData[t + 1];
    positions[o + 2] = posData[t + 2];
    const frac = Math.min(1, Math.sqrt(posData[t] * posData[t] + posData[t + 2] * posData[t + 2]) / maxRadius);
    // Mass brightness (official vColor.y = mass/250 caps the core brighter).
    const boost = Math.min(1, 0.7 + mass / 250 * 0.6);
    colors[o] = (orange[0] + (blue[0] - orange[0]) * frac) * boost;
    colors[o + 1] = (orange[1] + (blue[1] - orange[1]) * frac) * boost;
    colors[o + 2] = (orange[2] + (blue[2] - orange[2]) * frac) * boost;
  }
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;
}

function boidsShaderGeometry(source, uniforms) {
  const cached = source._r1BoidsDraw;
  if (cached) return cached;
  const position = source.attributes.position;
  const reference = source.attributes.reference;
  const birdVertex = source.attributes.birdVertex;
  if (!position || !reference || !birdVertex || reference.count < position.count) return null;
  const count = position.count;
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(count * 3), 3));
  const colors = new Float32Array(count * 3);
  const birdColor = source.attributes.birdColor;
  if (birdColor && birdColor.count >= count) {
    colors.set(birdColor.array.subarray(0, count * 3));
  } else {
    for (let i = 0; i < count * 3; i += 3) { colors[i] = 0.8; colors[i + 1] = 0.62; colors[i + 2] = 0.28; }
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  const uvAttr = source.attributes.uv;
  if (uvAttr && uvAttr.count >= count) {
    geometry.setAttribute('uv', new Float32BufferAttribute(new Float32Array(count * 2), 2));
    geometry.attributes.uv.array.set(uvAttr.array.subarray(0, count * 2));
  }
  if (source.index) geometry.setIndex(source.index.clone());
  // Flock roams ±BOUNDS (position kernel wrap); a fixed sphere avoids both a
  // per-frame O(N) recompute and a stale-sphere cull once birds fly out.
  geometry.boundingSphere = new Sphere(new Vector3(0, 0, 0), 3000);
  const template = new Float32Array(count * 3);
  template.set(position.array.subarray(0, count * 3));
  const birdVertexArr = new Float32Array(count);
  birdVertexArr.set(birdVertex.array.subarray(0, count));
  source._r1BoidsDraw = geometry;
  geometry._r1Boids = { source, template, birdVertex: birdVertexArr, count, lastFrame: '', uniforms };
  return geometry;
}

function refreshBoidsShaderGeometry(geometry, uniforms) {
  const data = geometry._r1Boids;
  const posTexture = uniforms.texturePosition?.value;
  const velTexture = uniforms.textureVelocity?.value;
  if (!data || !posTexture?.image?.data || !velTexture?.image?.data) return;
  const frame = gpgpuFrameKey(posTexture);
  if (frame === data.lastFrame) return;
  data.lastFrame = frame;
  const { template, birdVertex, count } = data;
  const width = posTexture.image.width || 1;
  const birds = width * (posTexture.image.height || 1);
  if (!birds) return;
  const perBird = Math.max(1, Math.floor(count / birds));
  const posData = posTexture.image.data;
  const velData = velTexture.image.data;
  const out = geometry.attributes.position.array;
  for (let i = 0; i < birds; i++) {
    const t = i * 4;
    const px = posData[t], py = posData[t + 1], pz = posData[t + 2];
    const phase = posData[t + 3];
    // Official birdVS: orientation basis from the normalized velocity.
    let vx = velData[t], vy = velData[t + 1], vz = -velData[t + 2];
    const velLen = Math.sqrt(vx * vx + vy * vy + vz * vz);
    if (velLen > 1e-6) { vx /= velLen; vy /= velLen; vz /= velLen; } else { vy = 1; }
    const xz = Math.sqrt(vx * vx + vz * vz) || 1e-6;
    const x = Math.sqrt(Math.max(1 - vy * vy, 1e-6));
    const cosry = vx / xz, sinry = vz / xz, cosrz = x, sinrz = vy;
    const m00 = cosry * cosrz, m01 = cosry * sinrz, m02 = sinry;
    const m10 = -sinrz, m11 = cosrz;
    const m20 = -sinry * cosrz, m21 = -sinry * sinrz, m22 = cosry;
    const flap = Math.sin(phase) * 5;
    const base = i * perBird;
    for (let j = 0; j < perBird && base + j < count; j++) {
      const v = base + j;
      const o = v * 3;
      const tx = template[o], tz = template[o + 2];
      const bv = birdVertex[v];
      const y = (bv === 4 || bv === 7) ? flap : template[o + 1];
      out[o] = m00 * tx + m01 * y + m02 * tz + px;
      out[o + 1] = m10 * tx + m11 * y + py;
      out[o + 2] = m20 * tx + m21 * y + m22 * tz + pz;
    }
  }
  geometry.attributes.position.needsUpdate = true;
}

function adaptedShaderDraw(object, viewMatrix = null) {
  const source = object.material;
  const uniforms = source.uniforms || {};
  const vertex = sourceTokens(source.vertexShader);
  const fragment = sourceTokens(source.fragmentShader);
  if (object.isPoints && uniforms.texturePosition?.value?.isDataTexture &&
    uniforms.textureVelocity?.value?.isDataTexture && object.geometry.attributes.uv) {
    // GPGPU protoplanet-style points: positions/masses live in float
    // DataTextures the CPU kernels (degrades/gpgpu_cpu_computation.mjs)
    // advance every tick; R1 draws them as vertex-colored gradient sprites.
    const geometry = protoPointsGeometry(object.geometry);
    if (geometry) {
      refreshProtoPointsGeometry(geometry, uniforms);
      adaptationWarn(source, '_r1GpgpuPointsWarned',
        'R1 draws the CPU-simulated GPGPU particles as vertex-colored radial-gradient sprites (mass → size is collapsed to one point size; color keeps the mass/core-rim ramp).');
      const material = copyShaderFlags(source, new PointsMaterial({
        size: 12, sizeAttenuation: true, vertexColors: true,
        transparent: true, opacity: 0.9, depthWrite: false,
        blending: AdditiveBlending, map: protoPointsSprite()
      }));
      return { material, geometry };
    }
  }
  const attrs = object.geometry.attributes;
  if (uniforms.texturePosition?.value?.isDataTexture &&
    uniforms.textureVelocity?.value?.isDataTexture && attrs.reference && attrs.birdVertex) {
    // GPGPU birds-style display shader: per-bird position/phase texels drive
    // an expanded vertex set. R1 evaluates the official birdVS math (wing
    // flap from the phase texel, orientation basis from the velocity texel)
    // on the CPU; colors keep the birdColor ramp.
    const geometry = boidsShaderGeometry(object.geometry);
    if (geometry) {
      refreshBoidsShaderGeometry(geometry, uniforms);
      adaptationWarn(source, '_r1BoidsWarned',
        'R1 evaluates the boids display shader on the CPU (flap + orientation); the distance-based grey falloff of birdFS is dropped in favor of the birdColor ramp.');
      return { material: basicShaderMaterial(source, { vertexColors: true }), geometry };
    }
  }
  if (uniforms.mapLeft?.value && uniforms.mapRight?.value &&
    uniforms.colorMatrixLeft?.value?.elements && uniforms.colorMatrixRight?.value?.elements &&
    vertex === ANAGLYPH_VERTEX && fragment === ANAGLYPH_FRAGMENT) {
    const material = copyShaderFlags(source, new MeshBasicMaterial({ map: uniforms.mapLeft.value }));
    material._r1NativeKind = 'anaglyph';
    material._r1Anaglyph = {
      right: uniforms.mapRight.value,
      left: uniforms.colorMatrixLeft.value.elements,
      rightMatrix: uniforms.colorMatrixRight.value.elements
    };
    return { material, geometry: object.geometry };
  }
  if (uniforms.tDiffuse?.value && vertex === RTT_VERTEX && fragment === RTT_SCREEN_FRAGMENT) {
    const material = copyShaderFlags(source, new MeshBasicMaterial({ map: uniforms.tDiffuse.value }));
    return { material, geometry: object.geometry };
  }
  const instancedKind = object.geometry.isInstancedBufferGeometry && attrs.offset && attrs.orientationStart ? 'instancing' :
    object.geometry.isInstancedBufferGeometry && attrs.translate ? 'billboards' : null;
  if (instancedKind) {
    // The expanded geometry must be STABLE across frames: a fresh
    // BufferGeometry per call gets a fresh resource id and re-sends the full
    // position/color/uv payload every render (measured: billboards re-uploaded
    // ~1.3MB per frame, presentedFps 10). Cache on the source geometry; the
    // refresh signature below decides whether the contents actually moved.
    const cachedDraw = object.geometry._r1ShaderDraw;
    const geometry = cachedDraw && cachedDraw._r1Instanced.kind === instancedKind
      ? cachedDraw
      : instancedShaderGeometry(object.geometry, instancedKind);
    if (geometry) {
      if (geometry !== cachedDraw) object.geometry._r1ShaderDraw = geometry;
      refreshInstancedShaderGeometry(geometry, uniforms, object, viewMatrix);
      adaptationWarn(source, '_r1InstancedShaderWarned',
        `R1 CPU-evaluates at most 2048 ${instancedKind} instances; billboard view alignment is exact but instance counts above the cap are not drawn.`);
      return { material: basicShaderMaterial(source, { map: uniforms.map?.value, vertexColors: true }), geometry };
    }
  }
  if (attrs.id && fragment.includes('out_id=vid')) {
    adaptationWarn(source, '_r1IntegerPickingWarned',
      'R1 renders the picking geometry as vertex-colored RGBA8; integer ID readback is not retained.');
    return { material: basicShaderMaterial(source, { vertexColors: !!attrs.color }), geometry: object.geometry };
  }
  if (source.name === 'GPUComputationShader') {
    adaptationWarn(source, '_r1GpuComputationWarned',
      'R1 lowers GPU computation passes to bounded texture copies/neutral draws; arbitrary compute math is dropped.');
    const material = basicShaderMaterial(source, { map: firstShaderTexture(uniforms) });
    material._r1ShaderTextures = shaderTextureList(uniforms);
    return { material, geometry: object.geometry };
  }
  if (source.extensions?.clipCullDistance && attrs.color) {
    adaptationWarn(source, '_r1ClipCullWarned',
      'R1 keeps clip-cull vertex colors and positions; the shader clip-distance plane is dropped.');
    return { material: basicShaderMaterial(source, { vertexColors: true }), geometry: object.geometry };
  }
  if (object.isSky || (source.name === 'SkyShader' && fragment.includes('vWorldPosition'))) {
    adaptationWarn(source, '_r1SkyWarned', 'R1 renders the Sky bounds with a bounded atmospheric-blue material.');
    return { material: basicShaderMaterial(source, { color: 0x87ceeb }), geometry: object.geometry };
  }
  if (attrs.position && attrs.color && fragment.includes('vColor') && vertex.includes('vPosition=position')) {
    const geometry = timeColorGeometry(object.geometry);
    if (geometry) {
      geometry._r1Time = uniforms.time;
      refreshTimeColorGeometry(geometry, Number(uniforms.time?.value || 0));
      adaptationWarn(source, '_r1VertexColorShaderWarned',
        'R1 evaluates the bounded position/color shader on the CPU, including its animated red channel.');
      return { material: basicShaderMaterial(source, { vertexColors: true }), geometry };
    }
  }
  if (attrs.position && attrs.normal && attrs.displacement && uniforms.amplitude && uniforms.colorTexture?.value) {
    const geometry = displacedShaderGeometry(object.geometry, Number(uniforms.amplitude.value));
    if (geometry) {
      geometry._r1Amplitude = uniforms.amplitude;
      adaptationWarn(source, '_r1CustomAttributesWarned',
        'R1 evaluates custom displacement on the CPU and keeps the grayscale detail as its base map.');
      return { material: basicShaderMaterial(source, { map: uniforms.colorTexture.value, color: uniforms.color?.value || 0xffffff }), geometry };
    }
  }
  if (fragment.includes('vec4color=vec4(vColor)') && attrs.position && attrs.color) {
    const geometry = timeColorGeometry(object.geometry);
    if (geometry) {
      geometry._r1Time = uniforms.time;
      refreshTimeColorGeometry(geometry, Number(uniforms.time?.value || 0));
      return { material: basicShaderMaterial(source, { vertexColors: true }), geometry };
    }
  }
  if (fragment.includes('vec3rand3=vec3(rand(vUv)') || fragment.includes('vec2rand2=vec2(rand(vUv)') || fragment.includes('gl_FragColor.xyz=vec3(rand(vUv))')) {
    adaptationWarn(source, '_r1NoiseShaderWarned', 'R1 bakes the bounded procedural noise shader into a 128x128 native texture.');
    return { material: basicShaderMaterial(source, { map: shaderNoiseTexture(fragment) }), geometry: object.geometry };
  }
  if (fragment.includes('e=400.0*(p.x*0.5+0.5)') && uniforms.time) {
    adaptationWarn(source, '_r1MonjoriWarned', 'R1 bakes one bounded 64x64 Monjori shader frame; subsequent time updates are not resampled.');
    return { material: basicShaderMaterial(source, { map: monjoriTexture(Number(uniforms.time.value)) }), geometry: object.geometry };
  }
  if (fragment.includes('pointLightsCount') && vertex.includes('vPositionEye')) {
    adaptationWarn(source, '_r1UboArrayWarned', 'R1 retains UBO-array geometry with a neutral base material; shader-only light arrays are dropped.');
    return { material: basicShaderMaterial(source), geometry: object.geometry };
  }
  if (Object.keys(uniforms).length === 0 && vertex.includes('vNormal') && fragment.includes('vNormal')) {
    adaptationWarn(source, '_r1NormalShaderWarned',
      'R1 lowers this normal shader to MeshNormalMaterial; UV-only color terms are dropped.');
    return { material: copyShaderFlags(source, new MeshNormalMaterial()), geometry: object.geometry };
  }
  const shaderTexture = firstShaderTexture(uniforms);
  const pendingTexture = Object.entries(uniforms).some(([name, uniform]) => uniform && uniform.value == null &&
    fragment.includes(name) && /sampler(?:2D|Cube|3D)/.test(fragment));
  if (shaderTexture || pendingTexture) {
    adaptationWarn(source, '_r1TextureShaderWarned',
      'R1 lowers this textured shader to its first bound texture; custom lighting, raymarch and postprocess math are dropped.');
    const material = basicShaderMaterial(source, { map: shaderTexture?.isCubeTexture ? null : shaderTexture,
      color: uniforms.color?.value?.isColor ? uniforms.color.value : 0xffffff });
    if (shaderTexture?.isCubeTexture) material.envMap = shaderTexture;
    material._r1ShaderTextures = shaderTextureList(uniforms);
    if (pendingTexture && !shaderTexture) adaptationWarn(source, '_r1PendingTextureWarned',
      'R1 renders a neutral pass until this shader sampler is bound.');
    if (object.isPoints) {
      // Procedural point sprites (protoplanet-style gl_PointCoord radial
      // falloff) lose their entire fragment math in the bounded lowering and
      // read as flat squares. Synthesize the one bounded sprite shape they
      // universally encode — a radial alpha falloff — as a cached 64x64 RGBA8
      // texture so the glow survives; per-particle color still flows through
      // the geometry color attribute.
      const proceduralSprite = /gl_PointCoord/.test(fragment) && /length\s*\(/.test(fragment) &&
        !(material.map);
      if (proceduralSprite) {
        adaptationWarn(source, '_r1PointSpriteWarned',
          'R1 approximates this procedural gl_PointCoord falloff with a cached radial sprite texture; custom per-point math is dropped.');
      }
      return { geometry: object.geometry, material: new PointsMaterial({
        color: material.color, size: 4, sizeAttenuation: true,
        map: proceduralSprite ? radialPointSpriteTexture() : material.map,
        vertexColors: !!object.geometry.attributes.color,
        transparent: material.transparent || proceduralSprite,
        blending: material.blending, opacity: material.opacity
      }) };
    }
    return { material, geometry: object.geometry };
  }
  if (uniforms.color?.value?.isColor && vertex.includes('position')) {
    adaptationWarn(source, '_r1ColorShaderWarned', 'R1 retains the bounded shader color and geometry; custom lighting is dropped.');
    return { material: basicShaderMaterial(source, { color: uniforms.color.value, vertexColors: !!attrs.color }), geometry: object.geometry };
  }
  if (uniforms.time && vertex === RTT_VERTEX && fragment === RTT_PROCEDURAL_FRAGMENT) {
    const material = copyShaderFlags(source, new MeshBasicMaterial({ vertexColors: true }));
    const geometry = proceduralRttGeometry(object.geometry, uniforms.time.value);
    if (!geometry) return null;
    material._r1ProceduralTime = uniforms.time;
    return { material, geometry };
  }
  return null;
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
  if (material.isMeshDepthMaterial && (material.map || material.alphaMap)) {
    adaptationWarn(material, '_r1DepthMaterialMapsWarned',
      'R1 drops MeshDepthMaterial map/alphaMap (depth output is untextured grayscale view depth).');
  }
  if (material.wireframe && (material.wireframeLinewidth !== 1 || material.wireframeLinecap !== 'round' || material.wireframeLinejoin !== 'round')) unsupported('wireframeStyle', 'R1 supports one-pixel round wireframe lines');
  if (material.blending === CustomBlending) {
    adaptationWarn(material, '_r1CustomBlendingWarned',
      'R1 drops custom blend factors/equations and uses normal alpha blending.');
  }
  const droppedState = [
    material.alphaHash ? 'alphaHash' : null,
    material.premultipliedAlpha ? 'premultipliedAlpha' : null
  ].filter(Boolean);
  if (droppedState.length) {
    adaptationWarn(material, '_r1MaterialStateWarned',
      `R1 drops ${droppedState.join(', ')}; base color/depth rendering remains active.`);
  }
  // R1 v8: colorWrite=false and the Material.stencil* state encode into the
  // material flags/tail (MATERIAL_FLAG_COLOR_WRITE_OFF, MATERIAL_FLAG_STENCIL
  // + the stencil tail), so they no longer belong in the dropped set.
  if (material.polygonOffset && !material._r1PolygonOffsetWarned) {
    // DecalGeometry enables polygon offset after the click. R1 has no factor/
    // units depth-state lane; keep drawing the decal with the base depth state
    // instead of rejecting every subsequent animation frame.
    material._r1PolygonOffsetWarned = true;
    console.warn('three: R1 drops material.polygonOffset (depth bias stays disabled).');
  }
  if (Object.prototype.hasOwnProperty.call(material, 'onBeforeCompile')) {
    adaptationWarn(material, '_r1OnBeforeCompileWarned',
      'R1 does not execute material.onBeforeCompile; the unmodified native material is rendered.');
  }
  // Detail slots without a native texture binding are peeled once, while the
  // base color/PBR/normal detail remains visible. In particular aoMap is an
  // optional glTF occlusion input, not a reason to discard the entire model.
  const droppedMaps = ['specularMap', 'lightMap', 'aoMap', 'emissiveMap',
    'clearcoatMap', 'transmissionMap'];
  if (!material.isMeshNormalMaterial) droppedMaps.push('displacementMap');
  for (const name of droppedMaps) {
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

function writeLightProbeColor(coefficients, x, y, z, intensity, output, offset) {
  for (let c = 0; c < 3; c++) {
    const component = vector => c === 0 ? vector.x : c === 1 ? vector.y : vector.z;
    let value = component(coefficients[0]) * 0.886227;
    value += component(coefficients[1]) * 2 * 0.511664 * y;
    value += component(coefficients[2]) * 2 * 0.511664 * z;
    value += component(coefficients[3]) * 2 * 0.511664 * x;
    value += component(coefficients[4]) * 2 * 0.429043 * x * y;
    value += component(coefficients[5]) * 2 * 0.429043 * y * z;
    value += component(coefficients[6]) * (0.743125 * z * z - 0.247708);
    value += component(coefficients[7]) * 2 * 0.429043 * x * z;
    value += component(coefficients[8]) * 0.429043 * (x * x - y * y);
    value *= intensity / Math.PI;
    requireFinite(value, 'light probe coefficient');
    output[offset + c] = value;
  }
}

function lineLoopGeometry(source) {
  const position = source.attributes.position;
  if (!position) return null;
  const indices = sourceIndices(source, position.count);
  if (indices.length < 2) return null;
  if (indices.length > 2000000) throw new Error('three.invalid: LineLoop vertex quota');
  const color = source.attributes.color;
  const positions = new Float32Array(indices.length * 6);
  const colors = color ? new Float32Array(indices.length * 6) : null;
  for (let i = 0; i < indices.length; i++) {
    const a = indices[i], b = indices[(i + 1) % indices.length];
    for (let c = 0; c < 3; c++) {
      positions[i * 6 + c] = position.getComponent(a, c);
      positions[i * 6 + 3 + c] = position.getComponent(b, c);
      if (color) {
        colors[i * 6 + c] = color.getComponent(a, c);
        colors[i * 6 + 3 + c] = color.getComponent(b, c);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  if (colors) geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
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

function installExampleGradientFacade(canvas) {
  const document = canvas.ownerDocument;
  if (!document || document._r1GradientFacade) return;
  document._r1GradientFacade = true;
  const augment = local => {
    if (!local || local._r1GradientFacade || typeof local.getContext !== 'function') return local;
    local._r1GradientFacade = true;
    const getContext = local.getContext;
    local.getContext = function(type, ...args) {
      const context = getContext.call(this, type, ...args);
      if (type !== '2d' || !context) return context;
      context.createLinearGradient = (x0, y0, x1, y1) => {
        finiteArray([x0, y0, x1, y1], 'linear gradient');
        const gradient = { _r1LinearGradient: true, _r1Color: '#000000', _r1Distance: Infinity };
        gradient.addColorStop = (offset, value) => {
          requireFinite(offset, 'linear gradient offset');
          if (offset < 0 || offset > 1) throw new Error('three.invalid: linear gradient offset');
          const distance = Math.abs(offset - 0.5);
          if (distance < gradient._r1Distance) {
            gradient._r1Distance = distance;
            gradient._r1Color = value;
          }
        };
        return gradient;
      };
      let styleOwner = context;
      let styleDescriptor = null;
      while (styleOwner && !styleDescriptor) {
        styleDescriptor = Object.getOwnPropertyDescriptor(styleOwner, 'fillStyle');
        styleOwner = Object.getPrototypeOf(styleOwner);
      }
      if (styleDescriptor?.get && styleDescriptor?.set) {
        Object.defineProperty(context, 'fillStyle', {
          configurable: true,
          enumerable: styleDescriptor.enumerable,
          get() { return styleDescriptor.get.call(this); },
          set(value) {
            const gradient = value?._r1LinearGradient ? value : null;
            if (gradient) {
              adaptationWarn(canvas, '_r1LinearGradientWarned',
                'R1 reduces example-canvas linear gradients to their midpoint color.');
              value = gradient._r1Color;
            }
            styleDescriptor.set.call(this, value);
          }
        });
      }
      const fillRect = context.fillRect;
      context.fillRect = function(...rect) {
        const style = this.fillStyle;
        if (!style?._r1LinearGradient) return fillRect.apply(this, rect);
        adaptationWarn(canvas, '_r1LinearGradientWarned',
          'R1 reduces example-canvas linear gradients to their midpoint color.');
        this.fillStyle = style._r1Color;
        try {
          return fillRect.apply(this, rect);
        } finally {
          this.fillStyle = style;
        }
      };
      return context;
    };
    return local;
  };
  for (const name of ['createElement', 'createElementNS']) {
    const create = document[name];
    if (typeof create === 'function') document[name] = function(...args) {
      return augment(create.apply(this, args));
    };
  }
}

export class JsrWebGLRenderer {
  constructor(parameters = {}) {
    this.isWebGLRenderer = true;
    this.isJsrThreeRenderer = true;
    this.runtime = parameters.runtime || getThreeRuntime(false);
    if (parameters.context != null) unsupported('rawWebGL', 'native R1 does not accept a caller-provided GL context');
    const canvas = parameters.canvas || this.runtime.createCanvas('main');
    if (!canvas.isJsrThreeCanvas) unsupported('canvas', 'native WebGLRenderer requires jsr.three.createCanvas()');
    if (canvas.renderer && canvas.renderer !== this && !canvas.renderer._disposed) {
      return canvas.renderer._reuseForParameters(parameters);
    }
    this.domElement = canvas;
    canvas.renderer = this;
    installExampleGradientFacade(canvas);
    let neutralPixels = null;
    Object.defineProperty(canvas, '_examplePixels', {
      configurable: true,
      get: () => {
        adaptationWarn(this, '_r1CanvasReadbackWarned',
          'R1 provides neutral RGBA to example canvas readback; GPU pixels remain on the host.');
        const width = canvas.width, height = canvas.height;
        if (!neutralPixels || neutralPixels.width !== width || neutralPixels.height !== height) {
          neutralPixels = { width, height, data: new Uint8ClampedArray(width * height * 4) };
        }
        return neutralPixels;
      }
    });
    this.capabilities = Object.assign({}, this.runtime.capabilities, {
      rawWebGL: false,
      isWebGL2: false,
      backend: 'flutterGpu',
      features: Object.freeze({ geometry: true, textures: true, lambert: true, standard: true, phong: true, normal: true, emissive: true, hemisphereLight: true, spotLight: true, clipping: true, wireframe: true, toneMapping: true, fogExp2: true, textureTransform: true, alphaMap: true, envMap: true, sprite: true, pointLightShadow: true, toonMaterial: true, matcapMaterial: true, cubeEnvMap: true, dataTexture: true, rawWebGL: false, shaderMaterial: false })
    });
    this.extensions = {
      has: name => ['WEBGL_clip_cull_distance', 'WEBGL_compressed_texture_astc',
        'WEBGL_compressed_texture_etc1', 'WEBGL_compressed_texture_etc',
        'WEBGL_compressed_texture_s3tc', 'WEBGL_compressed_texture_pvrtc'].includes(name),
      get: name => this.getContext().getExtension(name)
    };
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
    const ignoredState = name => adaptationWarn(this, `_r1State_${name}`,
      `R1 ignores renderer.state.${name} compatibility writes.`);
    const stateBuffer = name => {
      const ignore = () => ignoredState(name);
      return { setMask: ignore, setLocked: ignore, setTest: ignore,
        setOp: ignore, setFunc: ignore, setClear: ignore, getReversed: () => false };
    };
    this.state = { buffers: {
      depth: stateBuffer('buffers.depth'), color: stateBuffer('buffers.color'), stencil: stateBuffer('buffers.stencil')
    } };
    this.coordinateSystem = WebGLCoordinateSystem;
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
    this._animationBatch = null;
    // Pending per-task envelope batch (see _emit); null outside a task.
    this._renderBatch = null;
    this._pendingDisposals = [];
    this._resources = new Map();
    this._renderTargets = new Map();
    this._renderTargetDisposers = new Map();
    this._renderTarget = null;
    this._activeCubeFace = 0;
    this._activeMipmapLevel = 0;
    this._clearFlags = 0;
    // R1 v8 stencil-lane walk state: the in-flight command stream (for
    // clearStencil() during onAfterRender), the node id whose draw upstream
    // would follow with the callback, and the per-frame "scene touches
    // stencil" marker that gates the FRAME_TARGET_FLAGS.clearStencil bit.
    this._walkCommands = null;
    this._walkAfterRenderNodeId = 0;
    this._frameStencilActivity = false;
    this._viewport = { x: 0, y: 0, z: this._width, w: this._height };
    this._scissor = { x: 0, y: 0, z: this._width, w: this._height };
    this._scissorTest = false;
    this._geometryModes = new Map();
    this._geometryResourceKeys = new Map();
    this._geometryResourceOwners = new Map();
    this._nextGeometryAlias = 0x80000000;
    this._canvasTextures = new Map();
    this._canvasRefreshHandle = null;
    this._adaptedLineDraws = new WeakMap();
    this._adaptedShaderDraws = new WeakMap();
    // Per-source-material bounded-shader lowering cache (see _adaptShaderDraw).
    this._adaptedBoundedShaderDraws = new WeakMap();
    this._batchedMeshProxies = new WeakMap();
    this._instancedMorphProxies = new WeakMap();
    this._nodeFast = new WeakMap();
    this._frameGeometryGate = new Map();
    this._geometryGateStamp = new WeakMap();
    this._lastScene = null;
    this._lastCamera = null;
    this._state = canvas._r1State || (canvas._r1State = {
      sequence: 0,
      geometries: new Map(), textures: new Map(), materials: new Map(),
      nodes: new Map(), batches: new Map(), lights: new Map(), cameras: new Map(),
      clippings: new Map(), renderTargets: new Map()
    });
    this._depthParameterWarnings = new Set();
    this._warnDepthParameters(parameters);
  }

  _warnDepthParameters(parameters) {
    for (const name of ['logarithmicDepthBuffer', 'reversedDepthBuffer']) {
      if (!parameters[name] || this._depthParameterWarnings.has(name)) continue;
      this._depthParameterWarnings.add(name);
      console.warn(`three: R1 ${name} is unavailable; this renderer uses standard native depth.`);
    }
  }

  _reuseForParameters(parameters) {
    adaptationWarn(this, '_r1SharedRendererWarned',
      'R1 shares one standard-depth renderer for this canvas; sequential viewport/scissor/target passes are preserved.');
    this._warnDepthParameters(parameters);
    return this;
  }

  getContext() {
    if (this._boundedGL) return this._boundedGL;
    let boundBuffer = null;
    this._boundedGL = {
      ARRAY_BUFFER: 34962, STATIC_DRAW: 35044, FLOAT: 5126, UNSIGNED_BYTE: 5121,
      createBuffer: () => ({ _r1Data: null }),
      bindBuffer: (target, buffer) => { if (target === 34962) boundBuffer = buffer; },
      bufferData: (target, data, usage) => {
        if (target !== 34962 || !boundBuffer || !ArrayBuffer.isView(data)) unsupported('rawWebGL', 'bounded bufferData requires an ARRAY_BUFFER typed array');
        boundBuffer._r1Data = data;
      },
      getExtension: name => name === 'WEBGL_clip_cull_distance' ? { CLIP_DISTANCE0_WEBGL: 0 } : null,
      enable: () => {}
    };
    return this._boundedGL;
  }
  getContextAttributes() { return { alpha: true, antialias: false, depth: true, stencil: false }; }
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
    this._viewport = { x: 0, y: 0, z: width, w: height };
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

  _rectangle(x, y, width, height) {
    const rect = x?.isVector4 ? { x: x.x, y: x.y, z: x.z, w: x.w } : { x, y, z: width, w: height };
    for (const value of [rect.x, rect.y, rect.z, rect.w]) requireFinite(value, 'renderer rectangle');
    if (rect.x < 0 || rect.y < 0 || rect.z < 0 || rect.w < 0) unsupported('renderRect', 'R1 rectangles must be nonnegative');
    return rect;
  }

  setViewport(x, y, width, height) { this._viewport = this._rectangle(x, y, width, height); }
  getViewport(target) { return target.copy(new Vector4(this._viewport.x, this._viewport.y, this._viewport.z, this._viewport.w)); }
  setScissor(x, y, width, height) { this._scissor = this._rectangle(x, y, width, height); }
  getScissor(target) { return target.copy(new Vector4(this._scissor.x, this._scissor.y, this._scissor.z, this._scissor.w)); }
  setScissorTest(value) { this._scissorTest = !!value; }
  getScissorTest() { return this._scissorTest; }
  setEffects(effects) {
    this._effects = Array.isArray(effects) ? effects.slice() : [];
    if (this._effects.length) adaptationWarn(this, '_r1EffectsWarned',
      'R1 ignores renderer.setEffects passes; the direct scene draw is retained.');
  }
  setRenderTarget(target, activeCubeFace = 0, activeMipmapLevel = 0) {
    // Validate before mutating renderer state: a rejected target must not
    // poison the next otherwise-valid frame.
    if (target) this._validateRenderTarget(target);
    this._renderTarget = target || null;
    if (target?.texture) {
      target.texture.renderTarget = target;
      if (target.depthTexture) target.depthTexture.renderTarget = target;
    }
    this._activeCubeFace = activeCubeFace;
    this._activeMipmapLevel = activeMipmapLevel;
    if (activeCubeFace) adaptationWarn(this, '_r1CubeTargetWarned',
      'R1 reuses the bounded 2D target for cube-camera faces; separate face storage is dropped.');
  }
  getRenderTarget() { return this._renderTarget; }
  getActiveCubeFace() { return this._activeCubeFace; }
  getActiveMipmapLevel() { return this._activeMipmapLevel; }
  readRenderTargetPixels(target, x, y, width, height, buffer) {
    if (!target?.isRenderTarget || !buffer || typeof buffer.length !== 'number') {
      throw new Error('three.invalid: readRenderTargetPixels requires a target and typed output buffer');
    }
    adaptationWarn(this, '_r1ReadbackWarned',
      'R1 target readback is a bounded neutral fallback; GPU pixels are not returned to JavaScript.');
    const fill = buffer instanceof Int32Array || buffer instanceof Uint32Array ? -1 : 0;
    buffer.fill(fill);
  }
  readRenderTargetPixelsAsync(target, x, y, width, height, buffer) {
    this.readRenderTargetPixels(target, x, y, width, height, buffer);
    return Promise.resolve();
  }
  clear(color = true, depth = true, stencil = false) {
    if (color) this._clearFlags |= FRAME_TARGET_FLAGS.clearColor;
    if (depth) this._clearFlags |= FRAME_TARGET_FLAGS.clearDepth;
    if (stencil) this._clearFlags |= FRAME_TARGET_FLAGS.clearStencil;
  }
  clearDepth() { this.clear(false, true); }
  clearColor() { this.clear(true, false); }
  // Upstream clears the stencil buffer immediately; R1 records the intent:
  // inside a render walk the OPCODE.STENCIL_CLEAR marker lands at the
  // current stream position (bound to the onAfterRender node when the walk
  // is invoking one), outside a walk a value of 0 rides the next FRAME's
  // FRAME_TARGET_FLAGS.clearStencil bit and non-zero values emit a
  // standalone marker envelope.
  clearStencil(value = 0) {
    if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
      throw new Error('three.invalid: stencil clear value must be a u32');
    }
    if (this._walkCommands) {
      this._walkCommands.push(stencilClearCommand(this._walkAfterRenderNodeId, value));
      this._frameStencilActivity = true;
      return;
    }
    if (value === 0) {
      this._clearFlags |= FRAME_TARGET_FLAGS.clearStencil;
      return;
    }
    this._emit([stencilClearCommand(0, value)]);
  }

  // Upstream copies GPU framebuffer pixels into a FramebufferTexture for the
  // next frame's sampling (webgl_framebuffer_texture). R1 keeps pixels on the
  // host, so the bounded lane fabricates the neutral CPU copy the sampler
  // lane reads (identical contract to readRenderTargetPixels) and renders the
  // base scene without error spam. GPU-true feedback stays explicitly absent.
  copyFramebufferToTexture(texture, position = null, level = 0) {
    if (!texture || !texture.isFramebufferTexture) {
      throw new Error('three.invalid: copyFramebufferToTexture expects a FramebufferTexture');
    }
    if (level !== 0) unsupported('textureMipmap', 'R1 copies framebuffer level 0 only');
    if (position !== null && (!Number.isFinite(position.x) || !Number.isFinite(position.y))) {
      throw new Error('three.invalid: copyFramebufferToTexture position must be finite');
    }
    const width = Math.floor(texture.image?.width || 0);
    const height = Math.floor(texture.image?.height || 0);
    if (width <= 0 || height <= 0 || width > 4096 || height > 4096) {
      throw new Error('three.invalid: FramebufferTexture size is outside the bounded range');
    }
    if (!texture.image.data || texture.image.data.length !== width * height * 4) {
      texture.image = { width, height, data: new Uint8Array(width * height * 4), encoding: 0, encoded: false };
      adaptationWarn(this, '_r1FramebufferCopyWarned',
        'R1 lowers copyFramebufferToTexture to a bounded neutral copy; GPU frame pixels are not returned to JavaScript.');
      texture.needsUpdate = true;
    }
  }

  // Upstream texSubImage-style copy. R1 has no GPU-side copies, so the bounded
  // lane edits CPU-side texture bytes (same format/type, Uint8Array storage)
  // and flags the destination for a full re-upload. Data3DTexture partial
  // updates (webgl_texture3d_partialupdate) ride exactly this lane; GPU-only
  // sources degrade loudly instead of failing the animation loop.
  copyTextureToTexture(srcTexture, dstTexture, srcRegion = null, dstPosition = null, srcLevel = 0, dstLevel = 0) {
    if (!srcTexture || !srcTexture.isTexture || !dstTexture || !dstTexture.isTexture) {
      throw new Error('three.invalid: copyTextureToTexture requires source and destination textures');
    }
    if (srcLevel !== 0 || dstLevel !== 0) unsupported('textureMipmap', 'R1 copies texture level 0 only');
    const srcImage = srcTexture.image;
    const dstImage = dstTexture.image;
    if (!srcImage || !(srcImage.data instanceof Uint8Array) ||
        !dstImage || !(dstImage.data instanceof Uint8Array) || srcTexture.type !== dstTexture.type) {
      unsupported('copyTextureToTexture',
        'R1 copies CPU-side Uint8Array textures of matching type only; GPU-side copies stay on the host');
    }
    // r186 Data3DTexture inherits the RGBAFormat default, so generated R8
    // volumes (webgl_texture3d_partialupdate) carry a mislabeled source format.
    // Trust the byte layout for the 1-byte-per-texel R8 lane; everything else
    // must match formats exactly.
    const formatMismatch = srcTexture.format !== dstTexture.format &&
      !(dstTexture.format === RedFormat && srcTexture.format === RGBAFormat &&
        srcImage.data.length === srcImage.width * srcImage.height * (srcImage.depth || 1));
    if (formatMismatch) {
      unsupported('copyTextureToTexture',
        'R1 copies CPU-side Uint8Array textures with matching format or matching R8 byte layout only; GPU-side copies stay on the host');
    }
    let width, height, depth, minX = 0, minY = 0, minZ = 0;
    if (srcRegion !== null) {
      if (!srcRegion.min || !srcRegion.max || !Number.isFinite(srcRegion.min.x) ||
          !Number.isFinite(srcRegion.min.y) || !Number.isFinite(srcRegion.max.x) || !Number.isFinite(srcRegion.max.y) ||
          (srcRegion.isBox3 && !Number.isFinite(srcRegion.max.z))) {
        throw new Error('three.invalid: copyTextureToTexture region');
      }
      width = srcRegion.max.x - srcRegion.min.x;
      height = srcRegion.max.y - srcRegion.min.y;
      depth = srcRegion.isBox3 ? srcRegion.max.z - srcRegion.min.z : 1;
      minX = srcRegion.min.x;
      minY = srcRegion.min.y;
      minZ = srcRegion.isBox3 ? srcRegion.min.z : 0;
    } else {
      width = srcImage.width;
      height = srcImage.height;
      depth = (srcTexture.isData3DTexture || srcTexture.isDataArrayTexture) ? srcImage.depth : 1;
    }
    const dstX = dstPosition ? dstPosition.x : 0;
    const dstY = dstPosition ? dstPosition.y : 0;
    const dstZ = dstPosition ? (dstPosition.z || 0) : 0;
    const sourceDepth = (srcTexture.isData3DTexture || srcTexture.isDataArrayTexture) ? srcImage.depth : 1;
    const destinationDepth = (dstTexture.isData3DTexture || dstTexture.isDataArrayTexture) ? dstImage.depth : 1;
    // `image.data` must hold RAW texel bytes of the declared layout. An
    // encoded (JPEG/PNG) upload keeps its compressed blob in `data`, so
    // indexing it in texel units would scribble garbage across compressed
    // bytes (and RangeError at `set`). Degrade loudly for those instead.
    const byteLayoutOk = image =>
      image.data.length === image.width * image.height * (image.depth || 1) * 4 ||
      image.data.length === image.width * image.height * (image.depth || 1);
    if (!byteLayoutOk(srcImage) || !byteLayoutOk(dstImage)) {
      unsupported('copyTextureToTexture',
        'R1 copies raw CPU-side texel bytes only; an encoded texture blob cannot receive partial updates without a CPU decode');
    }
    if (!Number.isInteger(width) || !Number.isInteger(height) || !Number.isInteger(depth) ||
        width <= 0 || height <= 0 || depth <= 0 ||
        minX + width > srcImage.width || minY + height > srcImage.height || minZ + depth > sourceDepth ||
        dstX + width > dstImage.width || dstY + height > dstImage.height || dstZ + depth > destinationDepth ||
        !Number.isInteger(dstX) || !Number.isInteger(dstY) || !Number.isInteger(dstZ)) {
      throw new Error('three.invalid: copyTextureToTexture region is outside the source or destination texture');
    }
    const srcTexelBytes = srcImage.data.length /
      (srcImage.width * srcImage.height * (srcImage.depth || 1));
    const dstTexelBytes = dstImage.data.length /
      (dstImage.width * dstImage.height * (dstImage.depth || 1));
    if (srcTexelBytes !== dstTexelBytes) {
      unsupported('copyTextureToTexture',
        'R1 copies between matching texel byte widths only');
    }
    const srcImageStride = srcImage.width * srcImage.height * srcTexelBytes;
    const dstImageStride = dstImage.width * dstImage.height * dstTexelBytes;
    for (let z = 0; z < depth; z++) {
      const srcLayer = (minZ + z) * srcImageStride;
      const dstLayer = (dstZ + z) * dstImageStride;
      for (let y = 0; y < height; y++) {
        const srcStart = srcLayer +
          ((minY + y) * srcImage.width + minX) * srcTexelBytes;
        const dstStart = dstLayer +
          ((dstY + y) * dstImage.width + dstX) * dstTexelBytes;
        const rowBytes = width * srcTexelBytes;
        dstImage.data.set(
          srcImage.data.subarray(srcStart, srcStart + rowBytes),
          dstStart,
        );
      }
    }
    adaptationWarn(this, '_r1TextureCopyWarned',
      'R1 lowers copyTextureToTexture to CPU-side bytes plus a full destination re-upload; partial GPU updates are not retained.');
    dstTexture.needsUpdate = true;
  }

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
      this._animationBatch = { commands: [] };
      try {
        callback(time);
      } finally {
        const batch = this._animationBatch;
        this._animationBatch = null;
        this._flushBatch(batch);
      }
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
      encoded: false,
      // Texture.clone() shares Source but not userData. Keep the bounded
      // canvas association on the raw image so clones remain uploadable after
      // the original CanvasTexture adopts its RGBA pixels.
      _r1Canvas2D: canvas
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
    if (isNativeCanvas2D(texture.image?._r1Canvas2D)) return texture.image._r1Canvas2D;
    if (!texture.isCanvasTexture) return null;
    const canvas = texture.userData && texture.userData.jsrCanvas2D;
    return isNativeCanvas2D(canvas) ? canvas : null;
  }

  _validateRenderTarget(target) {
    const texture = target?.texture;
    if (!target?.isRenderTarget || !texture ||
        (target.depth !== 1 && !target.isWebGLArrayRenderTarget)) {
      unsupported('renderTarget', 'R1 supports one bounded color surface per pass');
    }
    if (target.textures?.length > 1) {
      adaptationWarn(target, '_r1MultipleTargetWarned',
        'R1 retains only MRT attachment 0; additional attachments and split normal output are omitted.');
    }
    if (target.isWebGLArrayRenderTarget) {
      adaptationWarn(target, '_r1ArrayTargetWarned',
        'R1 reduces this array render target to one 2D RGBA8 layer; layer selection and remaining layers are omitted.');
    }
    const formats = target.isWebGLArrayRenderTarget ? [RGBAFormat, RedFormat] : [RGBAFormat, RGBAIntegerFormat];
    if (!formats.includes(texture.format) ||
      ![UnsignedByteType, HalfFloatType, FloatType, IntType].includes(texture.type) || texture.flipY ||
      (texture.mapping !== UVMapping && !(target.isWebGLCubeRenderTarget && texture.mapping === CubeReflectionMapping))) {
      unsupported('renderTargetTexture', 'R1 targets require a bounded RGBA color attachment');
    }
    if (target.isWebGLCubeRenderTarget) adaptationWarn(target, '_r1CubeTargetStorageWarned',
      'R1 stores a WebGLCubeRenderTarget as one bounded 2D color target; face sampling is approximated.');
    if (texture.type !== UnsignedByteType || texture.format !== RGBAFormat) {
      adaptationWarn(target, '_r1TargetPrecisionWarned',
        'R1 stores this render target as RGBA8; floating-point/integer precision is not retained.');
    }
    if (texture.generateMipmaps || texture.colorSpace === SRGBColorSpace) {
      adaptationWarn(target, '_r1TargetTextureStateWarned',
        'R1 drops target mipmaps and stores target samples in the native linear RGBA8 attachment.');
    }
    if (![NearestFilter, LinearFilter].includes(texture.magFilter)) {
      unsupported('renderTargetFilter', 'R1 target magnification supports nearest/linear only');
    }
    if (![NearestFilter, LinearFilter, NearestMipmapNearestFilter, NearestMipmapLinearFilter,
      LinearMipmapNearestFilter, LinearMipmapLinearFilter].includes(texture.minFilter)) {
      unsupported('renderTargetFilter', 'R1 target sampling supports nearest/linear filtering only');
    }
    if (texture.minFilter !== NearestFilter && texture.minFilter !== LinearFilter) {
      adaptationWarn(target, '_r1TargetMipmapFilterWarned',
        'R1 samples the target base level with linear filtering; mip levels are not generated.');
    }
    if (target.samples || target.stencilBuffer || target.depthTexture) {
      adaptationWarn(target, '_r1TargetAttachmentWarned',
        'R1 uses one non-multisampled color/depth pass; stencil, multisample resolve and depth-texture precision are approximated.');
    }
    const pixels = target.width * target.height;
    if (!Number.isFinite(target.width) || !Number.isFinite(target.height) || target.width < 1 || target.height < 1 ||
      target.width > 8192 || target.height > 8192 || pixels > MAX_RENDER_TARGET_PIXELS) {
      unsupported('renderTargetSize', `R1 target ${target.width}x${target.height} exceeds the bounded 2D budget`);
    }
  }

  _renderTargetFlags(target) {
    const texture = target.texture;
    return (texture.magFilter === NearestFilter ? 1 : 0) |
      (texture.minFilter === NearestFilter ? 2 : 0) |
      (texture.wrapS !== ClampToEdgeWrapping ? 4 : 0) |
      (texture.wrapT !== ClampToEdgeWrapping ? 8 : 0) |
      (target.depthBuffer ? 256 : 0);
  }

  _trackRenderTarget(target) {
    this._validateRenderTarget(target);
    target.texture.renderTarget = target;
    if (target.depthTexture) target.depthTexture.renderTarget = target;
    const id = resourceId(target.texture);
    if (this._renderTargets.has(id)) return id;
    if (this._renderTargets.size >= MAX_RENDER_TARGETS) unsupported('renderTargetLimit', 'R1 supports at most 16 live targets');
    const record = { id, version: Math.max(1, target.version || 1), signature: null, target };
    const dispose = () => {
      if (!this._renderTargets.has(id)) return;
      this._mapDelete(this._renderTargets, id);
      this._mapDelete(this._state.renderTargets, id);
      this._renderTargetDisposers.delete(id);
      target.removeEventListener('dispose', dispose);
      target.texture.removeEventListener('dispose', dispose);
      // RenderTarget.setSize() disposes in r186; the next _ensureRenderTarget
      // re-tracks with a fresh version, so Dart must see the disposal first
      // or its per-id version gate drops the resized upsert as stale.
      this._pendingDisposals.push({ id, kind: RESOURCE_KIND.renderTarget });
    };
    target.addEventListener('dispose', dispose);
    target.texture.addEventListener('dispose', dispose);
    this._renderTargetDisposers.set(id, dispose);
    this._mapSet(this._renderTargets, id, record);
    this._mapSet(this._state.renderTargets, id, record);
    return id;
  }

  _ensureRenderTarget(target, commands) {
    const id = this._trackRenderTarget(target);
    const record = this._renderTargets.get(id);
    const flags = this._renderTargetFlags(target);
    const width = Math.floor(target.width), height = Math.floor(target.height);
    const signature = [width, height, resourceId(target.texture), flags].join(':');
    if (record.signature !== signature) {
      if (record.signature !== null) record.version++;
      record.signature = signature;
      commands.push(renderTargetCommand(id, record.version, width, height, resourceId(target.texture), flags));
    }
    return id;
  }

  _ensureRenderTargetTexture(texture, commands) {
    const target = texture.renderTarget;
    if (!target) unsupported('renderTargetAssociation', 'R1 target texture has no owning target');
    if (this._renderTarget === target) {
      adaptationWarn(target, '_r1TargetFeedbackWarned',
        'R1 unbinds the active target from this material; the base draw continues without feedback sampling.');
      return 0;
    }
    this._ensureRenderTarget(target, commands);
    if (texture.isDepthTexture) {
      adaptationWarn(target, '_r1DepthSampleWarned',
        'R1 samples the target color attachment in place of its depth texture for this bounded pass.');
      return resourceId(target.texture);
    }
    return resourceId(texture);
  }

  _ensureTexture(texture, commands, role = 'map') {
    if (!texture) return 0;
    if (texture.isRenderTargetTexture || (texture.isDepthTexture && texture.renderTarget)) {
      return this._ensureRenderTargetTexture(texture, commands);
    }
    if (!texture.isTexture) unsupported('texture', 'material map is not a THREE.Texture');
    if (texture.isCompressedTexture && (!texture.mipmaps || texture.mipmaps.length === 0)) {
      adaptationWarn(texture, '_r1CompressedPendingWarned',
        'R1 keeps an unloaded compressed texture unbound; base geometry renders while its asset is unavailable.');
      return 0;
    }
    if (texture.isDataArrayTexture) {
      adaptationWarn(texture, '_r1VolumeTextureWarned',
        'R1 drops this array sampler in the bounded 2D material lowering.');
      return 0;
    }
    if (!texture.isCubeTexture && (texture.isCompressedTexture || texture.isVideoTexture ||
        (texture.isFramebufferTexture && !(texture.image && texture.image.data instanceof Uint8Array)) ||
        texture.isDepthTexture || texture.isExternalTexture)) unsupported('textureType', texture.type);
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
    if (texture.premultiplyAlpha) unsupported('textureState', 'premultiplyAlpha');
    if (texture.mipmaps && texture.mipmaps.length) {
      adaptationWarn(texture, '_r1CustomMipmapsWarned',
        'R1 drops custom mip levels; the base image and native generated mipmaps remain active where supported.');
    }
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
    let image = texture.image;
    if (!image || !image.data) return 0;
    if (texture.isData3DTexture) {
      const depth = image.depth || 0;
      const components = texture.format === RedFormat ? 1 : texture.format === RGBAFormat ? 4 : 0;
      if (!components || !(image.data instanceof Uint8Array) || !depth ||
          image.data.length !== image.width * image.height * depth * components) {
        unsupported('textureFormat', 'R1 volume slices require matching RGBA8 or R8 data');
      }
      const offset = Math.floor(depth / 2) * image.width * image.height * components;
      image = { data: image.data.subarray(offset, offset + image.width * image.height * components),
        width: image.width, height: image.height, encoding: 0 };
      adaptationWarn(texture, '_r1VolumeTextureWarned',
        'R1 samples the middle Data3DTexture slice as a bounded 2D texture; raymarch depth is dropped.');
    }
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
      } else if (texture.type === FloatType) {
        if (texture.format !== RGBAFormat || !(data instanceof Float32Array) || width * height * 4 !== data.length) {
          throw new Error('three.invalid: float raw textures must be RGBA Float32 data with matching dimensions');
        }
        const expanded = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
          const value = data[i];
          requireFinite(value, 'float texture');
          expanded[i] = value <= 0 ? 0 : value >= 1 ? 255 : value * 255 + 0.5;
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
    if (Array.isArray(faces) && faces.length === 0) return 0;
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
    const id = resourceId(material);
    // v8 stencil tail (null for upstream-default stencil state). Computed
    // before the frame cache so per-frame stencil activity tracking stays
    // correct even when the material signature itself is cached.
    const stencil = this._materialStencil(material);
    if (stencil) this._frameStencilActivity = true;
    const frameCached = this._frameMaterials.get(id);
    if (frameCached !== undefined) return frameCached;
    // Per-material snapshot tier: when every signature input of a previously
    // ensured material is unchanged, skip materialKind()/validateMaterial()
    // and the full texture-scan + 40-element signature join. This is the
    // dominant per-visible-mesh cost in many-mesh scenes (every frustum-
    // visible mesh re-ensures its material each frame); any changed input
    // falls through to the full body, which revalidates and emits the exact
    // same command as before — rendered results identical.
    const kind = material._r1NativeKind === 'anaglyph' ? 11 : materialKind(material);
    validateMaterial(material);
    this._listen(material, 'materials', this._state.materials, id);
    let shaderMap = material.map || null;
    if (material._r1ShaderTextures && shaderMap?.renderTarget === this._renderTarget) {
      shaderMap = material._r1ShaderTextures.find(texture => texture.renderTarget !== this._renderTarget) || null;
      adaptationWarn(material, '_r1FeedbackPassWarned',
        'R1 unbinds an active target from a lowered pass-through shader to preserve the feedback invariant.');
    }
    const mapId = this._ensureTexture(shaderMap, commands);
    const anaglyph = material._r1Anaglyph || null;
    const mapRightId = kind === 11 ? this._ensureTexture(anaglyph.right, commands) : 0;
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
    const mapUvMatrix = uvTransformElements(shaderMap);
    const alphaMapUvMatrix = uvTransformElements(kind === 11 ? anaglyph.right : (material.alphaMap || null));
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
    const flags = (material.vertexColors ? 1 : 0) | (material.flatShading ? 2 : 0) | (material.transparent ? 4 : 0) | (material.depthTest ? 8 : 0) | (material.depthWrite ? 16 : 0) | (material.wireframe ? 32 : 0) | (material.sizeAttenuation === false ? 64 : 0) | ((material.blending || 0) << 7) | (material.colorWrite === false ? MATERIAL_FLAG_COLOR_WRITE_OFF : 0) | (stencil ? MATERIAL_FLAG_STENCIL : 0);
    const clip = this._resolveClipping(material, commands);
    const signature = [kind, mapId, shaderMap ? this._state.textures.get(resourceId(shaderMap))?.version || 0 : 0,
      flags, side, color.r, color.g, color.b, opacity, roughness, metalness, alphaTest, pointSize,
      specular ? specular.r : 0, specular ? specular.g : 0, specular ? specular.b : 0, shininess,
      emissive ? emissive.r : 0, emissive ? emissive.g : 0, emissive ? emissive.b : 0, emissiveIntensity, material.version,
      clip.signature, clip.flags, alphaMapId, envMapId, envMapIntensity,
      mapUvMatrix ? mapUvMatrix.join(',') : 'I', alphaMapUvMatrix ? alphaMapUvMatrix.join(',') : 'I',
      matcapId, gradientMapId, spriteRotation, normalMapId, normalScaleX, normalScaleY, bumpMapId, bumpScale, roughnessMapId, metalnessMapId,
      mapRightId, anaglyph ? anaglyph.left.join(',') : '', anaglyph ? anaglyph.rightMatrix.join(',') : '',
      stencil ? [stencil.stencilWrite, stencil.stencilFunc, stencil.stencilRef, stencil.stencilFuncMask,
        stencil.stencilWriteMask, stencil.stencilFailOp, stencil.stencilZFailOp, stencil.stencilZPassOp].join(':') : ''].join('|');
    const changed = this._nextVersion(this._state.materials, id, signature);
    if (changed) {
      commands.push(materialCommand(id, changed.version, kind, mapId, flags, side, color, opacity, roughness, metalness, alphaTest, pointSize, specular, shininess, emissive, emissiveIntensity, clip.id, clip.flags,
        { alphaMapId, envMapId, envMapIntensity, mapUvMatrix, alphaMapUvMatrix },
        { matcapId, gradientMapId, rotation: spriteRotation },
        { normalMapId, normalScaleX, normalScaleY, bumpMapId, bumpScale, roughnessMapId, metalnessMapId },
        kind === 11 ? { rightId: mapRightId, left: anaglyph.left, right: anaglyph.rightMatrix } : null,
        stencil));
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

  // R1 v8 stencil tail payload, or null when every Material.stencil* field
  // sits at its upstream default (stencilWrite false, AlwaysStencilFunc,
  // ref 0, masks 255, KeepStencilOp x3) — the byte-stability contract for
  // stenciless materials. Upstream gates the whole stencil block on
  // material.stencilWrite (WebGLState.setMaterial), so the tail mirrors the
  // encoded state honestly: the native pass re-applies the same gating.
  _materialStencil(material) {
    const stencilWrite = !!material.stencilWrite;
    const stencilFunc = material.stencilFunc === undefined || material.stencilFunc === null ? STENCIL_FUNC.always : material.stencilFunc;
    const stencilRef = material.stencilRef || 0;
    const stencilFuncMask = material.stencilFuncMask === undefined ? 255 : material.stencilFuncMask;
    const stencilWriteMask = material.stencilWriteMask === undefined ? 255 : material.stencilWriteMask;
    const stencilFailOp = material.stencilFail === undefined || material.stencilFail === null ? STENCIL_OP.keep : material.stencilFail;
    const stencilZFailOp = material.stencilZFail === undefined || material.stencilZFail === null ? STENCIL_OP.keep : material.stencilZFail;
    const stencilZPassOp = material.stencilZPass === undefined || material.stencilZPass === null ? STENCIL_OP.keep : material.stencilZPass;
    if (!stencilWrite && stencilFunc === STENCIL_FUNC.always && stencilRef === 0 &&
        stencilFuncMask === 255 && stencilWriteMask === 255 &&
        stencilFailOp === STENCIL_OP.keep && stencilZFailOp === STENCIL_OP.keep &&
        stencilZPassOp === STENCIL_OP.keep) return null;
    return { stencilWrite, stencilFunc, stencilRef, stencilFuncMask, stencilWriteMask, stencilFailOp, stencilZFailOp, stencilZPassOp };
  }

  // Upstream invokes object.onAfterRender(renderer, scene, camera, geometry,
  // material, group) right after renderBufferDirect; webgl_clipping_stencil
  // uses it to call renderer.clearStencil() after each cap plane. The R1
  // walk (this flatten pass) is where upstream would have drawn the object,
  // so the callback runs here and its clearStencil() lands as an
  // OPCODE.STENCIL_CLEAR marker bound to the node id — the native side
  // applies it after that node's draws in its sorted order. The callback
  // sees a BOUNDED renderer proxy (clearStencil/clear/clearColor/clearDepth
  // only): anything else throws into the one-time warn below instead of
  // corrupting the encode pass, and the throw degrades to today's behavior
  // (callback skipped) rather than failing the frame.
  _runOnAfterRender(object, scene, camera, commands, nodeId) {
    let clearValue = null;
    const boundedRenderer = {
      clearStencil: value => { clearValue = value === undefined ? 0 : value; },
      clear: (color, depth, stencil) => { if (stencil) clearValue = 0; },
      clearColor: () => {},
      clearDepth: () => {}
    };
    const previousNodeId = this._walkAfterRenderNodeId;
    this._walkAfterRenderNodeId = nodeId;
    try {
      object.onAfterRender(boundedRenderer, scene, camera, object.geometry || null, object.material || null, null);
    } catch (error) {
      adaptationWarn(object, '_r1OnAfterRenderWarned',
        `R1 invokes object.onAfterRender in a bounded clearStencil proxy and it threw: ${error.message}`);
    } finally {
      this._walkAfterRenderNodeId = previousNodeId;
    }
    if (clearValue !== null) {
      commands.push(stencilClearCommand(nodeId, clearValue));
      this._frameStencilActivity = true;
    }
  }

  // Per-geometry signature cache. Rebuilding the signature string for every
  // drawable on every frame is pure QuickJS string churn (~tens of KB of
  // garbage per frame — the dominant cost of a static scene's traverse).
  // Fast path: no attribute/index version moved since last frame -> reuse
  // the string. Slow path: a version moved -> hash that attribute's storage;
  // an identical hash means a helper set needsUpdate with the same content
  // (see attributeContentHash) -> still reuse the string, just refresh the
  // cached versions. Only genuinely different content rebuilds the string.
  _geometrySignatureCached(geometry, primitive, mode, includeWire, fullRange = false) {
    let cache = this._geometrySignatureCache ? null : null;
    const store = this._geometrySignatureCache || (this._geometrySignatureCache = new Map());
    cache = store.get(geometry);
    // The GLBufferAttribute draw-range lane uploads the FULL vertex set once
    // and moves the window through a batch part, so its signature must stay
    // stable across setDrawRange mutations; the lane flag is part of the
    // identity so a sliced upload of the same geometry can never alias it.
    const range = fullRange ? { start: 0, count: Infinity } :
      (geometry.drawRange || { start: 0, count: Infinity });
    if (cache && cache.full === (fullRange ? 1 : 0) && cache.primitive === primitive && cache.mode === mode &&
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
        const indexVersion = index ? attributeVersionKey(index) : -1;
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
        const version = attributeVersionKey(attribute);
        versions[i] = version;
        // A dynamic position/normal invalidates this signature every frame,
        // but says nothing about the UV/color arrays. Preserve the content
        // hash when the complete identity/version key is unchanged instead
        // of rescanning every static attribute on every animated frame.
        hashes[i] = cache && cache.versions[i] === version ? cache.hashes[i] :
          (volatileAttribute(attribute) ? 0 : attributeContentHash(attribute.array));
      }
    }
    if (geometry.index) {
      const index = geometry.index;
      const version = attributeVersionKey(index);
      versions[4] = version;
      hashes[4] = cache && cache.versions[4] === version ? cache.hashes[4] :
        (volatileAttribute(index) ? 0 : attributeContentHash(index.array));
    }
    const sig = `${geometrySignature(geometry, primitive, mode, range)};wire:${includeWire ? 1 : 0}`;
    store.set(geometry, { full: fullRange ? 1 : 0, primitive, mode, wire: includeWire ? 1 : 0, rangeStart: range.start, rangeCount: range.count, versions, hashes, sig });
    return sig;
  }

  _uploadAttribute(upload, slot, attribute, vertexCount, components, name, vertexOffset) {
    const entries = upload.attributes || (upload.attributes = []);
    const old = entries[slot];
    if (old && old.attribute === attribute && old.array === (attribute ? attribute.array : null) &&
        old.version === attributeVersionKey(attribute) && old.vertexCount === vertexCount &&
        old.components === components && old.vertexOffset === vertexOffset) return old.values;
    // Reuse only storage from an earlier submission sequence. Multiple render
    // passes can retain commands in one animation batch; rewriting their
    // arrays before the flush would corrupt the earlier pass.
    const reusable = old && old.sequence !== this._state.sequence ? old.values : null;
    const values = attributeFloats(attribute, vertexCount, components, name, vertexOffset, reusable);
    entries[slot] = { attribute, array: attribute ? attribute.array : null,
      version: attributeVersionKey(attribute), vertexCount, components, vertexOffset, values,
      sequence: this._state.sequence };
    return values;
  }

  _ensureGeometry(geometry, primitive, mode, commands, wireframe = false, fullRange = false) {    if (!geometry || !geometry.isBufferGeometry) unsupported('geometry', 'only BufferGeometry is supported');
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
    const sliceRange = !fullRange && !geometry.index && !includeWire && mode !== 'line' && range.count > 0 &&
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
    const signature = this._geometrySignatureCached(geometry, primitive, mode, includeWire, fullRange);
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
    // The range lane (fullRange) drives per-frame windows through DRAW_BATCH
    // parts; an identity index materialized from the FIRST frame's drawRange
    // would pin geometry.indexCount to that stale window size forever (the
    // geometry never re-uploads), and the Dart part-range validator would
    // reject every later window that grew past it — the official
    // glbufferattribute example grows drawRange.count from 100 toward 300k,
    // which rendered ~2 frames and then dropped the batch (black frame).
    // Non-indexed points draws do not need an index (the legacy slice lane
    // uploads none either), so the full-range lane emits none.
    let indices = null;
    if (!sliceRange && (index || !fullRange)) {
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
    // TransformControls intentionally uses +/-Infinity to pin its gizmo at
    // the ends of upstream's render order. Keep that ordering with finite,
    // symmetric sentinels at the strict R1 float32 boundary.
    const renderOrder = object.renderOrder === Infinity ? 1e30 :
      object.renderOrder === -Infinity ? -1e30 : object.renderOrder;
    const castShadow = object.castShadow === true && !object.isSprite;
    const receiveShadow = object.receiveShadow === true && !object.isSprite;
    const old = this._state.nodes.get(id);
    const unchanged = old && old.parentId === parentId &&
      old.geometryId === geometryId && old.materialId === materialId &&
      old.visible === visible && old.objectKind === objectKind &&
      old.castShadow === castShadow && old.receiveShadow === receiveShadow &&
      old.spriteCenterX === spriteCenter.x && old.spriteCenterY === spriteCenter.y &&
      old.renderOrder === renderOrder && cachedMatrixEquals(old.matrix, matrix);
    if (!unchanged) {
      if (!Number.isFinite(renderOrder)) {
        throw new Error(`three.invalid: node renderOrder must be finite (${object.type}/${object.name}/${id}: ${object.renderOrder})`);
      }
      finiteArray(matrix.elements, 'matrixWorld');
      requireFinite(spriteCenter.x, 'sprite center');
      requireFinite(spriteCenter.y, 'sprite center');
      commands.push(nodeCommand(id, parentId, geometryId, materialId, visible, objectKind, matrix,
        { cast: castShadow, receive: receiveShadow }, spriteCenter, renderOrder));
      this._mapSet(this._state.nodes, id, {
        parentId, geometryId, materialId, visible, objectKind,
        castShadow, receiveShadow, matrix: matrix.elements.slice(), object,
        spriteCenterX: spriteCenter.x, spriteCenterY: spriteCenter.y,
        renderOrder
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

  _ensureBatch(object, id, geometry, materials, commands, partsOverride = null) {
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
    const parts = partsOverride || (simpleInstanced ? [{
      geometryId: geometry.id, materialId: simpleMaterialId, offset: 0, count: geometry.drawCount
    }] : this._ensureBatchParts(object, geometry, materials, commands));
    const partSignature = parts.map(part => [part.geometryId, part.materialId, part.offset, part.count].join(':')).join('|');
    const signature = `${instance ? `1:${instance.count}:${instance.signature}` : '0:1:-'};${partSignature}`;
    const changed = this._nextVersion(this._state.batches, id, signature);
    if (changed) {
      if (instance && instance.colors) {
        for (let i = 0; i < instance.colorCount; i++) requireFinite(instance.colors[i], 'instanceColor');
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
    // MorphBlendMesh (MD2 characters) mutates ONE shared influences array per
    // mesh in place every frame, so identity memoization is useless and the
    // historical join(',') ran a 199-float Number→string conversion on every
    // character mesh per frame (26 meshes in loader_md2_control). Compare
    // element-wise against the cached set first and only pay for the string
    // key when the weights actually moved.
    let key = base.key;
    const lastInfluences = base.lastInfluences;
    if (!lastInfluences || lastInfluences.length !== influences.length) {
      key = influences.join(',');
    } else {
      for (let i = 0; i < lastInfluences.length; i++) {
        if (lastInfluences[i] !== influences[i]) { key = influences.join(','); break; }
      }
    }
    base.lastInfluences = Array.prototype.slice.call(influences);
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

    const nativeMorph = globalThis.__jsrMorphBytes;
    const positionAttribute = geometry.attributes.position;
    const normalAttribute = geometry.attributes.normal;
    if (typeof nativeMorph === 'function' && positionAttribute && positionAttribute.array.length % 3 === 0) {
      const stride = positionAttribute.array.length;
      const vertexCount = stride / 3;
      const positionTargets = morphPositions || [];
      const normalTargets = normalAttribute && base.normal && normalAttribute.array.length === stride &&
        base.normal.length === stride ? (morphNormals || []) : [];
      const positionTargetCount = Math.min(positionTargets.length, influences.length);
      const normalTargetCount = Math.min(normalTargets.length, influences.length);
      const weightOffset = 8;
      const positionOffset = weightOffset + influences.length;
      const normalOffset = positionOffset + stride;
      const positionTargetOffset = normalOffset + (normalTargetCount ? stride : 0);
      const normalTargetOffset = positionTargetOffset + positionTargetCount * stride;
      const length = normalTargetOffset + normalTargetCount * stride;
      let packet = base.nativePacket;
      let rebuild = !packet || packet.length !== length || base.nativeRelative !== relative;
      const checkTargets = (targets, count, versions, arrays) => {
        if (!versions || !arrays || versions.length !== count) return false;
        for (let i = 0; i < count; i++) {
          if (versions[i] !== targets[i].version || arrays[i] !== targets[i].array ||
              targets[i].array.length < stride) return false;
        }
        return true;
      };
      if (!rebuild) {
        rebuild = !checkTargets(positionTargets, positionTargetCount, base.nativePositionVersions, base.nativePositionArrays) ||
          !checkTargets(normalTargets, normalTargetCount, base.nativeNormalVersions, base.nativeNormalArrays) ||
          base.position.length !== stride;
      }
      const storageValid = positionTargets.slice(0, positionTargetCount).every(item => item.array.length >= stride) &&
        normalTargets.slice(0, normalTargetCount).every(item => item.array.length >= stride);
      if (rebuild) {
        packet = null;
        base.nativePacket = null;
        base.nativePacketBytes = null;
      }
      if (rebuild && storageValid && length <= 16777216) {
        packet = new Float32Array(length);
        base.nativePacket = packet;
        base.nativePacketBytes = new Uint8Array(packet.buffer);
        base.nativeRelative = relative;
        base.nativePositionVersions = positionTargets.slice(0, positionTargetCount).map(item => item.version);
        base.nativePositionArrays = positionTargets.slice(0, positionTargetCount).map(item => item.array);
        base.nativeNormalVersions = normalTargets.slice(0, normalTargetCount).map(item => item.version);
        base.nativeNormalArrays = normalTargets.slice(0, normalTargetCount).map(item => item.array);
        for (let i = 0; i < positionTargetCount; i++) {
          packet.set(positionTargets[i].array.subarray(0, stride), positionTargetOffset + i * stride);
        }
        for (let i = 0; i < normalTargetCount; i++) {
          packet.set(normalTargets[i].array.subarray(0, stride), normalTargetOffset + i * stride);
        }
      }
      if (packet && packet.length === length && base.position.length === stride) {
        packet[0] = vertexCount;
        packet[1] = influences.length;
        packet[2] = positionTargetCount;
        packet[3] = normalTargetCount;
        packet[4] = relative ? 1 : 0;
        packet[5] = 0;
        packet.set(influences, weightOffset);
        packet.set(base.position, positionOffset);
        if (normalTargetCount) packet.set(base.normal, normalOffset);
        nativeMorph('three.morph', base.nativePacketBytes);
        if (packet[5] === 1) {
          if (positionTargetCount) {
            positionAttribute.array.set(packet.subarray(positionOffset, positionOffset + stride));
            positionAttribute._r1DynamicContent = true;
            positionAttribute.version++;
            positionAttribute._r1FiniteVersion = positionAttribute.version;
          }
          if (normalTargetCount) {
            normalAttribute.array.set(packet.subarray(normalOffset, normalOffset + stride));
            normalAttribute._r1DynamicContent = true;
            normalAttribute.version++;
            normalAttribute._r1FiniteVersion = normalAttribute.version;
          }
          return;
        }
      }
    }

    const blend = (attributeName, targets, baseArray) => {
      const attribute = geometry.attributes[attributeName];
      if (!attribute || !targets || !targets.length || !baseArray) return;
      const out = attribute.array;
      const count = out.length;
      // Upstream WebGLMorphtargets only touches influences !== 0, and real
      // morph animation (MD2 characters, morphtargets examples) keeps at
      // most two live targets per mesh while the storage holds EVERY
      // animation frame (ogro.md2: 199 frame targets). Hoisting the active
      // (weight, array) pairs once per blend turns the per-vertex inner scan
      // from O(targets) into O(active): ~2.4M QuickJS inner iterations per
      // frame collapse to ~36k, which moved loader_md2_control from ~12fps
      // to the vsync ceiling. Blend order and arithmetic are unchanged, so
      // output bytes are bit-identical for finite inputs; a non-finite
      // influence falls back to the historical scan so the strict encode
      // contract still sees the same NaN and fails (or neutralizes normals)
      // exactly as before.
      let finite = true;
      const active = [];
      for (let t = 0; t < targets.length && t < influences.length; t++) {
        const weight = influences[t];
        if (!Number.isFinite(weight)) { finite = false; continue; }
        if (weight === 0) continue;
        active.push(weight, targets[t]);
      }
      const canStamp = finite &&
        // One-time finiteness scan per immutable morph target: blended
        // output is finite only when the sources are, and the fast
        // attributeFloats bulk-copy lane below skips its per-float check
        // when the blend stamps _r1FiniteVersion (the CPU skinning lane
        // already uses the same pattern).
        baseSourceFinite(baseArray, count) &&
        activeTargetsFinite(active, count);
      if (finite && active.length === 0) {
        // All-zero influences restore the pristine base; baseInfluence is
        // exactly 1 (1 - 0) or the relative passthrough, so a bulk copy is
        // bit-identical to the historical scan.
        if (baseArray.length === count) out.set(baseArray);
        else for (let i = 0; i < count; i++) out[i] = baseArray[i];
      } else if (finite) {
        for (let i = 0; i < count; i++) {
          let value = relative ? baseArray[i] : baseArray[i] * baseInfluence;
          for (let a = 0; a < active.length; a += 2) {
            value += active[a] * active[a + 1].array[i];
          }
          out[i] = value;
        }
      } else {
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
      }
      attribute._r1DynamicContent = true;
      attribute.version++;
      if (canStamp) attribute._r1FiniteVersion = attribute.version;
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
    // Skinned-aware culling bound (R1 CPU skinning lane). CPU skinning
    // rewrites the position attribute in place, which breaks both upstream
    // bound sources at cull time: geometry.boundingSphere stays at bind
    // pose, and the upstream SkinnedMesh.computeBoundingSphere that
    // official IK examples re-run every frame (updateIK -> scene.traverse)
    // applies bone transforms to the ALREADY-skinned attribute and
    // publishes a sphere displaced by the full delta twice. Example
    // (webgl_animation_skinning_ik head): published center (-1.36, 1.95,
    // -0.15) vs drawn extents (~0, 0.06, -1.61) -> the head node is culled
    // at camera angles where the drawn head is in full view. Refresh the
    // sphere Frustum.intersectsObject prefers (object.boundingSphere,
    // applied with matrixWorld) from the attribute as last skinned: the
    // refresh must also run on paused or duplicate renders because the
    // example's own per-frame recompute corrupts the sphere between
    // renders, and the main and shadow cull checks later in this
    // traverseVisible walk must always see the just-drawn extents.
    // The refresh itself is memoized per changed attribute VERSION: within a
    // frame (cube-camera faces, main pass, shadow passes) duplicate render
    // calls see an identical attribute, so a memo hit cannot observe stale
    // data. The changed-pose path re-invokes the refresh AFTER the skin write
    // below, so the memo always records the post-skin version and the bound
    // is exact for the frame being drawn (a pre-skin refresh would trail one
    // attribute version behind and force one wasted scan per frame).
    const refreshCullSphere = () => {
      const skinned = geometry.attributes.position;
      if (!skinned || skinned.count === 0) return;
      const skinnedPositions = skinned.array;
      const memo = object._r1CullSphereMemo;
      if (!memo || memo.version !== skinned.version || memo.array !== skinnedPositions) {
        const cullSphere = object.boundingSphere || (object.boundingSphere = new Sphere());
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        for (let v = 0, p3 = 0; v < skinned.count; v++, p3 += 3) {
          const x = skinnedPositions[p3], y = skinnedPositions[p3 + 1], z = skinnedPositions[p3 + 2];
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (z < minZ) minZ = z;
          if (z > maxZ) maxZ = z;
        }
        cullSphere.center.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
        cullSphere.radius = 0.5 * Math.hypot(maxX - minX, maxY - minY, maxZ - minZ);
        object._r1CullSphereMemo = { version: skinned.version, array: skinnedPositions };
      }
    };
    // Paused mixers and duplicate render() calls still invoke skeleton.update,
    // but identical bone/bind state must not re-skin and re-upload every vertex.
    if (unchanged) {
      refreshCullSphere();
      return;
    }
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
    let nativeApplied = false;
    const nativeSkin = globalThis.__jsrSkinBytes;
    if (typeof nativeSkin === 'function') {
      const matrixOffset = 4;
      const indexOffset = matrixOffset + boneCount * 16;
      const weightOffset = indexOffset + position.count * 4;
      const positionOffset = weightOffset + position.count * 4;
      const normalOffset = positionOffset + position.count * 3;
      const length = normalOffset + (outNormal ? position.count * 3 : 0);
      let packet = cache.packet;
      if (!packet || packet.length !== length || cache.packetSkin !== skin) {
        packet = new Float32Array(length);
        cache.packet = packet;
        cache.packetBytes = new Uint8Array(packet.buffer);
        // The index/weight regions are immutable for a given skin (they
        // rebuild only with the skin identity above) — fill them once.
        // The position/normal regions are NOT static: they are in-place
        // transform buffers the native call OVERWRITES with the skinned
        // result, so the pristine bind pose is re-staged before EVERY call
        // below (stale staging would skin the previous output and compound
        // pose drift — the skining-morph parity pin catches exactly that).
        packet[0] = position.count;
        packet[1] = boneCount;
        packet[2] = outNormal ? 1 : 0;
        packet.set(indices, indexOffset);
        packet.set(weights, weightOffset);
        cache.packetSkin = skin;
      }
      packet[3] = 0;
      packet.set(B, matrixOffset);
      packet.set(basePos, positionOffset);
      if (outNormal) packet.set(baseNormal, normalOffset);
      nativeSkin('three.skin', cache.packetBytes);
      if (packet[3] === 1) {
        outPos.set(packet.subarray(positionOffset, positionOffset + position.count * 3));
        if (outNormal) outNormal.set(packet.subarray(normalOffset, normalOffset + position.count * 3));
        nativeApplied = true;
      }
    }
    if (!nativeApplied) {
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
    }
    position._r1DynamicContent = true;
    position.version++;
    if (normal) { normal._r1DynamicContent = true; normal.version++; }
    // The skinned attribute is final for this frame: refresh the culling
    // bound from the just-written extents so the draw/cull checks below see
    // the current pose (not the previous frame's), and the memo records the
    // post-skin version (duplicate renders within the frame become hits).
    refreshCullSphere();
    if (nativeApplied) {
      position._r1FiniteVersion = position.version;
      if (normal) normal._r1FiniteVersion = normal.version;
    }
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
    const fat = object.isLineSegments2 === true || object.isWireframe === true;
    const dashed = material.isLineDashedMaterial === true || (fat && material.dashed === true);
    const loop = object.isLineLoop === true;
    if (!fat && !dashed && !loop) return null;
    const attrs = source.attributes;
    const signature = loop ? [
      'loop', adaptedAttributeVersion(attrs.position), adaptedAttributeVersion(attrs.color),
      adaptedAttributeVersion(source.index), source.drawRange.start, source.drawRange.count,
      material.color ? `${material.color.r}:${material.color.g}:${material.color.b}` : '-',
      material.opacity, material.transparent, material.version
    ].join('|') : fat ? [
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
      return { geometry: previous.geometry, material: previous.material, lineSegments: loop || fat || object.isLineSegments };
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
    } else if (loop) {
      geometry = lineLoopGeometry(source);
      if (!geometry) return null;
      adaptedMaterial = adaptedLineMaterial(material, !!source.attributes.color);
    } else {
      geometry = dashedGeometry(source, !!object.isLineSegments, material);
      adaptedMaterial = adaptedLineMaterial(material, !!source.attributes.color);
    }
    if (previous) {
      if (previous.geometry !== geometry && previous.geometry !== source) previous.geometry.dispose();
      if (previous.material !== adaptedMaterial) previous.material.dispose();
    }
    this._adaptedLineDraws.set(object, { source, sourceMaterial: material, signature, geometry, material: adaptedMaterial });
    return { geometry, material: adaptedMaterial, lineSegments: loop || fat || object.isLineSegments };
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
    else if (object.isPoints && attrs.position && (attrs.customColor || attrs.ca || attrs.size || attrs.scale)) kind = 'points';
    else if (material.type === 'LightProbeHelperMaterial' && attrs.position && attrs.normal && uniforms.sh) kind = 'lightProbe';
    else if (object.isLine && attrs.position && attrs.customColor && attrs.displacement &&
        uniforms.amplitude && String(material.vertexShader).includes('amplitude')) kind = 'customLine';
    else if (object.isMesh && attrs.position && attrs.normal && attrs.customColor && attrs.displacement &&
        uniforms.amplitude && String(material.vertexShader).includes('amplitude')) kind = 'tessellation';
    if (!kind) {
      const signature = boundedShaderSignature(material);
      // Bounded-pass materials are keyed by SOURCE MATERIAL, not by the
      // drawing object: a postprocessing composer reuses ONE FullScreenQuad
      // mesh across every sub-pass, cycling highPass/blur/composite/blend
      // materials through the same node each render call. Keying by object
      // evicted and re-lowered a fresh material per pass per tick (~14
      // material+geometry upserts per presented frame in the bloom chain).
      // Keyed by material, each pass's lowering is computed once and its
      // uniform-texture signature (boundedShaderSignature includes the bound
      // texture ids) keeps readBuffer/writeBuffer rotation exact — two
      // flip-flopping entries per pass material, both stable. Entries are
      // never disposed (the same entry is reused on alternating ticks);
      // growth is bounded by the per-material signature cap below.
      let entries = this._adaptedBoundedShaderDraws.get(material);
      if (entries === undefined) {
        entries = new Map();
        this._adaptedBoundedShaderDraws.set(material, entries);
      }
      const previous = entries.get(signature);
      if (previous !== undefined && previous.source === source) {
        return { geometry: previous.geometry, material: previous.material };
      }
      const adapted = adaptedShaderDraw(object, this._frameViewMatrix || null);
      if (!adapted) return null;
      entries.set(signature, {
        source, sourceMaterial: material, signature,
        material: adapted.material, geometry: adapted.geometry
      });
      if (entries.size > 8) {
        const oldest = entries.keys().next().value;
        entries.delete(oldest);
      }
      return adapted;
    }
    const amplitude = kind === 'tessellation' || kind === 'customLine' ? Number(uniforms.amplitude.value) : 0;
    const sizeAttribute = kind === 'points' ? (attrs.size || attrs.scale || null) : null;
    const pointColorAttribute = kind === 'points' ? (attrs.customColor || attrs.ca || null) : null;
    let meanSize = 1;
    if (sizeAttribute) {
      // A plain typed array is read by direct indexing; one QuickJS method
      // call per point (getComponent) dominated the 100k-point examples.
      const sizeArray = sizeAttribute.isInterleavedBufferAttribute ? null : sizeAttribute.array;
      let total = 0;
      if (sizeArray instanceof Float32Array && sizeArray.length >= sizeAttribute.count) {
        for (let i = 0; i < sizeAttribute.count; i++) {
          const value = sizeArray[i];
          if (value !== value || value === Infinity || value === -Infinity) requireFinite(value, 'point size attribute');
          total += value;
        }
      } else {
        for (let i = 0; i < sizeAttribute.count; i++) {
          const value = sizeAttribute.getComponent(i, 0);
          requireFinite(value, 'point size attribute');
          total += value;
        }
      }
      meanSize = sizeAttribute.count ? total / sizeAttribute.count : 1;
      if (!(meanSize > 0)) meanSize = 0.001;
    }
    const uniformColor = uniforms.color && uniforms.color.value;
    const probeSignature = kind === 'lightProbe'
      ? uniforms.sh.value.map(value => `${value.x}:${value.y}:${value.z}`).join(',') + `:${uniforms.intensity.value}`
      : '';
    const signature = [
      kind, adaptedAttributeVersion(attrs.position), adaptedAttributeVersion(attrs.normal),
      adaptedAttributeVersion(attrs.color), adaptedAttributeVersion(pointColorAttribute),
      adaptedAttributeVersion(attrs.vertColor), adaptedAttributeVersion(attrs.visible),
      adaptedAttributeVersion(attrs.displacement), adaptedAttributeVersion(sizeAttribute),
      adaptedAttributeVersion(source.index), source.drawRange.start, source.drawRange.count,
      amplitude, meanSize, material.version, material.opacity, material.transparent,
      uniformColor && uniformColor.isColor ? `${uniformColor.r}:${uniformColor.g}:${uniformColor.b}` : '-',
      uniforms.pointTexture && uniforms.pointTexture.value ? resourceId(uniforms.pointTexture.value) : 0,
      uniforms.alphaTest ? uniforms.alphaTest.value : 0,
      uniforms.opacity ? uniforms.opacity.value : material.opacity, probeSignature
    ].join('|');
    const previous = this._adaptedShaderDraws.get(object);
    if (previous && previous.source === source && previous.sourceMaterial === material && previous.signature === signature) {
      return { geometry: previous.geometry, material: previous.material, lineSegments: kind === 'selective' ? true : undefined };
    }
    let geometry;
    let adaptedMaterial;
    let materialKey;
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
    } else if (kind === 'lightProbe') {
      const count = attrs.position.count;
      if (!previous || previous.kind !== kind || previous.geometry.attributes.position.count !== count) {
        geometry = new BufferGeometry();
        geometry.setAttribute('position', attrs.position);
        geometry.setAttribute('color', new Float32BufferAttribute(new Float32Array(count * 3), 3));
        if (source.index) geometry.setIndex(source.index);
        geometry.setDrawRange(source.drawRange.start, source.drawRange.count);
        geometry.boundingSphere = source.boundingSphere;
      } else geometry = previous.geometry;
      const colors = geometry.attributes.color;
      const coefficients = uniforms.sh.value;
      const intensity = Number(uniforms.intensity.value);
      for (let i = 0; i < count; i++) {
        const x = attrs.normal.getComponent(i, 0);
        const y = attrs.normal.getComponent(i, 1);
        const z = attrs.normal.getComponent(i, 2);
        const length = Math.hypot(x, y, z) || 1;
        writeLightProbeColor(coefficients, x / length, y / length, z / length,
          intensity, colors.array, i * 3);
      }
      colors._r1DynamicContent = true;
      colors.needsUpdate = true;
      adaptedMaterial = previous && previous.kind === kind ? previous.material :
        new MeshBasicMaterial({ vertexColors: true, side: material.side, fog: material.fog });
      adaptationWarn(material, '_r1LightProbeHelperWarned',
        'R1 evaluates the light-probe SH irradiance helper into native vertex colors.');
    } else if (kind === 'customLine') {
      const count = attrs.position.count;
      if (!previous || previous.kind !== kind || previous.geometry.attributes.position.count !== count) {
        geometry = new BufferGeometry();
        geometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(count * 3), 3));
        geometry.setAttribute('color', new Float32BufferAttribute(new Float32Array(count * 3), 3));
        if (source.index) geometry.setIndex(source.index);
        geometry.setDrawRange(source.drawRange.start, source.drawRange.count);
      } else {
        geometry = previous.geometry;
        geometry.setDrawRange(source.drawRange.start, source.drawRange.count);
      }
      const positions = geometry.attributes.position;
      const colors = geometry.attributes.color;
      // The customColor attribute is static across frames in the official
      // lines example (written once at init). Skip the per-frame color
      // rewrite and its needsUpdate bump when the source version key and
      // backing array are unchanged, so the upload cache keeps returning the
      // previously encoded color values instead of re-encoding them and
      // revalidating every component each frame.
      const colorSourceVersion = attributeVersionKey(attrs.customColor);
      const colorStable = geometry._r1ColorSourceVersion === colorSourceVersion &&
        geometry._r1ColorSourceArray === attrs.customColor.array;
      const positionArray = positions.array;
      const colorArray = colors.array;
      const sourceArray = attrs.position.array;
      const displacementArray = attrs.displacement.array;
      const customColorArray = attrs.customColor.array;
      const fastArrays = count > 0 &&
        !attrs.position.isInterleavedBufferAttribute &&
        !attrs.displacement.isInterleavedBufferAttribute &&
        !attrs.customColor.isInterleavedBufferAttribute &&
        sourceArray instanceof Float32Array && displacementArray instanceof Float32Array &&
        customColorArray instanceof Float32Array && colorArray instanceof Float32Array &&
        sourceArray.length >= count * 3 && displacementArray.length >= count * 3 &&
        customColorArray.length >= count * 3 && positionArray.length >= count * 3 &&
        colorArray.length >= count * 3;
      if (fastArrays) {
        // Direct typed-array writes over the whole interleaved extent. The
        // strict position contract and the culling sphere are still honored,
        // but with per-FRAME work instead of per-COMPONENT branching:
        // - finiteness: source and displacement arrays are validated at load
        //   (strict decode) and `amplitude` is a validated uniform, so a
        //   non-finite product can only appear through overflow. The static
        //   magnitude bounds built with the sphere meta decide per frame
        //   whether |source| + sweep*|amplitude| can reach the float32
        //   ceiling at all; when it cannot, no component can overflow and
        //   the sweep runs with zero checks. When it can, the component sum
        //   (NaN and both infinities always surface in it) gates a
        //   per-component fallback that reproduces the exact requireFinite
        //   diagnostics. A non-finite amplitude fails loudly up front.
        // - culling: the sphere is derived once from the static source bounds
        //   plus the displacement magnitude bound, then grown monotonically
        //   when a larger |amplitude| appears. It always encloses every
        //   displaced vertex (conservative, never smaller than the tight
        //   per-frame sphere), so frustum/shadow culling stays honest without
        //   a per-vertex min/max scan.
        requireFinite(amplitude, 'amplitude uniform');
        const n = count * 3;
        const a = amplitude;
        let meta = geometry._r1CustomLineSphere;
        if (!meta || meta.count !== count || meta.source !== sourceArray ||
            meta.displacement !== displacementArray) {
          // (Re)build the static bound: the source AABB gives the center and
          // the base radius; the longest displacement vector gives the sweep.
          let minX = Infinity, minY = Infinity, minZ = Infinity;
          let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
          let maxDispSq = 0, maxAbsSource = 0;
          for (let i3 = 0; i3 < n; i3 += 3) {
            const x = sourceArray[i3], y = sourceArray[i3 + 1], z = sourceArray[i3 + 2];
            requireFinite(x, 'position attribute');
            requireFinite(y, 'position attribute');
            requireFinite(z, 'position attribute');
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
            if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
            const ax = x < 0 ? -x : x, ay = y < 0 ? -y : y, az = z < 0 ? -z : z;
            if (ax > maxAbsSource) maxAbsSource = ax;
            if (ay > maxAbsSource) maxAbsSource = ay;
            if (az > maxAbsSource) maxAbsSource = az;
            const dx = displacementArray[i3], dy = displacementArray[i3 + 1], dz = displacementArray[i3 + 2];
            requireFinite(dx, 'displacement attribute');
            requireFinite(dy, 'displacement attribute');
            requireFinite(dz, 'displacement attribute');
            const d = dx * dx + dy * dy + dz * dz;
            if (d > maxDispSq) maxDispSq = d;
          }
          const ex = (maxX - minX) / 2, ey = (maxY - minY) / 2, ez = (maxZ - minZ) / 2;
          const sphere = geometry.boundingSphere || (geometry.boundingSphere = new Sphere());
          sphere.center.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
          meta = {
            count, source: sourceArray, displacement: displacementArray,
            sphere, baseRadius: Math.sqrt(ex * ex + ey * ey + ez * ez),
            sweep: Math.sqrt(maxDispSq), maxAbsSource, maxAbsAmplitude: 0
          };
          geometry._r1CustomLineSphere = meta;
        }
        if (!colorStable) {
          for (let i3 = 0; i3 < n; i3 += 3) {
            colorArray[i3] = customColorArray[i3];
            colorArray[i3 + 1] = customColorArray[i3 + 1];
            colorArray[i3 + 2] = customColorArray[i3 + 2];
          }
          colors._r1DynamicContent = true;
          colors.needsUpdate = true;
        }
        const absA = a < 0 ? -a : a;
        // Float32 ceiling: any |source| + sweep*|amplitude| below it cannot
        // produce a non-finite float32 when written back.
        if (meta.maxAbsSource + meta.sweep * absA < 3.4e38) {
          for (let i3 = 0; i3 < n; i3 += 3) {
            positionArray[i3] = sourceArray[i3] + displacementArray[i3] * a;
            positionArray[i3 + 1] = sourceArray[i3 + 1] + displacementArray[i3 + 1] * a;
            positionArray[i3 + 2] = sourceArray[i3 + 2] + displacementArray[i3 + 2] * a;
          }
        } else {
          let sum = 0;
          for (let i3 = 0; i3 < n; i3 += 3) {
            const x = sourceArray[i3] + displacementArray[i3] * a;
            const y = sourceArray[i3 + 1] + displacementArray[i3 + 1] * a;
            const z = sourceArray[i3 + 2] + displacementArray[i3 + 2] * a;
            positionArray[i3] = x; positionArray[i3 + 1] = y; positionArray[i3 + 2] = z;
            sum += x + y + z;
          }
          if (!Number.isFinite(sum)) {
            for (let i3 = 0; i3 < n; i3++) {
              requireFinite(positionArray[i3], 'position attribute');
            }
          }
        }
        const sphere = meta.sphere;
        if (absA > meta.maxAbsAmplitude) {
          meta.maxAbsAmplitude = absA;
          sphere.radius = meta.baseRadius + meta.sweep * absA;
        }
        positions._r1DynamicContent = true;
        positions.needsUpdate = true;
        // Every written component was validated above; the exact bumped
        // version may take attributeFloats' bulk-copy lane.
        positions._r1FiniteVersion = positions.version;
        geometry._r1ColorSourceVersion = colorSourceVersion;
        geometry._r1ColorSourceArray = attrs.customColor.array;
      } else {
        for (let i = 0; i < count; i++) {
          for (let c = 0; c < 3; c++) {
            positions.array[i * 3 + c] = attrs.position.getComponent(i, c) +
              attrs.displacement.getComponent(i, c) * amplitude;
            colors.array[i * 3 + c] = attrs.customColor.getComponent(i, c);
          }
        }
        positions._r1DynamicContent = true;
        colors._r1DynamicContent = true;
        positions.needsUpdate = true;
        colors.needsUpdate = true;
        geometry.computeBoundingSphere();
      }
      adaptedMaterial = previous && previous.kind === kind ? previous.material : new LineBasicMaterial({
        color: uniformColor && uniformColor.isColor ? uniformColor : new Color(0xffffff),
        opacity: uniforms.opacity ? Number(uniforms.opacity.value) : material.opacity,
        transparent: !!material.transparent,
        vertexColors: true,
        depthTest: material.depthTest,
        depthWrite: material.depthWrite,
        blending: material.blending,
        fog: material.fog
      });
      if (adaptedMaterial.color && uniformColor?.isColor) adaptedMaterial.color.copy(uniformColor);
      adaptedMaterial.opacity = uniforms.opacity ? Number(uniforms.opacity.value) : material.opacity;
      adaptationWarn(material, '_r1CustomLineWarned',
        'R1 evaluates the custom line displacement/color shader on the CPU.');
    } else if (kind === 'points') {
      // The official points examples mutate only the per-point size
      // attribute, whose mean rides the material lane. Rebuilding the
      // adapted geometry (and a fresh resource id) on every signature
      // change forced a full position/color re-upload, a new GPU buffer
      // and a disposal of the previous one per presented frame.
      if (pointColorAttribute) {
        if (previous && previous.kind === kind && previous.geometry !== source &&
            previous.geometry.attributes.position === attrs.position &&
            previous.geometry.attributes.color === pointColorAttribute) {
          geometry = previous.geometry;
          geometry.setDrawRange(source.drawRange.start, source.drawRange.count);
          if (source.boundingSphere) geometry.boundingSphere = source.boundingSphere;
        } else {
          geometry = new BufferGeometry();
          geometry.setAttribute('position', attrs.position);
          geometry.setAttribute('color', pointColorAttribute);
          geometry.setDrawRange(source.drawRange.start, source.drawRange.count);
          geometry.boundingSphere = source.boundingSphere;
        }
      } else geometry = source;
      let map = uniforms.pointTexture && uniforms.pointTexture.value;
      let alphaTest = uniforms.alphaTest ? Number(uniforms.alphaTest.value) : 0;
      if (!map && String(material.fragmentShader).includes('gl_PointCoord')) {
        map = pointDiscTexture();
        if (!alphaTest) alphaTest = 0.5;
      }
      const materialKey = [
        uniformColor && uniformColor.isColor ? `${uniformColor.r}:${uniformColor.g}:${uniformColor.b}` : '-',
        map ? resourceId(map) : 0, alphaTest,
        !(pointColorAttribute || attrs.color), !!material.transparent, material.opacity,
        material.depthTest, material.depthWrite, material.blending, material.fog ? 1 : 0, material.side
      ].join('|');
      if (previous && previous.kind === kind && previous.materialKey === materialKey) {
        adaptedMaterial = previous.material;
        // The mean point size is the only per-frame change; it is part of
        // the _ensureMaterial signature (pointSize), so the material
        // command re-encodes without an artificial version bump.
        adaptedMaterial.size = meanSize;
      } else {
        adaptedMaterial = new PointsMaterial({
          color: uniformColor && uniformColor.isColor ? uniformColor : new Color(0xffffff),
          size: meanSize,
          sizeAttenuation: true,
          map: map || null,
          alphaTest,
          vertexColors: !!(pointColorAttribute || attrs.color),
          transparent: !!material.transparent,
          opacity: material.opacity,
          depthTest: material.depthTest,
          depthWrite: material.depthWrite,
          blending: material.blending,
          fog: material.fog
        });
      }
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
    this._adaptedShaderDraws.set(object, { kind, source, sourceMaterial: material, signature, geometry, material: adaptedMaterial, materialKey });
    return { geometry, material: adaptedMaterial, lineSegments: kind === 'selective' ? true : undefined };
  }

  _adaptDrawable(object) {
    return this._adaptLineDraw(object) || this._adaptShaderDraw(object);
  }

  _batchedGeometry(object, geometryId, record) {
    const cached = record.geometries.get(geometryId);
    if (cached) return cached;
    const source = object.geometry;
    const info = object._geometryInfo[geometryId];
    const geometry = new BufferGeometry();
    for (const name of ATTR_NAMES) {
      const attribute = source.attributes[name];
      if (!attribute) continue;
      const values = new Float32Array(info.vertexCount * attribute.itemSize);
      for (let vertex = 0; vertex < info.vertexCount; vertex++) {
        for (let component = 0; component < attribute.itemSize; component++) {
          values[vertex * attribute.itemSize + component] = attribute.getComponent(info.vertexStart + vertex, component);
        }
      }
      geometry.setAttribute(name, new Float32BufferAttribute(values, attribute.itemSize, attribute.normalized));
    }
    const sourceIndex = source.index;
    const indices = new Uint32Array(info.count);
    for (let index = 0; index < info.count; index++) {
      indices[index] = sourceIndex
        ? sourceIndex.getX(info.indexStart + index) - info.vertexStart
        : index;
    }
    geometry.setIndex(new BufferAttribute(indices, 1));
    geometry.computeBoundingSphere();
    record.geometries.set(geometryId, geometry);
    return geometry;
  }

  _batchedMaterial(object, record) {
    const source = object.material;
    let hasLight = false;
    if (!this._sceneEnvironment && !source.envMap && source.isMeshStandardMaterial && source.metalness === 1) {
      let root = object;
      while (root.parent) root = root.parent;
      root.traverseVisible(child => { if (child.isLight) hasLight = true; });
    }
    const lightingKey = `${token(this._sceneEnvironment)}:${token(source.envMap)}:${hasLight ? 1 : 0}`;
    if (record.materialSource === source && record.lightingKey === lightingKey) return record.material;
    if (record.ownsMaterial) record.material.dispose();
    let material = source;
    if (!this._sceneEnvironment && !source.envMap && source.isMeshStandardMaterial &&
        source.metalness === 1 && !hasLight &&
        (!source.emissive || source.emissiveIntensity === 0 ||
         (source.emissive.r === 0 && source.emissive.g === 0 && source.emissive.b === 0))) {
      material = new MeshBasicMaterial({
        color: source.color, map: source.map, alphaMap: source.alphaMap,
        side: source.side, transparent: source.transparent, opacity: source.opacity,
        depthTest: source.depthTest, depthWrite: source.depthWrite,
        blending: source.blending, alphaTest: source.alphaTest,
        vertexColors: source.vertexColors, wireframe: source.wireframe,
        fog: source.fog
      });
      material.clippingPlanes = source.clippingPlanes;
      material.clipIntersection = source.clipIntersection;
      material.clipShadows = source.clipShadows;
      adaptationWarn(source, '_r1BatchedUnlitMaterialWarned',
        'R1 retains colors with an unlit BatchedMesh material because the omitted environment was the only illumination for fully metallic geometry.');
    }
    record.materialSource = source;
    record.lightingKey = lightingKey;
    record.material = material;
    record.ownsMaterial = material !== source;
    return material;
  }

  _syncBatchedMeshProxies(object) {
    if (Array.isArray(object.material)) unsupported('multiMaterial', 'R1 BatchedMesh instancing requires a single material');
    let record = this._batchedMeshProxies.get(object);
    if (!record) {
      record = { geometryKey: '', instanceKey: '', geometries: new Map(), proxies: [], materialSource: null, material: null, ownsMaterial: false };
      this._batchedMeshProxies.set(object, record);
    }
    const material = this._batchedMaterial(object, record);
    const source = object.geometry;
    const infos = object._geometryInfo || [];
    const geometryKey = [
      ...ATTR_NAMES.map(name => attributeVersionKey(source.attributes[name])),
      attributeVersionKey(source.index),
      ...infos.map(info => [info.active, info.vertexStart, info.vertexCount, info.indexStart, info.count].join(':'))
    ].join('|');
    if (record.geometryKey !== geometryKey) {
      for (const proxy of record.proxies) object.remove(proxy);
      for (const geometry of record.geometries.values()) geometry.dispose();
      record.proxies = [];
      record.geometries.clear();
      record.geometryKey = geometryKey;
      record.instanceKey = '';
    }
    const matrices = object._matricesTexture;
    const colors = object._colorsTexture;
    const instanceKey = [matrices?.version || 0, colors?.version || 0].join(':');
    for (const proxy of record.proxies) {
      proxy.material = material;
      proxy.castShadow = object.castShadow;
      proxy.receiveShadow = object.receiveShadow;
      proxy.frustumCulled = object.frustumCulled;
    }
    if ((record.instanceKey === instanceKey && !object._visibilityChanged) || !matrices?.image?.data) return;
    for (const proxy of record.proxies) object.remove(proxy);
    record.proxies = [];
    const groups = new Map();
    const instances = object._instanceInfo || [];
    let retained = 0;
    for (let id = 0; id < instances.length && retained < MAX_BATCHED_INSTANCES; id++) {
      const instance = instances[id];
      if (!instance || instance.active === false || instance.visible === false) continue;
      const geometryId = instance.geometryIndex;
      if (!infos[geometryId] || infos[geometryId].active === false || infos[geometryId].count <= 0) continue;
      let group = groups.get(geometryId);
      if (!group) { group = []; groups.set(geometryId, group); }
      group.push(id);
      retained++;
    }
    const matrixData = matrices.image.data;
    const colorData = colors?.image?.data || null;
    for (const [geometryId, ids] of groups) {
      const geometry = this._batchedGeometry(object, geometryId, record);
      const proxy = new InstancedMesh(geometry, material, ids.length);
      const matrixArray = proxy.instanceMatrix.array;
      const colorArray = colorData ? new Float32Array(ids.length * 3) : null;
      for (let index = 0; index < ids.length; index++) {
        const sourceId = ids[index];
        for (let component = 0; component < 16; component++) {
          matrixArray[index * 16 + component] = matrixData[sourceId * 16 + component];
        }
        if (colorArray) {
          colorArray[index * 3] = colorData[sourceId * 4];
          colorArray[index * 3 + 1] = colorData[sourceId * 4 + 1];
          colorArray[index * 3 + 2] = colorData[sourceId * 4 + 2];
        }
      }
      proxy.instanceMatrix.needsUpdate = true;
      if (colorArray) proxy.instanceColor = new InstancedBufferAttribute(colorArray, 3);
      proxy.castShadow = object.castShadow;
      proxy.receiveShadow = object.receiveShadow;
      proxy.frustumCulled = object.frustumCulled;
      proxy.raycast = jsrBatchedMeshProxyRaycast;
      proxy.userData.jsrBatchedMeshProxy = true;
      object.add(proxy);
      proxy.updateMatrixWorld(true);
      record.proxies.push(proxy);
    }
    object._visibilityChanged = false;
    record.instanceKey = instanceKey;
  }

  // Per-instance morph textures (webgl_instancing_morph): R1 cannot evaluate
  // a per-instance weight texture on the GPU, so the flock is re-grouped into
  // a bounded set of PHASE BUCKETS — instances with a similar first morph
  // weight share one CPU-blended geometry clone drawn as one instanced
  // proxy. Instance matrices and colors stay exact; the animation phase is
  // quantized to the bucket resolution (24 buckets ≈ a 15° gallop phase step
  // on the horse cycle), which is visually indistinguishable at 1024
  // instances and keeps the per-frame re-upload under ~350 KB (proven
  // envelope budget: the 120fps skinning lane re-uploads ~868 KB/frame).
  _syncInstancedMorphProxies(object) {
    if (Array.isArray(object.material)) unsupported('multiMaterial', 'R1 instanced morphs take a single material');
    const geometry = object.geometry;
    const morphPositions = geometry.morphAttributes?.position || [];
    const morphCount = morphPositions.length;
    const morphData = object.morphTexture?.image?.data ||
      object.morphTexture?.source?.data?.data || null;
    if (!morphCount || !morphData) return;
    let record = this._instancedMorphProxies.get(object);
    if (!record) {
      const buckets = Math.min(24, Math.max(8, Math.round(object.count / 42) + 8));
      const sourceAttrs = geometry.attributes;
      const vertexCount = sourceAttrs.position?.count || 0;
      const proxies = [];
      const geometries = [];
      for (let bucket = 0; bucket < buckets; bucket++) {
        const bucketGeometry = new BufferGeometry();
        for (const name of ['position', 'normal', 'uv', 'color']) {
          const attribute = sourceAttrs[name];
          if (!attribute) continue;
          const array = attribute.array.slice(0, vertexCount * attribute.itemSize);
          bucketGeometry.setAttribute(name, new BufferAttribute(array, attribute.itemSize));
        }
        if (geometry.index) bucketGeometry.setIndex(geometry.index.clone());
        bucketGeometry.boundingSphere = new Sphere(new Vector3(0, 0, 0), 800);
        geometries.push(bucketGeometry);
        const proxy = new InstancedMesh(bucketGeometry, object.material, object.count);
        proxy.castShadow = object.castShadow;
        proxy.receiveShadow = object.receiveShadow;
        proxy.frustumCulled = object.frustumCulled;
        proxy.raycast = jsrBatchedMeshProxyRaycast;
        proxy.userData.jsrInstancedMorphProxy = true;
        proxies.push(proxy);
        object.add(proxy);
        proxy.updateMatrixWorld(true);
      }
      record = {
        buckets,
        morphCount,
        proxies,
        geometries,
        morphLength: morphData.length,
        instanceKey: '',
        lastPhaseKey: '',
        members: proxies.map(() => [])
      };
      this._instancedMorphProxies.set(object, record);
      adaptationWarn(object, '_r1InstancedMorphWarned',
        `R1 evaluates per-instance morph weights on the CPU through ${buckets} phase-bucket proxies; instance matrices and colors are exact, the animation phase is quantized to the bucket resolution.`);
    }
    const stride = record.morphCount + 1;
    if (morphData.length < object.count * stride) return;
    const matrixSource = object.instanceMatrix.array;
    const colorSource = object.instanceColor ? object.instanceColor.array : null;
    // Bucket assignment: the first morph weight cycles with the animation
    // phase (upstream's mixer drives all 15 weights from one time curve);
    // instances with a nearby phase share a bucket and a representative pose.
    const phaseKey = [matrixSource.length, colorSource ? colorSource.length : 0].join(':');
    if (phaseKey !== record.instanceKey) {
      record.instanceKey = phaseKey;
      const members = record.members;
      for (const list of members) list.length = 0;
      for (let i = 0; i < object.count; i++) {
        const phase = ((morphData[i * stride + 1] % 1) + 1) % 1;
        const bucket = Math.min(record.buckets - 1, Math.floor(phase * record.buckets));
        members[bucket].push(i);
      }
    }
    // Re-blend every bucket geometry + refresh proxy instance data. The
    // representative weights are re-read EVERY frame (the mixer advances all
    // weights continuously; the member partition is stable but the poses are
    // not).
    const base = geometry.attributes.position.array;
    const vertexCount = base.length;
    for (let bucket = 0; bucket < record.buckets; bucket++) {
      const proxy = record.proxies[bucket];
      const members = record.members[bucket];
      proxy.count = members.length;
      if (!members.length) continue;
      const matrixArray = proxy.instanceMatrix.array;
      for (let m = 0; m < members.length; m++) {
        const source = members[m] * 16;
        for (let c = 0; c < 16; c++) matrixArray[m * 16 + c] = matrixSource[source + c];
      }
      proxy.instanceMatrix.needsUpdate = true;
      if (colorSource) {
        if (!proxy.instanceColor || proxy.instanceColor.array.length < members.length * 3) {
          proxy.instanceColor = new InstancedBufferAttribute(new Float32Array(members.length * 3), 3);
        }
        const colorArray = proxy.instanceColor.array;
        for (let m = 0; m < members.length; m++) {
          const source = members[m] * 3;
          colorArray[m * 3] = colorSource[source];
          colorArray[m * 3 + 1] = colorSource[source + 1];
          colorArray[m * 3 + 2] = colorSource[source + 2];
        }
        proxy.instanceColor.needsUpdate = true;
      }
      // CPU blend of the representative weights into the bucket geometry.
      const positionAttribute = record.geometries[bucket].attributes.position;
      if (!positionAttribute) continue;
      const out = positionAttribute.array;
      const weightOffset = members[0] * stride + 1;
      let baseWeight = 1;
      for (let j = 0; j < record.morphCount; j++) baseWeight -= morphData[weightOffset + j];
      for (let v = 0; v < vertexCount; v++) out[v] = base[v] * baseWeight;
      for (let j = 0; j < record.morphCount; j++) {
        const weight = morphData[weightOffset + j];
        if (weight === 0) continue;
        const target = morphPositions[j].array;
        if (!target || target.length < vertexCount) continue;
        for (let v = 0; v < vertexCount; v++) out[v] += target[v] * weight;
      }
      positionAttribute.needsUpdate = true;
    }
  }

  _ensureNode(object, parentId, commands, drawVisible) {
    const id = resourceId(object);
    // Fast path for many-object scenes (e.g. webgl_interactive_cubes' 2000
    // unit boxes with one material each): an unchanged plain mesh reuses the
    // cached geometry/material ids and draw descriptor instead of re-running
    // the full resource lanes, which cost tens of microseconds per unchanged
    // node per frame in QuickJS. Validation contract:
    //  - object/geometry/material identity and the cheap per-node flags are
    //    re-read every frame;
    //  - matrixWorld is compared numerically against the validated copy;
    //  - geometry content is validated once per frame per geometry through
    //    upstream's own invalidation model (attribute/index version bumps,
    //    drawRange), so bumped content still takes the full path;
    //  - frustum-VISIBLE fast nodes still run the full material ensure, so
    //    material content changes (e.g. the hover emissive swap) re-emit;
    //  - frustum-CULED fast nodes skip the resource lanes entirely (they
    //    draw nothing this frame; the first unculed frame revalidates before
    //    any draw references them).
    if (drawVisible && !this._sceneOverrideMaterial) {
      const fast = this._fastNode(object, id, parentId, commands);
      if (fast) return fast;
    }
    const materialVisible = !object.material || object.material.visible !== false;
    const visible = !!object.visible && materialVisible;
    const batched = !!object.isInstancedMesh || !!(object.isMesh && Array.isArray(object.material));
    // GLBufferAttribute points draw-range lane. The official
    // webgl_buffergeometry_glbufferattribute example re-routes setDrawRange
    // every frame over a GPU-side buffer; slicing the moved window per frame
    // re-sent up to ~140k points (~3.4MB) every frame (measured presentedFps
    // 18 and falling). Upload the full vertex set once and move the window
    // through a NON-instanced DRAW_BATCH part (offset/count), which the Dart
    // planner already honors per part for the points primitive. The lane is
    // keyed on the geometry shape, not the material, so every points drawable
    // over such a geometry takes the same resource identity and signature.
    const rangeLaneObject = !!(object.isPoints && !Array.isArray(object.material) &&
      object.geometry && !object.geometry.index &&
      object.geometry.attributes.position &&
      object.geometry.attributes.position.isGLBufferAttribute);
    const spriteCenter = object.isSprite
      ? (object.center || { x: 0.5, y: 0.5 })
      : { x: 0.5, y: 0.5 };
    if ((!drawVisible || !materialVisible) && !object.isLight && !object.isCamera) {
      const objectKind = this._objectKind(object);
      if (!batched && !rangeLaneObject) this._removeBatch(id, commands);
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
    let rangeLane = false;
    // Set only when the plain single-material triangle-mesh lane produced a
    // draw without a shader/line adaptation — the fast-lane eligibility
    // marker for _writeFastNode below.
    let plainLaneDraw = null;
    if (object.isBatchedMesh) {
      adaptationWarn(object, '_r1BatchedMeshWarned',
        'R1 retains bounded BatchedMesh instances as per-geometry instanced draws; LOD selection and per-range sorting are omitted.');
      this._syncBatchedMeshProxies(object);
      this._removeBatch(id, commands);
      this._updateNode(object, id, parentId, 0, 0, visible, 0, commands, spriteCenter);
      return { id, draw: null };
    }
    if (object.isInstancedMesh && object.morphTexture &&
      object.geometry?.morphAttributes?.position?.length) {
      this._syncInstancedMorphProxies(object);
      this._updateNode(object, id, parentId, 0, 0, visible, 0, commands, spriteCenter);
      return { id, draw: null };
    }
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
      if (!batched && sourcePosition && sourceRange(sourceGeometry, sourcePosition.count).count === 0) {
        this._removeBatch(id, commands);
        this._updateNode(object, id, parentId, 0, 0, visible, 0, commands, spriteCenter);
        return { id, draw: null };
      }
      this._applyMorphTargets(object);
      if (object.isSkinnedMesh) this._applySkining(object);
      const adapted = this._sceneOverrideMaterial ? null : this._adaptDrawable(object);
      const material = this._sceneOverrideMaterial || (adapted ? adapted.material : object.material);
      const renderGeometry = adapted ? adapted.geometry : object.geometry;
      rangeLane = rangeLaneObject && !adapted && renderGeometry === object.geometry;
      if (!adapted && !sourcePosition) {
        adaptationWarn(object, '_r1EmptyGeometryWarned', 'R1 retains an empty drawable as a no-draw node.');
        if (!batched && !rangeLane) this._removeBatch(id, commands);
        this._updateNode(object, id, parentId, 0, 0, visible, 0, commands, spriteCenter);
        return { id, draw: null };
      }
      if (material._r1ProceduralTime) refreshProceduralRtt(renderGeometry, material._r1ProceduralTime.value);
      if (renderGeometry._r1TimeColor) refreshTimeColorGeometry(renderGeometry, Number(renderGeometry._r1Time?.value || 0));
      if (renderGeometry._r1Displaced) refreshDisplacedShaderGeometry(renderGeometry, Number(renderGeometry._r1Amplitude?.value || 0));
      if (renderGeometry._r1Instanced) refreshInstancedShaderGeometry(renderGeometry, object.material.uniforms || {}, object, this._frameViewMatrix || null);
      if (renderGeometry._r1Boids) refreshBoidsShaderGeometry(renderGeometry, renderGeometry._r1Boids.uniforms || object.material.uniforms || {});
      if (renderGeometry._r1ProtoPoints) refreshProtoPointsGeometry(renderGeometry, renderGeometry._r1ProtoPoints.uniforms || object.material.uniforms || {});
      if (adapted) {
        const adaptedPosition = renderGeometry.attributes.position;
        if (!adaptedPosition || sourceRange(renderGeometry, adaptedPosition.count).count === 0) {
          if (!batched && !rangeLane) this._removeBatch(id, commands);
          this._updateNode(object, id, parentId, 0, 0, visible, 0, commands, spriteCenter);
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
      const geometry = this._ensureGeometry(renderGeometry, primitive, mode, commands, wireframe, rangeLane);
      if (batched || rangeLane) {
        let parts = null;
        if (rangeLane) {
          const range = sourceRange(object.geometry, renderGeometry.attributes.position.count);
          if (range.count === 0) {
            this._removeBatch(id, commands);
            this._updateNode(object, id, parentId, 0, 0, visible, 0, commands, spriteCenter);
            return { id, draw: null };
          }
          parts = [{
            geometryId: geometry.id,
            materialId: this._ensureMaterial(materials[0], commands),
            offset: range.start, count: range.count
          }];
        }
        batch = { geometry, materials, parts };
      } else {
        geometryId = geometry.id;
        materialId = this._ensureMaterial(material, commands);
        draw = { primitive: wireframe ? 1 : primitive, count: wireframe ? geometry.wireDrawCount : geometry.drawCount };
        if (!adapted) plainLaneDraw = draw;
      }
    } else if (object.isLight || object.isCamera) {
      return null;
    } else if (object.isInstancedMesh || object.isBatchedMesh) {
      unsupported('objectType', object.type);
    }
    if (!batched && !rangeLane) this._removeBatch(id, commands);
    if (!batched && !rangeLane && plainLaneDraw !== null) {
      this._writeFastNode(object, id, parentId, visible, plainLaneDraw);
    }
    this._updateNode(object, id, parentId, geometryId, materialId, visible, objectKind, commands, spriteCenter);
    if (batch) draw = this._ensureBatch(object, id, batch.geometry, batch.materials, commands, batch.parts);
    return { id, draw };
  }

  /// Per-frame geometry validation gate (shared across the meshes that
  /// reference the same geometry): the gate is eligible only for plain
  /// non-morph non-special geometries, and "clean" means upstream's own
  /// content invalidation signals (attribute/index versions plus drawRange)
  /// are unchanged since the last validation.
  _geometryGate(geometry) {
    let gate = this._frameGeometryGate.get(geometry);
    if (gate !== undefined) return gate;
    const position = geometry.attributes && geometry.attributes.position;
    const morphs = geometry.morphAttributes;
    const eligible = !!(position && !position.isGLBufferAttribute &&
      (!morphs || (!(morphs.position && morphs.position.length) &&
        !(morphs.normal && morphs.normal.length))) &&
      !geometry._r1TimeColor && !geometry._r1Displaced && !geometry._r1Instanced);
    let clean = false;
    if (eligible) {
      const snapshot = this._geometryGateStampSnapshot(geometry);
      const persisted = this._geometryGateStamp.get(geometry);
      clean = !!persisted && persisted.rangeStart === snapshot.rangeStart &&
        persisted.rangeCount === snapshot.rangeCount &&
        persisted.index === snapshot.index &&
        persisted.position === snapshot.position &&
        persisted.normal === snapshot.normal &&
        persisted.uv === snapshot.uv &&
        persisted.color === snapshot.color &&
        persisted.indexVersion === snapshot.indexVersion &&
        persisted.positionVersion === snapshot.positionVersion &&
        persisted.normalVersion === snapshot.normalVersion &&
        persisted.uvVersion === snapshot.uvVersion &&
        persisted.colorVersion === snapshot.colorVersion;
      this._geometryGateStamp.set(geometry, snapshot);
    }
    gate = { eligible, clean };
    this._frameGeometryGate.set(geometry, gate);
    return gate;
  }

  /// Current content-invalidation stamp of a geometry (attribute identity +
  /// upstream versions + drawRange). Persisted after every full validation
  /// and compared per frame by the fast-lane gate.
  _geometryGateStampSnapshot(geometry) {
    const range = geometry.drawRange;
    const index = geometry.index;
    const attrs = geometry.attributes;
    return {
      rangeStart: range ? range.start : 0,
      rangeCount: range ? range.count : Infinity,
      index,
      position: attrs.position, normal: attrs.normal, uv: attrs.uv, color: attrs.color,
      indexVersion: index ? index.version : 0,
      positionVersion: attrs.position ? attrs.position.version : 0,
      normalVersion: attrs.normal ? attrs.normal.version : 0,
      uvVersion: attrs.uv ? attrs.uv.version : 0,
      colorVersion: attrs.color ? attrs.color.version : 0
    };
  }

  /// Returns the cached fast-lane result for an unchanged plain mesh, or
  /// null when anything must take the full validation path below.
  _fastNode(object, id, parentId, commands) {
    const dbg = globalThis.__JSR_R1PROBE;
    const miss = reason => { if (dbg) dbg['miss_' + reason] = (dbg['miss_' + reason] || 0) + 1; return null; };
    const rec = this._nodeFast.get(object);
    if (rec === undefined) return miss('noRec');
    const material = object.material;
    if (!material || Array.isArray(material) || material !== rec.material) return miss('material');
    if (object.geometry !== rec.geometry || !object.isMesh ||
        object.isInstancedMesh || object.isBatchedMesh || object.isSkinnedMesh ||
        (object.morphTargetInfluences && object.morphTargetInfluences.length)) return miss('lane');
    const visible = object.visible && material.visible !== false;
    if (rec.parentId !== parentId || rec.visible !== visible ||
        rec.frustumCulled !== (object.frustumCulled === true) ||
        rec.renderOrder !== object.renderOrder ||
        rec.castShadow !== (object.castShadow === true) ||
        rec.receiveShadow !== (object.receiveShadow === true) ||
        rec.wireframe !== (material.wireframe === true)) return miss('flags');
    const gate = this._geometryGate(object.geometry);
    if (!gate || !gate.clean) return miss('gate');
    const elements = object.matrixWorld.elements;
    const saved = rec.matrix;
    for (let i = 0; i < 16; i++) {
      if (elements[i] !== saved[i]) return miss('matrix');
    }
    if (dbg) dbg.hits = (dbg.hits || 0) + 1;
    const culed = object.frustumCulled && !_frustum.intersectsObject(object);
    if (culed) {
      // The mesh draws nothing this frame, but the historical full-ensure
      // path raised the frame stencil flag for stencil-configured materials
      // regardless of culling; keep that byte behavior.
      if (material.stencilWrite) this._frameStencilActivity = true;
    } else {
      // Material content is re-validated whenever the node can actually
      // draw (identity and cheap flags above already passed).
      this._ensureMaterial(material, commands);
    }
    return { id, draw: rec.draw, culedFast: culed };
  }

  /// Records the fast-lane entry for a successfully validated plain mesh
  /// (called from the full path only). The matrix copy is reused across
  /// frames to keep the fast path allocation-free.
  _writeFastNode(object, id, parentId, visible, draw) {
    const material = object.material;
    if (!material || Array.isArray(material) || material._r1ProceduralTime) return;
    const influences = object.morphTargetInfluences;
    if (influences && influences.length) return;
    const saved = this._nodeFast.get(object);
    const matrix = saved && saved.matrix || new Array(16);
    const elements = object.matrixWorld.elements;
    for (let i = 0; i < 16; i++) matrix[i] = elements[i];
    this._nodeFast.set(object, {
      parentId,
      visible,
      frustumCulled: object.frustumCulled === true,
      renderOrder: object.renderOrder,
      castShadow: object.castShadow === true,
      receiveShadow: object.receiveShadow === true,
      geometry: object.geometry,
      material,
      draw,
      wireframe: material.wireframe === true,
      matrix
    });
    // The full path just validated this geometry against the Dart-side
    // state; persist its gate stamp so the very next frame can hit.
    this._geometryGateStamp.set(object.geometry,
      this._geometryGateStampSnapshot(object.geometry));
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
    else if (light.isLightProbe) {
      type = 0;
      adaptationWarn(light, '_r1LightProbeWarned',
        'R1 retains light-probe band 0 as ambient light; directional SH bands remain on the CPU helper only.');
    } else if (light.type === 'SunLight') type = 1; // addons/lights/SunLight: directional towards the origin
    else if (light.isRectAreaLight) {
      type = 2;
      adaptationWarn(light, '_r1RectAreaWarned',
        'R1 approximates RectAreaLight with a point light at its center; area shape and LTC distribution are dropped.');
    } else unsupported('light', light.type);
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
    } else if (light.isPointLight) {
      // Point lights have no direction. R1 uses those otherwise-zero lanes
      // for decay and cutoff distance; older decoders safely ignored them.
      // Omitting decay made the upstream default (2) act as zero, so bright
      // lights saturated every material instead of attenuating with distance.
      if (!Number.isFinite(light.decay) || light.decay < 0 ||
          !Number.isFinite(light.distance) || light.distance < 0) {
        throw new Error('three.invalid: PointLight distance/decay');
      }
      _direction.set(light.decay, light.distance, 0);
    }
    let lightColor = light.color;
    if (light.isLightProbe && light.sh?.coefficients?.[0]) {
      const coefficient = light.sh.coefficients[0];
      lightColor = light._r1ProbeColor || (light._r1ProbeColor = new Color());
      lightColor.setRGB(Math.max(0, coefficient.x * 0.886227),
        Math.max(0, coefficient.y * 0.886227), Math.max(0, coefficient.z * 0.886227));
    }
    const groundColor = light.isHemisphereLight ? light.groundColor : null;
    const spot = light.isSpotLight
      ? { angle: light.angle, penumbra: light.penumbra, distance: light.distance, decay: light.decay }
      : null;
    const signature = [type, lightColor.r, lightColor.g, lightColor.b, light.intensity,
      _position.x, _position.y, _position.z, _direction.x, _direction.y, _direction.z,
      groundColor ? groundColor.r : 0, groundColor ? groundColor.g : 0,
      groundColor ? groundColor.b : 0,
      spot ? spot.angle : 0, spot ? spot.penumbra : 0, spot ? spot.distance : 0, spot ? spot.decay : 0].join('|');
    const old = this._state.lights.get(id);
    if (!old || old.signature !== signature) {
      if (!Number.isFinite(light.intensity) || light.intensity < 0) throw new Error('three.invalid: light intensity');
      finiteArray([lightColor.r, lightColor.g, lightColor.b, _position.x, _position.y, _position.z, _direction.x, _direction.y, _direction.z], 'light');
      if (groundColor) finiteArray([groundColor.r, groundColor.g, groundColor.b], 'light groundColor');
      commands.push(lightCommand(id, type, lightColor, light.intensity, _position, _direction, groundColor, spot));
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
      // Upstream WebGLBackground renders the skybox in a dedicated pass
      // BEFORE the scene. R1 sorts the injected node among the opaque draws,
      // so without a reserved renderOrder its position depends on material
      // creation order: when the module's materials upsert first the skybox
      // draws LAST and its near-plane fragments pass the depth test,
      // painting the whole frame over (watch white-slab / clearcoat missing
      // spheres). Pin it first like the upstream pass.
      this._backgroundMesh.renderOrder = -1e6;
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

  _flushBatch(batch) {
    if (!batch || batch.commands.length === 0) return;
    const sequence = this._state.sequence + 1;
    this._state.sequence = sequence;
    this._sendCommands(batch.commands, sequence);
  }

  _sendCommands(commands, sequence) {
    const canvas = this.domElement;
    const bytes = encodeEnvelope(commands, canvas.engineId, canvas.surfaceId, sequence);
    this.runtime.sendR1(bytes);
  }

  _emit(commands) {
    if (this._animationBatch) {
      this._animationBatch.commands.push(...commands);
      return;
    }
    if (globalThis.__JSR_NO_RENDER_BATCH) {
      const sequence = this._state.sequence + 1;
      this._state.sequence = sequence;
      this._sendCommands(commands, sequence);
      return;
    }
    // Per-task envelope batching: consecutive renderer.render() calls inside
    // ONE JS task (a composer tick runs up to ~15 sub-pass renders) used to
    // cross the bridge as 15 separate envelopes, each carrying a frame the
    // Dart pump queued individually. At 120 Hz that is ~1800 frame-submits/s,
    // which overflowed the host's pending-frame queue (measured 1132
    // coalesced/dropped frames vs 84 presented in 2 s ≈ 39.9 fps ceiling on
    // three-postprocessing-unreal-bloom). Accumulating within the task and
    // flushing once on the task end microtask gives the decoder the SAME
    // per-frame command sequence in one envelope: one bridge crossing, one
    // state apply, one pump per tick. Single-render widgets flush one
    // envelope per task exactly as before — byte-identical content and
    // pacing. A synchronous flush remains available for disposal ordering.
    if (this._renderBatch === null) {
      this._renderBatch = { commands: [] };
      // QuickJS on this engine has no queueMicrotask global; the runtime's
      // established microtask pattern is a resolved-promise job (see
      // _scheduleCanvasRefresh). Both flush once per task after sync code.
      Promise.resolve().then(() => this._flushRenderBatch());
    }
    this._renderBatch.commands.push(...commands);
  }

  _flushRenderBatch() {
    const batch = this._renderBatch;
    if (batch === null) return;
    this._renderBatch = null;
    if (batch.commands.length === 0) return;
    const sequence = this._state.sequence + 1;
    this._state.sequence = sequence;
    this._sendCommands(batch.commands, sequence);
  }

  _frameTargetSpec(commands) {
    const target = this._renderTarget;
    const targetId = target ? this._ensureRenderTarget(target, commands) : 0;
    const viewportRect = target ? target.viewport : this._viewport;
    const scissorRect = target ? target.scissor : this._scissor;
    const viewport = this._rectangle(viewportRect.x, viewportRect.y, viewportRect.z, viewportRect.w);
    const scissor = this._rectangle(scissorRect.x, scissorRect.y, scissorRect.z, scissorRect.w);
    const scissorTest = target ? target.scissorTest : this._scissorTest;
    let flags = FRAME_TARGET_FLAGS.viewport | (scissorTest ? FRAME_TARGET_FLAGS.scissor : 0) | this._clearFlags;
    if (this.autoClear && this.autoClearColor) flags |= FRAME_TARGET_FLAGS.clearColor;
    if (this.autoClear && this.autoClearDepth) flags |= FRAME_TARGET_FLAGS.clearDepth;
    // Upstream auto-clears the stencil at frame start (autoClearStencil
    // defaults true). R1 sets the bit only when this frame actually touches
    // stencil state, keeping stenciless frames' flags word byte-stable.
    if (this.autoClear && this.autoClearStencil && this._frameStencilActivity) flags |= FRAME_TARGET_FLAGS.clearStencil;
    return {
      targetId,
      width: target ? Math.floor(target.width) : 0,
      height: target ? Math.floor(target.height) : 0,
      viewport,
      scissor,
      flags
    };
  }

  compile(scene, camera) {
    if (!scene?.isObject3D || !camera?.isCamera) throw new Error('three.invalid: compile requires a scene and camera');
    adaptationWarn(this, '_r1CompileWarned',
      'R1 compiles native materials on submission; onBeforeCompile shader injection is dropped.');
  }
  compileAsync(scene, camera) {
    this.compile(scene, camera);
    return Promise.resolve();
  }

  render(scene, camera) {
    const arrayCamera = !!(camera && camera.isArrayCamera);
    let ownedBatch = null;
    if (arrayCamera) {
      if (!Array.isArray(camera.cameras) || camera.cameras.length > 64) {
        throw new Error('three.invalid: ArrayCamera requires at most 64 subcameras');
      }
      if (!this._animationBatch) {
        ownedBatch = { commands: [] };
        this._animationBatch = ownedBatch;
      }
    }
    const previousPending = this._pendingDisposals.slice();
    const previousSequence = this._state.sequence;
    this._transaction = new Map();
    this._transactionListens = [];
    try {
      let result;
      if (arrayCamera) {
        const previousViewport = this._viewport;
        const previousScissor = this._scissor;
        const previousScissorTest = this._scissorTest;
        try {
          for (const subcamera of camera.cameras) {
            if (!subcamera || !subcamera.viewport) throw new Error('three.invalid: ArrayCamera subcamera viewport is required');
            const rect = subcamera.viewport;
            const scale = this._renderTarget ? 1 : this._pixelRatio;
            const viewport = this._rectangle(rect.x / scale, rect.y / scale, rect.z / scale, rect.w / scale);
            this._viewport = viewport;
            this._scissor = viewport;
            this._scissorTest = true;
            result = this._render(scene, subcamera);
          }
        } finally {
          this._viewport = previousViewport;
          this._scissor = previousScissor;
          this._scissorTest = previousScissorTest;
        }
      } else {
        result = this._render(scene, camera);
      }
      if (ownedBatch) {
        this._animationBatch = null;
        this._flushBatch(ownedBatch);
      }
      this._transaction = null;
      this._transactionListens = null;
      this.domElement._r1State = this._state;
      return result;
    } catch (error) {
      if (ownedBatch) this._animationBatch = null;
      this._walkCommands = null;
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
    if (!scene || !scene.isObject3D) throw new Error('three.invalid: render requires an Object3D');
    if (this.outputColorSpace !== SRGBColorSpace) unsupported('outputColorSpace', 'native R1 requires SRGBColorSpace');
    if (!TONE_MAPPINGS.has(this.toneMapping)) unsupported('toneMapping', `${this.toneMapping} is not an upstream tone mapping constant`);
    if (this.xr.enabled) unsupported('xr');
    let overrideMaterial = scene.overrideMaterial || null;
    if (overrideMaterial?.isShaderMaterial &&
        (overrideMaterial.name === 'BokehDepthShader' || overrideMaterial.uniforms?.mNear)) {
      // BokehDepth-style shader overrides have no shader lane; keep their
      // bounding dark-box semantics.
      if (!this._r1DepthOverride) this._r1DepthOverride = new MeshBasicMaterial({ color: 0x000000, side: overrideMaterial.side });
      overrideMaterial = this._r1DepthOverride;
      adaptationWarn(scene, '_r1DepthOverrideWarned',
        'R1 lowers shader depth overrides to opaque dark geometry for bounded target passes.');
    }
    // A plain MeshDepthMaterial override now rides the real depth-viz lane
    // (material kind 12, grayscale linearized view depth into the color
    // attachment). The previous lowering swapped it for opaque black, which
    // black-holed every depth-prepass target: webgl_depth_texture's RT held
    // black, and the post quad sampled that black for both tDiffuse and the
    // (aliased) tDepth — the whole widget presented a black screen.
    else if (overrideMaterial?.isMeshDepthMaterial && !this._r1DepthOverrideWarned) {
      this._r1DepthOverrideWarned = true;
      adaptationWarn(scene, '_r1DepthOverrideWarned',
        'R1 renders MeshDepthMaterial overrides through the depth-viz lane (grayscale view depth).');
    }
    this._sceneOverrideMaterial = overrideMaterial;
    if (overrideMaterial) adaptationWarn(scene, '_r1OverrideMaterialWarned',
      'R1 applies the bounded scene.overrideMaterial to every drawable in this pass.');
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
    this._frameViewMatrix = camera.matrixWorldInverse;
    this._frameMaterials = new Map();
    this._frameTextures = new Map();
    this._frameMorphKeys = new Map();
    this._frameGeometryGate.clear();
    this._frameStencilActivity = false;
    const commands = [];
    this._walkCommands = commands;
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
    let draws = 0;
    let triangles = 0;
    let lines = 0;
    let points = 0;
    const culledNodeIds = [];
    const shadowCandidates = [];
    this._ensureBackgroundNode(scene, camera, commands, seenNodes);
    _frustumMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_frustumMatrix);
    // Per-walk visibility/parent-id ride short-lived expando fields on the
    // objects themselves instead of two Maps (2000+ nodes/frame): traverse is
    // pre-order, so a child always reads its parent's just-written values, and
    // unwalked parents fall back to visible/root (the same defaults the Maps
    // had). Values are rewritten every frame for every walked node.
    scene.traverseVisible(object => {
      // THREE.LOD selects the active level per frame; upstream WebGLRenderer
      // does the same in projectObject before visibility is flattened.
      if (object.isLOD) object.update(camera);
      const op = object.parent;
      const parentVisible = op ? (op.__r1Vis === undefined ? true : op.__r1Vis) : true;
      const visibleHere = parentVisible && !!object.visible && (!object.material || object.material.visible !== false);
      object.__r1Vis = visibleHere;
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
        object.__r1Pid = op ? (op.__r1Pid || 0) : 0;
        return;
      }
      if (object.isCamera) { object.__r1Pid = op ? (op.__r1Pid || 0) : 0; return; }
      const parentId = op ? (op.__r1Pid || 0) : 0;
      if (!visibleHere) {
        // Hidden source/reference meshes must not become permanent zero-draw
        // native nodes. Existing nodes retire once below; re-showing recreates.
        object.__r1Pid = parentId;
        return;
      }
      const result = !this._sceneOverrideMaterial
        ? this._fastNode(object, resourceId(object), parentId, commands)
        : null;
      const node = result || this._ensureNode(object, parentId, commands, visibleHere);
      if (node) {
        seenNodes.add(node.id);
        const nodeEntry = this._state.nodes.get(node.id);
        if (nodeEntry) nodeEntry.sceneId = renderedSceneId;
        object.__r1Pid = node.id;
        // Upstream sprites never cast shadows, so they stay out of the
        // shadow scan even with a user-set castShadow flag.
        if (node.draw && object.castShadow && !object.isSprite) shadowCandidates.push(object);
        const culled = node.draw && (node.culledFast !== undefined
          ? node.culledFast
          : (object.frustumCulled && !_frustum.intersectsObject(object)));
        if (culled) culledNodeIds.push(node.id);
        // v8: upstream calls object.onAfterRender after renderBufferDirect —
        // i.e. only for unculled draws. Skip the upstream no-op prototype
        // method so untouched scenes never enter the callback path.
        if (!culled && node.draw && object.onAfterRender &&
            object.onAfterRender !== Object3D.prototype.onAfterRender) {
          this._runOnAfterRender(object, scene, camera, commands, node.id);
        }
        if (!culled && node.draw && node.draw.parts) {
          if (node.draw.instanceCount > 0) {
            for (const part of node.draw.parts) {
              if (part.count === 0) continue;
              draws++;
              triangles += part.count / 3 * node.draw.instanceCount;
            }
          }
        } else if (!culled && node.draw) {
          draws++;
          if (node.draw.primitive === 0) triangles += node.draw.count / 3;
          else if (node.draw.primitive === 1) lines += node.draw.count / 2;
          else points += node.draw.count;
        }
      } else object.__r1Pid = parentId;
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
    commands.push(frameCommand(resourceId(scene), cameraId, background, this.toneMappingExposure, fog, shadow, culledNodeIds, culledShadowNodeIds, shadowLightType, this.toneMapping, pointShadow, this._frameTargetSpec(commands)));
    this._walkCommands = null;
    this._emit(commands);
    this._clearFlags = 0;
    // Only canvas-target renders may seed the resize/refresh redraw: an
    // offscreen pass must not be replayed onto the default framebuffer.
    if (!this._renderTarget) {
      this._lastScene = scene;
      this._lastCamera = camera;
    }
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
    for (const [id] of this._state.renderTargets) dispose(id, RESOURCE_KIND.renderTarget);
    for (const [id] of this._state.materials) dispose(id, RESOURCE_KIND.material);
    for (const [id] of this._state.nodes) dispose(id, RESOURCE_KIND.node);
    for (const [id] of this._state.lights) dispose(id, RESOURCE_KIND.light);
    for (const [id] of this._state.cameras) dispose(id, RESOURCE_KIND.camera);
    commands.push(disposeSurfaceCommand());
    try {
      this._renderBatch = null; // dispose crosses synchronously, never batched
      this._emit(commands);
    } finally {
      this._unlistenAll();
      this._state.geometries.clear(); this._state.textures.clear(); this._state.materials.clear();
      this._state.nodes.clear(); this._state.batches.clear(); this._state.lights.clear(); this._state.cameras.clear();
      this._state.renderTargets.clear();
      for (const [id, record] of this._renderTargets) {
        const disposeTarget = this._renderTargetDisposers.get(id);
        record.target.removeEventListener('dispose', disposeTarget);
        record.target.texture.removeEventListener('dispose', disposeTarget);
      }
      this._renderTargetDisposers.clear();
      this._renderTargets.clear();
      this.domElement.dispose();
      if (this.domElement.renderer === this) this.domElement.renderer = null;
    }
  }
}

export { JsrWebGLRenderer as WebGLRenderer };

// Cached radial point-sprite texture for the bounded procedural-sprite
// lowering (see the gl_PointCoord branch in the shader lowering). One shared
// white RGBA8 falloff per runtime; vertex colors supply the per-particle hue.
let _r1RadialSprite = null;
function radialPointSpriteTexture() {
  if (_r1RadialSprite) return _r1RadialSprite;
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    const dx = (px + 0.5) / size - 0.5;
    const dy = (py + 0.5) / size - 0.5;
    const r = Math.min(1, Math.hypot(dx, dy) * 2);
    // Smooth alpha falloff with a bright core: matches the classic
    // `1 - length(gl_PointCoord - 0.5)` glow family (protoplanet).
    const a = Math.max(0, 1 - r);
    const glow = a * a * (3 - 2 * a);
    const offset = (py * size + px) * 4;
    data[offset] = 255; data[offset + 1] = 255; data[offset + 2] = 255;
    data[offset + 3] = Math.round(glow * 255);
  }
  const texture = new DataTexture(data, size, size);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.needsUpdate = true;
  _r1RadialSprite = texture;
  return texture;
}
