// The node materials have already been mapped to native WebGL base materials.
// Keep the official renderer.setNodesHandler call as an explicit no-op.
export class WebGLNodesHandler {
  constructor() {
    this.isBoundedNativeFallback = true;
  }
  dispose() {}
}
