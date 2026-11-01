import { BatchedMesh } from 'three';

console.warn('three: BVH LOD generation is bounded for QuickJS: source geometries are reused at every LOD, radix/BVH acceleration is omitted, and native R1 retains its shared-geometry BatchedMesh degrade.');
export const performanceRangeLOD = Object.freeze({});
export async function simplifyGeometriesByErrorLOD(geometries) {
  return geometries.map(geometry => [geometry, geometry, geometry, geometry, geometry]);
}
export function extendBatchedMeshPrototype() {
  if (typeof BatchedMesh.prototype.addGeometryLOD !== 'function') {
    BatchedMesh.prototype.addGeometryLOD = function() {};
  }
  if (typeof BatchedMesh.prototype.computeBVH !== 'function') {
    BatchedMesh.prototype.computeBVH = function() { this.bvh = { boundedNativeFallback: true }; };
  }
}
export function createRadixSort() { return null; }
export function getBatchedMeshLODCount(groups) {
  let vertexCount = 0;
  let indexCount = 0;
  const LODIndexCount = groups.map(group => {
    const geometry = group[0];
    const vertices = geometry.getAttribute('position').count;
    const indices = geometry.index ? geometry.index.count : vertices;
    vertexCount += vertices;
    indexCount += indices;
    return indices;
  });
  return { vertexCount, indexCount, LODIndexCount };
}
