import { Cache, DataTexture, DataTextureLoader as UpstreamDataTextureLoader, Loader, Texture } from 'three';
import { assetFailure, unsupported } from './errors.js';
import { decodeBase64, decodeUtf8, getThreeRuntime } from './runtime.js';

function text(bytes) { return decodeUtf8(bytes); }

function buffer(bytes) { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); }

// A loader is a lifetime scope for its asset guards. In particular, a loader
// first used before the main canvas exists must not silently acquire that
// canvas on a later loadAsync call: doing so manufactures an epoch/generation
// mismatch while the second request is in flight. Explicit setCanvas() starts
// a new association; disposal guards remain active for every bound canvas.
function associatedCanvas(loader, runtime) {
  if (loader.canvas) return loader.canvas;
  if (!loader._assetAssociationReady) {
    loader._defaultAssetCanvas = runtime.getCanvas('main');
    loader._assetAssociationReady = true;
  }
  return loader._defaultAssetCanvas;
}

function setLoaderCanvas(loader, canvas) {
  loader.canvas = canvas;
  loader._defaultAssetCanvas = null;
  loader._assetAssociationReady = false;
  return loader;
}

export class JsrFileLoader extends Loader {
  constructor(manager) {
    super(manager);
    this.mimeType = '';
    this.responseType = '';
    this._aborted = false;
    this.canvas = null;
  }

  setCanvas(canvas) { return setLoaderCanvas(this, canvas); }
  setResponseType(value) { this.responseType = value; return this; }
  setMimeType(value) { this.mimeType = value; return this; }
  abort() { this._aborted = true; return this; }

  load(url, onLoad, onProgress, onError) {
    if (url === undefined) url = '';
    url = this.path + url;
    url = this.manager.resolveURL(url);
    const runtime = getThreeRuntime(false);
    const canvas = associatedCanvas(this, runtime);
    const guard = canvas ? { canvas, generation: canvas.generation, epoch: canvas._assetEpoch } : null;
    const cached = Cache.get(`file:${url}`);
    const finish = (data, callback) => {
      if (this._aborted) throw assetFailure(url, 'request aborted');
      if (canvas && (canvas.disposed || canvas.generation !== guard.generation)) throw assetFailure(url, 'surface was disposed during file load');
      if (callback) callback(data);
    };
    const convert = record => {
      const bytes = record.bytes || decodeBase64(record.data);
      switch (this.responseType) {
        case 'arraybuffer': return buffer(bytes);
        case 'json': return JSON.parse(text(bytes));
        case 'blob':
          if (typeof Blob !== 'undefined') return new Blob([bytes], { type: record.mime || this.mimeType });
          return bytes;
        case 'document': unsupported('DOMParser', 'native FileLoader cannot parse XML/HTML documents');
        default: return text(bytes);
      }
    };
    const report = error => {
      if (onError) onError(error);
      // Official examples often omit onError. Never swallow an exception
      // thrown by their onLoad callback: without this log a parsed model can
      // fail in modifier/setup code and leave an unexplained empty scene.
      else if (typeof console !== 'undefined' && console.error) console.error(error);
    };
    if (cached !== undefined) {
      this.manager.itemStart(url);
      Promise.resolve().then(() => finish(cached, onLoad)).catch(report).finally(() => this.manager.itemEnd(url));
      return;
    }
    this.manager.itemStart(url);
    runtime.loadAsset(url, guard).then(record => {
      const data = convert(record);
      Cache.add(`file:${url}`, data);
      finish(data, onLoad);
    }).catch(error => {
      report(error);
      this.manager.itemError(url);
    }).finally(() => this.manager.itemEnd(url));
  }
}

function encoding(record) {
  const bytes = record.bytes;
  const mime = String(record.mime || '').toLowerCase();
  if (mime.includes('rgba') || mime.includes('raw')) return { encoding: 0, encoded: false };
  if (bytes.length >= 8 && bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) return { encoding: 1, encoded: true };
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) return { encoding: 2, encoded: true };
  if (mime.includes('png')) return { encoding: 1, encoded: true };
  if (mime.includes('jpeg') || mime.includes('jpg')) return { encoding: 2, encoded: true };
  throw assetFailure(record.url || '<texture>', 'only PNG, JPEG, or registered raw RGBA8 bytes are supported');
}

