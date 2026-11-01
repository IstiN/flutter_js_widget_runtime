import { createExampleCanvas2D } from './example_canvas2d.js';
import { JsrDOMParser } from './vendor/xml_dom.js';

const ROOT = globalThis;
if (typeof ROOT.DOMParser === 'undefined') ROOT.DOMParser = JsrDOMParser;
// Official modules use `self` (window/worker alias) for timers and sizes.
if (typeof ROOT.self === 'undefined') ROOT.self = ROOT;
const browserDocument = ROOT.document || null;
const EXAMPLE = __JSR_THREE_EXAMPLE_ID__;
const WIDGET_ID = __JSR_THREE_WIDGET_ID__;
const ASSETS = JSON.parse(__JSR_THREE_EXAMPLE_ASSETS_JSON__);
const ASSETS_BY_URL = new Map(ASSETS.map(asset => [asset.url, asset]));
const JSR = ROOT.jsr;

if (!JSR || !JSR.three || typeof JSR.three.createCanvas !== 'function' ||
    typeof JSR.three.registerAsset !== 'function' ||
    typeof JSR.three._prepareTree !== 'function') {
  throw new Error(`${WIDGET_ID}: evaluate the JSR three.native.js/three.web.js bundle first`);
}
if (typeof JSR.render !== 'function' || typeof JSR.exportState !== 'function') {
  throw new Error(`${WIDGET_ID}: jsr.render and jsr.exportState are required`);
}

// USDComposer and similar embedded-media loaders use the browser Blob ->
// object URL -> Image pipeline. QuickJS has no browser Blob implementation,
// so provide a bounded byte-owning facade and register each URL in the same
// local asset lane used by every other prepared texture. Revocation drops the
// URL handle only after the upstream image onload callback has completed.
if (typeof ROOT.Blob === 'undefined') {
  const MAX_BLOB_BYTES = 64 * 1024 * 1024;
  const MAX_BLOB_PARTS = 1024;
  const MAX_OBJECT_URLS = 64;
  const objectUrls = new Map();
  let nextObjectUrl = 0;
  ROOT.Blob = class JsrExampleBlob {
    constructor(parts = [], options = {}) {
      if (!Array.isArray(parts) && !(parts && typeof parts[Symbol.iterator] === 'function')) {
        throw new TypeError('three.invalid: Blob parts must be iterable');
      }
      const chunks = [];
      let size = 0;
      let count = 0;
      for (const part of parts) {
        if (++count > MAX_BLOB_PARTS) throw new Error('three.invalid: Blob part quota exceeded');
        let bytes;
        if (part instanceof ROOT.Blob) bytes = part._bytes;
        else if (part instanceof Uint8Array) bytes = part;
        else if (part instanceof ArrayBuffer) bytes = new Uint8Array(part);
        else if (ArrayBuffer.isView(part)) bytes = new Uint8Array(part.buffer, part.byteOffset, part.byteLength);
        else bytes = new TextEncoder().encode(String(part));
        size += bytes.byteLength;
        if (size > MAX_BLOB_BYTES) throw new Error('three.invalid: Blob exceeds 64 MiB');
        chunks.push(new Uint8Array(bytes));
      }
      this._bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { this._bytes.set(chunk, offset); offset += chunk.byteLength; }
      this.size = size;
      this.type = String(options && options.type || '').slice(0, 128).toLowerCase();
    }
    arrayBuffer() { return Promise.resolve(this._bytes.buffer.slice(this._bytes.byteOffset, this._bytes.byteOffset + this._bytes.byteLength)); }
    text() { return Promise.resolve(new TextDecoder().decode(this._bytes)); }
  };
  const objectUrlApi = ROOT.URL || class JsrExampleURL {};
  objectUrlApi.createObjectURL = function(blob) {
    if (!(blob instanceof ROOT.Blob)) throw new TypeError('three.invalid: createObjectURL expects a Blob');
    if (objectUrls.size >= MAX_OBJECT_URLS) throw new Error('three.invalid: object URL quota exceeded');
    const url = `blob:jsr-example-${++nextObjectUrl}`;
    objectUrls.set(url, blob);
    JSR.three.registerAsset(url, { data: blob._bytes, mime: blob.type });
    return url;
  };
  objectUrlApi.revokeObjectURL = function(url) { objectUrls.delete(String(url)); };
  ROOT.URL = objectUrlApi;
  if (browserDocument && browserDocument.defaultView) {
    browserDocument.defaultView.Blob = ROOT.Blob;
    browserDocument.defaultView.URL = ROOT.URL;
  }
}

