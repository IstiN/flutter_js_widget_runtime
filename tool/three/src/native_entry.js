import {
  Box3, CubeCamera as CoreCubeCamera, Mesh, DataTexture, EquirectangularReflectionMapping,
  LinearFilter, Matrix3, Matrix4, PMREMGenerator as CorePMREMGenerator, RGBAFormat, SkinnedMesh as CoreSkinnedMesh,
  Sphere, UnsignedByteType
} from 'three';
import { installThreeRuntime } from './runtime.js';
import { installNativeCanvas2D } from './native_canvas2d.js';
import { installNativeRaycastBVH } from './native_raycast_bvh.js';
import { JsrWebGLRenderer } from './native_renderer.js';
import { JsrImageLoader, JsrTextureLoader } from './native_loaders.js';

// Addon passes construct Image directly for embedded lookup textures. Route
// those elements through the same host decoder as ImageLoader, including the
// DOM onload/addEventListener surface used by SMAAPass and texture upload.
class JsrImageElement {
  constructor() {
    this.complete = false;
    this.width = 0;
    this.height = 0;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
    this.onload = null;
    this.onerror = null;
    this._listeners = new Map();
    this._request = 0;
    this._src = '';
  }

  get src() { return this._src; }

  set src(value) {
    this._src = String(value);
    this.complete = false;
    const request = ++this._request;
    new JsrImageLoader().load(this._src, image => {
      if (request !== this._request) return;
      this.width = this.naturalWidth = image.width;
      this.height = this.naturalHeight = image.height;
      this.data = image.data;
      this.encoding = image.encoding;
      this.encoded = image.encoded;
      this._r1Pixels = image._r1Pixels;
      this.complete = true;
      if (typeof this.onload === 'function') this.onload({ type: 'load', target: this });
      this.dispatchEvent({ type: 'load', target: this });
    }, error => {
      if (request !== this._request) return;
      if (typeof this.onerror === 'function') this.onerror(error);
      this.dispatchEvent({ type: 'error', target: this, error });
    });
  }

  addEventListener(type, callback) {
    const list = this._listeners.get(type) || [];
    if (!list.includes(callback)) list.push(callback);
    this._listeners.set(type, list);
  }

  removeEventListener(type, callback) {
    const list = this._listeners.get(type);
    if (list) this._listeners.set(type, list.filter(item => item !== callback));
  }

  dispatchEvent(event) {
    for (const callback of (this._listeners.get(event.type) || []).slice()) {
      callback.call(this, event);
    }
  }
}

// LUTImageLoader sends TextureLoader's decoded image directly through the
// example software canvas. Preserve the typed texture payload and additionally
// expose the two established local-pixel associations used by that canvas and
// the raw-image drawImage lane. Encoded sources remain native-upload only.
class JsrCanvasTextureLoader extends JsrTextureLoader {
  load(url, onLoad, onProgress, onError) {
    return super.load(url, texture => {
      const image = texture.image;
      if (image && image.encoded === false && image.data &&
          Number.isInteger(image.width) && Number.isInteger(image.height) &&
          image.width > 0 && image.height > 0 &&
          image.data.length === image.width * image.height * 4) {
        const pixels = image._examplePixels || {
          data: image.data instanceof Uint8ClampedArray ? image.data : new Uint8ClampedArray(image.data),
          width: image.width,
          height: image.height
        };
        image._examplePixels = pixels;
        image._r1Pixels = pixels;
      }
      if (onLoad) onLoad(texture);
    }, onProgress, onError);
  }
}

installNativeCanvas2D(installThreeRuntime(false));
if (typeof globalThis.Image === 'undefined') globalThis.Image = JsrImageElement;

