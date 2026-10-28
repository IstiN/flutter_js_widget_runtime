import { unsupported, requireFinite } from './errors.js';
import { decodeBase64 } from './runtime.js';

const MAX_DIMENSION = 4096;
const MAX_PIXELS = 16777216;
const MAX_COMMANDS = 1024;
const MAX_STOPS = 64;
const MAX_ENCODED_BYTES = (64 * 1024 * 1024 * 4 / 3) + 8;

function dimension(value, name) {
  if (!Number.isFinite(value) || value < 0 || value > MAX_DIMENSION) {
    throw new Error(`three.invalid: canvas2d ${name} must be within 0..${MAX_DIMENSION}`);
  }
  return Math.floor(value);
}

function finiteRect(values) {
  for (const value of values) {
    requireFinite(value, 'canvas2d rectangle');
    if (Math.abs(value) > 10000000) throw new Error('three.invalid: canvas2d rectangle is outside the bounded coordinate range');
  }
  return values;
}

function color(value) {
  if (typeof value !== 'string' || value.length < 1 || value.length > 128) {
    throw new Error('three.invalid: canvas2d color must be a nonempty bounded string');
  }
  return value;
}

export function isNativeCanvas2D(value) {
  return !!(value && value.isJsrNativeCanvas2D);
}

class JsrNativeCanvasGradient {
  constructor(x0, y0, r0, x1, y1, r1) {
    finiteRect([x0, y0, r0, x1, y1, r1]);
    if (r0 < 0 || r1 < 0) throw new Error('three.invalid: canvas2d gradient radii must be non-negative');
    if (x0 !== x1 || y0 !== y1 || r0 !== 0) {
      unsupported('canvas2d.radialGradient', 'Flutter R1 currently supports concentric radial gradients with r0=0');
    }
    this.centerX = x1;
    this.centerY = y1;
    this.radius = r1;
    this.stops = [];
  }

  addColorStop(offset, value) {
    requireFinite(offset, 'canvas2d gradient offset');
    if (offset < 0 || offset > 1) throw new Error('three.invalid: canvas2d gradient offset must be within 0..1');
    if (this.stops.length >= MAX_STOPS) throw new Error('three.invalid: canvas2d gradient stop quota exceeded');
    this.stops.push({ offset, color: color(value) });
  }

  snapshot() {
    if (this.stops.length < 2) unsupported('canvas2d.gradient', 'at least two color stops are required');
    const stops = this.stops.map(stop => ({ offset: stop.offset, color: stop.color }));
    for (let index = 1; index < stops.length; index++) {
      if (stops[index].offset < stops[index - 1].offset) {
        unsupported('canvas2d.gradient', 'color stops must be added in nondecreasing offset order');
      }
    }
    return {
      kind: 'radial', centerX: this.centerX, centerY: this.centerY,
      radius: this.radius, stops
    };
  }
}

class JsrNativeCanvas2DContext {
  constructor(canvas) {
    this.canvas = canvas;
    this._fillStyle = '#000000';
  }

  get fillStyle() { return this._fillStyle; }
  set fillStyle(value) {
    if (typeof value !== 'string' && !(value instanceof JsrNativeCanvasGradient)) {
      unsupported('canvas2d.fillStyle', 'only CSS colors and native radial gradients are supported');
    }
    this._fillStyle = typeof value === 'string' ? color(value) : value;
  }

  createRadialGradient(x0, y0, r0, x1, y1, r1) {
    return new JsrNativeCanvasGradient(x0, y0, r0, x1, y1, r1);
  }

  fillRect(x, y, width, height) {
    finiteRect([x, y, width, height]);
    const style = typeof this._fillStyle === 'string'
      ? { kind: 'color', color: this._fillStyle }
      : this._fillStyle.snapshot();
    this.canvas._record({ op: 'fillRect', x, y, width, height, style });
  }

  clearRect() { unsupported('canvas2d.clearRect', 'not included in the bounded native Canvas2D profile'); }
  drawImage() { unsupported('canvas2d.drawImage', 'not included in the bounded native Canvas2D profile'); }
  fillText() { unsupported('canvas2d.fillText', 'not included in the bounded native Canvas2D profile'); }
  getImageData() { unsupported('canvas2d.getImageData', 'readback belongs to the Flutter host'); }
  putImageData() { unsupported('canvas2d.putImageData', 'not included in the bounded native Canvas2D profile'); }
}

export class JsrNativeCanvas2D {
  constructor(runtime, surface, canvasId, options = {}) {
    this.runtime = runtime;
    this.surface = surface;
    this.canvasId = canvasId;
    this.engineId = runtime.engineId;
    this.surfaceId = surface.surfaceId;
    this.surfaceGeneration = surface.generation;
    this.isJsrNativeCanvas2D = true;
    this.isJsrThreeExampleLocal = true;
    this.style = {};
    this._width = dimension(options.width === undefined ? 300 : options.width, 'width');
    this._height = dimension(options.height === undefined ? 150 : options.height, 'height');
    this._context = new JsrNativeCanvas2DContext(this);
    this._commands = [];
    this._listeners = new Map();
    this._readyListeners = new Set();
    this._revision = 0;
    this._sentRevision = 0;
    this._requestId = 0;
    this._readyVersion = 0;
    this._ready = false;
    this._rgba = null;
    this._scheduled = false;
    this._inFlight = false;
    this._disposed = false;
    this.error = null;
  }

  get width() { return this._width; }
  set width(value) { this._resize(dimension(value, 'width'), this._height); }
  get height() { return this._height; }
  set height(value) { this._resize(this._width, dimension(value, 'height')); }
  get disposed() { return this._disposed; }
  get ready() { return this._ready; }

