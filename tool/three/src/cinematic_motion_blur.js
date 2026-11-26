// cinematic_motion_blur.js — the JSR-owned cinematic passes of segment F4c1
// (issue #8, ADR-0004 decision 5, ADR-0005).
//
// CinematicMotionBlurPass — the JSR-owned shutter motion blur. Classic r186
// has no general upstream MotionBlurPass equivalent (the TSL nodes are out of
// scope per the issue: "Classic WebGL2, not WebGPU/TSL"), so this pass is
// honestly named as JSR-owned. First candidate (ADR-0005): SUBFRAME
// ACCUMULATION with the stratified shutter samples of clockState().
//
//   - The pipeline renders the scene once per subframe (the composer chain
//     runs end to end) and this pass — inserted before OutputPass — blends
//     each chain result into a half-float accumulation target with the
//     subframe weight. On the LAST subframe it resolves the accumulated
//     average into the chain (needsSwap), and OutputPass tone-maps the
//     average exactly once (issue #8 invariant: one final color conversion).
//   - Deterministic by construction: the subframe times/weights are a pure
//     function of (frame, fps, shutter, samples) from clockState(); the
//     accumulation runs in the fixed subframe order, so direct seek to
//     frame N and sequential 0..N produce bit-identical output. No history:
//     the accumulation target is cleared at subframe 0 of every frame, so
//     there is no cross-frame state to reconstruct.
//   - Works on native 1B and Web (both are real WebGL2 lanes with
//     EXT_color_buffer_float); the R1 lane lacks float targets and keeps the
//     pass NAMED-unsupported (caps.motionBlurAccum === false) — never
//     silently dropped.
//
// CinematicBokehFringeShader — the controlled fringing helper (issue #8 P1:
// "BokehShader2 fringe or a small helper ShaderPass for optional chromatic
// aberration"). The three per-channel texel offsets and the fringe*blur
// scaling are BokehShader2's exact formula, extracted as a standalone
// ShaderPass so it composes with the stock BokehPass (BokehShader, r186)
// which has no fringe uniform.

import {
  AdditiveBlending,
  Color,
  HalfFloatType,
  NoBlending,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget
} from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

const ACCUM_VERTEX = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const ZERO_COLOR = new Color(0x000000);