const canvas = JSR.three.createCanvas('main');
const runtimeDocument = canvas.ownerDocument;
canvas.getRootNode = () => runtimeDocument;
const dispatchCanvasEvent = canvas.dispatchEvent;
canvas.dispatchEvent = function(event) {
  if (event && (String(event.type).startsWith('pointer') || event.type === 'wheel')) {
    if (event.clientX === undefined) event.clientX = event.pageX || 0;
    if (event.clientY === undefined) event.clientY = event.pageY || 0;
    if (event.pageX === undefined) event.pageX = event.clientX;
    if (event.pageY === undefined) event.pageY = event.clientY;
  }
  return dispatchCanvasEvent.call(this, event);
};
if (!runtimeDocument || !runtimeDocument.defaultView) {
  throw new Error(`${WIDGET_ID}: the JSR runtime document facade is unavailable`);
}
const runtimeWindow = runtimeDocument.defaultView;
if (typeof ROOT.HTMLCanvasElement === 'undefined') ROOT.HTMLCanvasElement = canvas.constructor;
if (typeof runtimeWindow.HTMLCanvasElement === 'undefined') runtimeWindow.HTMLCanvasElement = ROOT.HTMLCanvasElement;
if (typeof ROOT.performance === 'undefined') ROOT.performance = { now: () => Date.now() };
if (typeof runtimeWindow.performance === 'undefined') runtimeWindow.performance = ROOT.performance;
if (typeof ROOT.HTMLMediaElement === 'undefined') {
  ROOT.HTMLMediaElement = class JsrHTMLMediaElement {};
  ROOT.HTMLMediaElement.HAVE_METADATA = 1;
}
if (typeof runtimeWindow.HTMLMediaElement === 'undefined') runtimeWindow.HTMLMediaElement = ROOT.HTMLMediaElement;
// Browser scripts occasionally use the global viewport aliases (SSR's
// EffectComposer options) instead of window.innerWidth/innerHeight.
for (const dimension of ['innerWidth', 'innerHeight']) {
  if (typeof ROOT[dimension] === 'undefined') {
    Object.defineProperty(ROOT, dimension, {
      configurable: true,
      get() { return runtimeWindow[dimension]; }
    });
  }
}
// Wide-gamut and similar feature probes only need a bounded media-query
// facade. R1 remains sRGB; no host display-gamut or change-event claim is made.
if (typeof runtimeWindow.matchMedia !== 'function') {
  runtimeWindow.matchMedia = query => ({
    media: String(query), matches: false, onchange: null,
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {}, dispatchEvent() { return false; }
  });
}
if (typeof ROOT.matchMedia !== 'function') ROOT.matchMedia = runtimeWindow.matchMedia;
if (typeof runtimeDocument.defaultView.DOMParser === 'undefined') {
  runtimeDocument.defaultView.DOMParser = JsrDOMParser;
}

let renderer = null;
let mounted = false;
let statsDiagnostics = {
  phase: 'idle', frames: 0, fps: 0, frameTimeMs: 0,
  begins: 0, ends: 0, updates: 0, mode: 0
};
let guiDiagnostics = { roots: 0, controllers: 0, changes: 0, finishes: 0, values: [] };
const mediaDiagnostics = {
  videoElements: 0, videoTextures: 0, shaderFallbacks: 0, warnings: []
};
let publishedMediaSignature = '';
const assetDiagnostics = {};
for (const asset of ASSETS) {
  assetDiagnostics[asset.url] = {
    url: asset.url, bytes: asset.bytes, registered: true
  };
}

function finite(value) {
  return Number.isFinite(value) ? value : 0;
}

function publishDiagnostics() {
  const info = renderer && renderer.info ? renderer.info : {};
  const render = info.render || {};
  const memory = info.memory || {};
  const capabilities = JSR.three.getCapabilities ? JSR.three.getCapabilities() : {};
  const state = {
    example: EXAMPLE,
    backend: renderer && renderer.capabilities && renderer.capabilities.backend || capabilities.backend || 'unknown',
    canvasCount: 1,
    mounted,
    assets: assetDiagnostics,
    renderer: {
      frame: finite(render.frame), calls: finite(render.calls),
      triangles: finite(render.triangles), points: finite(render.points),
      lines: finite(render.lines), geometries: finite(memory.geometries),
      textures: finite(memory.textures)
    },
    stats: Object.assign({}, statsDiagnostics),
    gui: guiDiagnostics,
    media: {
      videoElements: mediaDiagnostics.videoElements,
      videoTextures: mediaDiagnostics.videoTextures,
      shaderFallbacks: mediaDiagnostics.shaderFallbacks,
      warnings: mediaDiagnostics.warnings.slice()
    }
  };
  for (const asset of ASSETS) {
    if (asset.diagnostic) state[asset.diagnostic] = assetDiagnostics[asset.url];
  }
  JSR.exportState(state);
}

// Stats is a local diagnostic adapter, not a second render-tree node.
export function reportStats(value) {
  statsDiagnostics = value;
  publishDiagnostics();
}

export function reportGui(value) {
  guiDiagnostics = value;
  publishDiagnostics();
}

export function useBrowserGui() {
  const capabilities = JSR.three.getCapabilities();
  return capabilities.backend === 'webgl2' && !!browserDocument &&
    typeof browserDocument.createElement === 'function' && !!browserDocument.body;
}

// Controls may be constructed with ANY element (container div, body), not
// only the main canvas. Give every shim element the document linkage and
// event surface OrbitControls.connect/disconnect touches.
if (runtimeDocument && typeof runtimeDocument.addEventListener !== 'function') {
  eventTarget(runtimeDocument);
}

const hostRender = JSR.render;
JSR.render = function(tree) {
  return hostRender.call(this, JSR.three._prepareTree(tree));
};

for (const asset of ASSETS) {
  JSR.three.registerAsset(asset.url, {
    data: asset.data,
    mime: asset.mime,
    width: asset.width,
    height: asset.height
  });
}

function eventTarget(target) {
  const listeners = new Map();
  target.addEventListener = function(type, callback) {
    if (!callback) return;
    const list = listeners.get(type) || [];
    if (!list.includes(callback)) list.push(callback);
    listeners.set(type, list);
  };
  target.removeEventListener = function(type, callback) {
    const list = listeners.get(type);
    if (list) listeners.set(type, list.filter(item => item !== callback));
  };
  target.dispatchEvent = function(event) {
    if (!event || !event.type) throw new Error(`${WIDGET_ID}: event.type is required`);
    if (!event.preventDefault) event.preventDefault = function() { this.defaultPrevented = true; };
    try { if (!event.target) event.target = target; } catch (_) {}
    try { event.currentTarget = target; } catch (_) {}
    for (const callback of (listeners.get(event.type) || []).slice()) {
      if (typeof callback === 'function') callback.call(target, event);
      else if (callback.handleEvent) callback.handleEvent(event);
    }
    return !event.defaultPrevented;
  };
  return target;
}