// The example canvas facade intentionally has a small software-pixel profile.
// Extend its drawImage method only for ImageLoader-produced raw RGBA images;
// all other sources retain the facade's original behavior. This keeps the
// official panorama atlas slicing code byte-exact without pretending that an
// encoded JPEG itself is a Canvas2D pixel store.
function rawImageDrawImage(source, args) {
  const pixels = source._r1Pixels;
  let sx = 0, sy = 0, sw = pixels.width, sh = pixels.height;
  let dx, dy, dw, dh;
  if (args.length === 2) {
    dx = args[0]; dy = args[1]; dw = sw; dh = sh;
  } else if (args.length === 4) {
    dx = args[0]; dy = args[1]; dw = args[2]; dh = args[3];
  } else if (args.length === 8) {
    sx = args[0]; sy = args[1]; sw = args[2]; sh = args[3];
    dx = args[4]; dy = args[5]; dw = args[6]; dh = args[7];
  } else {
    unsupported('canvas2d.drawImage', 'expected 2, 4, or 8 numeric arguments after the image');
  }
  const values = [sx, sy, sw, sh, dx, dy, dw, dh];
  for (const value of values) if (!Number.isFinite(value)) throw new Error('three.invalid: canvas2d drawImage coordinates');
  if (sw <= 0 || sh <= 0 || dw <= 0 || dh <= 0 || sx < 0 || sy < 0 ||
      sx + sw > pixels.width || sy + sh > pixels.height) {
    unsupported('canvas2d.drawImage', 'raw image crop is outside its source or has a non-positive size');
  }
  const width = Math.floor(dw), height = Math.floor(dh);
  if (width <= 0 || height <= 0 || width * height > 16777216) {
    throw new Error('three.invalid: canvas2d drawImage output quota');
  }
  const data = new Uint8ClampedArray(width * height * 4);
  const input = pixels.data;
  if (sx === Math.floor(sx) && sy === Math.floor(sy) && sw === width && sh === height) {
    const rowBytes = width * 4;
    const sourceX = Math.floor(sx), sourceY = Math.floor(sy);
    for (let y = 0; y < height; y++) {
      const start = ((sourceY + y) * pixels.width + sourceX) * 4;
      data.set(input.subarray(start, start + rowBytes), y * rowBytes);
    }
  } else {
    for (let y = 0; y < height; y++) {
      const sourceY = Math.min(pixels.height - 1, Math.floor(sy + (y + 0.5) * sh / dh));
      for (let x = 0; x < width; x++) {
        const sourceX = Math.min(pixels.width - 1, Math.floor(sx + (x + 0.5) * sw / dw));
        const from = (sourceY * pixels.width + sourceX) * 4;
        const to = (y * width + x) * 4;
        data[to] = input[from]; data[to + 1] = input[from + 1];
        data[to + 2] = input[from + 2]; data[to + 3] = input[from + 3];
      }
    }
  }
  return { image: { data, width, height }, x: dx, y: dy };
}

function installRawImageDrawImage() {
  const document = globalThis.document;
  if (!document || document._r1RawImageDrawImage || typeof document.createElement !== 'function') return;
  const createElement = document.createElement;
  document.createElement = function(tagName, ...args) {
    const element = createElement.call(this, tagName, ...args);
    if (String(tagName).toLowerCase() !== 'canvas' || !element || element._r1RawImageCanvas) return element;
    const getContext = element.getContext;
    if (typeof getContext !== 'function') return element;
    element._r1RawImageCanvas = true;
    element.getContext = function(type) {
      const context = getContext.call(this, type);
      if (type !== '2d' || !context || context._r1RawImageContext) return context;
      const drawImage = context.drawImage;
      context._r1RawImageContext = true;
      context.drawImage = function(source, ...args) {
        if (!source || !source._r1Pixels) {
          if (typeof drawImage === 'function') return drawImage.apply(this, [source, ...args]);
          unsupported('canvas2d.drawImage');
        }
        const drawn = rawImageDrawImage(source, args);
        if (typeof this.putImageData !== 'function') unsupported('canvas2d.drawImage', 'raw RGBA target required');
        this.putImageData(drawn.image, drawn.x, drawn.y);
      };
      return context;
    };
    return element;
  };
  document._r1RawImageDrawImage = true;
}

