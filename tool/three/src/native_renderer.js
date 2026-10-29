import {
  BackSide, Color, DoubleSide, FrontSide, Frustum, LinearFilter, Matrix4, MeshBasicMaterial,
  MeshLambertMaterial, MeshStandardMaterial, MirroredRepeatWrapping, NearestFilter,
  NearestMipmapNearestFilter, NearestMipmapLinearFilter, NormalBlending, NoToneMapping,
  PointsMaterial, RGBAFormat, RepeatWrapping, SRGBColorSpace, UVMapping,
  UnsignedByteType, Vector3
} from 'three';
import { unsupported, requireFinite } from './errors.js';
import { getThreeRuntime } from './runtime.js';
import { isNativeCanvas2D } from './native_canvas2d.js';
import {
  OPCODE, NO_SHADOW, cameraCommand, command, disposeResourceCommand, disposeSurfaceCommand,
  drawBatchCommand, encodeEnvelope, frameCommand, geometryCommand, lightCommand,
  materialCommand, nodeCommand, removeBatchCommand, removeNodeCommand, resourceId,
  textureCommand
} from './r1.js';

const ATTR_NAMES = ['position', 'normal', 'uv', 'color'];
const MAX_INSTANCES = 1000000;
const MAX_BATCH_PARTS = 1024;
const RESOURCE_KIND = { geometry: 1, texture: 2, material: 3, node: 4, light: 5, camera: 6 };
const ZERO = new Vector3();
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