function append(parent, child) {
  const old = parent.children.indexOf(child);
  if (old >= 0) parent.children.splice(old, 1);
  parent.children.push(child);
  child.parentNode = parent;
  return child;
}

function appendMainCanvas(parent, child) {
  if (child !== canvas) throw new Error(`${WIDGET_ID}: exactly one main canvas is supported`);
  append(parent, child);
  renderer = child.renderer || renderer;
  if (!mounted) {
    mounted = true;
    // Controls overlays (lil-gui) may already have rendered a full stack; a
    // bare canvas render here would wipe them. Prefer the overlay rerender.
    const rerenderOverlays = JSR.three._guiRerender;
    publishDiagnostics();
    if (typeof rerenderOverlays === 'function' && rerenderOverlays()) return;
    JSR.render({ type: 'three', canvasId: 'main' });
  }
  publishDiagnostics();
  return child;
}

function localElement(tagName) {
  const element = eventTarget({
    __jsrThreeExampleLocal: true,
    tagName: String(tagName).toUpperCase(),
    style: {},
    children: [],
    parentNode: null,
    classList: {
      _names: new Set(),
      add(...names) { for (const name of names) this._names.add(String(name)); },
      remove(...names) { for (const name of names) this._names.delete(String(name)); },
      toggle(name) { if (this._names.has(name)) { this._names.delete(name); return false; } this._names.add(name); return true; },
      contains(name) { return this._names.has(name); }
    }
  });
  const cssNumber = (value, fallback) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const viewportSize = dimension => cssNumber(
    element.style[dimension],
    runtimeDocument.defaultView[dimension === 'width' ? 'innerWidth' : 'innerHeight']
  );
  Object.defineProperties(element, {
    offsetWidth: { get: () => viewportSize('width') },
    offsetHeight: { get: () => viewportSize('height') },
    clientWidth: { get: () => viewportSize('width') },
    clientHeight: { get: () => viewportSize('height') }
  });
  element.getBoundingClientRect = function() {
    let left = cssNumber(this.style.left, 0);
    let top = cssNumber(this.style.top, 0);
    let width = this.offsetWidth;
    let height = this.offsetHeight;
    let ancestor = this.parentNode;
    while (ancestor && !String(ancestor.className || '').split(/\s+/).includes('list-item')) {
      ancestor = ancestor.parentNode;
    }
    if (ancestor) {
      const index = Math.max(0, ancestor.parentNode ? ancestor.parentNode.children.indexOf(ancestor) : 0);
      width = Math.max(1, Math.floor(runtimeDocument.defaultView.innerWidth / 4));
      height = Math.max(1, Math.floor(runtimeDocument.defaultView.innerHeight / 2));
      left = (index % 4) * width;
      top = Math.floor(index / 4) * height;
    } else if (String(this.className || '').split(/\s+/).includes('view')) {
      const index = Math.max(0, staticViews.indexOf(this));
      width = Math.min(this.offsetWidth, runtimeDocument.defaultView.innerWidth);
      height = Math.min(this.offsetHeight, runtimeDocument.defaultView.innerHeight);
      left = 0;
      top = index * height;
    }
    return {
      x: left, y: top, left, top, width, height,
      right: left + width, bottom: top + height
    };
  };
  element.ownerDocument = runtimeDocument;
  element.getRootNode = () => runtimeDocument;
  element.appendChild = function(child) {
    if (child && child.isJsrThreeCanvas && this.tagName === 'DIV') {
      return appendMainCanvas(this, child);
    }
    if (!child || !child.__jsrThreeExampleLocal) throw new Error(`${WIDGET_ID}: only local diagnostic children are supported`);
    return append(this, child);
  };
  element.removeChild = function(child) {
    const index = this.children.indexOf(child);
    if (index < 0) throw new Error(`${WIDGET_ID}: child is not mounted`);
    this.children.splice(index, 1);
    child.parentNode = null;
    return child;
  };
  element.remove = function() {
    if (this.parentNode && typeof this.parentNode.removeChild === 'function') this.parentNode.removeChild(this);
  };
  element.click = function() {
    this.__jsrClicked = true;
    this.dispatchEvent({ type: 'click' });
  };
  const queryChildren = new Map();
  element.querySelector = function(selector) {
    const key = String(selector);
    if (!queryChildren.has(key)) {
      const child = localElement(key.replace(/^[^A-Za-z]*/, '') || 'div');
      queryChildren.set(key, append(this, child));
    }
    return queryChildren.get(key);
  };
  element.querySelectorAll = function(selector) { return [this.querySelector(selector)]; };
  return element;
}

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
let imageDecodeRequestId = 0;