// Blob + URL.createObjectURL facade for addons that hand embedded image
// bytes to an <img> through an object URL (USDLoader's USDComposer texture
// lane: `new Blob([data])` + `URL.createObjectURL(blob)` + `image.src = url`).
// The sandbox has no Blob/URL; register the bytes as a transient asset so the
// JsrImageElement/JsrImageLoader decoder pipeline resolves the URL unchanged.
const blobRegistry = new Map();
let blobRegistryNext = 0;
class JsrBlob {
  constructor(parts = [], options = {}) {
    let size = 0;
    const chunks = [];
    for (const part of parts) {
      if (part instanceof ArrayBuffer) { chunks.push(new Uint8Array(part)); size += part.byteLength; }
      else if (ArrayBuffer.isView(part)) {
        chunks.push(new Uint8Array(part.buffer, part.byteOffset, part.byteLength));
        size += part.byteLength;
      } else if (part instanceof JsrBlob) { chunks.push(part._bytes()); size += part.size; }
      else if (typeof part === 'string') {
        const bytes = new Uint8Array(part.length);
        for (let i = 0; i < part.length; i++) bytes[i] = part.charCodeAt(i) & 0xff;
        chunks.push(bytes); size += bytes.length;
      }
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    this._data = bytes;
    this.size = size;
    this.type = String(options.type || '');
  }
  _bytes() { return this._data; }
  arrayBuffer() { return this._data.buffer.slice(0, this._data.byteLength); }
}
const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function encodeBase64Bytes(bytes) {
  // Chunked flat-string join (runtime.js encodeBase64 precedent): quadratic
  // += over multi-hundred-KB payloads stalls QuickJS.
  const parts = [];
  let piece = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    piece += B64_ALPHABET[(n >> 18) & 63] + B64_ALPHABET[(n >> 12) & 63] +
      (i + 1 < bytes.length ? B64_ALPHABET[(n >> 6) & 63] : '=') +
      (i + 2 < bytes.length ? B64_ALPHABET[n & 63] : '=');
    if (piece.length >= 8192) { parts.push(piece); piece = ''; }
  }
  if (piece.length > 0) parts.push(piece);
  return parts.join('');
}
function registerBlobAsset(url, blob) {
  const runtime = installThreeRuntime(false);
  runtime.registerAsset(url, { data: encodeBase64Bytes(blob._bytes()), mime: blob.type || 'application/octet-stream' });
}
// R1 v8 (revised): do NOT install global Blob/createObjectURL here.
// GLB-family widgets (three-animation-multiple Soldier, all Needle boots)
// carry their own Blob/createObjectURL adapter that registers
// `blob:jsr-example-N` assets with RAW bytes; installing a competing global
// facade flipped GLTFLoader's embedded-image lane onto jsr-blob:N URLs the
// runtime texture decoder could not finish (Soldier base color lost,
// js_three_animation_multiple_texture_test red). The USDZ composer's blob
// lane needs its own follow-up behind a widget-level patch instead.
// URL must stay CONSTRUCTABLE: needle-family widgets (webgl_loader_gltf_*)
// lazily run `new URL(relPath, base)` for their draco/basis decoder assets.
// A plain `{}` stand-in made that throw "URL is not a constructor" and the
// async boot chain died before the first frame (three-loader-gltf-animation-
// pointer hang). Resolve relative paths against the base string; absolute
// and jsr-* scheme URLs pass through unchanged.
if (typeof globalThis.URL === 'undefined') {
  globalThis.URL = function JsrUrl(url, base) {
    url = String(url);
    if (base !== undefined && base !== null && String(base) !== '' &&
        !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) {
      const b = String(base);
      const cut = b.lastIndexOf('/');
      url = (cut >= 0 ? b.slice(0, cut + 1) : '') + url;
    }
    this.href = url;
  };
  globalThis.URL.prototype.toString = function () { return this.href; };
  Object.defineProperty(globalThis.URL.prototype, 'pathname', {
    get() { return this.href.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:/, ''); },
  });
}
// NOTE: intentionally NO global createObjectURL install (see the revised
// R1 v8 note above — the widget adapters own the blob lane).

installNativeRaycastBVH(Mesh);

const pmremWarnings = new WeakSet();

