import { assetFailure, unsupported } from './errors.js';

const ROOT = typeof globalThis !== 'undefined' ? globalThis : {};
const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
let activeRuntime = null;

function utf8(value, useNative = true) {
  const string = String(value);
  if (useNative && typeof TextEncoder !== 'undefined') return new TextEncoder().encode(string);
  const bytes = [];
  for (let i = 0; i < string.length; i++) {
    let code = string.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < string.length) {
      const next = string.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + next - 0xdc00;
        i++;
      } else code = 0xfffd;
    } else if (code >= 0xd800 && code <= 0xdfff) code = 0xfffd;
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
    else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 63), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
  }
  return new Uint8Array(bytes);
}

export function decodeUtf8(bytes) {
  let result = '';
  for (let i = 0; i < bytes.length;) {
    const first = bytes[i++];
    let code = first;
    let extra = 0;
    let minimum = 0;
    if (first >= 0xc2 && first <= 0xdf) { code = first & 31; extra = 1; minimum = 0x80; }
    else if (first >= 0xe0 && first <= 0xef) { code = first & 15; extra = 2; minimum = 0x800; }
    else if (first >= 0xf0 && first <= 0xf4) { code = first & 7; extra = 3; minimum = 0x10000; }
    else if (first >= 0x80) { result += '\ufffd'; continue; }
    if (i + extra > bytes.length) { result += '\ufffd'; break; }
    let valid = true;
    for (let j = 0; j < extra; j++) {
      const next = bytes[i++];
      if ((next & 0xc0) !== 0x80) {
        valid = false;
        i--;
        break;
      }
      code = (code << 6) | (next & 63);
    }
    if (!valid || code < minimum || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) result += '\ufffd';
    else result += String.fromCodePoint(code);
  }
  return result;
}

function installTextEncoding() {
  if (typeof ROOT.TextDecoder === 'undefined') {
    ROOT.TextDecoder = class {
      constructor(label = 'utf-8') {
        const normalized = String(label).toLowerCase().replace('_', '-');
        if (normalized !== 'utf-8' && normalized !== 'utf8') throw new RangeError(`three.invalid: unsupported TextDecoder label ${label}`);
      }
      decode(value) {
        if (value === undefined) return '';
        if (!(value instanceof ArrayBuffer) && !ArrayBuffer.isView(value)) throw new TypeError('three.invalid: TextDecoder.decode expects an ArrayBuffer or view');
        return decodeUtf8(decodeBase64(value));
      }
    };
  }
  if (typeof ROOT.TextEncoder === 'undefined') {
    ROOT.TextEncoder = class { encode(value) { return utf8(value, false); } };
  }
}

export function decodeBase64(value) {
  if (value instanceof Uint8Array) return new Uint8Array(value);
  if (value instanceof ArrayBuffer) return new Uint8Array(value.slice(0));
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
  if (typeof value !== 'string') throw assetFailure('<bytes>', 'expected base64 or a typed array');
  const clean = value.replace(/\s/g, '');
  if (clean.length % 4 === 1 || /[^A-Za-z0-9+/=_-]/.test(clean)) throw assetFailure('<bytes>', 'invalid base64');
  const normalized = clean.replace(/-/g, '+').replace(/_/g, '/');
  const output = [];
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (char === '=') break;
    const index = BASE64.indexOf(char);
    if (index < 0) throw assetFailure('<bytes>', 'invalid base64');
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >> bits) & 255);
    }
  }
  return new Uint8Array(output);
}

export function encodeBase64(value) {
  const bytes = decodeBase64(value);
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    result += BASE64[(n >> 18) & 63] + BASE64[(n >> 12) & 63] +
      (i + 1 < bytes.length ? BASE64[(n >> 6) & 63] : '=') +
      (i + 2 < bytes.length ? BASE64[n & 63] : '=');
  }
  return result;
}

function identity(value, name, max) {
  const bytes = utf8(value);
  if (bytes.length < 1 || bytes.length > max) throw new Error(`three.invalid: ${name} UTF-8 length must be 1..${max}`);
  return String(value);
}

