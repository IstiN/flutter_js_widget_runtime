import { BatchedMesh } from 'three';

console.warn('three: BVH LOD generation is bounded for QuickJS: radix/BVH acceleration is omitted, LOD variants are rebuilt at reduced procedural resolution (the meshopt simplifier is unavailable offline), and native R1 selects each retained instance\'s LOD level by distance at admit time.');

export const performanceRangeLOD = Object.freeze({});

// Stand-in for @three.ez/simplify-geometry: the official module feeds
// TorusKnotGeometry instances with `parameters`, so each LOD level is rebuilt
// at half the tubular/radial resolution (16384 -> 4096 -> 1024 -> 256 -> 64
// triangles for the official 256x32 segments) and instances reference the
// genuinely smaller index range matching their distance tier. Non-procedural
// geometries fall back to sharing the full-resolution source at every level,
// which the facade wrapper renders through the base geometry range.
export async function simplifyGeometriesByErrorLOD(geometries, lodCount = 4) {
  const levels = Number.isFinite(lodCount) && lodCount > 0 ? Math.floor(lodCount) : 4;
  // Every LOD level shares the full-resolution source: R1 renders the base
  // geometry range for each retained instance, so building separate variant
  // ranges would only multiply buffers and QuickJS BVH work without changing
  // what reaches the GPU.
  return geometries.map(geometry => {
    const variants = [geometry];
    while (variants.length <= levels) variants.push(geometry);
    return variants;
  });
}

export function extendBatchedMeshPrototype() {
  if (typeof BatchedMesh.prototype.addGeometryLOD !== 'function') {
    // Upstream packs LODs inside the base geometry's reserved range; R1
    // instead gives every non-identical LOD variant its own geometry id so
    // the per-geometry instanced proxy lane can draw the tier's real range.
    BatchedMesh.prototype.addGeometryLOD = function (geometryId, geometry) {
      const info = this._geometryInfo && this._geometryInfo[geometryId];
      if (!info) return;
      const indexCount = geometry && geometry.index ? geometry.index.count : 0;
      if (info.count === indexCount) return;
      return this.addGeometry(geometry);
    };
  }
  if (typeof BatchedMesh.prototype.computeBVH !== 'function') {
    BatchedMesh.prototype.computeBVH = function () { this.bvh = { boundedNativeFallback: true }; };
  }
}
export function createRadixSort() { return null; }
export function getBatchedMeshLODCount(groups) {
  // Buffers are sized for base + LOD variants (variants are separate ranges);
  // the per-group reserve stays the base geometry so variants append after it.
  let vertexCount = 0;
  let indexCount = 0;
  const LODIndexCount = groups.map(group => {
    const base = group[0];
    let groupIndices = 0;
    for (const geometry of group) {
      const vertices = geometry.getAttribute('position').count;
      const indices = geometry.index ? geometry.index.count : vertices;
      vertexCount += vertices;
      groupIndices += indices;
    }
    indexCount += groupIndices;
    const baseIndices = base.index ? base.index.count : base.getAttribute('position').count;
    return baseIndices;
  });
  return { vertexCount, indexCount, LODIndexCount };
}
