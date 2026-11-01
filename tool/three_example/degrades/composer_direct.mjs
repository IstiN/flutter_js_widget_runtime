console.warn('three: postprocessing godrays are not emulated by arbitrary R1 shaders; EffectComposer retains the official RenderPass as a direct native scene draw and GodraysPass is explicitly omitted.');
export class RenderPass {
  constructor(scene, camera) { this.scene = scene; this.camera = camera; }
  render(renderer) { renderer.render(this.scene, this.camera); }
}
export class EffectComposer {
  constructor(renderer) { this.renderer = renderer; this.passes = []; }
  addPass(pass) { this.passes.push(pass); }
  render(delta) {
    for (const pass of this.passes) {
      if (pass instanceof RenderPass) pass.render(this.renderer, delta);
    }
  }
  setSize() {}
  setPixelRatio() {}
  dispose() {}
}
