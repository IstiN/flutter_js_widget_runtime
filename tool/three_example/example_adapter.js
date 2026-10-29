import { createExampleCanvas2D } from './example_canvas2d.js';

const ROOT = globalThis;
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

function localElement(tagName) {
  const element = eventTarget({
    __jsrThreeExampleLocal: true,
    tagName: String(tagName).toUpperCase(),
    style: {},
    children: [],
    parentNode: null
  });
  element.appendChild = function(child) {
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

function localImage() {
  if (typeof ROOT.OffscreenCanvas !== 'function') {
    throw new Error(`${WIDGET_ID}: local web textures require OffscreenCanvas`);
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
    if (child !== canvas) throw new Error(`${WIDGET_ID}: exactly one main canvas is supported`);
    append(this, child);
    renderer = child.renderer || renderer;
    if (!mounted) {
      mounted = true;
      JSR.render({ type: 'three', canvasId: 'main' });
    }
    publishDiagnostics();
    return child;
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
runtimeDocument.getElementById = function(id) {
  if (id === 'container') return container;
  if (id === 'info') return info;
  return null;
};

// The host normalizes mouse and touch movement to document pointer events.
// Mirror them to body listeners and to legacy mousemove listeners locally.
runtimeDocument.addEventListener('pointermove', event => {
  const normalized = Object.assign({}, event, {
    clientX: event.clientX === undefined ? event.pageX : event.clientX,
    clientY: event.clientY === undefined ? event.pageY : event.clientY
  });
  container.dispatchEvent(Object.assign({}, normalized));
  body.dispatchEvent(Object.assign({}, normalized));
  runtimeDocument.dispatchEvent(Object.assign({}, normalized, { type: 'mousemove' }));
});

ROOT.document = runtimeDocument;
ROOT.window = runtimeDocument.defaultView;

publishDiagnostics();
