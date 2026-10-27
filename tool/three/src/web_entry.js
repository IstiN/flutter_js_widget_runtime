import { installThreeRuntime } from './runtime.js';

if (typeof globalThis !== 'undefined') globalThis.__JSR_THREE_WEB__ = true;
installThreeRuntime(true);

export * from 'three';
export { JsrWebRenderer as WebGLRenderer, OriginalWebGLRenderer } from './web_renderer.js';
export { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
export { ThreeCompatibilityRuntime, JsrThreeCanvas } from './runtime.js';
export { ThreeCapabilityError, UnsupportedWebGPURenderer as WebGPURenderer } from './errors.js';
