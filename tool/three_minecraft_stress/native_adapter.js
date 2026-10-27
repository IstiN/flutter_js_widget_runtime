const ROOT = globalThis;
const JSR = ROOT.jsr;
const ASSETS = __JSR_MINECRAFT_ASSETS__;
const INITIAL_DRAW_DISTANCE = __JSR_MINECRAFT_DRAW_DISTANCE__;
const STORAGE_WRITE_THROUGH = __JSR_MINECRAFT_STORAGE_WRITE_THROUGH__;
const ID = 'three-minecraft-stress';
const MAX_BLOB_URLS = 16;

if (!JSR || !JSR.three || typeof JSR.three.createCanvas !== 'function' ||
    typeof JSR.three.registerAsset !== 'function') {
  throw new Error(`${ID}: evaluate the pinned three.native.js bundle first`);
}
for (const method of ['render', 'exportState', 'onEvent']) {
  if (typeof JSR[method] !== 'function') throw new Error(`${ID}: jsr.${method} is required`);
}

const canvas = JSR.three.createCanvas('main');
const runtime = JSR.three._runtime;
const documentFacade = canvas.ownerDocument;
const windowFacade = documentFacade.defaultView;
canvas.getRootNode = () => documentFacade;
if (!documentFacade || !windowFacade || !runtime) {
  throw new Error(`${ID}: finite JSR document runtime is unavailable`);
}

let renderer = null;
let scene = null;
let camera = null;
let world = null;
let mounted = false;
let mountCount = 0;
let renderTreeCount = 0;
let stats = { phase: 'idle', frames: 0, fps: 0, frameTimeMs: 0, begins: 0, ends: 0, updates: 0, mode: 0 };
let ui = { visual: false, debugOnly: true, hidden: false, controllers: 0, folders: 0 };
let lastRender = null;
let lastRenderError = null;
const loggedDegradations = new Set();
const loggedErrors = new Set();
const input = {
  virtualPointerLock: true, lockRequests: 0, unlockRequests: 0,
  lockChanges: 0, lastLockOptions: null, keys: 0, lastKeyCode: null,
  pointerDown: 0, pointerMove: 0, pointerUp: 0,
  mouseDown: 0, mouseMove: 0, mouseUp: 0,
  rawPointerLock: false, rawDeltaPolls: 0, rawDeltaEvents: 0
};
const idle = { scheduled: 0, executed: 0, pending: 0, cancelled: 0 };
const blobStats = { created: 0, revoked: 0, evicted: 0, active: 0, limit: MAX_BLOB_URLS };
const storageDiagnostics = { writes: 0, writeThroughErrors: 0 };
const preparedUrls = Object.keys(ASSETS).sort();
for (const url of preparedUrls) JSR.three.registerAsset(url, ASSETS[url]);

function finite(value) { return Number.isFinite(value) ? value : 0; }
function append(parent, child) {
  const old = parent.children.indexOf(child);
  if (old >= 0) parent.children.splice(old, 1);
  parent.children.push(child);
  child.parentNode = parent;
  return child;
}

function classList(initial = '') {
  const values = new Set(String(initial).split(/\s+/).filter(Boolean));
  return {
    add(...names) { for (const name of names) values.add(String(name)); },
    remove(...names) { for (const name of names) values.delete(String(name)); },
    contains(name) { return values.has(String(name)); },
    toggle(name, force) {
      const add = force === undefined ? !values.has(name) : !!force;
      if (add) values.add(name); else values.delete(name);
      return add;
    },
    toString() { return [...values].join(' '); }
  };
}

function localElement(tagName, id = '') {
  return {
    __jsrMinecraftStressLocal: true,
    tagName: String(tagName).toUpperCase(), id,
    ownerDocument: documentFacade, style: {}, children: [], parentNode: null,
    classList: classList(), innerHTML: '', textContent: '', src: '',
    appendChild(child) {
      if (!child || (!child.__jsrMinecraftStressLocal && !child.isJsrThreeCanvas)) {
        throw new Error(`${ID}: finite elements accept only known local children`);
      }
      return append(this, child);
    },
    removeChild(child) {
      const index = this.children.indexOf(child);
      if (index < 0) throw new Error(`${ID}: child is not mounted`);
      this.children.splice(index, 1);
      child.parentNode = null;
      return child;
    }
  };
}

