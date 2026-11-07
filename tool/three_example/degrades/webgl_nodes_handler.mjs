// The node materials have already been mapped to native WebGL base materials.
// Keep the official renderer.setNodesHandler call as an explicit no-op.
// The real WebGLRenderer.setNodesHandler(handler) calls handler.setRenderer(this),
// so the bounded fallback must expose the method even though it stores nothing.
export class WebGLNodesHandler {
  constructor() {
    this.isBoundedNativeFallback = true;
  }
  setRenderer(renderer) {
    this.renderer = renderer;
  }
  dispose() {}
}
