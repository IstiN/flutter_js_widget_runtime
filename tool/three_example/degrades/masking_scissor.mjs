// webgl_postprocessing_masking approximates the official stencil-mask
// composer chain with scissor rectangles: MaskPass projects its mask object
// to a screen-space rect and the following TexturePass draws a textured
// fullscreen quad clipped to that rect. Stencil write/test composition is
// not reachable on the bounded R1 lane, so the multiply-through-stencil
// composite becomes a clipped direct composite with the same scene order
// (clear, box-masked Caravaggio photo, torus-masked second photo).
import * as THREE from 'three';

console.warn(
  'three: R1 approximates the stencil mask chain with scissor rectangles; '
  + 'MaskPass projects the mask object bounds to a screen rect and the '
  + 'following TexturePass draws only inside it.'
);

const fullscreenCamera = () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

export class ClearPass {
  constructor() {}
  render(renderer) {
    renderer.setRenderTarget(null);
    renderer.setScissorTest(false);
    renderer.clear();
    // Upstream starts every canvas life at the clear color; the bounded
    // surface keeps uninitialized pixels until a pass covers them, so paint
    // the clear color as a one-shot fullscreen quad (outside any scissor).
    if (!this._scene) {
      this._scene = new THREE.Scene();
      this._camera = fullscreenCamera();
      const color = new THREE.Color();
      renderer.getClearColor(color);
      this._scene.add(new THREE.Mesh(
        fullscreenGeometry(),
        new THREE.MeshBasicMaterial({ color, depthTest: false, depthWrite: false }),
      ));
    }
    renderer.render(this._scene, this._camera);
  }
}

export class MaskPass {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
  }
  render(renderer) {
    // Project the mask scene's object bounds into canvas pixels. The lane's
    // camera.matrixWorldInverse is not maintained outside walks, so derive
    // the view matrix here and clip-transform manually.
    const size = new THREE.Vector2();
    renderer.getSize(size);
    this.camera.updateMatrixWorld();
    this.scene.updateMatrixWorld();
    const view = new THREE.Matrix4().copy(this.camera.matrixWorld).invert();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const box = new THREE.Box3();
    const corner = new THREE.Vector4();
    const point = new THREE.Vector3();
    for (const object of this.scene.children) {
      if (!object.isMesh || !object.geometry) continue;
      if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
      box.copy(object.geometry.boundingBox);
      for (let i = 0; i < 8; i++) {
        point.set(
          i & 1 ? box.max.x : box.min.x,
          i & 2 ? box.max.y : box.min.y,
          i & 4 ? box.max.z : box.min.z,
        );
        point.applyMatrix4(object.matrixWorld);
        corner.set(point.x, point.y, point.z, 1);
        corner.applyMatrix4(view);
        if (corner.w <= 0) continue;
        corner.applyMatrix4(this.camera.projectionMatrix);
        if (corner.w === 0) continue;
        const x = (corner.x / corner.w * 0.5 + 0.5) * size.x;
        const y = (corner.y / corner.w * 0.5 + 0.5) * size.y;
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    if (minX >= maxX || minY >= maxY) return;
    const width = Math.min(size.x, maxX) - Math.max(0, minX);
    const height = Math.min(size.y, maxY) - Math.max(0, minY);
    renderer.setScissorTest(true);
    renderer.setScissor(Math.max(0, minX), Math.max(0, minY), width, height);
  }
}

export class ClearMaskPass {
  constructor() {}
  render(renderer) {
    renderer.setScissorTest(false);
  }
}

export class TexturePass {
  constructor(texture) {
    this.texture = texture;
    this._scene = null;
  }
  render(renderer) {
    renderer.setRenderTarget(null);
    if (!this._scene) {
      this._scene = new THREE.Scene();
      this._camera = fullscreenCamera();
      const material = new THREE.MeshBasicMaterial({
        map: this.texture,
        depthTest: false,
        depthWrite: false,
      });
      this._scene.add(new THREE.Mesh(fullscreenGeometry(), material));
    }
    renderer.render(this._scene, this._camera);
  }
}

export class OutputPass {
  constructor() {}
  render(renderer) {}
}

export class EffectComposer {
  constructor(renderer, renderTarget) {
    this.renderer = renderer;
    this.renderTarget2 = renderTarget;
    this.passes = [];
    this.renderToScreen = true;
  }
  addPass(pass) { this.passes.push(pass); }
  render() {
    // Mirror the real composer: the chain manages its own clearing
    // (ClearPass), so automatic per-render clears stay off for the chain.
    const renderer = this.renderer;
    const previousAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    try {
      for (const pass of this.passes) pass.render(renderer);
    } finally {
      renderer.autoClear = previousAutoClear;
    }
  }
  setSize() {}
  setPixelRatio() {}
  dispose() {}
}

function fullscreenGeometry() {
  const geometry = new THREE.PlaneGeometry(2, 2);
  return geometry;
}