const body = localElement('body');
const elements = new Map();
function fixed(tag, id, parent = body, classes = '') {
  const element = localElement(tag, id);
  element.classList = classList(classes);
  elements.set(id, element);
  append(parent, element);
  return element;
}

const app = fixed('div', 'app');
const info = fixed('div', 'info');
fixed('div', 'info-player-position', info);
const toolbarContainer = fixed('div', 'toolbar-container');
const toolbar = fixed('div', 'toolbar', toolbarContainer);
const toolbarImages = {
  1: 'grass.png', 2: 'dirt.png', 3: 'stone.png', 4: 'coal_ore.png',
  5: 'iron_ore.png', 6: 'tree_top.png', 7: 'leaves.png', 8: 'sand.png',
  0: 'pickaxe.png'
};
for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 0]) {
  const image = fixed('img', `toolbar-${id}`, toolbar, `toolbar-icon${id === 0 ? ' selected' : ''}`);
  image.src = `textures/${toolbarImages[id]}`;
}
const overlay = fixed('div', 'overlay');
overlay.style.visibility = 'visible';
fixed('div', 'instructions', overlay);
fixed('div', 'status');

body.appendChild = function(child) {
  if (child && child.isJsrThreeCanvas) {
    if (child !== canvas) throw new Error(`${ID}: exactly one precreated main canvas is supported`);
    append(this, child);
    renderer = child.renderer || renderer;
    if (!mounted) {
      mounted = true;
      mountCount++;
      renderNativeTree();
    }
    publishDiagnostics();
    return child;
  }
  if (!child || !child.__jsrMinecraftStressLocal) {
    throw new Error(`${ID}: body accepts only the main canvas and finite local UI`);
  }
  append(this, child);
  return child;
};
documentFacade.body = body;
documentFacade.pointerLockElement = null;
documentFacade.getElementById = id => elements.get(String(id)) || null;
documentFacade.createElement = tag => {
  const normalized = String(tag).toLowerCase();
  if (normalized !== 'div' && normalized !== 'img') {
    throw new Error(`${ID}: document.createElement supports only finite div/img adapters, not ${normalized}`);
  }
  return localElement(normalized);
};
documentFacade.createElementNS = (_namespace, tag) => documentFacade.createElement(tag);

function textureDataUrl(name) {
  const asset = ASSETS[`textures/${name}`];
  return `data:${asset.mime};base64,${asset.data}`;
}

function toolbarTree() {
  const icons = [];
  for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 0]) {
    const element = elements.get(`toolbar-${id}`);
    const selected = element.classList.contains('selected');
    icons.push({
      type: 'container',
      decoration: {
        color: '#FF3A3A3A',
        borderColor: selected ? '#FFFFFFFF' : '#FF3A3A3A', borderWidth: 4
      },
      child: {
        type: 'image', src: textureDataUrl(toolbarImages[id]),
        width: 64, height: 64, fit: 'fill', filterQuality: 'none'
      }
    });
    if (id !== 0) icons.push({ type: 'sizedBox', width: 12 });
  }
  return {
    type: 'container', positioned: { left: 0, right: 0, bottom: 8 },
    child: {
      type: 'center',
      child: {
        type: 'container', padding: 8,
        decoration: {
          color: '#FF6D6D6D', borderColor: '#FF939393', borderWidth: 4
        },
        child: { type: 'row', mainAxisSize: 'min', children: icons }
      }
    }
  };
}

function instructionsTree() {
  return {
    type: 'gestureDetector', positioned: { left: 0, top: 0, right: 0, bottom: 0 },
    onTap: `${ID}.lock`,
    child: {
      type: 'container', decoration: { color: '#80000000' },
      child: {
        type: 'center',
        child: {
          type: 'column', mainAxisSize: 'min', children: [
            {
              type: 'text', data: 'MINECRAFTjs', textAlign: 'center',
              style: { color: '#FFFFFFFF', fontSize: 48, fontWeight: 'w700' }
            },
            {
              type: 'text', textAlign: 'center',
              data: 'WASD - Move\nSHIFT - Sprint\nSPACE - Jump\nR - Reset Camera\nU - Toggle UI\n0 - Pickaxe\n1-8 - Select Block\nF1 - Save Game\nF2 - Load Game\nF10 - Debug Camera\nESC - Release Mouse',
              style: { color: '#FFFFFFFF', fontSize: 22 }
            },
            { type: 'sizedBox', height: 24 },
            {
              type: 'text', data: 'PRESS ANY KEY OR CLICK TO START', textAlign: 'center',
              style: { color: '#FFFFFFFF', fontSize: 28, fontWeight: 'w700' }
            }
          ]
        }
      }
    }
  };
}