function eventTarget(target) {
  target._listeners = new Map();
  target.addEventListener = function(type, callback, options) {
    if (!callback) return;
    const list = this._listeners.get(type) || [];
    const capture = options === true || !!(options && options.capture);
    if (list.some(item => item.callback === callback && item.capture === capture)) return;
    list.push({ callback, capture, once: !!(options && options.once) });
    this._listeners.set(type, list);
    if (this._listenBacking) this._listenBacking(type);
  };
  target.removeEventListener = function(type, callback, options) {
    const list = this._listeners.get(type);
    if (!list) return;
    const capture = options === true || !!(options && options.capture);
    this._listeners.set(type, list.filter(item => item.callback !== callback || item.capture !== capture));
  };
  target.dispatchEvent = function(event) {
    if (typeof event === 'string') event = { type: event };
    if (!event || !event.type) throw new Error('three.invalid: event.type is required');
    if (!event.preventDefault) event.preventDefault = function() { this.defaultPrevented = true; };
    if (!event.stopPropagation) event.stopPropagation = function() { this.cancelBubble = true; };
    try { if (!event.target) event.target = this; } catch (_) {}
    try { event.currentTarget = this; } catch (_) {}
    const list = (this._listeners.get(event.type) || []).slice();
    for (const item of list) {
      if (item.once) this.removeEventListener(event.type, item.callback, { capture: item.capture });
      if (typeof item.callback === 'function') item.callback.call(this, event);
      else if (item.callback && typeof item.callback.handleEvent === 'function') item.callback.handleEvent(event);
    }
    return !event.defaultPrevented;
  };
  return target;
}

class JsrThreeDocument {
  constructor(runtime) {
    this.runtime = runtime;
    this.visibilityState = 'visible';
    this.hidden = false;
    this.activeElement = null;
    this.documentElement = { style: {} };
    this.defaultView = {
      get devicePixelRatio() { return runtime.pixelRatio; },
      get innerWidth() { return runtime.width; },
      get innerHeight() { return runtime.height; },
      addEventListener: (type, fn, options) => this.addEventListener(type, fn, options),
      removeEventListener: (type, fn, options) => this.removeEventListener(type, fn, options),
      requestAnimationFrame: fn => runtime.requestAnimationFrame(fn),
      cancelAnimationFrame: id => runtime.cancelAnimationFrame(id)
    };
    eventTarget(this);
  }

  hasFocus() { return this.activeElement !== null; }

  _setVisibility(hidden) {
    this.hidden = !!hidden;
    this.visibilityState = hidden ? 'hidden' : 'visible';
    this.dispatchEvent({ type: 'visibilitychange' });
  }
}

export class JsrThreeCanvas {
  constructor(runtime, canvasId, generation, options = {}) {
    this.runtime = runtime;
    this.canvasId = canvasId;
    this.engineId = runtime.engineId;
    this.generation = generation;
    this.surfaceId = options.surfaceId || `${canvasId}#${generation}`;
    identity(this.surfaceId, 'surfaceId', 128);
    this.isJsrThreeCanvas = true;
    this.style = {};
    this._pixelRatio = options.pixelRatio || runtime.pixelRatio;
    this._cssWidth = options.width || 300;
    this._cssHeight = options.height || 150;
    this._width = Math.max(0, Math.floor(this._cssWidth * this._pixelRatio));
    this._height = Math.max(0, Math.floor(this._cssHeight * this._pixelRatio));
    this._captured = new Set();
    this._disposed = false;
    this._mounted = false;
    this._assetEpoch = 0;
    this._focused = false;
    this.ownerDocument = runtime.document;
    this.tabIndex = 0;
    this._backing = null;
    this._backingListeners = new Map();
    eventTarget(this);
    if (runtime.web) this._createBacking(options);
  }

  _createBacking(options) {
    const supplied = options.canvas || options.offscreenCanvas;
    if (supplied) this._backing = supplied;
    else if (typeof OffscreenCanvas !== 'undefined') this._backing = new OffscreenCanvas(this._width, this._height);
    else if (typeof document !== 'undefined' && document.createElement) {
      this._backing = document.createElement('canvas');
      this._backing.width = this._width;
      this._backing.height = this._height;
    } else unsupported('webgl2', 'OffscreenCanvas or a canvas element is required');
    if (this._backing.style) this.style = this._backing.style;
    if (this._backing.ownerDocument) this.ownerDocument = this._backing.ownerDocument;
    this._backing.width = this._width;
    this._backing.height = this._height;
  }

