import { assetFailure, unsupported } from './errors.js';
import { installNativeAudio } from './native_audio.js';

const ROOT = typeof globalThis !== 'undefined' ? globalThis : {};

// Hosts deliver key events with Flutter-flavored labels (`jsr.onKey` payloads:
// `key: 'arrowUp'`, `code: physicalKey.debugName` → 'Arrow Up'/'Shift Left').
// Official three.js modules switch on DOM KeyboardEvent.code values with no
// whitespace ('ArrowUp', 'ShiftLeft', 'KeyW'). Without this normalization a
// correct-but-unmatched code silently drops every keypress in examples that
// drive AnimationActions or OrbitControls from event.code — the animation
// never starts and nothing warns. Normalization is bounded: whitespace is
// removed and a fixed label map covers the non-alphanumeric named keys.
const DOM_CODE_LABELS = Object.freeze({
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  space: 'Space',
  enter: 'Enter',
  escape: 'Escape',
  tab: 'Tab',
  backspace: 'Backspace',
  delete: 'Delete',
  shift: 'ShiftLeft',
  control: 'ControlLeft',
  alt: 'AltLeft',
  meta: 'MetaLeft',
  capslock: 'CapsLock',
  contextmenu: 'ContextMenu',
  home: 'Home',
  end: 'End',
  insert: 'Insert',
  pageup: 'PageUp',
  pagedown: 'PageDown',
  scrolllock: 'ScrollLock',
  numlock: 'NumLock',
  pause: 'Pause',
  printscreen: 'PrintScreen'
});

function domKeyCode(value) {
  const raw = String(value === undefined || value === null ? '' : value);
  if (!raw) return '';
  const compact = raw.replace(/[\s_-]+/g, '');
  const mapped = DOM_CODE_LABELS[compact.toLowerCase()];
  if (mapped !== undefined) return mapped;
  if (compact.length === 1) {
    const code = compact.charCodeAt(0);
    if (code >= 65 && code <= 90) return `Key${compact}`;
    if (code >= 97 && code <= 122) return `Key${compact.toUpperCase()}`;
    if (code >= 48 && code <= 57) return `Digit${compact}`;
  }
  return compact;
}