function attributeSignature(attribute) {
  if (!attribute) return '-';
  return [attribute.id, attribute.version, attribute.itemSize, attribute.normalized ? 1 : 0,
    attribute.count, token(attribute.array), attribute.data ? attribute.data.version : 0,
    attribute.data ? token(attribute.data.array) : 0, attribute.offset || 0].join(':');
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

function attributeFloats(attribute, vertexCount, components, name) {
  if (!attribute) return null;
  if (typeof attribute.getComponent !== 'function' || attribute.isGLBufferAttribute) unsupported('rawGLAttribute', name);
  if (attribute.itemSize !== components || attribute.count !== vertexCount) throw new Error(`three.invalid: ${name} attribute must have ${components} components per vertex`);
  const values = new Float32Array(vertexCount * components);
  for (let i = 0; i < vertexCount; i++) {
    for (let c = 0; c < components; c++) {
      const value = attribute.getComponent(i, c);
      requireFinite(value, `${name} attribute`);
      values[i * components + c] = value;
    }
  }
  return values;
}

function prepareIndices(geometry, primitive, mode, vertexCount) {
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

function materialKind(material) {
  if (material.isMeshBasicMaterial) return 0;
  if (material.isMeshLambertMaterial) return 1;
  if (material.isMeshStandardMaterial && !material.isMeshPhysicalMaterial) return 2;
  if (material.isLineBasicMaterial && !material.isLineDashedMaterial) return 3;
  if (material.isPointsMaterial) return 4;
  if (material.isMeshPhongMaterial) return 5;
  if (material.isMeshNormalMaterial) return 6;
  unsupported('material', material.type || 'unknown material');
}

function supportsEmissive(material) {
  return material.isMeshLambertMaterial || material.isMeshPhongMaterial ||
    (material.isMeshStandardMaterial && !material.isMeshPhysicalMaterial);
}

function validateMaterial(material) {
  if (material.isShaderMaterial || material.isRawShaderMaterial) unsupported('ShaderMaterial', 'arbitrary shaders require 1B');
  if (material.wireframe && !(material.isMeshBasicMaterial || material.isMeshLambertMaterial || material.isMeshPhongMaterial || material.isMeshNormalMaterial || (material.isMeshStandardMaterial && !material.isMeshPhysicalMaterial))) unsupported('wireframe', 'R1 wireframe requires a mesh material');
  if (material.wireframe && (material.wireframeLinewidth !== 1 || material.wireframeLinecap !== 'round' || material.wireframeLinejoin !== 'round')) unsupported('wireframeStyle', 'R1 supports one-pixel round wireframe lines');
  if (material.blending !== NormalBlending) unsupported('materialBlending');
  if (material.alphaHash || material.premultipliedAlpha || material.colorWrite === false || material.stencilWrite || material.polygonOffset) unsupported('materialState', 'alphaHash/premultipliedAlpha/colorWrite/stencil/polygonOffset');
  if (material.clippingPlanes && material.clippingPlanes.length) unsupported('clippingPlanes');
  if (Object.prototype.hasOwnProperty.call(material, 'onBeforeCompile')) unsupported('onBeforeCompile', 'arbitrary shaders require 1B');
  const maps = ['alphaMap', 'aoMap', 'bumpMap', 'displacementMap', 'emissiveMap', 'envMap', 'lightMap', 'metalnessMap', 'normalMap', 'roughnessMap', 'specularMap', 'clearcoatMap', 'transmissionMap'];
  for (const name of maps) if (material[name]) unsupported('materialTexture', `${material.type}.${name}`);
  if (!supportsEmissive(material) && material.emissive &&
      (material.emissive.r !== 0 || material.emissive.g !== 0 || material.emissive.b !== 0)) {
    unsupported('emissiveMaterial', `${material.type} has no upstream emissive support`);
  }
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
      features: Object.freeze({ geometry: true, textures: true, lambert: true, standard: true, phong: true, normal: true, emissive: true, hemisphereLight: true, wireframe: true, rawWebGL: false, shaderMaterial: false })
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
    this._clearAlpha = 0;
    this._pixelRatio = canvas.pixelRatio || 1;
    this._width = canvas.clientWidth || canvas.width;
    this._height = canvas.clientHeight || canvas.height;
    this._disposed = false;
    this._animationLoop = null;
    this._animationHandle = null;
    this._pendingDisposals = [];
    this._resources = new Map();
    this._geometryModes = new Map();
    this._canvasTextures = new Map();
    this._canvasRefreshHandle = null;
    this._lastScene = null;
    this._lastCamera = null;
    this._state = canvas._r1State || (canvas._r1State = {
      sequence: 0,
      geometries: new Map(), textures: new Map(), materials: new Map(),
      nodes: new Map(), batches: new Map(), lights: new Map(), cameras: new Map()
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

  _listen(resource, type, map, id) {
    if (!resource || !resource.addEventListener || this._resources.has(resource)) return;
    const kinds = { geometries: RESOURCE_KIND.geometry, textures: RESOURCE_KIND.texture, materials: RESOURCE_KIND.material, nodes: RESOURCE_KIND.node };
    const listener = () => {
      this._unlisten(resource);
      if (type === 'textures') this._unwatchCanvasTexture(resource);
      if (type === 'geometries') this._mapDelete(this._geometryModes, id);
      if (this._state[type].has(id)) {
        this._mapDelete(this._state[type], id);
        const item = { id, kind: kinds[type] };
        if (type === 'nodes' && this._mapDelete(this._state.batches, id)) item.batch = true;
        this._pendingDisposals.push(item);
      }
    };
    resource.addEventListener('dispose', listener);
    this._resources.set(resource, { type, id, listener });
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
    if (!texture.isCanvasTexture) return null;
    if (isNativeCanvas2D(texture.image)) return texture.image;
    const canvas = texture.userData && texture.userData.jsrCanvas2D;
    return isNativeCanvas2D(canvas) ? canvas : null;
  }

  _ensureTexture(texture, commands) {
    if (!texture) return 0;
    if (!texture.isTexture) unsupported('texture', 'material map is not a THREE.Texture');
    if (texture.isCubeTexture || texture.isDataArrayTexture || texture.isData3DTexture || texture.isCompressedTexture || texture.isVideoTexture || texture.isFramebufferTexture || texture.isDepthTexture || texture.isExternalTexture) unsupported('textureType', texture.type);
    const canvas = this._canvasForTexture(texture);
    if (texture.isCanvasTexture && !canvas) unsupported('canvas2d.source', 'native CanvasTexture requires a Flutter canvas2d image');
    if (canvas) {
      const entry = this._watchCanvasTexture(texture, canvas);
      this._adoptCanvasTexture(entry);
      if (!canvas._ready) return 0;
    }
    if (texture.mapping !== UVMapping) unsupported('textureMapping');
    if (texture.premultiplyAlpha || texture.anisotropy > 1 || (texture.mipmaps && texture.mipmaps.length)) unsupported('textureState', 'premultiplyAlpha/anisotropy/custom mipmaps');
    if (texture.channel !== 0 || texture.offset.x !== 0 || texture.offset.y !== 0 || texture.repeat.x !== 1 || texture.repeat.y !== 1 || texture.center.x !== 0 || texture.center.y !== 0 || texture.rotation !== 0) unsupported('textureTransform', 'R1 v1 has no UV transform fields');
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
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
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
      if (texture.format !== RGBAFormat || texture.type !== UnsignedByteType) unsupported('textureFormat', 'R1 raw textures require RGBA8/UnsignedByteType');
      if (!width || !height || width * height * 4 !== bytes.byteLength) throw new Error('three.invalid: raw RGBA8 texture dimensions/data length');
    } else if (encoding !== 1 && encoding !== 2) unsupported('textureEncoding', encoding);
    if (encoding !== 0 && bytes.length === 0) throw new Error('three.invalid: encoded texture bytes must be nonempty');
    commands.push(textureCommand(id, changed.version, width, height, encoding, textureFlags(texture), bytes));
    this._mapSet(this._state.textures, id, { signature, version: changed.version, object: texture });
    this._frameTextures.set(id, id);
    return id;
  }

  _ensureMaterial(material, commands) {
    const kind = materialKind(material);
    validateMaterial(material);
    const id = resourceId(material);
    const frameCached = this._frameMaterials.get(id);
    if (frameCached !== undefined) return frameCached;
    this._listen(material, 'materials', this._state.materials, id);
    const mapId = this._ensureTexture(material.map || null, commands);
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
    const flags = (material.vertexColors ? 1 : 0) | (material.flatShading ? 2 : 0) | (material.transparent ? 4 : 0) | (material.depthTest ? 8 : 0) | (material.depthWrite ? 16 : 0) | (material.wireframe ? 32 : 0);
    const signature = [kind, mapId, material.map ? this._state.textures.get(resourceId(material.map))?.version || 0 : 0,
      flags, side, color.r, color.g, color.b, opacity, roughness, metalness, alphaTest, pointSize,
      specular ? specular.r : 0, specular ? specular.g : 0, specular ? specular.b : 0, shininess,
      emissive ? emissive.r : 0, emissive ? emissive.g : 0, emissive ? emissive.b : 0, emissiveIntensity, material.version].join('|');
    const changed = this._nextVersion(this._state.materials, id, signature);
    if (changed) {
      commands.push(materialCommand(id, changed.version, kind, mapId, flags, side, color, opacity, roughness, metalness, alphaTest, pointSize, specular, shininess, emissive, emissiveIntensity));
      this._mapSet(this._state.materials, id, { signature, version: changed.version, object: material });
    }
    this._frameMaterials.set(id, id);
    return id;
  }

  _ensureGeometry(geometry, primitive, mode, commands, wireframe = false) {
    if (!geometry || !geometry.isBufferGeometry) unsupported('geometry', 'only BufferGeometry is supported');
    if (geometry.isInstancedBufferGeometry) unsupported('instancedGeometry');
    if (geometry.index && (!geometry.index.array || geometry.index.isGLBufferAttribute)) unsupported('rawGLAttribute', 'index');
    if (geometry.morphAttributes && Object.keys(geometry.morphAttributes).some(key => geometry.morphAttributes[key] && geometry.morphAttributes[key].length)) unsupported('morphTargets');
    const position = geometry.attributes.position;
    if (!position) throw new Error('three.invalid: position attribute is required');
    const vertexCount = position.count;
    if (!Number.isInteger(vertexCount) || vertexCount <= 0 || vertexCount > 4000000) throw new Error('three.invalid: vertexCount');
    const id = resourceId(geometry);
    const oldMode = this._geometryModes.get(id);
    if (oldMode && (oldMode.primitive !== primitive || oldMode.mode !== mode)) unsupported('sharedGeometryPrimitive', 'one geometry cannot be used with multiple R1 primitive modes on a surface');
    const old = this._state.geometries.get(id);
    const includeWire = primitive === 0 && (wireframe || (old && old.hasWireIndices));
    const frameCached = this._frameGeometries.get(id);
    if (frameCached && (!wireframe || frameCached.hasWireIndices)) return frameCached;
    this._mapSet(this._geometryModes, id, { primitive, mode });
    this._listen(geometry, 'geometries', this._state.geometries, id);
    const signature = `${geometrySignature(geometry, primitive, mode)};wire:${includeWire ? 1 : 0}`;
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
    const attributes = {
      position: attributeFloats(position, vertexCount, 3, 'position'),
      normal: attributeFloats(geometry.attributes.normal, vertexCount, 3, 'normal'),
      uv: attributeFloats(geometry.attributes.uv, vertexCount, 2, 'uv'),
      color: geometry.attributes.color ? attributeFloats(geometry.attributes.color, vertexCount, geometry.attributes.color.itemSize, 'color') : null
    };
    if (geometry.attributes.color && geometry.attributes.color.itemSize !== 3 && geometry.attributes.color.itemSize !== 4) throw new Error('three.invalid: color attribute must have 3 or 4 components');
    const indices = prepareIndices(geometry, primitive, mode, vertexCount);
    const wireIndices = includeWire ? prepareWireIndices(geometry, vertexCount) : null;
    const indexCount = indices ? indices.length : 0;
    if (indexCount > 12000000) throw new Error('three.invalid: indexCount');
    commands.push(geometryCommand(id, changed.version, primitive, vertexCount, attributes, indices, wireIndices));
    const drawCount = indices ? indexCount : vertexCount;
    const range = sourceRange(geometry, vertexCount);
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

  _updateNode(object, id, parentId, geometryId, materialId, visible, objectKind, commands) {
    const matrix = object.matrixWorld;
    const castShadow = object.castShadow === true;
    const receiveShadow = object.receiveShadow === true;
    const old = this._state.nodes.get(id);
    const unchanged = old && old.parentId === parentId &&
      old.geometryId === geometryId && old.materialId === materialId &&
      old.visible === visible && old.objectKind === objectKind &&
      old.castShadow === castShadow && old.receiveShadow === receiveShadow &&
      cachedMatrixEquals(old.matrix, matrix);
    if (!unchanged) {
      finiteArray(matrix.elements, 'matrixWorld');
      commands.push(nodeCommand(id, parentId, geometryId, materialId, visible, objectKind, matrix, { cast: castShadow, receive: receiveShadow }));
      this._mapSet(this._state.nodes, id, {
        parentId, geometryId, materialId, visible, objectKind,
        castShadow, receiveShadow, matrix: matrix.elements.slice(), object
      });
    }
  }

  _removeBatch(id, commands) {
    if (!this._mapDelete(this._state.batches, id)) return;
    commands.push(removeBatchCommand(id));
  }

  _instanceData(object, materials) {
    if (object.instanceColor) unsupported('instanceColor', 'R1 instancing supports matrices only');
    for (const material of materials) {
      if (material.transparent) unsupported('transparentInstancedMesh', 'R1 instanced draws must be opaque');
    }
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
    return {
      count, array, valueCount,
      signature: [attribute.version, token(attribute), token(array), attribute.count].join(':')
    };
  }

  _ensureBatchParts(object, geometry, materials, commands) {
    if (object.isInstancedMesh && !Array.isArray(object.material)) {
      return [{ geometryId: geometry.id, materialId: this._ensureMaterial(materials[0], commands), offset: 0, count: geometry.drawCount }];
    }
    const groups = object.geometry.groups;
    if (!groups || groups.length === 0) unsupported('multiMaterialGroups', 'material arrays require BufferGeometry.groups');
    if (groups.length > MAX_BATCH_PARTS) throw new Error(`three.invalid: batch partCount exceeds ${MAX_BATCH_PARTS}`);
    if (!object.geometry.index && (groups.length !== 1 || groups[0].start !== 0 || groups[0].count !== geometry.sourceCount)) {
      unsupported('nonIndexedGroups', 'R1 supports only one full-geometry group for non-indexed material arrays');
    }
    const rangeEnd = geometry.rangeStart + geometry.rangeCount;
    const parts = [];
    for (const group of groups) {
      if (!group || !Number.isInteger(group.start) || group.start < 0 || !Number.isInteger(group.count) || group.count < 0) throw new Error('three.invalid: geometry group start/count');
      if (!Number.isInteger(group.materialIndex) || group.materialIndex < 0 || group.materialIndex >= materials.length) throw new Error('three.invalid: geometry group materialIndex');
      if (group.start > geometry.sourceCount || group.count > geometry.sourceCount - group.start) throw new Error('three.invalid: geometry group is outside geometry bounds');
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
      const geometryState = this._state.geometries.get(geometry.id);
      const materialState = this._state.materials.get(simpleMaterialId);
      if (previous && previous.simpleInstanced && previous.object === object &&
          previous.geometry === object.geometry && previous.geometryVersion === geometryState.version &&
          previous.material === materials[0] && previous.materialVersion === materialState.version &&
          previous.instanceMatrix === attribute && previous.instanceVersion === attribute.version &&
          previous.instanceAttributeCount === attribute.count && previous.instanceArray === attribute.array &&
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
      }
      const count = instance ? instance.count : 1;
      commands.push(drawBatchCommand(id, changed.version, count, instance ? 1 : 0, parts, instance ? instance.array : null));
      this._mapSet(this._state.batches, id, {
        signature, version: changed.version, object, parts, simpleInstanced,
        geometry: object.geometry, geometryVersion: this._state.geometries.get(geometry.id).version,
        material: simpleInstanced ? materials[0] : null,
        materialVersion: simpleInstanced ? this._state.materials.get(simpleMaterialId).version : 0,
        instanceMatrix: instance ? object.instanceMatrix : null,
        instanceVersion: instance ? object.instanceMatrix.version : 0,
        instanceAttributeCount: instance ? object.instanceMatrix.count : 0,
        instanceArray: instance ? instance.array : null,
        instanceCount: instance ? instance.count : 0
      });
    }
    this._listen(object, 'nodes', this._state.nodes, id);
    return { primitive: 0, parts, instanceCount: instance ? instance.count : 1 };
  }

  _ensureNode(object, parentId, commands, drawVisible) {
    const id = resourceId(object);
    const materialVisible = !object.material || object.material.visible !== false;
    const visible = !!object.visible && materialVisible;
    const batched = !!object.isInstancedMesh || !!(object.isMesh && Array.isArray(object.material));
    if ((!drawVisible || !materialVisible) && !object.isLight && !object.isCamera) {
      const objectKind = object.isMesh ? 1 : (object.isPoints ? 3 : ((object.isLine || object.isLineSegments) ? 2 : 0));
      if (!batched) this._removeBatch(id, commands);
      this._updateNode(object, id, parentId, 0, 0, visible, objectKind, commands);
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
      this._updateNode(object, id, parentId, 0, 0, visible, 1, commands);
      return { id, draw: null };
    }
    let geometryId = 0;
    let materialId = 0;
    let objectKind = 0;
    let draw = null;
    let batch = null;
    if (object.isMesh || object.isLine || object.isLineSegments || object.isPoints) {
      if (object.isSkinnedMesh || object.isBatchedMesh || object.isSprite) unsupported('objectType', object.type);
      if (object.isLineLoop) unsupported('LineLoop');
      const material = object.material;
      if (!material || (Array.isArray(material) && material.length === 0)) throw new Error('three.invalid: drawable has no material');
      let primitive = 0;
      let mode = 'triangles';
      objectKind = 1;
      if (object.isPoints) { primitive = 2; mode = 'points'; objectKind = 3; }
      else if (object.isLine || object.isLineSegments) { primitive = 1; mode = object.isLineSegments ? 'lines' : 'line'; objectKind = 2; }
      if (Array.isArray(material) && primitive !== 0) unsupported('multiMaterial', 'R1 material arrays require triangle meshes');
      const materials = Array.isArray(material) ? material : [material];
      const wireframe = primitive === 0 && materials.some(item => item.wireframe);
      if (batched && wireframe) unsupported('wireframeBatch', 'R1 wireframe requires a single-material non-instanced Mesh');
      const geometry = this._ensureGeometry(object.geometry, primitive, mode, commands, wireframe);
      if (batched) {
        batch = { geometry, materials };
      } else {
        geometryId = geometry.id;
        materialId = this._ensureMaterial(material, commands);
        draw = { primitive: wireframe ? 1 : primitive, count: wireframe ? geometry.wireDrawCount : geometry.drawCount };
      }
    } else if (object.isLight || object.isCamera) {
      return null;
    } else if (object.isSkinnedMesh || object.isInstancedMesh || object.isBatchedMesh || object.isSprite || object.isLOD) {
      unsupported('objectType', object.type);
    }
    if (!batched) this._removeBatch(id, commands);
    this._updateNode(object, id, parentId, geometryId, materialId, visible, objectKind, commands);
    if (batch) draw = this._ensureBatch(object, id, batch.geometry, batch.materials, commands);
    return { id, draw };
  }

  _ensureLight(light, commands) {
    let type;
    if (light.isAmbientLight) type = 0;
    else if (light.isDirectionalLight) type = 1;
    else if (light.isPointLight) type = 2;
    else if (light.isHemisphereLight) type = 3;
    else unsupported('light', light.type);
    const id = resourceId(light);
    light.getWorldPosition(_position);
    _direction.set(0, 0, 0);
    if (light.isDirectionalLight) {
      light.target.updateMatrixWorld(true);
      _target.setFromMatrixPosition(light.target.matrixWorld);
      _direction.copy(_position).sub(_target).normalize();
    } else if (light.isHemisphereLight) {
      // THREE uses the normalized world position as the hemisphere direction;
      // translation is directional state, not a point-light location/target.
      _direction.copy(_position).normalize();
    }
    const groundColor = light.isHemisphereLight ? light.groundColor : null;
    const signature = [type, light.color.r, light.color.g, light.color.b, light.intensity,
      _position.x, _position.y, _position.z, _direction.x, _direction.y, _direction.z,
      groundColor ? groundColor.r : 0, groundColor ? groundColor.g : 0,
      groundColor ? groundColor.b : 0].join('|');
    const old = this._state.lights.get(id);
    if (!old || old.signature !== signature) {
      if (!Number.isFinite(light.intensity) || light.intensity < 0) throw new Error('three.invalid: light intensity');
      finiteArray([light.color.r, light.color.g, light.color.b, _position.x, _position.y, _position.z, _direction.x, _direction.y, _direction.z], 'light');
      if (groundColor) finiteArray([groundColor.r, groundColor.g, groundColor.b], 'light groundColor');
      commands.push(lightCommand(id, type, light.color, light.intensity, _position, _direction, groundColor));
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
    if (!background.isColor) unsupported('backgroundTexture', 'R1 v1 accepts a Color or null background');
    return { r: background.r, g: background.g, b: background.b, a: 1 };
  }

  _fog(scene) {
    const fog = scene.fog;
    if (fog === null || fog === undefined) {
      return { mode: 0, color: { r: 0, g: 0, b: 0 }, near: 0, far: 0 };
    }
    if (!fog.isFog) unsupported('fogType', 'R1 supports linear THREE.Fog');
    finiteArray([fog.color.r, fog.color.g, fog.color.b, fog.near, fog.far], 'fog');
    if (fog.near < 0 || fog.far <= fog.near) throw new Error('three.invalid: fog requires 0 <= near < far');
    return { mode: 1, color: fog.color, near: fog.near, far: fog.far };
  }

  _shadow(scene, light) {
    if (!this.shadowMap.enabled) return NO_SHADOW;
    if (!light || !light.shadow || !light.shadow.camera || !light.shadow.mapSize) return NO_SHADOW;
    const shadow = light.shadow;
    const width = Math.floor(shadow.mapSize.x);
    const height = Math.floor(shadow.mapSize.y);
    light.target.updateMatrixWorld(true);
    shadow.camera.updateProjectionMatrix();
    shadow.updateMatrices(light);
    const manual = this.shadowMap.autoUpdate === false;
    if (manual && this.shadowMap.needsUpdate === true) {
      this._manualShadowRevision = (this._manualShadowRevision + 1) >>> 0;
      if (this._manualShadowRevision === 0) this._manualShadowRevision = 1;
      this.shadowMap.needsUpdate = false;
    }
    let refreshCulling = true;
    if (manual) {
      const key = this._manualShadowRevision + '|' + width + '|' + height + '|' +
        shadow.bias + '|' + shadow.normalBias + '|' + shadow.matrix.elements.join(',');
      refreshCulling = key !== this._shadowCullingKey;
      this._shadowCullingKey = key;
    }
    return {
      width, height, bias: shadow.bias, normalBias: shadow.normalBias,
      radius: shadow.radius, matrix: shadow.matrix, camera: shadow.camera,
      contentRevision: manual ? this._manualShadowRevision : undefined,
      refreshCulling
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
    if (this.toneMapping !== NoToneMapping) unsupported('toneMapping', 'native R1 requires NoToneMapping');
    if (this.xr.enabled) unsupported('xr');
    if (this.localClippingEnabled || this.clippingPlanes.length) unsupported('clippingPlanes');
    if (scene.environment || scene.overrideMaterial) unsupported('sceneFeature', 'environment/overrideMaterial are outside R1 v1');
    if (!camera || (!camera.isPerspectiveCamera && !camera.isOrthographicCamera)) unsupported('camera', 'R1 supports perspective and orthographic cameras');
    if (scene.matrixWorldAutoUpdate === true) scene.updateMatrixWorld();
    if (camera.parent === null && camera.matrixWorldAutoUpdate === true) {
      camera.updateMatrixWorld();
    }
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    this._frameGeometries = new Map();
    this._frameMaterials = new Map();
    this._frameTextures = new Map();
    const commands = [];
    const pending = this._pendingDisposals.splice(0);
    for (const item of pending) {
      if (item.batch) commands.push(removeBatchCommand(item.id));
      commands.push(disposeResourceCommand(item.id, item.kind));
    }
    const seenNodes = new Set();
    const seenLights = new Set();
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
    _frustumMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_frustumMatrix);
    scene.traverseVisible(object => {
      const parentVisible = object.parent ? (drawVisibility.get(object.parent) ?? true) : true;
      const visibleHere = parentVisible && !!object.visible && (!object.material || object.material.visible !== false);
      drawVisibility.set(object, visibleHere);
      if (object.isLight) {
        if (object.visible) seenLights.add(this._ensureLight(object, commands));
        if (!shadowLight && object.isDirectionalLight && object.visible && object.castShadow) {
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
        parents.set(object, result.id);
        if (result.draw && object.castShadow) shadowCandidates.push(object);
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
      if (!seenNodes.has(id)) {
        this._removeBatch(id, commands);
        commands.push(removeNodeCommand(id));
        this._mapDelete(this._state.nodes, id);
        retiredNodes.push(node.object);
      }
    }
    for (const [id] of this._state.lights) {
      if (!seenLights.has(id)) {
        commands.push(disposeResourceCommand(id, RESOURCE_KIND.light));
        this._mapDelete(this._state.lights, id);
      }
    }
    const cameraId = this._ensureCamera(camera, commands);
    const background = this._background(scene);
    const fog = this._fog(scene);
    const shadow = this._shadow(scene, shadowLight);
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
    commands.push(frameCommand(resourceId(scene), cameraId, background, this.toneMappingExposure, fog, shadow, culledNodeIds, culledShadowNodeIds));
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