  _listenBacking(type) {
    if (!this._backing || this._backingListeners.has(type) || !this._backing.addEventListener) return;
    const forward = event => this.dispatchEvent(event);
    this._backingListeners.set(type, forward);
    this._backing.addEventListener(type, forward);
  }

  get width() { return this._width; }
  set width(value) { this._setPhysicalSize(value, this._height); }
  get height() { return this._height; }
  set height(value) { this._setPhysicalSize(this._width, value); }
  get clientWidth() { return this._cssWidth; }
  get clientHeight() { return this._cssHeight; }
  get pixelRatio() { return this._pixelRatio; }
  get devicePixelRatio() { return this._pixelRatio; }
  get disposed() { return this._disposed; }
  get mounted() { return this._mounted; }
  get context() { return this._context || null; }

  _setPhysicalSize(width, height) {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 0 || height < 0) throw new Error('three.invalid: canvas dimensions must be non-negative finite numbers');
    this._width = Math.floor(width);
    this._height = Math.floor(height);
    this._cssWidth = this._width / this._pixelRatio;
    this._cssHeight = this._height / this._pixelRatio;
    if (this._backing) {
      this._backing.width = this._width;
      this._backing.height = this._height;
    }
  }

  _setSize(width, height, ratio, updateStyle) {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width < 0 || height < 0 || width > 16384 || height > 16384) throw new Error('three.invalid: canvas size must be within 0..16384');
    if (!Number.isFinite(ratio) || ratio <= 0 || ratio > 16) throw new Error('three.invalid: pixel ratio must be within (0,16]');
    this._cssWidth = width;
    this._cssHeight = height;
    this._pixelRatio = ratio;
    this._width = Math.floor(width * ratio);
    this._height = Math.floor(height * ratio);
    if (this._width > 16384 || this._height > 16384) throw new Error('three.invalid: drawing buffer exceeds 16384 pixels');
    if (this._backing) {
      this._backing.width = this._width;
      this._backing.height = this._height;
    }
    if (updateStyle !== false) {
      this.style.width = `${width}px`;
      this.style.height = `${height}px`;
    }
  }

  setPixelRatio(value) { this._setSize(this._cssWidth, this._cssHeight, value, false); }
  setSize(width, height, updateStyle = true) { this._setSize(width, height, this._pixelRatio, updateStyle); }

  getContext(type, attributes) {
    if (this._disposed) throw new Error('three.surface: canvas is disposed');
    if (!this.runtime.web) unsupported('rawWebGL', `canvas.getContext(${type}) requires the 1B backend`);
    if (type !== 'webgl2' && type !== 'webgl') unsupported('canvasContext', type);
    if (!this._backing || !this._backing.getContext) unsupported('webgl2', 'backing canvas has no getContext');
    const context = this._backing.getContext(type === 'webgl' ? 'webgl2' : type, attributes);
    if (!context) unsupported('webgl2', 'WebGL2 context creation failed');
    this._context = context;
    return context;
  }

  setAttribute(name, value) { if (this._backing && this._backing.setAttribute) this._backing.setAttribute(name, value); else this[`_${name}`] = value; }
  getAttribute(name) { return this._backing && this._backing.getAttribute ? this._backing.getAttribute(name) : this[`_${name}`]; }
  removeAttribute(name) { if (this._backing && this._backing.removeAttribute) this._backing.removeAttribute(name); }

  focus() {
    if (this._disposed) return;
    if (this._backing && this._backing.focus) this._backing.focus();
    this._focused = true;
    this.ownerDocument.activeElement = this;
    this.dispatchEvent({ type: 'focus' });
  }

  blur() {
    if (this._backing && this._backing.blur) this._backing.blur();
    this._focused = false;
    if (this.ownerDocument.activeElement === this) this.ownerDocument.activeElement = null;
    this.dispatchEvent({ type: 'blur' });
  }

  setPointerCapture(pointerId) {
    this._captured.add(pointerId);
    if (this._backing && this._backing.setPointerCapture) this._backing.setPointerCapture(pointerId);
    this.dispatchEvent({ type: 'gotpointercapture', pointerId });
  }

  releasePointerCapture(pointerId) {
    this._captured.delete(pointerId);
    if (this._backing && this._backing.releasePointerCapture) {
      try { this._backing.releasePointerCapture(pointerId); } catch (_) {}
    }
    this.dispatchEvent({ type: 'lostpointercapture', pointerId });
  }

  hasPointerCapture(pointerId) { return this._captured.has(pointerId); }

  getBoundingClientRect() {
    if (this._backing && this._backing.getBoundingClientRect) return this._backing.getBoundingClientRect();
    return { x: 0, y: 0, left: 0, top: 0, width: this.clientWidth, height: this.clientHeight, right: this.clientWidth, bottom: this.clientHeight };
  }

  present(payload) { return this.runtime.present(this, payload); }
  transferToImageBitmap() {
    if (this._backing && this._backing.transferToImageBitmap) return this._backing.transferToImageBitmap();
    unsupported('present', 'transferToImageBitmap is unavailable on the backing canvas');
  }
  transferControlToOffscreen() { unsupported('offscreenTransfer', 'canvas is already owned by the JSR surface'); }
  toDataURL() { unsupported('canvas2d', 'capture belongs to the JSR host'); }
  toBlob() { unsupported('canvas2d', 'capture belongs to the JSR host'); }

  _detach() {
    this._mounted = false;
    this._assetEpoch++;
    this.runtime._clearInput(this, true);
  }

  dispose() {
    if (this._disposed) return;
    this._detach();
    this._disposed = true;
    this._listeners.clear();
    if (this._backing && this._backing.removeEventListener) {
      for (const [type, listener] of this._backingListeners) this._backing.removeEventListener(type, listener);
    }
    this._backingListeners.clear();
    this.runtime._canvasDisposed(this);
  }
}

