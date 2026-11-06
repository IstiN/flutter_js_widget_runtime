// webgl_postprocessing_dof freezes each material palette after its first
// Color.setHSL assignment. The official module rewrites all 1764 sphere
// colors every animation frame; on the bounded QuickJS lane that walk costs
// ~34 ms of CPU per frame and ~1 MB of material-diff packets (measured
// 7.6 presented fps), so the per-frame hue rotation is dropped while the
// initial index-based rainbow stays. The real BokehPass lowering (RTT
// screen-fragment path) is unchanged.
import * as THREE from 'three';

export { BokehPass } from 'three/addons/postprocessing/BokehPass.js';

const originalSetHSL = THREE.Color.prototype.setHSL;
THREE.Color.prototype.setHSL = function (h, s, l, colorSpace) {
  if (this._r1PaletteFrozen) return this;
  const result = originalSetHSL.call(this, h, s, l, colorSpace);
  this._r1PaletteFrozen = true;
  return result;
};

console.warn(
  'three: R1 freezes each BokehPass sphere palette after its first Color.setHSL; '
  + 'the official per-frame hue rotation rewrites 1764 materials per frame '
  + '(~1 MB/frame) and is omitted on the bounded lane.'
);