// The native env sampler already accepts equirectangular and six-face cube
// textures. Preserve those source pixels instead of running upstream's
// offscreen CubeUV shader chain, which R1 cannot reproduce. This is an explicit
// prefilter/roughness degrade, not a claim that a PMREM target was generated.
export class JsrPMREMGenerator extends CorePMREMGenerator {
  _warn(renderer, message) {
    if (pmremWarnings.has(renderer)) return;
    pmremWarnings.add(renderer);
    console.warn(`three: ${message}`);
  }

  compileCubemapShader() {
    if (this._renderer instanceof JsrWebGLRenderer) return;
    return super.compileCubemapShader();
  }

  compileEquirectangularShader() {
    if (this._renderer instanceof JsrWebGLRenderer) return;
    return super.compileEquirectangularShader();
  }

  fromCubemap(cubemap) {
    const renderer = this._renderer;
    if (renderer instanceof JsrWebGLRenderer) {
      this._warn(renderer, 'R1 samples the source cubemap directly; PMREM CubeUV prefiltering and roughness blur are omitted.');
      return { texture: cubemap, dispose() {} };
    }
    return super.fromCubemap(cubemap);
  }

  fromEquirectangular(equirectangular) {
    const renderer = this._renderer;
    if (renderer instanceof JsrWebGLRenderer) {
      this._warn(renderer, 'R1 samples the source equirectangular texture directly; PMREM CubeUV prefiltering and roughness blur are omitted.');
      return { texture: equirectangular, dispose() {} };
    }
    return super.fromEquirectangular(equirectangular);
  }

  fromScene(scene, sigma = 0, near = 0.1, far = 100, options = {}) {
    const renderer = this._renderer;
    if (renderer instanceof JsrWebGLRenderer) {
      this._warn(renderer, 'R1 approximates PMREM scene environments with a smooth room-gradient equirect (bright ceiling, lit side walls and a dark floor blended over ~0.08-wide smoothstep transitions, so metal surfaces keep directional shading without banding); per-scene prefiltering is omitted.');
      // RoomEnvironment-only examples have no direct lights. Returning null
      // makes their Standard/Physical materials black even though map pixels
      // uploaded correctly. A flat 0.8 environment kept the diffuse/specular
      // response but flattened every metalness-1 surface into a uniform
      // silhouette (no bright tops / dark undersides), so the approximation
      // mirrors the room's radiance layout instead: a bright ceiling with the
      // 100-intensity panel, mid walls with the side area lights, and a dark
      // floor at a mean level around 0.4. The vertical profile blends through
      // ~0.08-wide smoothstep transitions: the earlier hard band ladder left
      // full-saturation-to-dark luminance cliffs that the mirrored-floor
      // reflection sampled as a hard "shadow cut" across the floor.
      const texture = jsrRoomGradientEquirect();
      return { texture, dispose() { texture.dispose(); } };
    }
    return super.fromScene(scene, sigma, near, far, options);
  }}

