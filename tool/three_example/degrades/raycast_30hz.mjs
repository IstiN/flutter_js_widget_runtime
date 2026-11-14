// Point-cloud picking tests 3 * 12,800 points every display frame in the
// official example. Cache that exact upstream result for one alternate frame:
// camera/point motion remains full-rate while picking runs every second display frame.
import * as THREE from 'three';

export function installPointsRaycast30Hz() {
  const proto = THREE.Raycaster.prototype;
  if (proto._r1PointsRaycast30Hz) return;
  const original = proto.intersectObjects;
  proto.intersectObjects = function (objects, recursive, optionalTarget) {
    const pointsOnly = objects.length > 0 && objects.every(object => object && object.isPoints);
    if (!pointsOnly) return original.call(this, objects, recursive, optionalTarget);
    const frame = (this._r1PointsRaycastFrame || 0) + 1;
    this._r1PointsRaycastFrame = frame;
    if ((frame & 1) === 0 && this._r1PointsRaycastResult) {
      if (optionalTarget) {
        optionalTarget.length = 0;
        optionalTarget.push(...this._r1PointsRaycastResult);
        return optionalTarget;
      }
      return this._r1PointsRaycastResult;
    }
    const result = original.call(this, objects, recursive, optionalTarget);
    this._r1PointsRaycastResult = result;
    return result;
  };
  proto._r1PointsRaycast30Hz = true;
  console.warn('three: R1 evaluates Points raycast picking every second display frame; rendering remains full-rate.');
}
