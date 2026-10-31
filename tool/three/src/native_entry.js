import { Mesh, PMREMGenerator as CorePMREMGenerator } from 'three';
import { installThreeRuntime } from './runtime.js';
import { installNativeCanvas2D } from './native_canvas2d.js';
import { installNativeRaycastBVH } from './native_raycast_bvh.js';
import { JsrWebGLRenderer } from './native_renderer.js';

installNativeCanvas2D(installThreeRuntime(false));
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