// three r186 FileLoader constructs an AbortController eagerly. QuickJS has
// none; a minimal spec-shaped shim keeps upstream loaders working (abort
// still notifies listeners and rejects through the loader's own handling).
function installAbortController() {
  if (typeof ROOT.AbortController === 'function') return;
  class AbortSignal {
    constructor() {
      this.aborted = false;
      this.reason = undefined;
      this.onabort = null;
      this._listeners = [];
    }
    addEventListener(type, listener) {
      if (type === 'abort' && listener) this._listeners.push(listener);
    }
    removeEventListener(type, listener) {
      if (type !== 'abort') return;
      const index = this._listeners.indexOf(listener);
      if (index >= 0) this._listeners.splice(index, 1);
    }
    throwIfAborted() {
      if (this.aborted) throw this.reason;
    }
    _fire(reason) {
      this.aborted = true;
      this.reason = reason;
      const event = { type: 'abort', target: this };
      if (typeof this.onabort === 'function') this.onabort(event);
      for (const listener of this._listeners.splice(0)) {
        if (typeof listener === 'function') listener(event);
        else if (listener && listener.handleEvent) listener.handleEvent(event);
      }
    }
  }
  class AbortController {
    constructor() { this.signal = new AbortSignal(); }
    abort(reason) {
      if (!this.signal.aborted) this.signal._fire(reason);
    }
  }
  ROOT.AbortController = AbortController;
  ROOT.AbortSignal = AbortSignal;
}
function installOfflineFetch() {
  if (typeof ROOT.Headers === 'undefined') {
    ROOT.Headers = class Headers {
      constructor(init = {}) {
        this._values = new Map();
        if (init && typeof init.forEach === 'function' && !Array.isArray(init)) {
          init.forEach((value, key) => this.set(key, value));
        } else if (Array.isArray(init)) {
          for (const entry of init) if (entry && entry.length >= 2) this.set(entry[0], entry[1]);
        } else if (init && typeof init === 'object') {
          for (const key of Object.keys(init)) this.set(key, init[key]);
        }
      }
      append(name, value) { this.set(name, this.has(name) ? `${this.get(name)}, ${value}` : value); }
      delete(name) { this._values.delete(String(name).toLowerCase()); }
      get(name) { const value = this._values.get(String(name).toLowerCase()); return value === undefined ? null : value; }
      has(name) { return this._values.has(String(name).toLowerCase()); }
      set(name, value) { this._values.set(String(name).toLowerCase(), String(value)); }
      forEach(callback, thisArg) { this._values.forEach((value, key) => callback.call(thisArg, value, key, this)); }
      entries() { return this._values.entries(); }
    };
  }
  if (typeof ROOT.Request === 'undefined') {
    ROOT.Request = class Request {
      constructor(input, options = {}) {
        this.url = String(input && input.url !== undefined ? input.url : input);
        this.headers = new ROOT.Headers(input && input.headers ? input.headers : options.headers || {});
        this.credentials = options.credentials || 'same-origin';
        this.signal = options.signal || (input && input.signal);
      }
    };
  } else if (!ROOT.Request.__jsrPinnedAware) {
    // Web workers are spawned from blob: URLs, so the native Request
    // constructor rejects a relative pinned asset url ('models/x.glb') —
    // upstream FileLoader builds `new Request(url)` BEFORE fetch is ever
    // called. Delegate absolute urls to the native Request (real URL
    // semantics for the network path) and keep the pinned name unparsed
    // for relative urls; the fetch shim below routes those through the
    // registered-asset + host lanes.
    const NativeRequest = ROOT.Request;
    ROOT.Request = class Request {
      constructor(input, options = {}) {
        const url = String(input && input.url !== undefined ? input.url : input);
        if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) return new NativeRequest(input, options);
        this.url = url;
        this.headers = new ROOT.Headers(input && input.headers ? input.headers : options.headers || {});
        this.credentials = options.credentials || 'same-origin';
        this.signal = options.signal || (input && input.signal);
        this.method = options.method || 'GET';
      }
    };
    ROOT.Request.__jsrPinnedAware = true;
  }
  const bytesOf = body => {
    if (body === undefined || body === null) return new Uint8Array();
    if (body instanceof Uint8Array) return new Uint8Array(body);
    if (body instanceof ArrayBuffer) return new Uint8Array(body.slice(0));
    if (ArrayBuffer.isView(body)) return new Uint8Array(body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength));
    return utf8(String(body));
  };
  if (typeof ROOT.Response === 'undefined') {
    ROOT.Response = class Response {
      constructor(body = null, options = {}) {
        this._bytes = bytesOf(body);
        this.status = options.status === undefined ? 200 : options.status;
        this.statusText = options.statusText || '';
        this.headers = new ROOT.Headers(options.headers || {});
        this.url = options.url || '';
        // No ReadableStream in the bounded QuickJS runtime. Upstream
        // FileLoader deliberately takes its non-streaming response branch.
        this.body = undefined;
      }
      async arrayBuffer() { return this._bytes.buffer.slice(this._bytes.byteOffset, this._bytes.byteOffset + this._bytes.byteLength); }
      async text() { return decodeUtf8(this._bytes); }
      async json() { return JSON.parse(await this.text()); }
      async blob() { return typeof Blob === 'undefined' ? this._bytes : new Blob([this._bytes], { type: this.headers.get('Content-Type') || '' }); }
    };
  }
  if (!ROOT.fetch || !ROOT.fetch.__jsrPinnedAware) {
    const nativeFetch = ROOT.fetch;
    const wrapped = (input, init) => {
      const request = input && input.url !== undefined ? input : new ROOT.Request(input, init);
      const url = String(request.url || '');
      const relative = url !== '' && !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url);
      if (relative) {
        const runtime = activeRuntime;
        if (!runtime) return Promise.reject(new Error('three.assetFailure: THREE runtime is not initialized'));
        if (request.signal && request.signal.aborted) return Promise.reject(request.signal.reason || new Error('request aborted'));
        return runtime.loadAsset(url).then(record => {
          if (request.signal && request.signal.aborted) throw request.signal.reason || new Error('request aborted');
          return new ROOT.Response(record.bytes, {
            status: 200,
            url,
            headers: {
              'Content-Type': record.mime || 'application/octet-stream',
              'Content-Length': String(record.bytes.length)
            }
          });
        });
      }
      // R1 v8: jsr-blob:<n> URLs are runtime-registered object URLs (the
      // Blob/createObjectURL facade in native_entry.js feeds addon loaders
      // such as ImageBitmapLoader, whose GLB embedded-image path fetches the
      // blob URL). They have a scheme so the relative branch above misses
      // them; resolve them through the same asset store instead of falling
      // through to nativeFetch, which does not exist in the QuickJS sandbox
      // and rejected silently — losing every GLB embedded texture
      // (webgl_animation_multiple Soldier base color).
      if (/^jsr-blob:/.test(url)) {
        const runtime = activeRuntime;
        if (!runtime) return Promise.reject(new Error('three.assetFailure: THREE runtime is not initialized'));
        return runtime.loadAsset(url).then(record => new ROOT.Response(record.bytes, {
          status: 200,
          url,
          headers: {
            'Content-Type': record.mime || 'application/octet-stream',
            'Content-Length': String(record.bytes.length)
          }
        }));
      }
      if (nativeFetch) return nativeFetch(input, init);
      return Promise.reject(new Error('three.assetFailure: network fetch is unavailable for ' + url));
    };
    wrapped.__jsrPinnedAware = true;
    ROOT.fetch = wrapped;
  }
}
const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
let activeRuntime = null;
let _b64First = null;
let _b64Pair = null;

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

