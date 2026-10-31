import { Mesh, PMREMGenerator as CorePMREMGenerator } from 'three';
import { installThreeRuntime } from './runtime.js';
import { installNativeCanvas2D } from './native_canvas2d.js';
import { installNativeRaycastBVH } from './native_raycast_bvh.js';
import { JsrWebGLRenderer } from './native_renderer.js';
import { JsrImageLoader, JsrTextureLoader } from './native_loaders.js';

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

// LUTImageLoader sends TextureLoader's decoded image directly through the
// example software canvas. Preserve the typed texture payload and additionally
// expose the two established local-pixel associations used by that canvas and
// the raw-image drawImage lane. Encoded sources remain native-upload only.
class JsrCanvasTextureLoader extends JsrTextureLoader {
  load(url, onLoad, onProgress, onError) {
    return super.load(url, texture => {
      const image = texture.image;
      if (image && image.encoded === false && image.data &&
          Number.isInteger(image.width) && Number.isInteger(image.height) &&
          image.width > 0 && image.height > 0 &&
          image.data.length === image.width * image.height * 4) {
        const pixels = image._examplePixels || {
          data: image.data instanceof Uint8ClampedArray ? image.data : new Uint8ClampedArray(image.data),
          width: image.width,
          height: image.height
        };
        image._examplePixels = pixels;
        image._r1Pixels = pixels;
      }
      if (onLoad) onLoad(texture);
    }, onProgress, onError);
  }
}

installNativeCanvas2D(installThreeRuntime(false));
if (typeof globalThis.Image === 'undefined') globalThis.Image = JsrImageElement;
installNativeRaycastBVH(Mesh);

const pmremWarnings = new WeakSet();

// The native env sampler already accepts equirectangular and six-face cube
// textures. Preserve those source pixels instead of running upstream's
// offscreen CubeUV shader chain, which R1 cannot reproduce. This is an explicit
// prefilter/roughness degrade, not a claim that a PMREM target was generated.
export class JsrPMREMGenerator extends CorePMREMGenerator {
  _warn(renderer, message) {
    if (pmremWarnings.has(renderer)) return;
    pmremWarnings.add(renderer);
    console.warn(`three: ${message}`);
  }

  compileCubemapShader() {
    if (this._renderer instanceof JsrWebGLRenderer) return;
    return super.compileCubemapShader();
  }

  compileEquirectangularShader() {
    if (this._renderer instanceof JsrWebGLRenderer) return;
    return super.compileEquirectangularShader();
  }

  fromCubemap(cubemap) {
    const renderer = this._renderer;
    if (renderer instanceof JsrWebGLRenderer) {
      this._warn(renderer, 'R1 samples the source cubemap directly; PMREM CubeUV prefiltering and roughness blur are omitted.');
      return { texture: cubemap, dispose() {} };
    }
    return super.fromCubemap(cubemap);
  }

  fromEquirectangular(equirectangular) {
    const renderer = this._renderer;
    if (renderer instanceof JsrWebGLRenderer) {
      this._warn(renderer, 'R1 samples the source equirectangular texture directly; PMREM CubeUV prefiltering and roughness blur are omitted.');
      return { texture: equirectangular, dispose() {} };
    }
    return super.fromEquirectangular(equirectangular);
  }

  fromScene(scene, sigma = 0, near = 0.1, far = 100, options = {}) {
    const renderer = this._renderer;
    if (renderer instanceof JsrWebGLRenderer) {
      this._warn(renderer, 'R1 omits PMREM scene environments; direct lighting remains active.');
      return { texture: null, dispose() {} };
    }
    return super.fromScene(scene, sigma, near, far, options);
  }
}

export * from 'three';
export { JsrPMREMGenerator as PMREMGenerator, JsrCanvasTextureLoader as TextureLoader };
export { getNativeRaycastDiagnostics } from './native_raycast_bvh.js';
export { JsrWebGLRenderer as WebGLRenderer } from './native_renderer.js';
export { JsrFileLoader as FileLoader, JsrImageLoader as ImageLoader } from './native_loaders.js';
export { JsrDataTextureLoader as DataTextureLoader } from './native_loaders.js';
export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export { ThreeCompatibilityRuntime, JsrThreeCanvas } from './runtime.js';
export { ThreeCapabilityError, UnsupportedWebGPURenderer as WebGPURenderer } from './errors.js';
