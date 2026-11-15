// Native ClearPass envelope: renderer.clear() records flags but intentionally
// does not draw by itself. An empty scene submits those flags and the clear
// color/alpha to the same composer readBuffer, including when every visible
// content pass is disabled. The official module and its GUI stay unchanged.
import * as THREE from 'three';

console.warn(
  'three: R1 submits ClearPass as an empty native frame carrying the exact '
  + 'clear color, alpha and depth flags; no fullscreen substitute is drawn.'
);

export class ClearPass {
  constructor(clearColor = 0, clearAlpha = 0) {
    this.needsSwap = false;
    this.clearColor = clearColor;
    this.clearAlpha = clearAlpha;
    this._oldClearColor = new THREE.Color();
    this._scene = new THREE.Scene();
    this._camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }

  setSize() {}

  render(renderer, writeBuffer, readBuffer) {
    let oldAlpha;
    if (this.clearColor) {
      renderer.getClearColor(this._oldClearColor);
      oldAlpha = renderer.getClearAlpha();
      renderer.setClearColor(this.clearColor, this.clearAlpha);
    }
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    renderer.clear();
    renderer.render(this._scene, this._camera);
    if (this.clearColor) renderer.setClearColor(this._oldClearColor, oldAlpha);
  }

  dispose() {}
}
