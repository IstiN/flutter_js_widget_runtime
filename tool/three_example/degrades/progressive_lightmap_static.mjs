// webgl_shadowmap_progressive static-lighting degrade (R1 boot lane).
//
// The official example accumulates a progressive lightmap while eight
// DirectionalLights re-jitter around `lightOrigin` EVERY frame (the module's
// own animate loop randomizes dirLights[l].position after the accumulation
// update and before renderer.render), so direct lighting and shadows shimmer
// on every renderer. Upstream converges visually because the accumulated
// lightMap smooths the samples out; on R1 that convergence lane is dead:
// R1 drops material.lightMap and material.onBeforeCompile, so the module's
// uvMat accumulation shader never runs and only the raw per-frame jitter is
// visible (plus one RT pass per frame that re-renders the stolen scene for
// nothing).
//
// This override keeps the official module untouched and makes the lighting
// static:
//
// 1. update() runs its real accumulation pass exactly once (the first call,
//    which also performs renderer.compile) and no-ops afterwards — the dead
//    R1 RT pass stops after one frame.
// 2. The per-frame 8-light jitter is structurally frozen: each light's
//    `position` is replaced by a frozen Vector3 whose mutators (set/copy/
//    lerp/...) are no-ops, so the module's animate-loop jitter writes are
//    ignored regardless of call order (pinning inside update() would lose —
//    the jitter runs AFTER update and BEFORE render). The lights stay at
//    their authored pre-jitter positions, i.e. the exact state the official
//    module renders its very first frame with.
//    Deviation (documented): the official jitter orbit around lightOrigin
//    (60,150,100) never renders; the widget permanently shows the official
//    pre-jitter lighting instead of a converged accumulation, because the
//    convergence target (the lightMap) is not reproducible on R1.
// 3. Exactly one light keeps castShadow (the first, anchored at its frozen
//    authored position). After the single accumulation pass it is attached
//    into the visible scene, because the module houses all lights inside its
//    internal RT scene and R1's shadow scan only sees the rendered scene —
//    without the anchor the widget would render shadowless after the pass
//    stops. Deviation (documented): the visible scene gains direct
//    directional lighting from this anchor; the official visible scene is
//    lit purely by the accumulated lightMap, which R1 cannot reproduce.
import { Vector3 } from 'three';
import { ProgressiveLightMap } from 'three/addons/misc/ProgressiveLightMap.js';

// Vector3 mutators the official module or renderer internals may call on a
// light position. All become no-ops on the frozen instance; readers (x/y/z,
// length, dot, ...) keep their real implementations.
const VECTOR3_MUTATORS = [
  'set', 'setScalar', 'setX', 'setY', 'setZ',
  'setFromMatrixColumn', 'setFromMatrix3Column', 'setFromMatrixPosition',
  'setFromEuler', 'setFromSpherical', 'setFromSphericalCoords',
  'setFromCylindrical', 'setFromCylindricalCoords', 'setFromCartesianCoords',
  'copy', 'add', 'addScalar', 'addScaledVector', 'addVectors',
  'sub', 'subScalar', 'subVectors', 'multiply', 'multiplyScalar', 'multiplyVectors',
  'divide', 'divideScalar', 'min', 'max', 'clamp', 'clampLength', 'clampScalar',
  'floor', 'ceil', 'round', 'roundToZero', 'negate',
  'applyAxisAngle', 'applyMatrix3', 'applyMatrix4', 'applyQuaternion', 'applyEuler',
  'lerp', 'lerpVectors', 'random', 'randomDirection', 'project', 'unproject',
  'transformDirection', 'normalize'
];

function frozenPosition(anchor) {
  const frozen = anchor.clone();
  for (const name of VECTOR3_MUTATORS) {
    if (typeof frozen[name] === 'function') frozen[name] = () => frozen;
  }
  // Legit mutable copies (shadow/camera math) stay mutable.
  frozen.clone = () => new Vector3().copy(frozen);
  return frozen;
}

// THREE.Object3D defines `position` as a non-writable, configurable property
// (defineProperties with a bare value descriptor), so the frozen instance
// must be installed with defineProperty — a plain assignment throws in the
// strict-mode bundle.
function freezePosition(object) {
  Object.defineProperty(object, 'position', {
    value: frozenPosition(object.position),
    configurable: true,
    enumerable: true,
    writable: false
  });
}

export class StaticProgressiveLightMap extends ProgressiveLightMap {
  addObjectsToLightMap(objects) {
    // Remember the first light before super() moves every light into the
    // module's internal RT scene (addObjectsToLightMap `this.scene.attach`
    // on isLight entries). That light becomes the one shadow caster.
    this.jsrAnchorLight = null;
    let lightIndex = 0;
    for (const object of objects) {
      if (!object.isLight) continue;
      if (lightIndex === 0) this.jsrAnchorLight = object;
      freezePosition(object);
      object.castShadow = lightIndex === 0;
      lightIndex++;
    }
    super.addObjectsToLightMap(objects);
  }

  update(camera, blendWindow = 100, blurEdges = true) {
    // Pre-init calls (blurringPlane still null, e.g. before the model loads)
    // fall through to super's own early return and don't count.
    if (this.jsrStaticUpdated || this.blurringPlane === null) return;
    this.jsrStaticUpdated = true;
    // The one and only accumulation pass: renderer.compile + the RT render.
    super.update(camera, blendWindow, blurEdges);
    // The accumulation pass ran exactly once; from here the module's RT
    // scene is never rendered again (dead RT pass stays dead). But R1's
    // shadow/light scan only sees the RENDERED scene, and the module keeps
    // every light inside its RT scene — so anchor the one shadow caster
    // into the visible scene next to the baked meshes. It stays at its
    // frozen authored position (origin anchor), so R1 emits one stable
    // 512x512 directional shadow instead of the per-frame resampled jitter
    // winner. Deviation (documented): the visible scene gains direct
    // directional lighting from this anchor — the official visible scene is
    // lit purely by the accumulated lightMap, which R1 cannot reproduce.
    const host = this.lightMapContainers[0] && this.lightMapContainers[0].object.parent;
    if (host && this.jsrAnchorLight) host.add(this.jsrAnchorLight);
  }
}

export { StaticProgressiveLightMap as ProgressiveLightMap };