function decodeBase64(value) {
  if (typeof value !== 'string') throw new Error(`${WIDGET_ID}: decoded image data must be base64`);
  const clean = value.replace(/\s/g, '');
  if (clean.length % 4 === 1 || /[^A-Za-z0-9+/=_-]/.test(clean)) {
    throw new Error(`${WIDGET_ID}: decoded image data is invalid base64`);
  }
  const normalized = clean.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0;
  const output = new Uint8Array(Math.floor(normalized.length * 3 / 4) - padding);
  let buffer = 0;
  let bits = 0;
  let offset = 0;
  for (let index = 0; index < normalized.length; index++) {
    const character = normalized[index];
    if (character === '=') break;
    const value = BASE64.indexOf(character);
    if (value < 0) throw new Error(`${WIDGET_ID}: decoded image data is invalid base64`);
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      if (offset >= output.length) throw new Error(`${WIDGET_ID}: decoded image data has invalid padding`);
      output[offset++] = (buffer >> bits) & 255;
    }
  }
  if (offset !== output.length) throw new Error(`${WIDGET_ID}: decoded image data has an invalid length`);
  return output;
}

function nativeImagePixels(source, record) {
  const bytes = record.bytes;
  const mime = String(record.mime || '').toLowerCase();
  const raw = mime.includes('rgba') || mime.includes('raw');
  if (raw) {
    const width = record.width || 0;
    const height = record.height || 0;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 ||
        !bytes || bytes.length !== width * height * 4) {
      throw new Error(`${WIDGET_ID}: invalid raw RGBA image ${source}`);
    }
    return { bytes, width, height, encoding: 0, encoded: false };
  }
  if (typeof JSR.hostCall !== 'function') {
    throw new Error(`${WIDGET_ID}: native host image decoding is unavailable for ${source}`);
  }
  const requestId = ++imageDecodeRequestId;
  const canvasId = `example-image-decode-${requestId}`;
  const generation = canvas.generation;
  return JSR.hostCall('three.canvas2d', {
    action: 'decodeImage', engineId: canvas.engineId, surfaceId: canvas.surfaceId,
    canvasId, generation, requestId, width: 0, height: 0, commands: [], data: record.data
  }).then(result => {
    if (!result || result.stale || result.engineId !== canvas.engineId ||
        result.surfaceId !== canvas.surfaceId || result.canvasId !== canvasId ||
        result.generation !== generation || result.requestId !== requestId ||
        !Number.isInteger(result.width) || !Number.isInteger(result.height) ||
        result.width <= 0 || result.height <= 0 || typeof result.data !== 'string') {
      throw new Error(`${WIDGET_ID}: invalid decoded image response for ${source}`);
    }
    const decoded = decodeBase64(result.data);
    if (decoded.length !== result.width * result.height * 4) {
      throw new Error(`${WIDGET_ID}: decoded image RGBA length mismatch for ${source}`);
    }
    return { bytes: decoded, width: result.width, height: result.height, encoding: 0, encoded: false };
  });
}

function localImage() {
  if (typeof ROOT.OffscreenCanvas !== 'function') {
    // Native JSR lane: no DOM Image exists, but the R1 texture path only
    // needs an image-like object carrying typed bytes + dimensions +
    // encoding (the same shape JsrTextureLoader installs on Texture.image).
    // Serve registered/host assets through runtime.loadAsset so modules
    // using ImageLoader / document.createElement('img') keep working.
    const image = eventTarget({
      complete: false, width: 0, height: 0, naturalWidth: 0, naturalHeight: 0,
      data: null, _examplePixels: null
    });
    let source = '';
    Object.defineProperty(image, 'src', {
      configurable: true,
      get() { return source; },
      set(value) {
        source = String(value);
        JSR.three.loadAsset(source).then(record => {
          if (!record.bytes) throw new Error(`${WIDGET_ID}: asset ${source} has no bytes`);
          return nativeImagePixels(source, record);
        }).then(decoded => {
          if (canvas.disposed) throw new Error(`${WIDGET_ID}: surface disposed during image decode`);
          const pixels = new Uint8ClampedArray(decoded.bytes);
          image.data = decoded.bytes;
          image.width = decoded.width;
          image.height = decoded.height;
          image.naturalWidth = decoded.width;
          image.naturalHeight = decoded.height;
          image.encoding = decoded.encoding;
          image.encoded = decoded.encoded;
          image._examplePixels = { data: pixels, width: decoded.width, height: decoded.height };
          image.complete = true;
          image.dispatchEvent({ type: 'load' });
        }).catch(error => {
          image.complete = false;
          image.dispatchEvent({ type: 'error', error });
        });
      }
    });
    return image;
  }
  // An OffscreenCanvas is a valid WebGL texture source. Registered bytes are
  // decoded locally and drawn into it; no Image/HTML network loader is used.
  const image = eventTarget(new ROOT.OffscreenCanvas(1, 1));
  image.complete = false;
  let source = '';
  Object.defineProperty(image, 'src', {
    configurable: true,
    get() { return source; },
    set(value) {
      source = String(value);
      Promise.resolve().then(async () => {
        const asset = ASSETS_BY_URL.get(source);
        if (!asset) throw new Error(`${WIDGET_ID}: unregistered image URL ${source}`);
        if (typeof ROOT.atob !== 'function' || typeof ROOT.Blob !== 'function' || typeof ROOT.createImageBitmap !== 'function') {
          throw new Error(`${WIDGET_ID}: local image decoding requires atob, Blob and createImageBitmap`);
        }
        image.width = asset.width;
        image.height = asset.height;
        image.naturalWidth = asset.width;
        image.naturalHeight = asset.height;
        const encoded = ROOT.atob(asset.data);
        const bytes = new Uint8Array(encoded.length);
        for (let i = 0; i < encoded.length; i++) bytes[i] = encoded.charCodeAt(i);
        const bitmap = await ROOT.createImageBitmap(new ROOT.Blob([bytes], { type: asset.mime }));
        try {
          const context = image.getContext('2d');
          if (!context) throw new Error(`${WIDGET_ID}: OffscreenCanvas 2D decoding is unavailable`);
          context.clearRect(0, 0, image.width, image.height);
          context.drawImage(bitmap, 0, 0);
          image.complete = true;
          image.dispatchEvent({ type: 'load' });
        } finally {
          if (bitmap.close) bitmap.close();
        }
      }).catch(error => {
        image.complete = false;
        image.dispatchEvent({ type: 'error', error });
      });
    }
  });
  return image;
}

