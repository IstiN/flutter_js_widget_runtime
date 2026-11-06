// webgl_postprocessing_unreal_bloom_selective keeps the official two-composer
// selective flow but renders the scene passes directly on the bounded lane:
// the bloom mip chain and the bloom/texture mix pass are omitted, so the
// final composite shows the unfiltered scene (the selected-layer glow is
// dropped). The official RenderPass class is reused unchanged.
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

console.warn(
  'three: R1 renders the selective-bloom scene passes directly; the bloom '
  + 'mip chain and bloom/texture mix pass are omitted, so the selected-layer '
  + 'glow is not composited on the bounded lane.'
);

export class UnrealBloomPass {
  constructor() {
    this.threshold = 0;
    this.strength = 1;
    this.radius = 0;
  }
  render() {}
  dispose() {}
}

export class ShaderPass {
  constructor(material) {
    this.material = material;
  }
  render() {}
}

export class OutputPass {
  constructor() {}
  render() {}
}

export class EffectComposer {
  constructor(renderer, renderTarget) {
    this.renderer = renderer;
    this.renderTarget2 = renderTarget || { texture: null };
    this.passes = [];
    this.renderToScreen = true;
  }
  addPass(pass) { this.passes.push(pass); }
  render(deltaTime) {
    for (const pass of this.passes) {
      if (pass instanceof RenderPass) pass.render(this.renderer, deltaTime);
      // The real RenderPass.render writes straight into the composer's
      // current target; direct mode keeps the canvas as the one target.
      else if (typeof pass.render === 'function') pass.render(this.renderer, deltaTime);
    }
  }
  setSize() {}
  setPixelRatio() {}
  dispose() {}
}
