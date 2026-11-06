import { Color, DataTexture, LinearFilter, PerspectiveCamera, RGBAFormat, Scene, Vector2 } from 'three';

// Wave-B phase probes: T0 is the degrade module's import time (widget boot).
// jsr.ldraw.prebuilt (fetch + typed-array rebuild) is opened in
// degrades/ldraw_xwing_prebuilt.mjs; firstR1 fires on the first renderSample.
// Total = firstR1 - T0.
const PT_T0 = performance.now();

console.warn('three: three-gpu-pathtracer is unavailable on the native R1 backend; rendering the same LDraw scene, environment and floor through the direct WebGL renderer.');

export class WebGLPathTracer {
  constructor(renderer) {
    this.renderer = renderer;
    this.tiles = new Vector2(1, 1);
    this.samples = 0;
    this.scene = null;
    this.camera = null;
    this._firstFrameLogged = false;
    // Early paint: run the render loop from boot with the sky gradient so the
    // first frame presents while the prebuilt LDraw scene loads. The null
    // guard below keeps this sky-only until the official module calls
    // setScene; its later setAnimationLoop(animate) replaces this callback.
    const skyScene = new Scene();
    const skyCamera = new PerspectiveCamera();
    const sky = new GradientEquirectTexture();
    sky.topColor.set(0xeeeeee);
    sky.bottomColor.set(0xeaeaea);
    sky.update();
    skyScene.background = sky;
    renderer.setAnimationLoop(() => {
      if (!this.scene) this.renderer.render(skyScene, skyCamera);
    });
  }
  setScene(scene, camera) {
    console.log(`[jsr-pt] sceneReadyMs=${Math.round(performance.now() - PT_T0)}`);
    this.scene = scene;
    this.camera = camera;
    this.samples = 0;
  }
  updateCamera() {}
  updateEnvironment() {}
  updateMaterials() {}
  reset() { this.samples = 0; }
  renderSample() {
    if (!this.scene || !this.camera) return;
    if (!this._firstFrameLogged) {
      this._firstFrameLogged = true;
      console.log(`[jsr-pt] firstR1Ms=${Math.round(performance.now() - PT_T0)}`);
    }
    this.renderer.render(this.scene, this.camera);
    this.samples = Math.min(1024, this.samples + 1);
  }
}

export class BlurredEnvMapGenerator {
  constructor(renderer) { this.renderer = renderer; }
  generate(texture) { return texture; }
  dispose() {}
}

export class GradientEquirectTexture extends DataTexture {
  constructor() {
    super(new Uint8Array(2 * 256 * 4), 2, 256);
    this.format = RGBAFormat;
    this.minFilter = this.magFilter = LinearFilter;
    this.topColor = new Color(0xffffff);
    this.bottomColor = new Color(0x000000);
    this.update();
  }
  update() {
    const data = this.image.data;
    for (let y = 0; y < 256; y++) {
      const t = y / 255;
      const r = Math.round(255 * (this.bottomColor.r * (1 - t) + this.topColor.r * t));
      const g = Math.round(255 * (this.bottomColor.g * (1 - t) + this.topColor.g * t));
      const b = Math.round(255 * (this.bottomColor.b * (1 - t) + this.topColor.b * t));
      for (let x = 0; x < 2; x++) {
        const i = (y * 2 + x) * 4;
        data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
      }
    }
    this.needsUpdate = true;
  }
}