function nativeTree() {
  const children = [{ type: 'three', canvasId: 'main' }, toolbarTree()];
  children.push({
    type: 'container', positioned: { right: 8, bottom: 8 }, ignorePointer: true,
    child: {
      type: 'text', data: elements.get('info-player-position').innerHTML,
      style: { color: '#FFFFFFFF', fontSize: 20 }
    }
  });
  if (overlay.style.visibility !== 'hidden') children.push(instructionsTree());
  children.push({
    type: 'container', positioned: { left: 8, bottom: 8 }, ignorePointer: true,
    child: {
      type: 'text', data: elements.get('status').innerHTML,
      style: { color: '#FFFFFFFF', fontSize: 24 }
    }
  });
  return { type: 'stack', fit: 'expand', children };
}

function renderNativeTree() {
  renderTreeCount++;
  JSR.render(nativeTree());
}

let nativePointerLockGeneration = 0;
let rawDeltaPending = false;

function syncNativePointerLock(locked) {
  const generation = ++nativePointerLockGeneration;
  if (!locked) input.rawPointerLock = false;
  JSR.hostCall('three.pointerLock', { locked }).then(supported => {
    if (generation !== nativePointerLockGeneration) return;
    input.rawPointerLock = locked && supported === true;
    publishDiagnostics();
  }).catch(() => {
    if (generation !== nativePointerLockGeneration) return;
    input.rawPointerLock = false;
    publishDiagnostics();
  });
}

export function pollRawPointer() {
  if (!input.rawPointerLock || rawDeltaPending) return;
  rawDeltaPending = true;
  input.rawDeltaPolls++;
  JSR.hostCall('three.pointerDelta', {}).then(delta => {
    rawDeltaPending = false;
    if (!input.rawPointerLock) return;
    if (!delta || delta.locked !== true) {
      input.rawPointerLock = false;
      unlock();
      return;
    }
    const dx = finite(delta.dx);
    const dy = finite(delta.dy);
    if (dx === 0 && dy === 0) return;
    input.rawDeltaEvents++;
    input.mouseMove++;
    documentFacade.dispatchEvent(mouseEvent('mousemove', {
      pointerId: 0, pointerType: 'mouse', button: 0, buttons: 0,
      clientX: 0, clientY: 0, pageX: 0, pageY: 0
    }, dx, dy));
  }).catch(() => {
    rawDeltaPending = false;
    input.rawPointerLock = false;
    publishDiagnostics();
  });
}

function lock(options = {}) {
  const normalized = typeof options === 'object' && options !== null
    ? { unadjustedMovement: !!options.unadjustedMovement }
    : { unadjustedMovement: !!options };
  input.lockRequests++;
  input.lastLockOptions = normalized;
  syncNativePointerLock(true);
  if (documentFacade.pointerLockElement !== body) {
    documentFacade.pointerLockElement = body;
    input.lockChanges++;
    documentFacade.dispatchEvent({ type: 'pointerlockchange' });
    overlay.style.visibility = 'hidden';
    renderNativeTree();
  }
  publishDiagnostics();
  return Promise.resolve();
}

function unlock() {
  input.unlockRequests++;
  syncNativePointerLock(false);
  if (documentFacade.pointerLockElement !== null) {
    documentFacade.pointerLockElement = null;
    input.lockChanges++;
    documentFacade.dispatchEvent({ type: 'pointerlockchange' });
    overlay.style.visibility = 'visible';
    renderNativeTree();
  }
  publishDiagnostics();
}

body.requestPointerLock = lock;
documentFacade.exitPointerLock = unlock;
JSR.onEvent(actionId => {
  if (actionId === `${ID}.lock`) lock({ unadjustedMovement: false });
  else if (actionId === `${ID}.unlock`) unlock();
});
setInterval(() => {
  if (mounted) renderNativeTree();
}, 100);

