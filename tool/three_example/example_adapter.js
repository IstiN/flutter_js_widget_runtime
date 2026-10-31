import { createExampleCanvas2D } from './example_canvas2d.js';

const ROOT = globalThis;
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

let renderer = null;
let mounted = false;
let statsDiagnostics = {
  phase: 'idle', frames: 0, fps: 0, frameTimeMs: 0,
  begins: 0, ends: 0, updates: 0, mode: 0
};
let guiDiagnostics = { roots: 0, controllers: 0, changes: 0, finishes: 0, values: [] };
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
    gui: guiDiagnostics
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
    return createExampleCanvas2D(JSR, 'main', { width: 300, height: 150 });
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
// Inline shader sources the official HTML carried in id'd script blocks
// (`<script id="vertexShader" type="x-shader/x-vertex">…</script>`).
const INLINE_SCRIPTS = JSON.parse(__JSR_THREE_EXAMPLE_SCRIPTS_JSON__);
const localElementsById = new Map();
runtimeDocument.getElementById = function(id) {
  if (id === 'container') return container;
  if (id === 'info') return info;
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
runtimeDocument.querySelector = function(selector) {
  const value = String(selector);
  if (value === '.container') return container;
  if (value.startsWith('#') && value.length > 1) return runtimeDocument.getElementById(value.slice(1));
  if (/^\.[A-Za-z_][\w-]*$/.test(value)) {
    const element = runtimeDocument.getElementById(value.slice(1));
    element.className = value.slice(1);
    return element;
  }
  return null;
};

// The host dispatches pointer events to the canvas and document. Browser
// events also bubble through the canvas' actual ancestors; official drag
// examples commonly listen for pointerdown on a dynamically-created
// container, then track move/up on the document. Reproduce that path for the
// complete pointer gesture, not just movement, and retain the legacy
// mousemove compatibility lane.
for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
  runtimeDocument.addEventListener(type, event => {
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

ROOT.document = runtimeDocument;
ROOT.window = runtimeDocument.defaultView;

publishDiagnostics();
