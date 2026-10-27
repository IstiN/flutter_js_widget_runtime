import { installThreeRuntime } from './runtime.js';

installThreeRuntime(false);

export * from 'three';
export { JsrWebGLRenderer as WebGLRenderer } from './native_renderer.js';
export { JsrTextureLoader as TextureLoader, JsrFileLoader as FileLoader } from './native_loaders.js';
export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export { ThreeCompatibilityRuntime, JsrThreeCanvas } from './runtime.js';
export { ThreeCapabilityError, UnsupportedWebGPURenderer as WebGPURenderer } from './errors.js';