function normalizeKey(event) {
  const originalCode = String(event.code || '');
  const originalKey = String(event.key || '');
  let code = originalCode;
  let key = originalKey;
  if (/^[a-z]$/i.test(code)) code = `Key${code.toUpperCase()}`;
  if (!/^Key[A-Z]$/.test(code) && /^[a-z]$/i.test(key)) code = `Key${key.toUpperCase()}`;
  if (/^[0-9]$/.test(code)) code = `Digit${code}`;
  if (!/^Digit[0-9]$/.test(code) && /^[0-9]$/.test(key)) code = `Digit${key}`;
  const named = {
    ' ': 'Space', space: 'Space', Space: 'Space', Spacebar: 'Space',
    shift: 'ShiftLeft', Shift: 'ShiftLeft', ShiftLeft: 'ShiftLeft', ShiftRight: 'ShiftRight',
    arrowLeft: 'ArrowLeft', arrowRight: 'ArrowRight', arrowUp: 'ArrowUp', arrowDown: 'ArrowDown',
    escape: 'Escape', Escape: 'Escape', enter: 'Enter', Enter: 'Enter'
  };
  code = named[code] || named[key] || code;
  if (/^Key[A-Z]$/.test(code)) key = code.slice(3).toLowerCase();
  else if (/^Digit[0-9]$/.test(code)) key = code.slice(5);
  else if (code === 'Space') key = ' ';
  else if (code.startsWith('Shift')) key = 'Shift';
  else if (/^F(?:[1-9]|1[0-2])$/.test(code)) key = code;
  return { code, key };
}

for (const type of ['keydown', 'keyup']) {
  documentFacade.addEventListener(type, event => {
    const normalized = normalizeKey(event);
    event.code = normalized.code;
    event.key = normalized.key;
    input.keys++;
    input.lastKeyCode = normalized.code;
    // Browsers apply Escape AFTER keydown listeners. The original player
    // re-locks on any keydown while unlocked, so an immediate unlock would be
    // undone by Player.onKeyDown before this event finishes dispatching.
    if (type === 'keydown' && normalized.code === 'Escape' &&
        documentFacade.pointerLockElement !== null) {
      setTimeout(() => {
        if (documentFacade.pointerLockElement !== null) unlock();
      }, 0);
    }
    publishDiagnostics();
  });
}

const pointers = new Map();
function coordinate(event, name) { return Number.isFinite(event[name]) ? event[name] : 0; }
function mouseEvent(type, event, movementX = 0, movementY = 0) {
  return {
    type, button: finite(event.button), buttons: finite(event.buttons),
    clientX: coordinate(event, 'clientX'), clientY: coordinate(event, 'clientY'),
    pageX: coordinate(event, 'pageX'), pageY: coordinate(event, 'pageY'),
    screenX: coordinate(event, 'screenX'), screenY: coordinate(event, 'screenY'),
    movementX, movementY, pointerId: finite(event.pointerId),
    pointerType: event.pointerType || 'mouse', timeStamp: finite(event.timeStamp)
  };
}

documentFacade.addEventListener('pointerdown', event => {
  const id = finite(event.pointerId);
  const x = coordinate(event, 'pageX');
  const y = coordinate(event, 'pageY');
  pointers.set(id, { x, y });
  input.pointerDown++;
  input.mouseDown++;
  documentFacade.dispatchEvent(mouseEvent('mousedown', event));
});
documentFacade.addEventListener('pointermove', event => {
  const id = finite(event.pointerId);
  const x = coordinate(event, 'pageX');
  const y = coordinate(event, 'pageY');
  const previous = pointers.get(id) || { x, y };
  const movementX = Number.isFinite(event.movementX) ? event.movementX : x - previous.x;
  const movementY = Number.isFinite(event.movementY) ? event.movementY : y - previous.y;
  pointers.set(id, { x, y });
  input.pointerMove++;
  input.mouseMove++;
  documentFacade.dispatchEvent(mouseEvent('mousemove', event, movementX, movementY));
});
for (const type of ['pointerup', 'pointercancel']) {
  documentFacade.addEventListener(type, event => {
    pointers.delete(finite(event.pointerId));
    input.pointerUp++;
    input.mouseUp++;
    documentFacade.dispatchEvent(mouseEvent(type === 'pointerup' ? 'mouseup' : 'mousecancel', event));
  });
}