export class ThreeCompatibilityRuntime {
  constructor(jsr, web = false, previous = {}) {
    this.jsr = jsr;
    this.web = web;
    this.engineId = identity(jsr.instanceId === undefined ? 'default' : jsr.instanceId, 'engineId', 128);
    this.pixelRatio = Number.isFinite(previous.devicePixelRatio) ? previous.devicePixelRatio : (Number.isFinite(ROOT.devicePixelRatio) ? ROOT.devicePixelRatio : 1);
    this.width = Number.isFinite(previous.width) ? previous.width : (Number.isFinite(ROOT.innerWidth) ? ROOT.innerWidth : 640);
    this.height = Number.isFinite(previous.height) ? previous.height : (Number.isFinite(ROOT.innerHeight) ? ROOT.innerHeight : 360);
    this.canvases = new Map();
    this.assets = new Map();
    this.generations = new Map();
    this.presentHook = null;
    this.heldKeys = new Map();
    this.activeCanvas = null;
    this.hostAssetLoader = typeof previous.loadAssetBytes === 'function' ? previous.loadAssetBytes : null;
    this.document = new JsrThreeDocument(this);
    this.capabilities = Object.freeze({
      backend: web ? 'webgl2' : 'flutterGpu',
      rawWebGL: !!web,
      webgl2: !!web,
      r1: !web,
      shaderMaterial: !!web,
      webgpu: false,
      dom: false
    });
  }

  createCanvas(canvasId = 'main', options = {}) {
    canvasId = String(canvasId || 'main');
    identity(canvasId, 'canvasId', 112);
    const existing = this.canvases.get(canvasId);
    if (existing && !existing.disposed) return existing;
    const generation = (this.generations.get(canvasId) || 0) + 1;
    this.generations.set(canvasId, generation);
    const canvas = new JsrThreeCanvas(this, canvasId, generation, options);
    this.canvases.set(canvasId, canvas);
    return canvas;
  }

  getCanvas(canvasId = 'main') { return this.canvases.get(String(canvasId)) || null; }

