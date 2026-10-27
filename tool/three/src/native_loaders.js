import { Cache, FileLoader as UpstreamFileLoader, Loader, Texture } from 'three';
import { assetFailure, unsupported } from './errors.js';
import { decodeBase64, decodeUtf8, getThreeRuntime } from './runtime.js';

function text(bytes) { return decodeUtf8(bytes); }

function buffer(bytes) { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); }

export class JsrFileLoader extends Loader {
  constructor(manager) {
    super(manager);
    this.mimeType = '';
    this.responseType = '';
    this._aborted = false;
    this.canvas = null;
  }

  setCanvas(canvas) { this.canvas = canvas; return this; }
  setResponseType(value) { this.responseType = value; return this; }
  setMimeType(value) { this.mimeType = value; return this; }
  abort() { this._aborted = true; return this; }

  load(url, onLoad, onProgress, onError) {
    if (url === undefined) url = '';
    url = this.path + url;
    url = this.manager.resolveURL(url);
    const runtime = getThreeRuntime(false);
    const canvas = this.canvas || runtime.getCanvas('main');
    const guard = canvas ? { canvas, generation: canvas.generation, epoch: canvas._assetEpoch } : null;
    const cached = Cache.get(`file:${url}`);
    const finish = (data, callback) => {
      if (this._aborted) throw assetFailure(url, 'request aborted');
      if (canvas && (canvas.disposed || canvas.generation !== guard.generation || canvas._assetEpoch !== guard.epoch)) throw assetFailure(url, 'surface was disposed during file load');
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
    if (cached !== undefined) {
      this.manager.itemStart(url);
      Promise.resolve().then(() => finish(cached, onLoad)).catch(error => { if (onError) onError(error); }).finally(() => this.manager.itemEnd(url));
      return;
    }
    this.manager.itemStart(url);
    runtime.loadAsset(url, guard).then(record => {
      const data = convert(record);
      Cache.add(`file:${url}`, data);
      finish(data, onLoad);
    }).catch(error => {
      if (onError) onError(error);
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

export class JsrTextureLoader extends Loader {
  constructor(manager) {
    super(manager);
    this.canvas = null;
  }

  setCanvas(canvas) { this.canvas = canvas; return this; }

  load(url, onLoad, onProgress, onError) {
    const texture = new Texture();
    url = this.path + (url === undefined ? '' : url);
    url = this.manager.resolveURL(url);
    const runtime = getThreeRuntime(false);
    const canvas = this.canvas || runtime.getCanvas('main');
    const generation = canvas ? canvas.generation : 0;
    const guard = canvas ? { canvas, generation, epoch: canvas._assetEpoch } : null;
    this.manager.itemStart(url);
    runtime.loadAsset(url, guard).then(record => {
      if (canvas && (canvas.disposed || canvas.generation !== generation || canvas._assetEpoch !== guard.epoch)) throw assetFailure(url, 'surface was disposed during texture load');
      const format = encoding(record);
      texture.image = {
        data: record.bytes,
        width: record.width || 0,
        height: record.height || 0,
        mime: record.mime || '',
        encoding: format.encoding,
        encoded: format.encoded
      };
      texture.needsUpdate = true;
      texture.userData.jsrAssetUrl = url;
      if (onLoad) onLoad(texture);
    }).catch(error => {
      if (onError) onError(error);
      this.manager.itemError(url);
    }).finally(() => this.manager.itemEnd(url));
    return texture;
  }
}

// Keep this named export useful to addons which only need the Loader shape.
export { UpstreamFileLoader };