const memoryStorage = new Map();
let storageErrorLogged = false;
function writeThrough(key, value) {
  if (!STORAGE_WRITE_THROUGH || !JSR.storage || typeof JSR.storage.set !== 'function') return;
  Promise.resolve(JSR.storage.set(key, value)).catch(error => {
    storageDiagnostics.writeThroughErrors++;
    if (!storageErrorLogged) {
      storageErrorLogged = true;
      console.warn(`${ID}: optional storage write-through failed: ${error.message || error}`);
    }
  });
}
const localStorageFacade = {
  get length() { return memoryStorage.size; },
  key(index) { return [...memoryStorage.keys()][index] || null; },
  getItem(key) { key = String(key); return memoryStorage.has(key) ? memoryStorage.get(key) : null; },
  setItem(key, value) {
    key = String(key);
    value = String(value);
    memoryStorage.set(key, value);
    storageDiagnostics.writes++;
    writeThrough(key, value);
  },
  removeItem(key) {
    key = String(key);
    memoryStorage.delete(key);
    storageDiagnostics.writes++;
    writeThrough(key, null);
  },
  clear() {
    const keys = [...memoryStorage.keys()];
    memoryStorage.clear();
    storageDiagnostics.writes++;
    for (const key of keys) writeThrough(key, null);
  }
};

const idleTimers = new Map();
let nextIdle = 1;
ROOT.requestIdleCallback = function(callback, options = {}) {
  if (typeof callback !== 'function') throw new TypeError(`${ID}: idle callback must be a function`);
  const id = nextIdle++;
  idle.scheduled++;
  idle.pending++;
  const started = performance.now();
  const timer = setTimeout(() => {
    idleTimers.delete(id);
    idle.pending--;
    idle.executed++;
    callback({
      didTimeout: false,
      timeRemaining() { return Math.max(0, 50 - (performance.now() - started)); }
    });
  }, Number.isFinite(options.timeout) ? Math.min(16, Math.max(0, options.timeout)) : 0);
  idleTimers.set(id, timer);
  return id;
};
ROOT.cancelRequestIdleCallback = function(id) {
  const timer = idleTimers.get(id);
  if (timer === undefined) return;
  clearTimeout(timer);
  idleTimers.delete(id);
  idle.pending--;
  idle.cancelled++;
};

function utf8(value) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(String(value));
  const result = [];
  for (const character of String(value)) {
    const code = character.codePointAt(0);
    if (code < 128) result.push(code);
    else if (code < 2048) result.push(192 | code >> 6, 128 | code & 63);
    else if (code < 65536) result.push(224 | code >> 12, 128 | code >> 6 & 63, 128 | code & 63);
    else result.push(240 | code >> 18, 128 | code >> 12 & 63, 128 | code >> 6 & 63, 128 | code & 63);
  }
  return new Uint8Array(result);
}

function bytesOf(part) {
  if (part instanceof FiniteBlob) return part._bytes.slice();
  if (part instanceof ArrayBuffer) return new Uint8Array(part.slice(0));
  if (ArrayBuffer.isView(part)) return new Uint8Array(part.buffer, part.byteOffset, part.byteLength).slice();
  if (typeof part === 'string') return utf8(part);
  throw new TypeError(`${ID}: finite Blob accepts only strings, ArrayBuffer/views, and finite Blobs`);
}

class FiniteBlob {
  constructor(parts = [], options = {}) {
    const chunks = Array.from(parts, bytesOf);
    const length = chunks.reduce((sum, bytes) => sum + bytes.byteLength, 0);
    this._bytes = new Uint8Array(length);
    let offset = 0;
    for (const bytes of chunks) { this._bytes.set(bytes, offset); offset += bytes.byteLength; }
    this.size = length;
    this.type = String(options.type || '').toLowerCase();
  }
  arrayBuffer() { return Promise.resolve(this._bytes.buffer.slice(this._bytes.byteOffset, this._bytes.byteOffset + this._bytes.byteLength)); }
  slice(start = 0, end = this.size, type = this.type) {
    return new FiniteBlob([this._bytes.slice(start, end)], { type });
  }
}