// Chunked UTF-8 decode: byte-exact with the historical per-codepoint loop
// (invalid sequences -> U+FFFD, truncated tails -> U+FFFD, no BOM stripping)
// but accumulates into bounded string chunks joined once. QuickJS strings are
// flat, so `result += piece` copied the whole accumulated string per append:
// decoding the 6.8MB prepared elevationGrid1 VRML JSON inside the
// loadAsset/FileLoader promise job was ~6.6GB of quadratic memcpy on the
// QuickJS thread (>6 CPU-minutes, in-app white screen). Chunks are flushed at
// DECODE_CHUNK chars, so every append copies at most ~2x the chunk size and
// the total is linear; the final join builds the flat string once.
export const DECODE_CHUNK = 8192;

export function decodeUtf8(bytes) {
  const len = bytes.length;
  if (bytes instanceof Uint8Array || bytes instanceof Int8Array || bytes instanceof Uint8ClampedArray) {
    // Fast path: pure-ASCII payloads (the pinned JSON/VRML/OBJ/GLB-chunk
    // assets) decode as chunked String.fromCharCode over array + join —
    // linear on QuickJS flat strings.
    let ascii = true;
    for (let i = 0; i < len; i++) {
      if (bytes[i] >= 0x80) { ascii = false; break; }
    }
    if (ascii) {
      const parts = new Array(1 + (len / DECODE_CHUNK | 0));
      let n = 0;
      for (let i = 0; i < len; i += DECODE_CHUNK) {
        parts[n++] = String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + DECODE_CHUNK, len)));
      }
      return parts.join('');
    }
  }
  const parts = [];
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
    if (result.length >= DECODE_CHUNK) {
      parts.push(result);
      result = '';
    }
  }
  return parts.length === 0 ? result : parts.join('') + result;
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
  // Reverse lookup over the shared alphabet, built once per runtime. The
  // original loop paid a BASE64.indexOf linear scan, a single-char string
  // allocation and an output.push per byte, and every large host decode
  // response (e.g. a 45 MB panorama atlas decodeImage payload) stalled the
  // QuickJS worker for seconds on top of three full-string regex passes.
  // The paired-table fast path fuses whitespace skipping, url-safe remaps
  // and '=' padding into one charCodeAt scan; the first irregular character
  // bails to the strict scalar pass, so exotic inputs keep the exact
  // historical semantics (cleaned length % 4, charset validation, decode
  // stops at the first '=').
  if (_b64First === null) {
    _b64First = new Int8Array(128).fill(-1);
    _b64Pair = new Int32Array(16384).fill(-1);
    for (let hi = 0; hi < 64 && hi < BASE64.length; hi++) {
      _b64First[BASE64.charCodeAt(hi)] = hi;
      for (let lo = 0; lo < 64 && lo < BASE64.length; lo++) {
        _b64Pair[(BASE64.charCodeAt(hi) << 8) | BASE64.charCodeAt(lo)] = (hi << 6) | lo;
      }
    }
  }
  const first = _b64First;
  const pair = _b64Pair;
  const len = value.length;
  const out = new Uint8Array(Math.max(0, Math.floor(len * 3 / 4)));
  let written = 0;
  let buffer = 0;
  let bits = 0;
  let i = 0;
  let bailed = false;
  while (i < len) {
    const c0 = value.charCodeAt(i);
    if (c0 === 61) break; // '='
    const hi = c0 < 128 ? first[c0] : -1;
    if (hi < 0 || i + 1 >= len) { bailed = true; break; }
    const c1 = value.charCodeAt(i + 1);
    const lo = c1 < 128 ? first[c1] : -1;
    if (lo < 0) { bailed = true; break; }
    buffer = (buffer << 12) | (hi << 6) | lo;
    bits += 12;
    while (bits >= 8) {
      bits -= 8;
      out[written++] = (buffer >> bits) & 255;
    }
    i += 2;
  }
  if (!bailed) {
    if (len % 4 === 1) throw assetFailure('<bytes>', 'invalid base64');
    return written === out.length ? out : out.subarray(0, written);
  }
  return decodeBase64Slow(value, first);
}

