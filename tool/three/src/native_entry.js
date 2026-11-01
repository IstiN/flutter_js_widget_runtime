import { Mesh, DataTexture, PMREMGenerator as CorePMREMGenerator } from 'three';
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

// HTML-in-canvas requires a browser layout/rasterization stack. Preserve the
// official HTMLTexture construction and textured mesh with a bounded local
// RGBA8 placeholder rather than aborting the surrounding native scene.
export class JsrImageBitmapLoader extends JsrImageLoader {
  setOptions() { return this; }
}

export class HTMLTexture extends DataTexture {
  constructor(element) {
    const width = 256;
    const height = 256;
    const data = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const offset = (y * width + x) * 4;
        const stripe = ((x >> 5) + (y >> 5)) % 2 === 0;
        data[offset] = stripe ? 238 : 40;
        data[offset + 1] = stripe ? 242 : 96;
        data[offset + 2] = stripe ? 248 : 160;
        data[offset + 3] = 255;
      }
    }
    super(data, width, height);
    this.isHTMLTexture = true;
    this.sourceElement = element || null;
    // InteractionManager projects the source element onto the textured mesh.
    // Keep the native RGBA payload while supplying the browser CSS surface it
    // touches; no DOM layout is attempted.
    Object.assign(this.image, {
      style: {}, offsetWidth: width, offsetHeight: height,
      clientWidth: width, clientHeight: height
    });
    this.needsUpdate = true;
    console.warn('three: HTMLTexture uses a bounded 256x256 native RGBA placeholder; browser HTML layout/rasterization is unavailable.');
  }
}

export * from 'three';
export { JsrPMREMGenerator as PMREMGenerator, JsrCanvasTextureLoader as TextureLoader };
export { getNativeRaycastDiagnostics } from './native_raycast_bvh.js';
export { JsrWebGLRenderer as WebGLRenderer } from './native_renderer.js';
export { JsrFileLoader as FileLoader, JsrImageLoader as ImageLoader } from './native_loaders.js';
export { JsrImageBitmapLoader as ImageBitmapLoader };
export { JsrDataTextureLoader as DataTextureLoader } from './native_loaders.js';
export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export { ThreeCompatibilityRuntime, JsrThreeCanvas } from './runtime.js';
export { ThreeCapabilityError, UnsupportedWebGPURenderer as WebGPURenderer } from './errors.js';