function localCanvas() {
  const capabilities = JSR.three.getCapabilities();
  if (capabilities.backend === 'flutterGpu') {
    if (typeof JSR.three.createCanvas2D !== 'function') {
      throw new Error(`${WIDGET_ID}: native Flutter canvas2d is unavailable`);
    }
    const local = createExampleCanvas2D(JSR, 'main', { width: 300, height: 150 });
    const getContext = local.getContext;
    local.getContext = function(type, ...args) {
      const context = getContext.call(this, type, ...args);
      if (type === '2d' && context && typeof context.arc !== 'function') {
        context.arc = function(x, y, radius, start, end, counterclockwise = false) {
          if (![x, y, radius, start, end].every(Number.isFinite) || radius < 0) {
            throw new Error('three.invalid: canvas arc expects finite coordinates and a non-negative radius');
          }
          const fullTurn = Math.PI * 2;
          let span = end - start;
          if (!counterclockwise && span < 0) span = span % fullTurn + fullTurn;
          if (counterclockwise && span > 0) span = span % fullTurn - fullTurn;
          if (Math.abs(span) >= fullTurn) span = counterclockwise ? -fullTurn : fullTurn;
          const steps = Math.max(1, Math.min(64, Math.ceil(Math.abs(span) / (Math.PI / 32))));
          for (let index = 0; index <= steps; index++) {
            const angle = start + span * index / steps;
            context.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
          }
        };
      }
      if (type === '2d' && context && typeof context.measureText !== 'function') {
        context.measureText = text => {
          const match = /([0-9]+(?:\.[0-9]+)?)\s*(?:px|pt)?/i.exec(context.font || '');
          const size = match ? Number(match[1]) : 10;
          return { width: String(text).length * size * 0.6 };
        };
      }
      return context;
    };
    return local;
  }
  if (typeof ROOT.OffscreenCanvas !== 'function') {
    throw new Error(`${WIDGET_ID}: local 2D canvases require OffscreenCanvas`);
  }
  return eventTarget(new ROOT.OffscreenCanvas(300, 150));
}

function createElement(tagName) {
  const tag = String(tagName).toLowerCase();
  if (tag === 'canvas') return localCanvas();
  if (tag === 'img' || tag === 'image') return localImage();
  return localElement(tag);
}

runtimeDocument.createElement = createElement;
runtimeDocument.createElementNS = function(_namespace, tagName) {
  // three.js creates its WebGL canvas through createElementNS. Keep that
  // canvas on the JSR surface; ordinary createElement canvases stay local 2D.
  if (String(tagName).toLowerCase() === 'canvas') return JSR.three.createCanvas('main');
  return createElement(tagName);
};

const container = localElement('div');
container.id = 'container';
container.appendChild = function(child) {
  if (child && child.isJsrThreeCanvas) {
    return appendMainCanvas(this, child);
  }
  if (!child || !child.__jsrThreeExampleLocal) {
    throw new Error(`${WIDGET_ID}: container accepts only the main canvas and local stats DOM`);
  }
  append(this, child);
  publishDiagnostics();
  return child;
};

const body = localElement('body');
body.appendChild = container.appendChild;
runtimeDocument.body = body;

const info = localElement('div');
info.id = 'info';

function localAudioElement(record) {
  const element = eventTarget({
    __jsrThreeExampleLocal: true,
    tagName: 'AUDIO', id: record.id || '', style: {}, children: [], parentNode: null,
    loop: !!record.loop, preload: 'auto', currentTime: 0, volume: 1, muted: false,
    paused: true, _jsrMediaPlaying: false,
    _jsrAudioLoad: () => JSR.three.loadAsset(record.url)
  });
  element.play = function() {
    this._jsrMediaPlaying = true;
    this.paused = false;
    return typeof this._jsrNativePlay === 'function'
      ? Promise.resolve(this._jsrNativePlay())
      : Promise.resolve();
  };
  element.pause = function() {
    this._jsrMediaPlaying = false;
    this.paused = true;
    if (typeof this._jsrNativePause === 'function') this._jsrNativePause();
  };
  element.remove = function() {};
  return element;
}

function waveDisplacement(kind) {
  if (kind === 0) return (x, y, z, t, target) => target.set(Math.sin(x - t), 0, 0);
  if (kind === 1) return (x, y, z, t, target) => {
    if (x * x + y * y < 0.01) return target.set(0, 0, 0);
    const rho = Math.sqrt(x * x + y * y);
    const phi = Math.atan2(y, x);
    const amplitude = 1.5 * Math.sin(rho - t) / Math.sqrt(rho);
    return target.set(amplitude * Math.cos(phi), amplitude * Math.sin(phi), 0);
  };
  return (x, y, z, t, target) => {
    if (x * x + y * y + z * z < 0.01) return target.set(0, 0, 0);
    const radius = Math.sqrt(x * x + y * y + z * z);
    const theta = Math.acos(z / radius);
    const phi = Math.atan2(y, x);
    const amplitude = 3 * Math.sin(radius - t) / radius;
    return target.set(
      amplitude * Math.cos(phi) * Math.sin(theta),
      amplitude * Math.sin(phi) * Math.sin(theta),
      amplitude * Math.cos(theta)
    );
  };
}

