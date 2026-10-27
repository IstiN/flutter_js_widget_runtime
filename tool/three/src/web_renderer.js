import { WebGLRenderer as UpstreamWebGLRenderer } from 'three';
import { getThreeRuntime } from './runtime.js';

// Rendering, shaders, state and capabilities remain upstream r186. This thin
// subclass only supplies the JSR canvas default and presents completed default-
// framebuffer renders through the Worker ImageBitmap lane.
export class JsrWebRenderer extends UpstreamWebGLRenderer {
  constructor(parameters = {}) {
    const runtime = parameters.runtime || getThreeRuntime(true);
    const canvas = parameters.canvas || runtime.createCanvas('main');
    super(Object.assign({}, parameters, { canvas }));
    // r186 installs render/dispose as own instance functions. Prototype
    // overrides alone are therefore shadowed; compose the actual own methods.
    const upstreamRender = this.render;
    const upstreamDispose = this.dispose;
    this.render = function(scene, camera) {
      upstreamRender.call(this, scene, camera);
      if (this.getRenderTarget() === null && this.domElement.isJsrThreeCanvas) this.domElement.present({ renderer: this });
    };
    this.dispose = function() {
      const element = this.domElement;
      upstreamDispose.call(this);
      if (element && element.isJsrThreeCanvas) {
        if (element.renderer === this) element.renderer = null;
        element.dispose();
      }
    };
    this.runtime = runtime;
    this.domElement.renderer = this;
    if (this.domElement.isJsrThreeCanvas) {
      this.capabilities.rawWebGL = true;
      this.capabilities.backend = 'webgl2';
    }
  }

  render(scene, camera) {
    super.render(scene, camera);
    if (this.getRenderTarget() === null && this.domElement.isJsrThreeCanvas) this.domElement.present({ renderer: this });
  }

  dispose() {
    const canvas = this.domElement;
    super.dispose();
    if (canvas && canvas.isJsrThreeCanvas) {
      if (canvas.renderer === this) canvas.renderer = null;
      canvas.dispose();
    }
  }
}

export { UpstreamWebGLRenderer as OriginalWebGLRenderer };
