const ROOT = globalThis;
const ATLAS_URL = __JSR_MINECRAFT_ATLAS_URL__;
const ATLAS_BASE64 = __JSR_MINECRAFT_ATLAS_BASE64__;
const ATLAS_WIDTH = __JSR_MINECRAFT_ATLAS_WIDTH__;
const ATLAS_HEIGHT = __JSR_MINECRAFT_ATLAS_HEIGHT__;
const ATLAS_BYTES = __JSR_MINECRAFT_ATLAS_BYTES__;
const JSR = ROOT.jsr;

if (!JSR || !JSR.three || typeof JSR.three.createCanvas !== 'function' ||
    typeof JSR.three.registerAsset !== 'function' ||
    typeof JSR.three._prepareTree !== 'function') {
  throw new Error('three-minecraft: evaluate the JSR three.native.js/three.web.js bundle first');
}
if (typeof JSR.render !== 'function' || typeof JSR.exportState !== 'function') {
  throw new Error('three-minecraft: jsr.render and jsr.exportState are required');
}

const canvas = JSR.three.createCanvas('main');
const runtimeDocument = canvas.ownerDocument;
if (!runtimeDocument || !runtimeDocument.defaultView) {
  throw new Error('three-minecraft: the JSR runtime document facade is unavailable');
}

let renderer = null;
let mounted = false;
let statsDiagnostics = {
  phase: 'idle', frames: 0, fps: 0, frameTimeMs: 0,
  begins: 0, ends: 0, updates: 0, mode: 0
};

function finite(value) {
  return Number.isFinite(value) ? value : 0;
}

function publishDiagnostics() {
  const info = renderer && renderer.info ? renderer.info : {};
  const render = info.render || {};
  const memory = info.memory || {};
  const capabilities = JSR.three.getCapabilities ? JSR.three.getCapabilities() : {};
  JSR.exportState({
    example: 'webgl_geometry_minecraft',
    backend: renderer && renderer.capabilities && renderer.capabilities.backend || capabilities.backend || 'unknown',
    canvasCount: 1,
    mounted,
    atlas: { url: ATLAS_URL, bytes: ATLAS_BYTES, registered: true },
    renderer: {
      frame: finite(render.frame), calls: finite(render.calls),
      triangles: finite(render.triangles), points: finite(render.points),
      lines: finite(render.lines), geometries: finite(memory.geometries),
      textures: finite(memory.textures)
    },
    stats: Object.assign({}, statsDiagnostics)
  });
}

// Stats is a local diagnostic adapter, not a second render-tree node.
export function reportStats(value) {
  statsDiagnostics = value;
  publishDiagnostics();
}

const hostRender = JSR.render;
JSR.render = function(tree) {
  return hostRender.call(this, JSR.three._prepareTree(tree));
};

JSR.three.registerAsset(ATLAS_URL, {
  data: ATLAS_BASE64,
  mime: 'image/png',
  width: ATLAS_WIDTH,
  height: ATLAS_HEIGHT
});

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
    if (!event || !event.type) throw new Error('three-minecraft: event.type is required');
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
    __jsrMinecraftLocal: true,
    tagName: String(tagName).toUpperCase(),
    style: {},
    children: [],
    parentNode: null
  });
  element.appendChild = function(child) {
    if (!child || !child.__jsrMinecraftLocal) throw new Error('three-minecraft: only local diagnostic children are supported');
    return append(this, child);
  };
  element.removeChild = function(child) {
    const index = this.children.indexOf(child);
    if (index < 0) throw new Error('three-minecraft: child is not mounted');
    this.children.splice(index, 1);
    child.parentNode = null;
    return child;
  };
  return element;
}

function localImage() {
  if (typeof ROOT.OffscreenCanvas !== 'function') {
    throw new Error('three-minecraft: local web textures require OffscreenCanvas');
  }
  // An OffscreenCanvas is a valid WebGL texture source. The registered PNG is
  // decoded locally and drawn into it; no Image/HTML network loader is used.
  const image = eventTarget(new ROOT.OffscreenCanvas(ATLAS_WIDTH, ATLAS_HEIGHT));
  image.complete = false;
  let source = '';
  Object.defineProperty(image, 'src', {
    configurable: true,
    get() { return source; },
    set(value) {
      source = String(value);
      Promise.resolve().then(async () => {
        if (source !== ATLAS_URL) throw new Error(`three-minecraft: unregistered image URL ${source}`);
        if (typeof ROOT.atob !== 'function' || typeof ROOT.Blob !== 'function' || typeof ROOT.createImageBitmap !== 'function') {
          throw new Error('three-minecraft: local PNG decoding requires atob, Blob and createImageBitmap');
        }
        const encoded = ROOT.atob(ATLAS_BASE64);
        const bytes = new Uint8Array(encoded.length);
        for (let i = 0; i < encoded.length; i++) bytes[i] = encoded.charCodeAt(i);
        const bitmap = await ROOT.createImageBitmap(new ROOT.Blob([bytes], { type: 'image/png' }));
        try {
          const context = image.getContext('2d');
          if (!context) throw new Error('three-minecraft: OffscreenCanvas 2D decoding is unavailable');
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

function createElement(tagName) {
  const tag = String(tagName).toLowerCase();
  if (tag === 'canvas') return JSR.three.createCanvas('main');
  if (tag === 'img' || tag === 'image') return localImage();
  return localElement(tag);
}

runtimeDocument.createElement = createElement;
runtimeDocument.createElementNS = function(_namespace, tagName) {
  return createElement(tagName);
};

const container = localElement('div');
container.id = 'container';
container.appendChild = function(child) {
  if (child && child.isJsrThreeCanvas) {
    if (child !== canvas) throw new Error('three-minecraft: exactly one main canvas is supported');
    append(this, child);
    renderer = child.renderer || renderer;
    if (!mounted) {
      mounted = true;
      JSR.render({ type: 'three', canvasId: 'main' });
    }
    publishDiagnostics();
    return child;
  }
  if (!child || !child.__jsrMinecraftLocal) {
    throw new Error('three-minecraft: container accepts only the main canvas and local stats DOM');
  }
  append(this, child);
  publishDiagnostics();
  return child;
};

const info = localElement('div');
info.id = 'info';
runtimeDocument.getElementById = function(id) {
  if (id === 'container') return container;
  if (id === 'info') return info;
  return null;
};

ROOT.document = runtimeDocument;
ROOT.window = runtimeDocument.defaultView;

publishDiagnostics();