export class JsrImageLoader extends Loader {
  constructor(manager) {
    super(manager);
    this.canvas = null;
  }

  setCanvas(canvas) { return setLoaderCanvas(this, canvas); }

  load(url, onLoad, onProgress, onError) {
    installRawImageDrawImage();
    const listeners = new Map();
    const image = {
      complete: false, width: 0, height: 0, data: null,
      addEventListener(type, callback) {
        const list = listeners.get(type) || [];
        if (!list.includes(callback)) list.push(callback);
        listeners.set(type, list);
      },
      removeEventListener(type, callback) {
        const list = listeners.get(type);
        if (list) listeners.set(type, list.filter(item => item !== callback));
      },
      dispatchEvent(event) {
        for (const callback of (listeners.get(event.type) || []).slice()) callback.call(image, event);
      }
    };
    url = this.path + (url === undefined ? '' : url);
    url = this.manager.resolveURL(url);
    const runtime = getThreeRuntime(false);
    const canvas = associatedCanvas(this, runtime);
    const generation = canvas ? canvas.generation : 0;
    const guard = canvas ? { canvas, generation, epoch: canvas._assetEpoch } : null;
    const requestId = ++JsrImageLoader._requestId;
    const canvasId = `image-decode-${requestId}`;
    this.manager.itemStart(url);
    runtime.loadAsset(url, guard).then(record => {
      if (canvas && (canvas.disposed || canvas.generation !== generation || canvas._assetEpoch !== guard.epoch)) {
        throw assetFailure(url, 'surface was disposed during image load');
      }
      if (!runtime.jsr || typeof runtime.jsr.hostCall !== 'function') unsupported('imageDecode', 'native host image decoding is unavailable');
      return runtime.jsr.hostCall('three.canvas2d', {
        action: 'decodeImage', engineId: runtime.engineId, surfaceId: canvas.surfaceId,
        canvasId, generation, requestId, width: 0, height: 0, commands: [], data: record.data
      });
    }).then(result => {
      if (!result || result.stale || result.engineId !== runtime.engineId ||
          result.surfaceId !== canvas.surfaceId || result.canvasId !== canvasId ||
          result.generation !== generation || result.requestId !== requestId ||
          !Number.isInteger(result.width) || !Number.isInteger(result.height) ||
          result.width <= 0 || result.height <= 0 ||
          (typeof result.data !== 'string' && !result.bytes)) {
        throw new Error('three.canvas2d: invalid decoded image response');
      }
      // The isolate warm-bytes lane ships large decoded RGBA as a typed
      // `bytes` array instead of a base64 `data` literal; accept both.
      const bytes = typeof result.data === 'string' ? decodeBase64(result.data) : result.bytes;
      if (bytes.length !== result.width * result.height * 4) throw new Error('three.canvas2d: decoded image RGBA length');
      image.width = result.width; image.height = result.height;
      image.naturalWidth = result.width; image.naturalHeight = result.height;
      image.data = bytes; image.encoding = 0; image.encoded = false;
      image._r1Pixels = { data: new Uint8ClampedArray(bytes), width: result.width, height: result.height };
      image.complete = true;
      if (onLoad) onLoad(image);
      image.dispatchEvent({ type: 'load' });
    }).catch(error => {
      image.complete = false;
      if (onError) onError(error);
      image.dispatchEvent({ type: 'error', error });
      this.manager.itemError(url);
    }).finally(() => this.manager.itemEnd(url));
    return image;
  }
}
JsrImageLoader._requestId = 0;

export class JsrTextureLoader extends Loader {
  constructor(manager) {
    super(manager);
    this.canvas = null;
  }

  setCanvas(canvas) { return setLoaderCanvas(this, canvas); }