  _canvasDisposed(canvas) {
    if (this.web) this._releaseWebCanvas(canvas, true);
    if (this.activeCanvas === canvas) this.activeCanvas = null;
    if (this.document.activeElement === canvas) this.document.activeElement = null;
    if (this.canvases.get(canvas.canvasId) === canvas) this.canvases.delete(canvas.canvasId);
  }

  _prepareTree(tree) {
    const visited = new Set();
    const mounted = new Set();
    const visit = value => {
      if (!value || typeof value !== 'object' || visited.has(value)) return;
      visited.add(value);
      if (value.type === 'three') {
        const id = value.canvasId === undefined ? 'main' : String(value.canvasId);
        const canvas = this.createCanvas(id);
        value.canvasId = id;
        value.engineId = canvas.engineId;
        value.surfaceId = canvas.surfaceId;
        value.generation = canvas.generation;
        canvas._mounted = true;
        if (canvas._webFrames) canvas._webFrames.released = false;
        mounted.add(canvas);
      }
      if (Array.isArray(value)) for (const child of value) visit(child);
      else for (const key of Object.keys(value)) {
        if (key !== 'canvas' && key !== 'renderer') visit(value[key]);
      }
    };
    visit(tree);
    for (const canvas of this.canvases.values()) if (canvas.mounted && !mounted.has(canvas)) canvas._detach();
    return tree;
  }

  _keyEvent(payload, down) {
    const event = Object.assign({}, payload, {
      type: down ? 'keydown' : 'keyup',
      down,
      key: payload.key || '',
      code: payload.code || payload.key || '',
      repeat: !!payload.repeat
    });
    const key = event.code || event.key;
    if (down) this.heldKeys.set(key, event);
    else this.heldKeys.delete(key);
    this.document.dispatchEvent(event);
    const focused = this.document.activeElement;
    const canvas = focused && focused.isJsrThreeCanvas ? focused : (this.document.hasFocus() ? null : this.activeCanvas);
    if (canvas && !canvas.disposed) canvas.dispatchEvent(event);
    return true;
  }

  _pointerEvent(canvas, event) {
    const result = canvas.dispatchEvent(event);
    const document = canvas.ownerDocument;
    if (document && document.runtime === this) document.dispatchEvent(event);
    return result;
  }

  _clearInput(canvas, blur) {
    const keys = Array.from(this.heldKeys.values());
    this.heldKeys.clear();
    for (const held of keys) {
      const event = Object.assign({}, held, { type: 'keyup', down: false, repeat: false });
      this.document.dispatchEvent(event);
      const target = canvas || this.activeCanvas;
      if (target && !target.disposed) target.dispatchEvent(event);
    }
    const canvases = canvas ? [canvas] : Array.from(this.canvases.values());
    for (const target of canvases) {
      for (const pointerId of Array.from(target._captured)) {
        this._pointerEvent(target, { type: 'pointercancel', pointerId, pointerType: 'unknown' });
        this._pointerEvent(target, { type: 'pointerup', pointerId, pointerType: 'unknown', button: 0 });
        if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
      }
      if (blur) target.blur();
    }
    if (blur) this.document.dispatchEvent({ type: 'blur' });
    return true;
  }

  _hostEvent(kind, payload = {}) {
    if (kind === 'key') return this._keyEvent(payload, payload.down !== false);
    if (kind === 'blur') return this._clearInput(null, true);
    if (kind === 'viewport') return this._setViewport(payload.width, payload.height, payload.pixelRatio || payload.dpr);
    if (kind === 'frameAck' || kind === 'release' || kind === 'jsr.three.frameAck' || kind === 'jsr.three.release') return this._frameControl(Object.assign({}, payload, { type: kind === 'frameAck' || kind === 'release' ? `jsr.three.${kind}` : kind }));
    if (typeof kind === 'string' && kind.startsWith('input:')) return this._dispatchEvent(kind.slice(6), payload);
    throw new Error(`three.invalid: unknown host event ${kind}`);
  }