const staticViews = EXAMPLE === 'webgl_multiple_elements_text'
  ? Array.from({ length: 6 }, (_, index) => {
    const view = localElement('div');
    view.className = 'view';
    view.style.width = '480px';
    view.style.height = '360px';
    view.lattice = index % 2 === 0;
    view.displacement = waveDisplacement(Math.floor(index / 2));
    return view;
  })
  : [];

const VIDEO_URLS = {
  webgl_materials_video: 'textures/sintel.mp4',
  webgl_video_kinect: 'textures/kinect.mp4',
  webgl_video_panorama_equirectangular: 'textures/pano.mp4'
};

function localVideoElement(id) {
  const element = eventTarget({
    __jsrThreeExampleLocal: true,
    tagName: 'VIDEO', id, style: {}, children: [], parentNode: null,
    loop: true, muted: true, autoplay: true, playsInline: true,
    preload: 'auto', currentTime: 0, volume: 1, paused: true,
    readyState: 4, videoWidth: 16, videoHeight: 16,
    srcObject: null, _jsrVideoUrl: VIDEO_URLS[EXAMPLE] || ''
  });
  mediaDiagnostics.videoElements++;
  element.play = function() {
    this.paused = false;
    this.dispatchEvent({ type: 'play' });
    return Promise.resolve();
  };
  element.pause = function() {
    this.paused = true;
    this.dispatchEvent({ type: 'pause' });
  };
  element.load = function() {};
  element.remove = function() {};
  return element;
}

if (typeof ROOT.navigator === 'undefined') {
  ROOT.navigator = { userAgent: 'JSR QuickJS' };
}
if (EXAMPLE === 'webgl_materials_video_webcam' && !ROOT.navigator.mediaDevices) {
  ROOT.navigator.mediaDevices = {
    getUserMedia: () => Promise.resolve({ getTracks: () => [] })
  };
}

if (typeof ROOT.Audio !== 'function') {
  ROOT.Audio = function(source) {
    return localAudioElement({ url: String(source || ''), mime: 'audio/mpeg', loop: false });
  };
}

// Inline shader sources the official HTML carried in id'd script blocks
// (`<script id="vertexShader" type="x-shader/x-vertex">…</script>`).
const INLINE_SCRIPTS = JSON.parse(__JSR_THREE_EXAMPLE_SCRIPTS_JSON__);
const AUDIO_ELEMENTS = JSON.parse(__JSR_THREE_EXAMPLE_AUDIO_JSON__);
const localElementsById = new Map();
runtimeDocument.getElementById = function(id) {
  if (id === 'canvas1' && WIDGET_ID === 'three-worker-offscreencanvas') {
    if (!canvas.parentNode) appendMainCanvas(container, canvas);
    return canvas;
  }
  if (id === 'c') {
    if (!canvas.parentNode) {
      canvas.setSize(
        runtimeDocument.defaultView.innerWidth,
        runtimeDocument.defaultView.innerHeight,
        false
      );
      appendMainCanvas(container, canvas);
    }
    return canvas;
  }
  if (id === 'video') {
    if (!localElementsById.has(id)) localElementsById.set(id, localVideoElement(id));
    return localElementsById.get(id);
  }
  if (id === 'container') return container;
  if (id === 'info') return info;
  if (Object.prototype.hasOwnProperty.call(AUDIO_ELEMENTS, id)) {
    if (!localElementsById.has(id)) localElementsById.set(id, localAudioElement(AUDIO_ELEMENTS[id]));
    return localElementsById.get(id);
  }
  if (Object.prototype.hasOwnProperty.call(INLINE_SCRIPTS, id)) {
    return { id: id, textContent: INLINE_SCRIPTS[id] };
  }
  // Official HTML carries extra diagnostic nodes (labels/borders). Serve a
  // bounded memoized local element so innerHTML/textContent/style writes
  // behave like the browser instead of crashing on null.
  if (!localElementsById.has(id)) {
    const element = localElement('div');
    element.id = String(id);
    element.innerHTML = '';
    localElementsById.set(id, element);
  }
  return localElementsById.get(id);
};
// Browser named-access exposes the static info element as window.info. A few
// official modules rely on that alias instead of calling getElementById.
if (typeof ROOT.info === 'undefined') ROOT.info = info;
if (typeof runtimeWindow.info === 'undefined') runtimeWindow.info = info;
runtimeDocument.querySelector = function(selector) {
  const value = String(selector);
  if (value === '.container') return container;
  if (value === '.view' && staticViews.length) return staticViews[0];
  if (value.startsWith('#') && value.length > 1) return runtimeDocument.getElementById(value.slice(1));
  if (/^\.[A-Za-z_][\w-]*$/.test(value)) {
    const element = runtimeDocument.getElementById(value.slice(1));
    element.className = value.slice(1);
    return element;
  }
  return null;
};
runtimeDocument.querySelectorAll = function(selector) {
  const value = String(selector);
  if (!/^\.[A-Za-z_][\w-]*$/.test(value)) return [];
  const className = value.slice(1);
  const result = [];
  const visited = new Set();
  const matches = element => String(element.className || '').split(/\s+/).includes(className);
  const visit = element => {
    if (!element || visited.has(element)) return;
    visited.add(element);
    if (matches(element)) result.push(element);
    for (const child of element.children || []) visit(child);
  };
  for (const view of staticViews) visit(view);
  visit(container);
  visit(body);
  for (const element of localElementsById.values()) visit(element);
  return result;
};

