import { Mesh } from 'three';
import { installThreeRuntime } from './runtime.js';
import { installNativeCanvas2D } from './native_canvas2d.js';
import { installNativeRaycastBVH } from './native_raycast_bvh.js';

installNativeCanvas2D(installThreeRuntime(false));
installNativeRaycastBVH(Mesh);

export * from 'three';
export { getNativeRaycastDiagnostics } from './native_raycast_bvh.js';
export { JsrWebGLRenderer as WebGLRenderer } from './native_renderer.js';
export { JsrTextureLoader as TextureLoader, JsrFileLoader as FileLoader } from './native_loaders.js';
export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export { ThreeCompatibilityRuntime, JsrThreeCanvas } from './runtime.js';
export { ThreeCapabilityError, UnsupportedWebGPURenderer as WebGPURenderer } from './errors.js';