// HTML-in-canvas requires a browser layout/rasterization stack. Preserve the
// official HTMLTexture construction and textured mesh with a bounded local
const JSR_ROOM_EQUIRECT_WIDTH = 128;
const JSR_ROOM_EQUIRECT_HEIGHT = 64;
function jsrRoomGradientEquirect() {
  const width = JSR_ROOM_EQUIRECT_WIDTH;
  const height = JSR_ROOM_EQUIRECT_HEIGHT;
  const data = new Uint8Array(width * height * 4);
  // Radiance layout mirrors the RoomEnvironment: a bright ceiling panel, mid
  // walls with two side area lights, and a dark floor. The two band
  // boundaries blend through 0.08-wide smoothstep windows (no hard edges);
  // at 64 rows the steepest per-row luminance step stays under 0.15, so the
  // floor reflection never lands on a luminance cliff.
  const CEILING_LEVEL = 0.75;
  const WALL_LEVEL = 0.32;
  const FLOOR_LEVEL = 0.05;
  const CEILING_EDGE = 0.3;
  const FLOOR_EDGE = 0.8;
  const TRANSITION = 0.08;
  const smoothstep = (edge0, edge1, x) => {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  };
  for (let y = 0; y < height; y++) {
    const v = (y + 0.5) / height;
    const level = WALL_LEVEL +
      (CEILING_LEVEL - WALL_LEVEL) * (1 - smoothstep(CEILING_EDGE - TRANSITION / 2, CEILING_EDGE + TRANSITION / 2, v)) +
      (FLOOR_LEVEL - WALL_LEVEL) * smoothstep(FLOOR_EDGE - TRANSITION / 2, FLOOR_EDGE + TRANSITION / 2, v);
    for (let x = 0; x < width; x++) {
      const u = x / width;
      let pixel = level;
      if (v > CEILING_EDGE + TRANSITION / 2 && v < FLOOR_EDGE - TRANSITION / 2) {
        const panel = Math.max(0, 1 - Math.abs(u - 0.25) * 8) +
          Math.max(0, 1 - Math.abs(u - 0.75) * 8);
        pixel = Math.min(1, level + panel * 0.3);
      }
      const byte = Math.max(0, Math.min(255, Math.round(pixel * 255)));
      const index = (y * width + x) * 4;
      data[index] = byte;
      data[index + 1] = byte;
      data[index + 2] = byte;
      data[index + 3] = 255;
    }
  }
  const texture = new DataTexture(data, width, height, RGBAFormat, UnsignedByteType);
  texture.mapping = EquirectangularReflectionMapping;
  // Bilinear sampling keeps the stored gradient smooth through the R1 env
  // sampler; the previous Nearest default re-introduced per-texel steps at
  // the band edges.
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

// RGBA8 placeholder rather than aborting the surrounding native scene.
export class JsrImageBitmapLoader extends JsrImageLoader {
  setOptions() { return this; }
}

const csgTokens = new WeakMap();
let nextCsgToken = 1;

// Bounded cube-camera lane. R1 stores a WebGLCubeRenderTarget as ONE bounded
// 2D color target (setRenderTarget drops per-face storage; the last face's
// pixels win). Upstream CubeCamera.update therefore spends five of its six
// full scene renders producing bytes the next face immediately overwrites in
// R1 storage. This override keeps upstream's state choreography — render
// target save/restore, mipmap generation enabled on the surviving (final)
// call, needsPMREMUpdate — but renders only the face whose pixels survive.
// Face sampling remains the already-disclosed approximation
// (_r1CubeTargetStorageWarned). Measured on webgl_animation_skinning_ik:
// five full scene plan-builds per frame dropped (cube lane 21.8ms -> 3.5ms).
function entryAdaptationWarn(object, key, message) {
  if (!object || object[key]) return;
  object[key] = true;
  console.warn(`three: ${message}`);
}

const stockCubeCameraUpdate = CoreCubeCamera.prototype.update;
CoreCubeCamera.prototype.update = function (renderer, scene) {
  const renderTarget = this.renderTarget;
  if (!renderTarget?.isWebGLCubeRenderTarget || !Array.isArray(this.children) || this.children.length !== 6) {
    return stockCubeCameraUpdate.call(this, renderer, scene);
  }
  entryAdaptationWarn(this, '_r1CubeFaceCollapseWarned',
    'CubeCamera.update renders only the final (-Z) face: R1 cube storage is one bounded 2D target whose pixels are the last face written, so the five overwritten face renders are dropped.');
  if (this.parent === null) this.updateMatrixWorld();
  const { activeMipmapLevel } = this;
  if (this.coordinateSystem !== renderer.coordinateSystem) {
    this.coordinateSystem = renderer.coordinateSystem;
    this.updateCoordinateSystem();
  }
  const cameraNZ = this.children[5];
  const currentRenderTarget = renderer.getRenderTarget();
  const currentActiveCubeFace = renderer.getActiveCubeFace();
  const currentActiveMipmapLevel = renderer.getActiveMipmapLevel();
  const currentXrEnabled = renderer.xr.enabled;
  renderer.xr.enabled = false;
  const generateMipmaps = renderTarget.texture.generateMipmaps;
  // Mipmaps are generated during the last render() call — in the bounded
  // lane that is the only call, so the flag is restored before it.
  renderTarget.texture.generateMipmaps = generateMipmaps;
  let reversedDepthBuffer = false;
  if (renderer.isWebGLRenderer === true) {
    reversedDepthBuffer = renderer.state.buffers.depth.getReversed();
  } else {
    reversedDepthBuffer = renderer.reversedDepthBuffer;
  }
  renderer.setRenderTarget(renderTarget, 5, activeMipmapLevel);
  if (reversedDepthBuffer && renderer.autoClear === false) renderer.clearDepth();
  renderer.render(scene, cameraNZ);
  renderer.setRenderTarget(currentRenderTarget, currentActiveCubeFace, currentActiveMipmapLevel);
  renderer.xr.enabled = currentXrEnabled;
  renderTarget.texture.needsPMREMUpdate = true;
  // Bounded probe-source tag: LightProbeGenerator.fromCubeRenderTarget needs
  // per-face pixels, which the bounded 2D cube storage cannot provide. When
  // the captured scene carried a real cube background (raw RGBA face data in
  // the image lane), expose it so the bounded generator can project the same
  // environment the cube camera actually photographed.
  if (scene.background && scene.background.isCubeTexture &&
    Array.isArray(scene.background.image) && scene.background.image.length === 6 &&
    scene.background.image[0] && scene.background.image[0].data) {
    renderTarget.texture._r1ProbeSource = scene.background;
  }
  // Probe-grid bakes (LightProbeGridWebGL) capture per-cell cube renders of
  // the static scene. The faces are not readable in the bounded lane, so the
  // generator falls back to light-derived SH from THIS scene.
  renderTarget.texture._r1ProbeScene = scene;
};

// Bounded skinned bounds. R1 CPU skining bakes bone transforms into the
// position attribute every changed frame (_applySkining). Upstream
// SkinnedMesh.computeBoundingSphere assumes a bind-pose attribute and
// re-applies the whole skeleton per vertex; over the already-skinned R1
// attribute that double-transforms every vertex — the webgl_animation_
// skinning_ik head-vanish root cause (published center displaced ~10 radii
// from the drawn extents) — and costs one skeleton-transformed pass per
// frame in the example's updateIK traverse. The honest R1 bound is the
// exact min/max of the CURRENT attribute (identical numbers to the
// per-render cull-sphere refresh), memoized on the attribute version so
// repeat calls within a frame are free.
const stockSkinnedComputeBoundingSphere = CoreSkinnedMesh.prototype.computeBoundingSphere;
CoreSkinnedMesh.prototype.computeBoundingSphere = function () {
  const position = this.geometry?.attributes?.position;
  if (!position || !position.array || !position.count || position.isInterleavedBufferAttribute) {
    return stockSkinnedComputeBoundingSphere.call(this);
  }
  const array = position.array;
  const memo = this._r1SkinnedBoundsMemo;
  const sphere = this.geometry.boundingSphere;
  if (sphere && memo && memo.version === position.version && memo.array === array) return sphere;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let v = 0, p3 = 0; v < position.count; v++, p3 += 3) {
    const x = array[p3], y = array[p3 + 1], z = array[p3 + 2];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const bounds = sphere || (this.geometry.boundingSphere = new Sphere());
  bounds.center.set((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
  bounds.radius = 0.5 * Math.hypot(maxX - minX, maxY - minY, maxZ - minZ);
  this._r1SkinnedBoundsMemo = { version: position.version, array };
  return bounds;
};
const nativeCSGDiagnostics = {
  evaluations: 0,
  exactHits: 0,
  transformSkips: 0,
  transformUpdates: 0,
  structuralInvalidations: 0
};
globalThis.__JSR_THREE_CSG_DIAGNOSTICS__ = nativeCSGDiagnostics;

function csgToken(value) {
  if (!value || (typeof value !== 'object' && typeof value !== 'function')) return String(value);
  let id = csgTokens.get(value);
  if (!id) { id = nextCsgToken++; csgTokens.set(value, id); }
  return id;
}

function csgBrushKey(brush) {
  const geometry = brush.geometry;
  const attributes = geometry ? Object.keys(geometry.attributes).sort().map(name => {
    const attribute = geometry.attributes[name];
    return `${name}:${attribute.version}:${csgToken(attribute.array)}`;
  }).join(',') : '';
  const materials = Array.isArray(brush.material) ? brush.material : [brush.material];
  return [csgToken(geometry), geometry?.index?.version || 0, attributes,
    materials.map(material => `${csgToken(material)}:${material?.version || 0}`).join(',')].join('|');
}

function csgStructuralKey(evaluator, a, b, operations, targetBrushes) {
  return [
    csgToken(a), csgToken(b), csgToken(targetBrushes),
    Array.isArray(operations) ? operations.map(csgToken).join(',') : csgToken(operations),
    evaluator.useGroups, evaluator.consolidateGroups, evaluator.removeUnusedMaterials,
    (evaluator.attributes || []).join(','), csgBrushKey(a), csgBrushKey(b)
  ].join(';');
}

function csgTransformKey(a, b) {
  return `${a.matrixWorld.elements.join(',')}|${b.matrixWorld.elements.join(',')}`;
}

function csgCaptureTransformCache(result, a, b, relativeTransforms) {
  if (!result || !result.geometry || !result.position || !result.matrixWorld) return null;
  if (!relativeTransforms) return { result, relativeTransforms: false };
  const geometry = result.geometry;
  const position = geometry.attributes.position;
  if (!position || position.itemSize !== 3 || position.isInterleavedBufferAttribute ||
      !position.array || !geometry.groups || geometry.groups.length === 0) return null;
  const normal = geometry.attributes.normal;
  if (normal && (normal.itemSize !== 3 || normal.isInterleavedBufferAttribute || !normal.array)) return null;
  const resultMaterials = Array.isArray(result.material) ? result.material : [result.material];
  const aMaterials = Array.isArray(a.material) ? a.material : [a.material];
  const bMaterials = Array.isArray(b.material) ? b.material : [b.material];
  const sources = new Uint8Array(position.count);
  const index = geometry.index;
  let marked = 0;
  for (const group of geometry.groups) {
    const material = resultMaterials[group.materialIndex];
    const fromA = aMaterials.includes(material);
    const fromB = bMaterials.includes(material);
    if (fromA === fromB) return null;
    const source = fromB ? 2 : 1;
    const end = group.start + group.count;
    for (let offset = group.start; offset < end; offset++) {
      const vertex = index ? index.getX(offset) : offset;
      if (vertex < 0 || vertex >= sources.length) return null;
      if (sources[vertex] === 0) marked++;
      else if (sources[vertex] !== source) return null;
      sources[vertex] = source;
    }
  }
  if (marked !== position.count) return null;
  // Propagation rewrites these arrays on every transform tick. Let R1 skip
  // the static-helper content hashes: hashing both arrays twice per frame is
  // pure QuickJS overhead and cannot avoid the required upload.
  position._r1DynamicContent = true;
  if (normal) normal._r1DynamicContent = true;
  return {
    result, sources,
    positionArray: position.array,
    basePositions: position.array.slice(0, position.count * 3),
    normalArray: normal ? normal.array : null,
    baseNormals: normal ? normal.array.slice(0, normal.count * 3) : null,
    aWorld: a.matrixWorld.clone(),
    bWorldInverse: b.matrixWorld.clone().invert(),
    transform: new Matrix4(),
    normalTransform: new Matrix3(),
    boundingBox: geometry.boundingBox || new Box3(),
    boundingSphere: geometry.boundingSphere || new Sphere()
  };
}

function csgUpdateTransformCache(cache, a, b) {
  if (!cache) return false;
  const result = cache.result;
  if (cache.relativeTransforms === false) {
    a.matrixWorld.decompose(result.position, result.quaternion, result.scale);
    result.updateMatrix();
    result.matrixWorld.copy(a.matrixWorld);
    return false;
  }
  const geometry = result.geometry;
  const position = geometry.attributes.position;
  if (position.array !== cache.positionArray) return false;
  // A-sourced vertices remain in A's local frame. B-sourced vertices follow
  // the relative B transform, expressed in the current A frame:
  // newA^-1 * newB * oldB^-1 * oldA.
  const m = cache.transform.copy(a.matrixWorld).invert()
    .multiply(b.matrixWorld).multiply(cache.bWorldInverse).multiply(cache.aWorld).elements;
  const normal = geometry.attributes.normal;
  if (normal && cache.normalArray) cache.normalTransform.getNormalMatrix(cache.transform);
  const nm = cache.normalTransform.elements;
  const positions = position.array, base = cache.basePositions, sources = cache.sources;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let vertex = 0; vertex < position.count; vertex++) {
    const offset = vertex * 3;
    const x = base[offset], y = base[offset + 1], z = base[offset + 2];
    let px = x, py = y, pz = z;
    if (sources[vertex] === 2) {
      const w = 1 / (m[3] * x + m[7] * y + m[11] * z + m[15]);
      px = (m[0] * x + m[4] * y + m[8] * z + m[12]) * w;
      py = (m[1] * x + m[5] * y + m[9] * z + m[13]) * w;
      pz = (m[2] * x + m[6] * y + m[10] * z + m[14]) * w;
      positions[offset] = px;
      positions[offset + 1] = py;
      positions[offset + 2] = pz;
      if (normal && cache.normalArray) {
        const nx = cache.baseNormals[offset], ny = cache.baseNormals[offset + 1], nz = cache.baseNormals[offset + 2];
        const tx = nm[0] * nx + nm[3] * ny + nm[6] * nz;
        const ty = nm[1] * nx + nm[4] * ny + nm[7] * nz;
        const tz = nm[2] * nx + nm[5] * ny + nm[8] * nz;
        const inverseLength = 1 / (Math.sqrt(tx * tx + ty * ty + tz * tz) || 1);
        cache.normalArray[offset] = tx * inverseLength;
        cache.normalArray[offset + 1] = ty * inverseLength;
        cache.normalArray[offset + 2] = tz * inverseLength;
      }
    }
    if (px < minX) minX = px;
    if (py < minY) minY = py;
    if (pz < minZ) minZ = pz;
    if (px > maxX) maxX = px;
    if (py > maxY) maxY = py;
    if (pz > maxZ) maxZ = pz;
  }
  const bounds = cache.boundingBox;
  bounds.min.set(minX, minY, minZ);
  bounds.max.set(maxX, maxY, maxZ);
  const sphere = cache.boundingSphere;
  sphere.center.set((minX + maxX) * 0.5, (minY + maxY) * 0.5, (minZ + maxZ) * 0.5);
  const dx = maxX - minX, dy = maxY - minY, dz = maxZ - minZ;
  sphere.radius = Math.sqrt(dx * dx + dy * dy + dz * dz) * 0.5;
  geometry.boundingBox = bounds;
  geometry.boundingSphere = sphere;
  a.matrixWorld.decompose(result.position, result.quaternion, result.scale);
  result.updateMatrix();
  result.matrixWorld.copy(a.matrixWorld);
  position.needsUpdate = true;
  if (normal && cache.normalArray) normal.needsUpdate = true;
  return true;
}

// three-bvh-csg recomputes its full BVH split for every call. Animated examples
// change only the brush transforms on most ticks, so retain one topology.
// Exact CSG can be refreshed at a bounded cadence, but defaults to structural
// invalidation only because one synchronous evaluation can stall QuickJS for
// over 100 ms. By default both source transforms propagate through the cached
// material groups; relativeTransforms:false keeps a coherent rigid result for
// long-running animation. Geometry, material, operation, target, and
// evaluator-option changes still invalidate immediately.
export function createBoundedCSGEvaluator(BaseEvaluator, options = {}) {
  if (typeof BaseEvaluator !== 'function') throw new TypeError('BaseEvaluator must be a constructor');
  const transformInterval = options.transformInterval === undefined ? 0 : options.transformInterval;
  if (!Number.isInteger(transformInterval) || transformInterval < 0 || transformInterval > 60) {
    throw new RangeError('transformInterval must be an integer within 0..60');
  }
  const relativeTransforms = options.relativeTransforms !== false;
  return class JsrBoundedCSGEvaluator extends BaseEvaluator {
    evaluate(a, b, operations, targetBrushes, ...rest) {
      // Without a caller-owned target there is no stable result to return on a
      // skipped tick; preserve stock behavior for that less common API form.
      if (targetBrushes === undefined) return super.evaluate(a, b, operations, targetBrushes, ...rest);
      const structural = csgStructuralKey(this, a, b, operations, targetBrushes);
      const transforms = csgTransformKey(a, b);
      const cached = this._jsrCSGCache;
      if (cached && cached.structural === structural) {
        if (cached.transforms === transforms) {
          nativeCSGDiagnostics.exactHits++;
          return cached.result;
        }
        if (transformInterval === 0 || cached.skipped < transformInterval - 1) {
          cached.skipped++;
          nativeCSGDiagnostics.transformSkips++;
          if (csgUpdateTransformCache(cached.transformCache, a, b)) {
            nativeCSGDiagnostics.transformUpdates++;
          }
          return cached.result;
        }
      } else if (cached) {
        nativeCSGDiagnostics.structuralInvalidations++;
      }
      const result = super.evaluate(a, b, operations, targetBrushes, ...rest);
      nativeCSGDiagnostics.evaluations++;
      this._jsrCSGCache = {
        structural: csgStructuralKey(this, a, b, operations, targetBrushes),
        transforms: csgTransformKey(a, b), result, skipped: 0,
        transformCache: csgCaptureTransformCache(result, a, b, relativeTransforms)
      };
      return result;
    }
  };
}

export function getNativeCSGDiagnostics() {
  return { ...nativeCSGDiagnostics };
}

export class HTMLTexture extends DataTexture {
  constructor(element) {
    const width = 256;
    const height = 256;
    const data = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4;
        const stripe = ((x >> 5) + (y >> 5)) % 2 === 0;
        data[offset] = stripe ? 238 : 40;
        data[offset + 1] = stripe ? 242 : 96;
        data[offset + 2] = stripe ? 248 : 160;
        data[offset + 3] = 255;
      }
    }
    super(data, width, height);
    this.isHTMLTexture = true;
    this.sourceElement = element || null;
    // InteractionManager projects the source element onto the textured mesh.
    // Keep the native RGBA payload while supplying the browser CSS surface it
    // touches; no DOM layout is attempted.
    Object.assign(this.image, {
      style: {}, offsetWidth: width, offsetHeight: height,
      clientWidth: width, clientHeight: height
    });
    this.needsUpdate = true;
    console.warn('three: HTMLTexture uses a bounded 256x256 native RGBA placeholder; browser HTML layout/rasterization is unavailable.');
  }
}

export * from 'three';
export { JsrPMREMGenerator as PMREMGenerator, JsrCanvasTextureLoader as TextureLoader };
export { getNativeRaycastDiagnostics } from './native_raycast_bvh.js';
export { JsrWebGLRenderer as WebGLRenderer } from './native_renderer.js';
export { JsrFileLoader as FileLoader, JsrImageLoader as ImageLoader } from './native_loaders.js';
export { JsrImageBitmapLoader as ImageBitmapLoader };
export { JsrDataTextureLoader as DataTextureLoader } from './native_loaders.js';
export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export { ThreeCompatibilityRuntime, JsrThreeCanvas } from './runtime.js';
export { ThreeCapabilityError, UnsupportedWebGPURenderer as WebGPURenderer } from './errors.js';
