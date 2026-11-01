import { Color, DataTexture, LinearFilter, RGBAFormat, Vector2 } from 'three';

console.warn('three: three-gpu-pathtracer is unavailable on the native R1 backend; rendering the same LDraw scene, environment and floor through the direct WebGL renderer.');

export class WebGLPathTracer {
  constructor(renderer) {
    this.renderer = renderer;
    this.tiles = new Vector2(1, 1);
    this.samples = 0;
    this.scene = null;
    this.camera = null;
  }
  setScene(scene, camera) { this.scene = scene; this.camera = camera; this.samples = 0; }
  updateCamera() {}
  updateEnvironment() {}
  updateMaterials() {}
  reset() { this.samples = 0; }
  renderSample() {
    if (!this.scene || !this.camera) return;
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
