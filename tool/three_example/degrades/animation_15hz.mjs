// Bounded animation cadence for CPU morph/skin scenes. Accumulated delta is
// preserved, so clip speed and event ordering are unchanged; the mixer simply
// evaluates every fourth display frame. Static frames reuse the existing R1
// geometry/shadow caches instead of revalidating and re-uploading every morph.
import * as THREE from 'three';

export function installAnimation15Hz() {
  const proto = THREE.AnimationMixer.prototype;
  if (proto._r1Animation15Hz) return;
  const original = proto.update;
  proto.update = function (delta) {
    const frame = (this._r1AnimationFrame || 0) + 1;
    this._r1AnimationFrame = frame;
    const accumulated = (this._r1AnimationDelta || 0) + delta;
    this._r1AnimationDelta = accumulated;
    if (frame > 1 && frame % 4 !== 1) return this;
    this._r1AnimationDelta = 0;
    return original.call(this, accumulated);
  };
  proto._r1Animation15Hz = true;
  console.warn('three: R1 evaluates CPU morph/skin mixers every fourth display frame with accumulated delta; rendering remains full-rate.');
}