function imageDimensions(bytes, mime) {
  if (mime.includes('png') || (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71)) {
    if (bytes.length < 24) throw new Error(`${ID}: truncated PNG blob`);
    return { width: bytes[16] * 0x1000000 + (bytes[17] << 16) + (bytes[18] << 8) + bytes[19],
      height: bytes[20] * 0x1000000 + (bytes[21] << 16) + (bytes[22] << 8) + bytes[23] };
  }
  if (mime.includes('jpeg') || mime.includes('jpg') || (bytes[0] === 0xff && bytes[1] === 0xd8)) {
    let offset = 2;
    while (offset + 8 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset++; continue; }
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const length = (bytes[offset] << 8) | bytes[offset + 1];
      if (length < 2 || offset + length > bytes.length) break;
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { height: (bytes[offset + 3] << 8) | bytes[offset + 4],
          width: (bytes[offset + 5] << 8) | bytes[offset + 6] };
      }
      offset += length;
    }
    throw new Error(`${ID}: JPEG blob has no supported size frame`);
  }
  return { width: 0, height: 0 };
}

const blobUrls = new Map();
let nextBlob = 1;
function revokeObjectURL(url, evicted = false) {
  if (!blobUrls.delete(url)) return;
  runtime.assets.delete(url);
  blobStats.active = blobUrls.size;
  if (evicted) blobStats.evicted++; else blobStats.revoked++;
  publishDiagnostics();
}
function createObjectURL(blob) {
  if (!(blob instanceof FiniteBlob)) throw new TypeError(`${ID}: object URLs require the finite native Blob`);
  if (!blob.type.includes('png') && !blob.type.includes('jpeg') && !blob.type.includes('jpg')) {
    throw new Error(`${ID}: finite object URLs are restricted to GLTF PNG/JPEG images`);
  }
  if (blobUrls.size >= MAX_BLOB_URLS) revokeObjectURL(blobUrls.keys().next().value, true);
  const url = `blob:jsr-minecraft-stress/${nextBlob++}`;
  const dimensions = imageDimensions(blob._bytes, blob.type);
  blobUrls.set(url, { mime: blob.type });
  JSR.three.registerAsset(url, { data: blob._bytes, mime: blob.type, ...dimensions });
  blobStats.created++;
  blobStats.active = blobUrls.size;
  publishDiagnostics();
  return url;
}

ROOT.Blob = FiniteBlob;
const URL_API = ROOT.URL || {};
URL_API.createObjectURL = createObjectURL;
URL_API.revokeObjectURL = revokeObjectURL;
ROOT.URL = URL_API;
ROOT.webkitURL = URL_API;
ROOT.self = ROOT;
// Native R1 consumes encoded bytes through JsrTextureLoader, never ImageBitmap.
ROOT.createImageBitmap = undefined;

ROOT.document = documentFacade;
ROOT.window = windowFacade;
ROOT.localStorage = localStorageFacade;
if (typeof ROOT.requestAnimationFrame !== 'function') {
  ROOT.requestAnimationFrame = callback => runtime.requestAnimationFrame(callback);
  ROOT.cancelAnimationFrame = id => runtime.cancelAnimationFrame(id);
}
windowFacade.requestAnimationFrame = ROOT.requestAnimationFrame;
windowFacade.cancelAnimationFrame = ROOT.cancelAnimationFrame;
windowFacade.document = documentFacade;
windowFacade.localStorage = localStorageFacade;
windowFacade.requestIdleCallback = ROOT.requestIdleCallback;
windowFacade.cancelRequestIdleCallback = ROOT.cancelRequestIdleCallback;

function findWorld(value) {
  if (!value) return null;
  return value.children.find(child => typeof child.drawDistance === 'number' && typeof child.generate === 'function') || null;
}

export function reportStats(value) {
  stats = value;
  publishDiagnostics();
}

export function reportUi(value) {
  ui = value;
  publishDiagnostics();
}