  load(url, onLoad, onProgress, onError) {
    const texture = new Texture();
    url = this.path + (url === undefined ? '' : url);
    url = this.manager.resolveURL(url);
    const runtime = getThreeRuntime(false);
    const canvas = associatedCanvas(this, runtime);
    const generation = canvas ? canvas.generation : 0;
    const guard = canvas ? { canvas, generation, epoch: canvas._assetEpoch } : null;
    this.manager.itemStart(url);
    runtime.loadAsset(url, guard).then(async record => {
      if (canvas && (canvas.disposed || canvas.generation !== generation || canvas._assetEpoch !== guard.epoch)) throw assetFailure(url, 'surface was disposed during texture load');
      let format;
      try {
        format = encoding(record);
      } catch (error) {
        const bytes = record.bytes;
        const gif = bytes && bytes.length >= 6 && bytes[0] === 71 && bytes[1] === 73 &&
          bytes[2] === 70 && bytes[3] === 56 && (bytes[4] === 55 || bytes[4] === 57) && bytes[5] === 97;
        if (!gif || !canvas || !runtime.jsr || typeof runtime.jsr.hostCall !== 'function') throw error;
        // Flutter's image codec already decodes GIF. R1 intentionally retains
        // the first frame as a static native texture, just like the bounded
        // ImageLoader lane, rather than rejecting an otherwise valid local
        // asset (webgl_buffergeometry_instancing_interleaved uses crate.gif).
        const requestId = ++JsrImageLoader._requestId;
        const canvasId = `texture-decode-${requestId}`;
        const result = await runtime.jsr.hostCall('three.canvas2d', {
          action: 'decodeImage', engineId: runtime.engineId, surfaceId: canvas.surfaceId,
          canvasId, generation, requestId, width: 0, height: 0, commands: [], data: record.data
        });
        if (!result || result.stale || result.engineId !== runtime.engineId ||
            result.surfaceId !== canvas.surfaceId || result.canvasId !== canvasId ||
            result.generation !== generation || result.requestId !== requestId ||
            !Number.isInteger(result.width) || !Number.isInteger(result.height) ||
            result.width <= 0 || result.height <= 0 ||
            (typeof result.data !== 'string' && !result.bytes)) {
          throw new Error('three.canvas2d: invalid decoded image response');
        }
        // Accept the isolate warm-bytes `bytes` form as well as base64.
        const rgba = typeof result.data === 'string' ? decodeBase64(result.data) : result.bytes;
        if (rgba.length !== result.width * result.height * 4) throw new Error('three.canvas2d: decoded image RGBA length');
        texture.image = {
          data: rgba, width: result.width, height: result.height,
          mime: 'application/octet-stream', encoding: 0, encoded: false
        };
      }
      if (!texture.image) {
        texture.image = {
          data: record.bytes,
          width: record.width || 0,
          height: record.height || 0,
          mime: record.mime || '',
          encoding: format.encoding,
          encoded: format.encoded
        };
      }
      texture.needsUpdate = true;
      texture.userData.jsrAssetUrl = url;
      if (onLoad) onLoad(texture);
    }).catch(error => {
      if (onError) onError(error);
      else if (typeof console !== 'undefined' && console.error) console.error(error);
      this.manager.itemError(url);
    }).finally(() => this.manager.itemEnd(url));
    return texture;
  }
}

// Keep this named export useful to addons which only need the Loader shape.
export { UpstreamDataTextureLoader };

// DataTextureLoader subclasses (EXR/HDR/RGBE/TGA loaders) inherit load() from
// the upstream base class, which constructs the upstream fetch-based
// FileLoader — whose constructor eagerly builds an AbortController (absent in
// the offline QuickJS isolate) and whose load() needs fetch(). Re-issuing the
// same flow through the asset-backed JsrFileLoader keeps the registered-asset
// lane (jsr.three.registerAsset / runtime.loadAsset) for every derived
// parser; parse() and _applyTexData() stay upstream.
export class JsrDataTextureLoader extends UpstreamDataTextureLoader {
  load(url, onLoad, onProgress, onError) {
    const scope = this;
    const texture = new DataTexture();
    const loader = new JsrFileLoader(this.manager);
    loader.setResponseType('arraybuffer');
    loader.setRequestHeader(this.requestHeader);
    loader.setPath(this.path);
    loader.setWithCredentials(scope.withCredentials);
    loader.load(url, bufferBytes => {
      let texData;
      try {
        texData = scope.parse(bufferBytes);
      } catch (error) {
        if (onError !== undefined) onError(error);
        else if (typeof console !== 'undefined' && console.error) console.error(error);
        return;
      }
      scope._applyTexData(texture, texData);
      if (onLoad) onLoad(texture, texData);
    }, onProgress, onError);
    return texture;
  }
}