function decodeBase64Slow(value, first) {
  const clean = value.replace(/\s/g, '');
  if (clean.length % 4 === 1 || /[^A-Za-z0-9+/=_-]/.test(clean)) throw assetFailure('<bytes>', 'invalid base64');
  const normalized = clean.replace(/-/g, '+').replace(/_/g, '/');
  const out = new Uint8Array(Math.max(0, Math.floor(normalized.length * 3 / 4)));
  let written = 0;
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < normalized.length; i++) {
    const code = normalized.charCodeAt(i);
    if (code === 61) break; // '='
    const index = code < 128 ? first[code] : -1;
    if (index < 0) throw assetFailure('<bytes>', 'invalid base64');
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[written++] = (buffer >> bits) & 255;
    }
  }
  return written === out.length ? out : out.subarray(0, written);
}

export function encodeBase64(value) {
  const bytes = decodeBase64(value);
  // Chunk-array join (decodeUtf8 precedent): QuickJS flat strings make
  // `result += quad` quadratic over multi-megabyte payloads.
  const parts = [];
  let piece = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    piece += BASE64[(n >> 18) & 63] + BASE64[(n >> 12) & 63] +
      (i + 1 < bytes.length ? BASE64[(n >> 6) & 63] : '=') +
      (i + 2 < bytes.length ? BASE64[n & 63] : '=');
    if (piece.length >= 8192) {
      parts.push(piece);
      piece = '';
    }
  }
  if (piece.length > 0) parts.push(piece);
  return parts.length === 0 ? '' : parts.join('');
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

class JsrThreeDomElement {
  // example_adapter supplies offsetWidth/offsetHeight on each local element,
  // while FlyControls also subtracts offsetLeft/offsetTop on every pointer
  // move. Without these prototype getters the full-screen container yielded
  // undefined offsets, making its rotation vector (and then the camera
  // matrix) non-finite on the first mouse move. Keep the same bounded CSS
  // number semantics as the adapter's rectangle lane.
  get offsetLeft() {
    const value = Number.parseFloat(this.style && this.style.left);
    return Number.isFinite(value) ? value : 0;
  }

  get offsetTop() {
    const value = Number.parseFloat(this.style && this.style.top);
    return Number.isFinite(value) ? value : 0;
  }
}