// The host dispatches pointer events to the canvas and document. Browser
// events also bubble through the canvas' actual ancestors; official drag
// examples commonly listen for pointerdown on a dynamically-created
// container, then track move/up on the document. Reproduce that path for the
// complete pointer gesture, not just movement, and retain the legacy
// mousemove compatibility lane.
for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
  runtimeDocument.addEventListener(type, event => {
    if (type === 'pointerdown') {
      const startButton = localElementsById.get('startButton');
      if (startButton && !startButton.__jsrClicked) startButton.click();
      if (typeof JSR.three._resumeAudio === 'function') {
        Promise.resolve(JSR.three._resumeAudio()).catch(error => {
          if (typeof console !== 'undefined' && console.error) console.error(error);
        });
      }
    }
    const normalized = Object.assign({}, event, {
      clientX: event.clientX === undefined ? event.pageX : event.clientX,
      clientY: event.clientY === undefined ? event.pageY : event.clientY
    });
    for (let parent = canvas.parentNode; parent; parent = parent.parentNode) {
      if (parent === runtimeDocument || typeof parent.dispatchEvent !== 'function') break;
      parent.dispatchEvent(Object.assign({}, normalized));
    }
    if (type === 'pointermove') {
      runtimeDocument.dispatchEvent(Object.assign({}, normalized, { type: 'mousemove' }));
    }
  });
}

function warnCompat(key, message) {
  if (mediaDiagnostics.warnings.includes(key)) return;
  mediaDiagnostics.warnings.push(key);
  console.warn(message);
}

function publishMediaChanges() {
  const signature = [
    mediaDiagnostics.videoElements,
    mediaDiagnostics.videoTextures,
    mediaDiagnostics.shaderFallbacks,
    mediaDiagnostics.warnings.length
  ].join(':');
  if (signature === publishedMediaSignature) return;
  publishedMediaSignature = signature;
  publishDiagnostics();
}

function videoFallbackImage() {
  const data = new Uint8Array(16 * 16 * 4);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const offset = (y * 16 + x) * 4;
      const alternate = ((x >> 2) + (y >> 2)) % 2 === 0;
      data[offset] = alternate ? 224 : 32;
      data[offset + 1] = alternate ? 160 : 64;
      data[offset + 2] = alternate ? 64 : 128;
      data[offset + 3] = 255;
    }
  }
  return { data, width: 16, height: 16, encoding: 0, encoded: false };
}

function degradeVideoTexture(texture) {
  if (!texture || !texture.isVideoTexture) return;
  texture.userData.jsrVideoElement = texture.image || null;
  texture.isVideoTexture = false;
  texture.image = videoFallbackImage();
  texture.needsUpdate = true;
  mediaDiagnostics.videoTextures++;
  warnCompat(
    'video-texture',
    'three: R1 VideoTexture transport is unavailable; rendering a bounded 16x16 RGBA fallback instead of a black frame.'
  );
}

const VIDEO_TEXTURE_SLOTS = [
  'map', 'alphaMap', 'aoMap', 'emissiveMap', 'normalMap', 'bumpMap',
  'roughnessMap', 'metalnessMap', 'envMap', 'matcap', 'gradientMap',
  'specularMap', 'displacementMap'
];

function degradeMaterialVideos(material) {
  if (!material) return;
  for (const slot of VIDEO_TEXTURE_SLOTS) degradeVideoTexture(material[slot]);
  const uniforms = material.uniforms || {};
  for (const key of Object.keys(uniforms)) {
    const value = uniforms[key] && uniforms[key].value;
    if (value && value.isTexture) degradeVideoTexture(value);
  }
}

function degradeSceneVideos(scene) {
  if (!scene) return;
  degradeVideoTexture(scene.background);
  degradeVideoTexture(scene.environment);
  if (typeof scene.traverse !== 'function') return;
  scene.traverse(object => {
    if (Array.isArray(object.material)) {
      for (const material of object.material) degradeMaterialVideos(material);
    } else degradeMaterialVideos(object.material);
  });
}

