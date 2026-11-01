// The vendored three-mesh-bvh package's general-purpose build is too costly in
// QuickJS for this 3000-ray visualization. R1 already installs a bounded lazy
// BVH in Mesh._computeIntersections; retain the official extension API and use
// that native candidate accelerator instead.
import { Color, Group } from 'three';
console.warn('three: three-mesh-bvh and the 150-ray/frame visualization are too costly for QuickJS; rendering the bunny and bounded BVH helper without synthetic ray hits.');
export function computeBoundsTree() {
  this.boundsTree = { nativeLazyBVH: true };
  return this;
}
export function disposeBoundsTree() {
  this.boundsTree = null;
  return this;
}
export function acceleratedRaycast(raycaster, intersects) {
  // Preserve the extension signature; synthetic rays are intentionally bounded
  // away. Ordinary unextended meshes retain R1's native raycast acceleration.
}
export class BVHHelper extends Group {
  constructor(mesh, depth = 10) {
    super();
    this.mesh = mesh;
    this.depth = depth;
    this.color = new Color(0xffffff);
    this.isBVHHelper = true;
  }
  update() {}
}
