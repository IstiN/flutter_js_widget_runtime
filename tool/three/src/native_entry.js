import { Mesh, PMREMGenerator as CorePMREMGenerator } from 'three';
import { installThreeRuntime } from './runtime.js';
import { installNativeCanvas2D } from './native_canvas2d.js';
import { installNativeRaycastBVH } from './native_raycast_bvh.js';
import { JsrWebGLRenderer } from './native_renderer.js';
import { JsrImageLoader } from './native_loaders.js';

// Addon passes construct Image directly for embedded lookup textures. Route
// those elements through the same host decoder as ImageLoader, including the
// DOM onload/addEventListener surface used by SMAAPass and texture upload.
class JsrImageElement {
  constructor() {
    this.complete = false;
    this.width = 0;
    this.height = 0;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
    this.onload = null;
    this.onerror = null;
    this._listeners = new Map();
    this._request = 0;
    this._src = '';
  }

  get src() { return this._src; }

  set src(value) {
    this._src = String(value);
    this.complete = false;
    const request = ++this._request;
    new JsrImageLoader().load(this._src, image => {
      if (request !== this._request) return;
      this.width = this.naturalWidth = image.width;
      this.height = this.naturalHeight = image.height;
      this.data = image.data;
      this.encoding = image.encoding;
      this.encoded = image.encoded;
      this._r1Pixels = image._r1Pixels;
      this.complete = true;
      if (typeof this.onload === 'function') this.onload({ type: 'load', target: this });
      this.dispatchEvent({ type: 'load', target: this });
    }, error => {
      if (request !== this._request) return;
      if (typeof this.onerror === 'function') this.onerror(error);
      this.dispatchEvent({ type: 'error', target: this, error });
    });
  }

  addEventListener(type, callback) {
    const list = this._listeners.get(type) || [];
    if (!list.includes(callback)) list.push(callback);
    this._listeners.set(type, list);
  }

  removeEventListener(type, callback) {
    const list = this._listeners.get(type);
    if (list) this._listeners.set(type, list.filter(item => item !== callback));
  }

  dispatchEvent(event) {
    for (const callback of (this._listeners.get(event.type) || []).slice()) {
      callback.call(this, event);
    }
  }
}

installNativeCanvas2D(installThreeRuntime(false));
if (typeof globalThis.Image === 'undefined') globalThis.Image = JsrImageElement;
installNativeRaycastBVH(Mesh);

const pmremWarnings = new WeakSet();

// R1 has one attached color surface and no offscreen render-target lane. Do
// not let an optional environment prefilter abort the whole example before its
// timer/scene are initialized. Keep the ordinary lit scene and omit only the
// environment contribution, with an explicit diagnostic.
export class JsrPMREMGenerator extends CorePMREMGenerator {
  fromScene(scene, sigma = 0, near = 0.1, far = 100, options = {}) {
    const renderer = this._renderer;
    if (renderer instanceof JsrWebGLRenderer) {
      if (!pmremWarnings.has(renderer)) {
        pmremWarnings.add(renderer);
        console.warn('three: R1 omits PMREM scene environments (offscreen CubeUV targets are unavailable); direct lighting remains active.');
      }
      return { texture: null, dispose() {} };
    }
    return super.fromScene(scene, sigma, near, far, options);
  }
}

export * from 'three';
export { JsrPMREMGenerator as PMREMGenerator };
export { getNativeRaycastDiagnostics } from './native_raycast_bvh.js';
export { JsrWebGLRenderer as WebGLRenderer } from './native_renderer.js';
export { JsrTextureLoader as TextureLoader, JsrFileLoader as FileLoader, JsrImageLoader as ImageLoader } from './native_loaders.js';
export { JsrDataTextureLoader as DataTextureLoader } from './native_loaders.js';
export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export { ThreeCompatibilityRuntime, JsrThreeCanvas } from './runtime.js';
export { ThreeCapabilityError, UnsupportedWebGPURenderer as WebGPURenderer } from './errors.js';