export class CinematicMotionBlurPass extends Pass {
  constructor(options) {
    super();
    options = options || {};
    const samples = Math.floor(Number(options.samples === undefined ? 8 : options.samples));
    this.samples = samples >= 1 ? samples : 8;
    // Subframe arm state — the pipeline arms exactly one subframe before
    // each composer.render() call (armSubframe).
    this._index = -1;
    this._count = 0;
    this._weight = 1;
    this._target = null;
    this._targetWidth = 0;
    this._targetHeight = 0;
    // Accumulate material — additive weighted blend into the half-float
    // target (identical math to the pre-F4c1 pipeline accumulator, so the
    // web-lane accumulation semantics are preserved).
    this._accumMaterial = new ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, weight: { value: 1 } },
      vertexShader: ACCUM_VERTEX,
      fragmentShader: 'uniform sampler2D tDiffuse; uniform float weight; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tDiffuse, vUv).rgb * weight, 1.0); }',
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true
    });
    // Resolve material — exact copy of the accumulated average into the
    // chain (NoBlending fullscreen overwrite; no clear needed).
    this._resolveMaterial = new ShaderMaterial({
      uniforms: { tDiffuse: { value: null } },
      vertexShader: ACCUM_VERTEX,
      fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main() { gl_FragColor = texture2D(tDiffuse, vUv); }',
      blending: NoBlending,
      depthTest: false,
      depthWrite: false
    });
    this._accumQuad = new FullScreenQuad(this._accumMaterial);
    this._resolveQuad = new FullScreenQuad(this._resolveMaterial);
  }

  // armSubframe(index, count, weight) — the pipeline calls this before every
  // composer.render() of a subframe. Subframes 0..count-2 accumulate
  // (needsSwap false — the chain keeps flowing); the last subframe resolves
  // the average into the chain (needsSwap true, swapped before OutputPass).
  armSubframe(index, count, weight) {
    this._index = index;
    this._count = count;
    this._weight = weight;
    this.needsSwap = index === count - 1;
  }

  render(renderer, writeBuffer, readBuffer) {
    if (this._count <= 0 || this._index < 0) return;
    if (this._count === 1) {
      // Pass-through: a single subframe IS the un-blurred frame — copy the
      // chain input straight through (no accumulation state involved).
      this._resolveMaterial.uniforms.tDiffuse.value = readBuffer.texture;
      renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
      this._resolveQuad.render(renderer);
      return;
    }
    if (this._index === 0) {
      // New frame: fresh accumulation target state. The clear color is forced
      // black HERE — three's background module resets the renderer clear
      // color to the scene background on every RenderPass, so the value set
      // before the subframe loop is already gone by the time this runs (a
      // background-colored clear inflates every accumulated average).
      this._ensureTarget();
      renderer.setRenderTarget(this._target);
      renderer.setClearColor(ZERO_COLOR, 0);
      renderer.clear(true, false, false);
    }
    if (this._index < this._count - 1) {
      this._accumMaterial.uniforms.tDiffuse.value = readBuffer.texture;
      this._accumMaterial.uniforms.weight.value = this._weight;
      // FullScreenQuad.render goes through renderer.render(), whose
      // autoClear would clear the accumulation before EVERY weighted draw
      // (last-write-wins: the average came out darkened by the sample count).
      // Suppress it for the additive draws — the explicit index-0 clear above
      // is the only clear of the frame.
      const oldAutoClear = renderer.autoClear;
      renderer.autoClear = false;
      renderer.setRenderTarget(this._target);
      this._accumQuad.render(renderer);
      renderer.autoClear = oldAutoClear;
    } else {
      // LAST subframe: this chain result must join the average BEFORE the
      // resolve — resolving instead of accumulating drops the final sample
      // (the average came out as sum*(n-1)/n, alpha n-1).
      this._accumMaterial.uniforms.tDiffuse.value = readBuffer.texture;
      this._accumMaterial.uniforms.weight.value = this._weight;
      const oldAutoClear = renderer.autoClear;
      renderer.autoClear = false;
      renderer.setRenderTarget(this._target);
      this._accumQuad.render(renderer);
      renderer.autoClear = oldAutoClear;
      this._resolveMaterial.uniforms.tDiffuse.value = this._target.texture;
      renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
      this._resolveQuad.render(renderer);
    }
  }

  _ensureTarget() {
    if (this._target) return;
    this._target = new WebGLRenderTarget(Math.max(1, this._targetWidth), Math.max(1, this._targetHeight), { type: HalfFloatType });
  }

  setSize(width, height) {
    this._targetWidth = width;
    this._targetHeight = height;
    if (this._target) this._target.setSize(width, height);
  }

  dispose() {
    if (this._target) this._target.dispose();
    this._accumMaterial.dispose();
    this._resolveMaterial.dispose();
    this._accumQuad.dispose();
    this._resolveQuad.dispose();
  }
}

// CinematicBokehFringeShader — BokehShader2's color() sampling as a
// standalone chromatic-aberration ShaderPass. Uniforms:
//   amount      — the fringe strength (BokehShader2 default 0.7)
//   blur        — the bokeh blur amplitude the fringe scales with (the
//                 stock BokehShader has no per-pixel blur, so hosts set this
//                 to their maxblur-like constant; 1.0 = plain fringing)
//   resolution  — the target size in pixels (texel size derivation)
export const CinematicBokehFringeShader = {
  name: 'CinematicBokehFringeShader',
  uniforms: {
    // tDiffuse is REQUIRED: r186 ShaderPass.render binds the chain input
    // through uniforms.tDiffuse (guarded — a shader without the uniform
    // silently samples a null texture and renders black).
    tDiffuse: { value: null },
    amount: { value: 0.7 },
    blur: { value: 1.0 },
    resolution: { value: new Vector2(1, 1) }
  },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: [
    'uniform sampler2D tDiffuse;',
    'uniform float amount;',
    'uniform float blur;',
    'uniform vec2 resolution;',
    'varying vec2 vUv;',
    'void main() {',
    '  vec2 texel = vec2(1.0 / resolution.x, 1.0 / resolution.y);',
    '  float f = amount * blur;',
    '  vec4 c;',
    '  c.r = texture2D(tDiffuse, vUv + vec2(0.0, 1.0) * texel * f).r;',
    '  c.g = texture2D(tDiffuse, vUv + vec2(-0.866, -0.5) * texel * f).g;',
    '  c.b = texture2D(tDiffuse, vUv + vec2(0.866, -0.5) * texel * f).b;',
    '  c.a = texture2D(tDiffuse, vUv).a;',
    '  gl_FragColor = c;',
    '}'
  ].join('\n')
};
