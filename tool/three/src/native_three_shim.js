// GLTFLoader and its addon dependencies resolve this module instead of the
// upstream barrel, so their object model stays upstream while asset IO is JSR.
export * from 'three';
export { JsrTextureLoader as TextureLoader, JsrFileLoader as FileLoader } from './native_loaders.js';