  _dispatchEvent(canvasId, event = {}) {
    const canvas = this.getCanvas(canvasId);
    if (!canvas || canvas.disposed) return false;
    const type = event.type || '';
    if (type === 'keydown' || type === 'keyup') return this._keyEvent(event, type === 'keydown');
    if (type === 'blur') return this._clearInput(canvas, true);
    if (type === 'visibility' || type === 'visibilitychange') {
      const hidden = event.hidden !== undefined ? !!event.hidden : !event.visible;
      if (hidden) this._clearInput(canvas, true);
      this.document._setVisibility(hidden);
      return canvas.dispatchEvent(Object.assign({}, event, { type: 'visibilitychange', hidden }));
    }
    if (type === 'resize') {
      if (Number.isFinite(event.width) && Number.isFinite(event.height)) {
        if (event.pixelRatio !== undefined || event.dpr !== undefined) canvas.setPixelRatio(event.pixelRatio || event.dpr);
        if (canvas.renderer) canvas.renderer.setSize(event.width, event.height, false);
        else canvas.setSize(event.width, event.height, false);
      }
      this._setViewport(event.width, event.height, event.pixelRatio || event.dpr);
      return canvas.dispatchEvent(event);
    }
    if (type === 'pointerdown') {
      this.activeCanvas = canvas;
      canvas.focus();
    }
    const result = type.startsWith('pointer') ? this._pointerEvent(canvas, event) : canvas.dispatchEvent(event);
    if ((type === 'pointerup' || type === 'pointercancel') && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    return result;
  }

  _setViewport(width, height, pixelRatio) {
    if (Number.isFinite(width)) this.width = width;
    if (Number.isFinite(height)) this.height = height;
    if (Number.isFinite(pixelRatio)) this.pixelRatio = pixelRatio;
    this.document.dispatchEvent({ type: 'resize', width: this.width, height: this.height, pixelRatio: this.pixelRatio });
  }

  registerAsset(url, asset) {
    url = String(url);
    if (url.startsWith('data:')) {
      const parsed = this._parseDataUrl(url);
      this.assets.set(url, parsed);
      return parsed;
    }
    const record = this._assetRecord(url, asset);
    this.assets.set(url, record);
    return record;
  }

  _parseDataUrl(url) {
    const comma = url.indexOf(',');
    if (comma < 0) throw assetFailure(url, 'malformed data URI');
    const header = url.slice(5, comma);
    const mime = header.split(';')[0] || 'application/octet-stream';
    if (!/;base64/i.test(header)) throw assetFailure(url, 'only base64 data URIs are supported');
    return this._assetRecord(url, { data: url.slice(comma + 1), mime });
  }

  _assetRecord(url, asset) {
    if (asset === undefined || asset === null) throw assetFailure(url, 'missing asset bytes');
    const source = typeof asset === 'object' && !(asset instanceof Uint8Array) && !(asset instanceof ArrayBuffer) && !ArrayBuffer.isView(asset) ? asset : { data: asset };
    const raw = source.data !== undefined ? source.data : source.bytes;
    const bytes = decodeBase64(raw);
    if (bytes.length > 64 * 1024 * 1024) throw assetFailure(url, 'asset exceeds 64 MiB');
    return {
      url,
      data: typeof raw === 'string' ? raw : encodeBase64(bytes),
      bytes,
      mime: source.mime || source.mimeType || '',
      width: Number.isFinite(source.width) ? source.width : 0,
      height: Number.isFinite(source.height) ? source.height : 0
    };
  }

  resolveAsset(url) {
    url = String(url);
    if (url.startsWith('data:')) {
      if (!this.assets.has(url)) this.registerAsset(url);
      return this.assets.get(url);
    }
    return this.assets.get(url) || this.assets.get(url.replace(/^\.\//, '')) || null;
  }

  _checkAssetGuard(url, guard) {
    if (guard && guard.canvas && (guard.canvas.disposed || guard.canvas.generation !== guard.generation || guard.canvas._assetEpoch !== guard.epoch)) throw assetFailure(url, 'surface was disposed or detached during asset load');
  }

  async loadAsset(url, guard) {
    url = String(url);
    this._checkAssetGuard(url, guard);
    const local = this.resolveAsset(url);
    if (local) return local;
    let result;
    try {
      if (this.hostAssetLoader) result = await this.hostAssetLoader(url);
      else if (this.jsr && typeof this.jsr.hostCall === 'function') result = await this.jsr.hostCall('three.asset', { url });
      else throw assetFailure(url, 'asset is not registered and no host asset loader is available');
    } catch (error) {
      if (error && error.code === 'three.assetFailure') throw error;
      throw assetFailure(url, error && error.message ? error.message : 'host load failed');
    }
    this._checkAssetGuard(url, guard);
    return this.registerAsset(url, result);
  }

  requestAnimationFrame(callback) {
    if (this.jsr && this.jsr.requestAnimationFrame) return this.jsr.requestAnimationFrame.call(this.jsr, callback);
    if (ROOT.requestAnimationFrame) return ROOT.requestAnimationFrame(callback);
    return ROOT.setTimeout(() => callback(Date.now()), 16);
  }

  cancelAnimationFrame(id) {
    if (this.jsr && this.jsr.cancelAnimationFrame) return this.jsr.cancelAnimationFrame.call(this.jsr, id);
    if (ROOT.cancelAnimationFrame) return ROOT.cancelAnimationFrame(id);
    return ROOT.clearTimeout(id);
  }

  sendR1(bytes) {
    if (!this.jsr || typeof this.jsr.hostCallBinary !== 'function') unsupported('three.r1', 'jsr.hostCallBinary is required');
    return this.jsr.hostCallBinary('three.r1', bytes);
  }

  setPresentHook(callback) {
    if (callback !== null && typeof callback !== 'function') throw new TypeError('three.invalid: present hook must be a function or null');
    this.presentHook = callback;
  }

  _webState(canvas) {
    return canvas._webFrames || (canvas._webFrames = { nextId: 0, pending: new Map(), capturing: false, dirty: false, released: false });
  }

  _frameMessage(canvas, type, frameId, bitmap) {
    const message = { type, engineId: canvas.engineId, surfaceId: canvas.surfaceId, canvasId: canvas.canvasId, generation: canvas.generation };
    if (frameId !== undefined) message.frameId = frameId;
    if (bitmap !== undefined) {
      message.bitmap = bitmap;
      message.width = canvas.width;
      message.height = canvas.height;
    }
    return message;
  }

  _postStructured(message, bitmap) {
    if (typeof ROOT.postMessage !== 'function') unsupported('present', 'dedicated Worker postMessage is required');
    if (bitmap === undefined) ROOT.postMessage(message);
    else ROOT.postMessage(message, [bitmap]);
  }

  _postWebFrame(canvas, state, bitmap) {
    const frameId = ++state.nextId;
    if (!Number.isSafeInteger(frameId)) throw new Error('three.surface: frameId exhausted');
    state.pending.set(frameId, true);
    try {
      this._postStructured(this._frameMessage(canvas, 'jsr.three.frame', frameId, bitmap), bitmap);
    } catch (error) {
      state.pending.delete(frameId);
      state.dirty = true;
      if (bitmap && bitmap.close) bitmap.close();
      throw error;
    }
    return frameId;
  }

  _flushWebPresent(canvas) {
    const state = this._webState(canvas);
    if (!state.dirty || state.released || canvas.disposed || state.capturing || state.pending.size >= 2) return false;
    state.dirty = false;
    const backing = canvas._backing;
    if (backing && backing.transferToImageBitmap) {
      const bitmap = backing.transferToImageBitmap();
      this._postWebFrame(canvas, state, bitmap);
      return true;
    }
    if (backing && typeof ROOT.createImageBitmap === 'function') {
      state.capturing = true;
      Promise.resolve(ROOT.createImageBitmap(backing)).then(bitmap => {
        state.capturing = false;
        if (state.released || canvas.disposed) { if (bitmap && bitmap.close) bitmap.close(); return; }
        this._postWebFrame(canvas, state, bitmap);
        if (state.dirty) this._flushWebPresent(canvas);
      }, error => {
        state.capturing = false;
        state.dirty = false;
        unsupported('present', error && error.message);
      });
      return true;
    }
    state.dirty = false;
    return unsupported('present', 'OffscreenCanvas.transferToImageBitmap or createImageBitmap is required');
  }

  _surfaceForMessage(message) {
    if (!message || typeof message !== 'object') return null;
    if (message.engineId !== undefined && message.engineId !== this.engineId) return null;
    for (const canvas of this.canvases.values()) {
      if (message.canvasId !== undefined && message.canvasId !== canvas.canvasId) continue;
      if (message.surfaceId !== undefined && message.surfaceId !== canvas.surfaceId) continue;
      if (message.generation !== undefined && message.generation !== canvas.generation) continue;
      return canvas;
    }
    return null;
  }

  _frameControl(message) {
    const canvas = this._surfaceForMessage(message);
    if (!canvas || !this.web) return false;
    const state = this._webState(canvas);
    if (message.type === 'jsr.three.release') {
      state.released = true;
      state.dirty = false;
      state.pending.clear();
      return true;
    }
    if (message.type !== 'jsr.three.frameAck') return false;
    state.pending.delete(message.frameId);
    if (state.dirty) this._flushWebPresent(canvas);
    return true;
  }

  _releaseWebCanvas(canvas, notify) {
    if (!this.web) return;
    const state = this._webState(canvas);
    state.released = true;
    state.dirty = false;
    state.pending.clear();
    if (notify) this._postStructured(this._frameMessage(canvas, 'jsr.three.release'));
  }

  present(canvas, payload) {
    if (canvas.disposed) return false;
    if (this.presentHook) return this.presentHook({ canvas, canvasId: canvas.canvasId, surfaceId: canvas.surfaceId, engineId: canvas.engineId, generation: canvas.generation, payload });
    if (!this.web) return false;
    const state = this._webState(canvas);
    if (state.released) return false;
    state.dirty = true;
    this._flushWebPresent(canvas);
    return true;
  }

  getCapabilities() { return { ...this.capabilities }; }

  install(previous) {
    const runtime = this;
    const api = Object.assign({}, previous, {
      createCanvas: (id, options) => runtime.createCanvas(id, options),
      getCanvas: id => runtime.getCanvas(id),
      registerAsset: (url, asset) => runtime.registerAsset(url, asset),
      resolveAsset: url => runtime.resolveAsset(url),
      loadAsset: url => runtime.loadAsset(url),
      loadAssetBytes: url => runtime.loadAsset(url),
      getCapabilities: () => runtime.getCapabilities(),
      capabilities: runtime.capabilities,
      setPresentHook: callback => runtime.setPresentHook(callback),
      present: (canvasId, payload) => {
        const canvas = runtime.getCanvas(canvasId);
        return canvas ? canvas.present(payload) : false;
      },
      _prepareTree: tree => runtime._prepareTree(tree),
      _hostEvent: (kind, payload) => runtime._hostEvent(kind, payload),
      _frameControl: message => runtime._frameControl(message),
      _dispatchEvent: (canvasId, event) => runtime._dispatchEvent(canvasId, event),
      _setViewport: (width, height, ratio) => runtime._setViewport(width, height, ratio),
      engineId: runtime.engineId,
      devicePixelRatio: runtime.pixelRatio
    });
    Object.defineProperty(api, '_runtime', { value: runtime, enumerable: false });
    return api;
  }
}

export function installThreeRuntime(web) {
  installTextEncoding();
  const jsr = ROOT.jsr || (ROOT.jsr = {});
  const previous = jsr.three || {};
  if (activeRuntime && activeRuntime.web === !!web && previous._runtime === activeRuntime) return activeRuntime;
  activeRuntime = new ThreeCompatibilityRuntime(jsr, !!web, previous);
  jsr.three = activeRuntime.install(previous);
  if (typeof jsr.render === 'function' && !jsr.render.__jsrThreeRenderWrapper) {
    const originalRender = jsr.render;
    const wrapped = function(tree, ...args) {
      const current = jsr.three && jsr.three._runtime;
      if (current) current._prepareTree(tree);
      return originalRender.call(this, tree, ...args);
    };
    Object.defineProperties(wrapped, {
      __jsrThreeRenderWrapper: { value: true },
      __jsrThreeOriginalRender: { value: originalRender }
    });
    jsr.render = wrapped;
  }
  return activeRuntime;
}

export function getThreeRuntime(web = false) {
  return activeRuntime || installThreeRuntime(web);
}

export { utf8 };