  _resize(width, height) {
    if (this._disposed) return;
    if (width === this._width && height === this._height) return;
    if (width * height > MAX_PIXELS) throw new Error('three.invalid: canvas2d pixel quota exceeded');
    this._width = width;
    this._height = height;
    this._commands = [];
    this._touch();
  }

  getContext(type) {
    if (this._disposed) throw new Error('three.surface: canvas2d is disposed');
    if (type !== '2d') unsupported('canvasContext', type);
    return this._context;
  }

  addEventListener(type, callback) {
    if (!callback) return;
    const list = this._listeners.get(type) || [];
    if (!list.includes(callback)) list.push(callback);
    this._listeners.set(type, list);
  }

  removeEventListener(type, callback) {
    const list = this._listeners.get(type);
    if (list) this._listeners.set(type, list.filter(item => item !== callback));
  }

  dispatchEvent(event) {
    if (!event || !event.type) throw new Error('three.invalid: canvas2d event.type is required');
    event.target = this;
    event.currentTarget = this;
    for (const callback of (this._listeners.get(event.type) || []).slice()) {
      if (typeof callback === 'function') callback.call(this, event);
      else if (callback && callback.handleEvent) callback.handleEvent(event);
    }
    return true;
  }

  _addReadyListener(callback) {
    if (this._disposed) return () => {};
    this._readyListeners.add(callback);
    return () => this._readyListeners.delete(callback);
  }

  _record(command) {
    if (this._disposed) throw new Error('three.surface: canvas2d is disposed');
    if (this._commands.length >= MAX_COMMANDS) throw new Error('three.invalid: canvas2d command quota exceeded');
    this._commands.push(command);
    this._touch();
  }

  _touch() {
    this._revision++;
    this._ready = false;
    this._rgba = null;
    this.error = null;
    this._schedule();
  }

  _schedule() {
    if (this._scheduled || this._disposed) return;
    this._scheduled = true;
    Promise.resolve().then(() => {
      this._scheduled = false;
      this._flush();
    });
  }

  _args(requestId, commands) {
    return {
      engineId: this.engineId,
      surfaceId: this.surfaceId,
      canvasId: this.canvasId,
      generation: this.surfaceGeneration,
      requestId,
      width: this._width,
      height: this._height,
      commands
    };
  }

  _flush() {
    if (this._disposed || this._inFlight || this._sentRevision === this._revision || !this._width || !this._height) return;
    const revision = this._revision;
    const requestId = ++this._requestId;
    const commands = this._commands.slice();
    this._sentRevision = revision;
    this._inFlight = true;
    this.runtime.jsr.hostCall('three.canvas2d', this._args(requestId, commands)).then(result => {
      if (this._disposed || requestId !== this._requestId || revision !== this._revision || !result || result.stale) return;
      if (result.engineId !== this.engineId || result.surfaceId !== this.surfaceId ||
          result.canvasId !== this.canvasId || result.generation !== this.surfaceGeneration ||
          result.requestId !== requestId || result.width !== this._width || result.height !== this._height ||
          typeof result.data !== 'string' || result.data.length > MAX_ENCODED_BYTES) {
        throw new Error('three.canvas2d: host response identity or dimensions do not match the request');
      }
      const bytes = decodeBase64(result.data);
      if (bytes.byteLength !== this._width * this._height * 4) {
        throw new Error('three.canvas2d: host returned an invalid raw RGBA byte length');
      }
      this._rgba = bytes;
      this._readyVersion++;
      this._ready = true;
      this.error = null;
      for (const listener of Array.from(this._readyListeners)) listener(this);
      this.dispatchEvent({ type: 'ready' });
    }).catch(error => {
      if (this._disposed || requestId !== this._requestId || revision !== this._revision) return;
      this.error = error instanceof Error ? error : new Error(String(error));
      this.dispatchEvent({ type: 'error', error: this.error });
    }).then(() => {
      this._inFlight = false;
      if (this._sentRevision !== this._revision) this._schedule();
    });
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this._requestId++;
    this._commands = [];
    this._rgba = null;
    this._ready = false;
    this._readyListeners.clear();
    this._listeners.clear();
    if (this.surface._nativeCanvas2d) this.surface._nativeCanvas2d.delete(this);
    this.runtime.jsr.hostCall('three.canvas2d', {
      action: 'dispose', engineId: this.engineId, surfaceId: this.surfaceId,
      canvasId: this.canvasId, generation: this.surfaceGeneration,
      requestId: this._requestId, width: 0, height: 0, commands: []
    }).catch(() => {});
  }

  toDataURL() { unsupported('canvas2d.capture', 'capture belongs to the JSR host'); }
  toBlob() { unsupported('canvas2d.capture', 'capture belongs to the JSR host'); }
}

export function installNativeCanvas2D(runtime) {
  if (!runtime || runtime.web) return;
  let sequence = 0;
  const create = (surfaceId = 'main', options = {}) => {
    const surface = typeof surfaceId === 'object' ? surfaceId : runtime.getCanvas(surfaceId);
    if (!surface || surface.disposed || !surface.isJsrThreeCanvas) {
      throw new Error('three.surface: canvas2d requires a live JSR THREE surface');
    }
    const canvas = new JsrNativeCanvas2D(runtime, surface, `2d-${++sequence}`, options);
    const owned = surface._nativeCanvas2d || (surface._nativeCanvas2d = new Set());
    owned.add(canvas);
    if (!surface._nativeCanvas2dDisposeWrapped) {
      surface._nativeCanvas2dDisposeWrapped = true;
      const dispose = surface.dispose;
      surface.dispose = function() {
        for (const child of Array.from(owned)) child.dispose();
        return dispose.call(this);
      };
    }
    return canvas;
  };
  runtime.createCanvas2D = create;
  runtime.jsr.three.createCanvas2D = create;
}