function installNativeExampleCompat() {
  const three = ROOT.THREE;
  if (!three || !three.WebGLRenderer || JSR.three.getCapabilities().backend !== 'flutterGpu') return;
  const prototype = three.WebGLRenderer.prototype;
  if (prototype.render.__jsrExampleCompat) return;
  const nativeRender = prototype.render;
  const nativeSetRenderTarget = prototype.setRenderTarget;
  const shaderFallbacks = new WeakMap();
  let visualizerCamera = null;
  const singleShaderScene = scene => {
    if (!scene) return false;
    if (scene.isMesh) return !!(scene.material && scene.material.isShaderMaterial);
    if (!scene.isScene || scene.children.length === 0) return false;
    let shader = false;
    for (const child of scene.children) {
      if (!child.isMesh || !child.material) return false;
      if (child.material.isShaderMaterial) shader = true;
    }
    return shader;
  };
  const adaptMediaShaders = scene => {
    if (EXAMPLE !== 'webaudio_visualizer' && EXAMPLE !== 'webgl_video_kinect' &&
        EXAMPLE !== 'webgl_test_memory2' && EXAMPLE !== 'webgl_loader_ldraw') return;
    if (!scene || typeof scene.traverse !== 'function') return;
    scene.traverse(object => {
      const source = object.material;
      if (!source || Array.isArray(source) || !source.isShaderMaterial) return;
      let fallback = shaderFallbacks.get(source);
      if (!fallback) {
        fallback = object.isPoints
          ? new three.PointsMaterial({
            color: 0x60a5fa, size: 2, sizeAttenuation: false,
            transparent: true, opacity: 0.8, depthWrite: false
          })
          : (object.isLine || object.isLineSegments)
            ? new three.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.7 })
            : new three.MeshBasicMaterial({ color: 0x2563eb });
        shaderFallbacks.set(source, fallback);
        mediaDiagnostics.shaderFallbacks++;
        warnCompat(
          `shader-fallback-${EXAMPLE}`,
          `three: ${EXAMPLE} arbitrary shader is unavailable on R1; rendering its native ${object.isPoints ? 'point-cloud' : (object.isLine || object.isLineSegments) ? 'line' : 'mesh'} fallback with an explicit static color.`
        );
      }
      object.material = fallback;
    });
  };
  const prepareShadowViewer = (renderer, scene) => {
    if (EXAMPLE !== 'webgl_shadowmap_viewer' || !scene || typeof scene.traverse !== 'function') return;
    scene.traverse(object => {
      if (!object.castShadow || !object.shadow || object.shadow.map) return;
      if (!renderer.__jsrShadowViewerTexture) {
        renderer.__jsrShadowViewerTexture = new three.DataTexture(
          new Uint8Array([255, 255, 255, 255]), 1, 1
        );
        renderer.__jsrShadowViewerTexture.needsUpdate = true;
      }
      object.shadow.map = { texture: renderer.__jsrShadowViewerTexture };
    });
  };
  const wrappedRender = function(scene, camera) {
    if (!renderer) {
      renderer = this;
      publishDiagnostics();
    }
    if (EXAMPLE === 'webgl_materials_envmaps_groundprojected' && scene && scene.environment) {
      // GroundedSkybox uses its equirect environment as a plain mesh map,
      // which is not a native R1 texture role. Keep the real HDR environment
      // and car, with an explicit background-only ground-projection degrade.
      for (const child of scene.children || []) {
        if (child.isMesh && child.material && child.material.map === scene.environment) child.visible = false;
      }
      scene.background = scene.environment;
      warnCompat(
        'ground-projection',
        'three: R1 renders the ground-projected example with its real equirect HDR background; the projected skybox mesh is omitted.'
      );
    }
    degradeSceneVideos(scene);
    adaptMediaShaders(scene);
    if (EXAMPLE === 'webgl_materials_video' && singleShaderScene(scene)) return;
    if (EXAMPLE === 'webgl_shadowmap_viewer') {
      if (singleShaderScene(scene)) {
        warnCompat(
          'shadow-viewer',
          'three: R1 omits the ShadowMapViewer HUD; the main scene and native shadow maps continue rendering.'
        );
        return;
      }
      prepareShadowViewer(this, scene);
    }
    if (EXAMPLE === 'webaudio_visualizer' && camera && camera.isCamera &&
        !camera.isPerspectiveCamera && !camera.isOrthographicCamera) {
      if (!visualizerCamera) {
        visualizerCamera = new three.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        visualizerCamera.position.z = 1;
        warnCompat(
          'visualizer-camera',
          'three: R1 maps the visualizer base Camera to a bounded orthographic camera.'
        );
      }
      camera = visualizerCamera;
    }
    publishMediaChanges();
    return nativeRender.call(this, scene, camera);
  };
  Object.defineProperty(wrappedRender, '__jsrExampleCompat', { value: true });
  prototype.render = wrappedRender;
  prototype.setRenderTarget = function(target) {
    if (EXAMPLE === 'webgl_materials_video') {
      warnCompat(
        'postprocessing-fallback',
        'three: R1 drops webgl_materials_video postprocessing; the base video-grid scene renders directly.'
      );
      return nativeSetRenderTarget.call(this, null);
    }
    return nativeSetRenderTarget.call(this, target);
  };
  if (EXAMPLE === 'webgl_multiple_elements' || EXAMPLE === 'webgl_multiple_elements_text' ||
      EXAMPLE === 'webgl_loader_texture_ktx2') {
    const nativeSetViewport = prototype.setViewport;
    const nativeSetScissor = prototype.setScissor;
    const clip = (canvas, x, y, width, height) => {
      const left = Math.max(0, Math.min(canvas.clientWidth, x));
      const bottom = Math.max(0, Math.min(canvas.clientHeight, y));
      const right = Math.max(left, Math.min(canvas.clientWidth, x + width));
      const top = Math.max(bottom, Math.min(canvas.clientHeight, y + height));
      return [left, bottom, right - left, top - bottom];
    };
    prototype.setViewport = function(x, y, width, height) {
      if (![x, y, width, height].every(Number.isFinite)) {
        return nativeSetViewport.call(this, x, y, width, height);
      }
      return nativeSetViewport.call(this, ...clip(this.domElement, x, y, width, height));
    };
    prototype.setScissor = function(x, y, width, height) {
      if (![x, y, width, height].every(Number.isFinite)) {
        return nativeSetScissor.call(this, x, y, width, height);
      }
      return nativeSetScissor.call(this, ...clip(this.domElement, x, y, width, height));
    };
  }
}

installNativeExampleCompat();
ROOT.document = runtimeDocument;
ROOT.window = runtimeDocument.defaultView;

Promise.resolve().then(() => {
  if (typeof ROOT.window.onload === 'function') {
    ROOT.window.onload.call(ROOT.window, { type: 'load' });
  }
}).catch(error => console.error(String(error), error && error.stack || ''));

publishDiagnostics();