export function reportStressRender(value, sceneValue, cameraValue, degradation) {
  renderer = value;
  scene = sceneValue;
  camera = cameraValue;
  world = findWorld(sceneValue) || world;
  lastRender = degradation;
  lastRenderError = degradation.error;
  for (const feature of ['fog', 'shadows']) {
    const requested = feature === 'fog' ? !!degradation.requested.fog : degradation.requested.shadows.enabled;
    const rendered = feature === 'fog' ? !!degradation.rendered.fog : degradation.rendered.shadows.enabled;
    if (requested && !rendered && !loggedDegradations.has(feature)) {
      loggedDegradations.add(feature);
      console.warn(`${ID}: requested ${feature}=${JSON.stringify(degradation.requested[feature])}; native rendered ${feature} disabled for this profile; restored after render`);
    }
  }
  if (lastRenderError && !loggedErrors.has(lastRenderError)) {
    loggedErrors.add(lastRenderError);
    console.error(`${ID}: native render blocker: ${lastRenderError}`);
  }
  publishDiagnostics();
}

export function publishDiagnostics() {
  const info = renderer && renderer.info || {};
  const render = info.render || {};
  const memory = info.memory || {};
  const capabilities = JSR.three.getCapabilities ? JSR.three.getCapabilities() : {};
  JSR.exportState({
    id: ID,
    originalApp: {
      name: 'Minecraft.js', reference: 'minecraft-threejs-clone',
      module: 'scripts/main.js', originalLogic: true, sourceFilesModified: false
    },
    three: {
      revision: ROOT.THREE && ROOT.THREE.REVISION || '186', version: '0.186.1',
      backend: renderer && renderer.capabilities && renderer.capabilities.backend || capabilities.backend || 'unknown',
      rawWebGL: false, protocol: 'JSR3D-T1/R1-v1'
    },
    profile: 'native-parity', visualParity: false,
    drawDistance: world ? world.drawDistance : INITIAL_DRAW_DISTANCE,
    originalDrawDistance: 3,
    canvasCount: runtime.canvases.size, mounted, mountCount, renderTreeCount,
    stats: Object.assign({}, stats),
    renderer: {
      stressWrapper: !!(renderer && renderer.isJsrMinecraftStressRenderer),
      frame: finite(render.frame), calls: finite(render.calls),
      triangles: finite(render.triangles), points: finite(render.points), lines: finite(render.lines),
      geometries: finite(memory.geometries), textures: finite(memory.textures),
      lastError: lastRenderError
    },
    assets: {
      prepared: preparedUrls.length, blockPngs: 17, toolbarPngs: 1, models: 1,
      activeRegistered: runtime.assets.size, embeddedBlobs: Object.assign({}, blobStats)
    },
    idle: Object.assign({}, idle),
    input: Object.assign({}, input, {
      locked: documentFacade.pointerLockElement === body,
      pointerLockElement: documentFacade.pointerLockElement === body ? 'document.body' : null,
      orbitDrag: 'pointer events preserved', wheel: 'unsupported: native host currently has no wheel lane',
      rawOsPointerDeltas: input.rawPointerLock === true
    }),
    storage: {
      mode: STORAGE_WRITE_THROUGH ? 'in-memory + optional write-through; no read hydration' : 'in-memory only',
      writeThrough: STORAGE_WRITE_THROUGH, entries: memoryStorage.size,
      writes: storageDiagnostics.writes, writeThroughErrors: storageDiagnostics.writeThroughErrors
    },
    ui: Object.assign({}, ui, {
      lockOverlay: 'native JSR instructions and lock gesture', originalDomVisual: false,
      nativeHudVisual: true, toolbarIcons: 9,
      originalOverlayVisibility: overlay.style.visibility || 'visible'
    }),
    degradations: lastRender ? [lastRender] : [],
    limitations: [
      'Linear fog and the first directional 2048px shadow map are native; R1 uses R32 depth plus 3x3 PCF rather than exact THREE PCFSoft filtering.',
      'HUD/toolbar/instructions are recreated as native JSR widgets; lil-gui and the original Minecraft font remain nonvisual.',
      'Pointer lock uses native macOS relative deltas when available, with absolute-position deltas as fallback; wheel input is unavailable.',
      'Visible wireframe remains unsupported by R1; hidden helper handling belongs to core.'
    ]
  });
}

Object.defineProperty(ROOT, '__jsrMinecraftStress', {
  configurable: false,
  value: Object.freeze({
    lock, unlock, publishDiagnostics, pollRawPointer,
    get canvas() { return canvas; },
    get renderer() { return renderer; },
    get scene() { return scene; },
    get camera() { return camera; },
    get world() { return world; },
    get document() { return documentFacade; },
    get assets() { return ASSETS; }
  })
});

publishDiagnostics();
