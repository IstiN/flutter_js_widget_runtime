// Direct native scene rendering already retains the surrounding example.
// These pass objects preserve initialization/API shape without claiming GPU
// postprocessing support.
export class EffectMaterial {}
export class NormalPass {
  constructor(scene, camera) { this.scene = scene; this.camera = camera; this.texture = null; this.needsSwap = false; }
  initialize() {}
  setSize() {}
  render() {}
}
export class EffectPass {
  constructor(camera, ...effects) { this.camera = camera; this.effects = effects; this.needsSwap = false; }
  initialize() {}
  setSize() {}
  render() {}
}
export class SMAAEffect {}