class JsrThreeDocument {
  constructor(runtime) {
    this.runtime = runtime;
    this.visibilityState = 'visible';
    this.hidden = false;
    this.activeElement = null;
    this.documentElement = { style: {} };
    // Bounded DOM element marker. Upstream DOM-touching code type-checks shim
    // elements against `document.defaultView` constructors — CSS2DObject's
    // 'removed' listener runs
    // `element instanceof element.ownerDocument.defaultView.Element`, and
    // without the constructor that instanceof throws right inside
    // Object3D.remove(), aborting any scene teardown that detaches labelled
    // nodes (webgl_loader_pdb molecule switching). One marker class serves
    // Element/HTMLElement/Node: the runtime never implements DOM class
    // hierarchies, it only needs the instanceof contract to hold.
    this.defaultView = {
      Math: ROOT.Math,
      Element: JsrThreeDomElement,
      HTMLElement: JsrThreeDomElement,
      Node: JsrThreeDomElement,
      get devicePixelRatio() { return runtime.pixelRatio; },
      get innerWidth() { return runtime.width; },
      get innerHeight() { return runtime.height; },
      // Inert browser location: upstream modules read `location.search`
      // (empty means official defaults) and some assign href/reload on
      // navigation; without this shim those accesses throw on the runtime
      // document's bare default view.
      location: {
        search: '',
        hash: '',
        href: 'jsr://three/',
        origin: 'null',
        pathname: '/',
        assign() {},
        replace() {},
        reload() {}
      },
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
  // CSS-layout DOM properties that controls read per pointer event. Upstream
  // FlyControls divides by offsetWidth/offsetHeight (FlyControls.onPointerMove
  // -> _getContainerDimensions); with them undefined every yaw term became
  // NaN, the camera matrix went non-finite and EVERY later render threw
  // 'camera matrixWorld must be finite' — the whole RAF loop died on the
  // first mouse move (webgl_lensflares / webgl_lod storm collapse). A
  // full-screen R1 canvas sits at (0,0) with its CSS box as the layout box.
  get offsetWidth() { return this._cssWidth; }
  get offsetHeight() { return this._cssHeight; }
  get offsetLeft() { return 0; }
  get offsetTop() { return 0; }
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

  // r186 controls (OrbitControls.onPointerDown/onPointerUp/onContextMenu)
  // resolve their listener scope through
  // `const document = this.domElement.getRootNode()` (offscreen-canvas
  // compatibility). Without it the OrbitControls constructor throws and
  // every widget whose animation tick starts with controls.update() dies on
  // the first frame (webgl_materials_normalmap composer never rendered).
  // The R1 canvas is its own root; the controls addEventListener on the
  // returned node, which eventTarget(this) already provides.
  getRootNode() { return this; }

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
    this.assetRedirects = new Map();
    this.presentHook = null;
    this.heldKeys = new Map();
    this.activeCanvas = null;
    this.hostAssetLoader = typeof previous.loadAssetBytes === 'function' ? previous.loadAssetBytes : null;
    this.document = new JsrThreeDocument(this);
    // getMaxAnisotropy mirrors upstream WebGLCapabilities: the maximum the
    // sampler hardware exposes. The native flutter_gpu sampler has no
    // anisotropic filtering, so R1 reports 1 (anisotropy values above the
    // maximum clamp to it exactly like upstream WebGLRenderer).
    this.capabilities = Object.freeze({
      backend: web ? 'webgl2' : 'flutterGpu',
      rawWebGL: !!web,
      webgl2: !!web,
      r1: !web,
      shaderMaterial: !!web,
      webgpu: false,
      dom: false,
      getMaxAnisotropy: () => 1
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
      code: domKeyCode(payload.code) || domKeyCode(payload.key),
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
        const ratio = event.pixelRatio || event.dpr;
        if (canvas.renderer) {
          if (ratio !== undefined) canvas.renderer.setPixelRatio(ratio);
          canvas.renderer.setSize(event.width, event.height, false);
        } else {
          if (ratio !== undefined) canvas.setPixelRatio(ratio);
          canvas.setSize(event.width, event.height, false);
        }
        // Change-driven widgets (OrbitControls 'change', no animation loop)
        // submit their only frames before the host surface attaches, where
        // the bounded lane drops them. Re-present the last canvas scene so
        // an attach-time resize paints instead of leaving a black surface.
        if (canvas.renderer && typeof canvas.renderer._scheduleCanvasRefresh === 'function') {
          canvas.renderer._scheduleCanvasRefresh();
        }
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

  registerAssetRedirect(alias, target) {
    alias = String(alias);
    target = String(target);
    if (!alias || !target) throw assetFailure(alias, 'asset redirect needs an alias and a target url');
    if (alias === target) throw assetFailure(alias, 'asset redirect cannot alias itself');
    this.assetRedirects.set(alias, target);
  }

  _redirectTarget(url) {
    let current = url;
    // Bounded chain walk: an alias must resolve to a concrete asset url, and
    // a cycle is a prepare bug that would otherwise spin forever.
    for (let seen = 0; seen < 8 && this.assetRedirects.has(current); seen++) {
      current = this.assetRedirects.get(current);
    }
    return current;
  }

  _assetRecord(url, asset) {
    if (asset === undefined || asset === null) throw assetFailure(url, 'missing asset bytes');
    const source = typeof asset === 'object' && !(asset instanceof Uint8Array) && !(asset instanceof ArrayBuffer) && !ArrayBuffer.isView(asset) ? asset : { data: asset };
    const raw = source.data !== undefined ? source.data : source.bytes;
    const bytes = decodeBase64(raw);
    if (bytes.length > 64 * 1024 * 1024) throw assetFailure(url, 'asset exceeds 64 MiB');
    let dataCache = typeof raw === 'string' ? raw : null;
    return {
      url,
      // Base64 is a compatibility shim for legacy `.data` readers: bytes
      // sources encode lazily so warm assets (raw typed data) never pay the
      // encode unless a consumer actually reads `.data`.
      get data() {
        if (dataCache === null) dataCache = encodeBase64(bytes);
        return dataCache;
      },
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
    // Cache-busting suffixes (`tex.jpg?<timestamp>` in webgl_loader_imagebitmap)
    // name the same bundled asset; resolve them against the canonical URL.
    // Aliases (`registerAssetRedirect`, e.g. the remote URL an official module
    // fetches pointing at the pinned offline file) resolve through the same
    // table, so both the registered-asset and host lanes see one canonical name.
    const stripped = this._redirectTarget(url.replace(/[?#].*$/, ''));
    const bare = this._redirectTarget(stripped.replace(/^\.\//, ''));
    return this.assets.get(url) || this.assets.get(url.replace(/^\.\//, '')) ||
      this.assets.get(bare) || this.assets.get(`./${bare}`) ||
      this.assets.get(stripped) || null;
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
    // `./textures/a.png` and `textures/a.png` name the same bundled asset.
    // Local lookup already accepted both forms; canonicalize the host request
    // too instead of making offline loading depend on the official example's
    // spelling. Keep the requested URL as the cache key on registration.
    // Redirects resolve BEFORE the host lane so alias requests (e.g. a remote
    // progressive-LOD url pinned to a local GLB) never leave the runtime as a
    // remote host fetch; the host lane only ever sees the canonical asset url.
    const redirected = this._redirectTarget(url);
    const hostUrl = redirected.replace(/^\.\//, '').replace(/[?#].*$/, '');
    // Warm lane: the engine pre-shipped these bytes as raw typed data (one
    // isolate transfer at boot) and `__jsrAssetFill` memcpy's them into this
    // JS-owned array. A big external texture therefore costs one in-worker
    // copy instead of a host round trip with a multi-megabyte base64 string
    // in both directions. The fill callback cannot throw across the FFI
    // boundary — a miss/short fill leaves the array zeroed, which every
    // pinned format (PNG/JPEG/GLB magic) rejects, and `__JSR_WARM_LAST__`
    // reports the outcome explicitly.
    const warm = ROOT.__JSR_WARM_ASSETS__ && (ROOT.__JSR_WARM_ASSETS__[url] || ROOT.__JSR_WARM_ASSETS__[hostUrl]);
    if (warm && typeof ROOT.__jsrAssetFill === 'function') {
      const bytes = new Uint8Array(warm.size);
      ROOT.__jsrAssetFill(hostUrl, bytes);
      if (ROOT.__JSR_WARM_LAST__ === hostUrl && bytes[0] !== 0) {
        return this.registerAsset(url, { bytes, mime: warm.mime, width: warm.width, height: warm.height });
      }
    }
    try {
      if (this.hostAssetLoader) result = await this.hostAssetLoader(hostUrl);
      else if (this.jsr && typeof this.jsr.hostCall === 'function') result = await this.jsr.hostCall('three.asset', { url: hostUrl });
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
      registerAssetRedirect: (alias, target) => runtime.registerAssetRedirect(alias, target),
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
      _resumeAudio: () => runtime._nativeAudioContext && runtime._nativeAudioContext.hasAudioGraph
        ? runtime._nativeAudioContext.resume()
        : Promise.resolve(),
      engineId: runtime.engineId,
      devicePixelRatio: runtime.pixelRatio
    });
    Object.defineProperty(api, '_runtime', { value: runtime, enumerable: false });
    return api;
  }
}

export function installThreeRuntime(web) {
  installTextEncoding();
  installAbortController();
  installOfflineFetch();
  const jsr = ROOT.jsr || (ROOT.jsr = {});
  const previous = jsr.three || {};
  if (activeRuntime && activeRuntime.web === !!web && previous._runtime === activeRuntime) return activeRuntime;
  activeRuntime = new ThreeCompatibilityRuntime(jsr, !!web, previous);
  if (!web) installNativeAudio(activeRuntime);
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
