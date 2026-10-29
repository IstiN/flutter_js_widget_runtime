// Native QuickJS raycast acceleration for large, static indexed meshes.
// The upstream implementation still performs every final triangle test; this
// module only reduces the candidate set and restores the original face ids.
const MIN_TRIANGLES = 1024;
const LEAF_TRIANGLES = 8;
const BOX_EPSILON = 1e-7;
const cache = new WeakMap();
const diagnostics = {
  builds: 0,
  queries: 0,
  candidateTriangles: 0,
  fallbacks: 0,
};

export function getNativeRaycastDiagnostics() {
  return { ...diagnostics };
}

export function installNativeRaycastBVH(Mesh) {
  const original = Mesh.prototype._computeIntersections;
  if (typeof original !== 'function') {
    throw new Error('three.invalid: upstream Mesh intersection path is unavailable');
  }
  Mesh.prototype._computeIntersections = function (raycaster, intersects, ray) {
    const candidates = candidateTriangles(this, ray);
    if (candidates === null) {
      diagnostics.fallbacks++;
      return original.call(this, raycaster, intersects, ray);
    }
    diagnostics.queries++;
    diagnostics.candidateTriangles += candidates.length;
    if (candidates.length === 0) return;

    const geometry = this.geometry;
    const originalIndex = geometry.index;
    const firstIntersection = intersects.length;
    geometry.index = filteredIndex(originalIndex, candidates);
    try {
      original.call(this, raycaster, intersects, ray);
    } finally {
      geometry.index = originalIndex;
    }
    for (let i = firstIntersection; i < intersects.length; i++) {
      const intersection = intersects[i];
      const faceIndex = intersection && intersection.faceIndex;
      if (Number.isInteger(faceIndex) && candidates[faceIndex] !== undefined) {
        intersection.faceIndex = candidates[faceIndex];
      }
    }
  };
}

function candidateTriangles(mesh, ray) {
  const geometry = mesh.geometry;
  if (!geometry || mesh.isSkinnedMesh || Array.isArray(mesh.material)) return null;
  if (geometry.morphAttributes && geometry.morphAttributes.position) return null;
  const position = geometry.attributes && geometry.attributes.position;
  const index = geometry.index;
  if (!eligibleAttributes(position, index) || !fullDrawRange(geometry)) return null;
  let entry = cache.get(geometry);
  if (!validCacheEntry(entry, position, index)) {
    entry = buildBVH(position, index);
    cache.set(geometry, entry);
    diagnostics.builds++;
  }
  return queryBVH(entry, ray);
}

function eligibleAttributes(position, index) {
  return !!(
    position &&
    index &&
    position.isBufferAttribute &&
    index.isBufferAttribute &&
    !position.isInterleavedBufferAttribute &&
    !index.isInterleavedBufferAttribute &&
    position.itemSize === 3 &&
    index.itemSize === 1 &&
    !position.normalized &&
    !index.normalized &&
    position.array &&
    index.array &&
    index.count >= MIN_TRIANGLES * 3 &&
    index.count % 3 === 0
  );
}

function fullDrawRange(geometry) {
  const range = geometry.drawRange;
  return !range || (range.start === 0 && range.count === Infinity);
}

function validCacheEntry(entry, position, index) {
  return !!(
    entry &&
    entry.position === position &&
    entry.index === index &&
    entry.positionArray === position.array &&
    entry.indexArray === index.array &&
    entry.positionVersion === position.version &&
    entry.indexVersion === index.version
  );
}

function buildBVH(position, index) {
  const positions = position.array;
  const indices = index.array;
  const triangleCount = index.count / 3;
  const order = new Uint32Array(triangleCount);
  const centroids = new Float64Array(triangleCount * 3);
  const bounds = new Float64Array(triangleCount * 6);
  for (let triangle = 0; triangle < triangleCount; triangle++) {
    order[triangle] = triangle;
    const offset = triangle * 3;
    const a = indices[offset] * 3;
    const b = indices[offset + 1] * 3;
    const c = indices[offset + 2] * 3;
    const target = triangle * 6;
    for (let axis = 0; axis < 3; axis++) {
      const av = positions[a + axis];
      const bv = positions[b + axis];
      const cv = positions[c + axis];
      const min = Math.min(av, bv, cv) - BOX_EPSILON;
      const max = Math.max(av, bv, cv) + BOX_EPSILON;
      bounds[target + axis] = min;
      bounds[target + axis + 3] = max;
      centroids[offset + axis] = (av + bv + cv) / 3;
    }
  }
  const nodes = [];
  buildNode(nodes, order, centroids, bounds, 0, triangleCount);
  return {
    position,
    index,
    positionArray: positions,
    indexArray: indices,
    positionVersion: position.version,
    indexVersion: index.version,
    nodes,
    order,
  };
}

function buildNode(nodes, order, centroids, bounds, start, end) {
  const node = {
    minX: Infinity,
    minY: Infinity,
    minZ: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    maxZ: -Infinity,
    centroidMinX: Infinity,
    centroidMinY: Infinity,
    centroidMinZ: Infinity,
    centroidMaxX: -Infinity,
    centroidMaxY: -Infinity,
    centroidMaxZ: -Infinity,
    start: -1,
    count: -1,
    left: -1,
    right: -1,
  };
  const nodeId = nodes.length;
  nodes.push(node);
  for (let i = start; i < end; i++) {
    const triangle = order[i];
    const b = triangle * 6;
    const c = triangle * 3;
    node.minX = Math.min(node.minX, bounds[b]);
    node.minY = Math.min(node.minY, bounds[b + 1]);
    node.minZ = Math.min(node.minZ, bounds[b + 2]);
    node.maxX = Math.max(node.maxX, bounds[b + 3]);
    node.maxY = Math.max(node.maxY, bounds[b + 4]);
    node.maxZ = Math.max(node.maxZ, bounds[b + 5]);
    node.centroidMinX = Math.min(node.centroidMinX, centroids[c]);
    node.centroidMinY = Math.min(node.centroidMinY, centroids[c + 1]);
    node.centroidMinZ = Math.min(node.centroidMinZ, centroids[c + 2]);
    node.centroidMaxX = Math.max(node.centroidMaxX, centroids[c]);
    node.centroidMaxY = Math.max(node.centroidMaxY, centroids[c + 1]);
    node.centroidMaxZ = Math.max(node.centroidMaxZ, centroids[c + 2]);
  }
  const count = end - start;
  if (count <= LEAF_TRIANGLES) {
    node.start = start;
    node.count = count;
    return nodeId;
  }
  const extentX = node.centroidMaxX - node.centroidMinX;
  const extentY = node.centroidMaxY - node.centroidMinY;
  const extentZ = node.centroidMaxZ - node.centroidMinZ;
  const axis = extentX >= extentY && extentX >= extentZ
    ? 0
    : extentY >= extentZ ? 1 : 2;
  const sorted = order.slice(start, end);
  sorted.sort((a, b) => centroids[a * 3 + axis] - centroids[b * 3 + axis] || a - b);
  order.set(sorted, start);
  const middle = start + Math.floor(count / 2);
  node.left = buildNode(nodes, order, centroids, bounds, start, middle);
  node.right = buildNode(nodes, order, centroids, bounds, middle, end);
  return nodeId;
}

function queryBVH(entry, ray) {
  const nodes = entry.nodes;
  const order = entry.order;
  const stack = new Int32Array(nodes.length);
  const candidates = [];
  const origin = ray.origin;
  const direction = ray.direction;
  let top = 0;
  stack[top++] = 0;
  while (top > 0) {
    const node = nodes[stack[--top]];
    if (!rayIntersectsNode(node, origin, direction)) continue;
    if (node.count >= 0) {
      const end = node.start + node.count;
      for (let i = node.start; i < end; i++) candidates.push(order[i]);
    } else {
      stack[top++] = node.left;
      stack[top++] = node.right;
    }
  }
  candidates.sort((a, b) => a - b);
  return candidates;
}

function rayIntersectsNode(node, origin, direction) {
  let near = 0;
  let far = Infinity;
  if (direction.x === 0) {
    if (origin.x < node.minX || origin.x > node.maxX) return false;
  } else {
    let a = (node.minX - origin.x) / direction.x;
    let b = (node.maxX - origin.x) / direction.x;
    if (a > b) { const swap = a; a = b; b = swap; }
    near = Math.max(near, a);
    far = Math.min(far, b);
    if (far < near) return false;
  }
  if (direction.y === 0) {
    if (origin.y < node.minY || origin.y > node.maxY) return false;
  } else {
    let a = (node.minY - origin.y) / direction.y;
    let b = (node.maxY - origin.y) / direction.y;
    if (a > b) { const swap = a; a = b; b = swap; }
    near = Math.max(near, a);
    far = Math.min(far, b);
    if (far < near) return false;
  }
  if (direction.z === 0) {
    if (origin.z < node.minZ || origin.z > node.maxZ) return false;
  } else {
    let a = (node.minZ - origin.z) / direction.z;
    let b = (node.maxZ - origin.z) / direction.z;
    if (a > b) { const swap = a; a = b; b = swap; }
    near = Math.max(near, a);
    far = Math.min(far, b);
    if (far < near) return false;
  }
  return true;
}

function filteredIndex(index, candidates) {
  const source = index.array;
  const array = new index.array.constructor(candidates.length * 3);
  for (let i = 0; i < candidates.length; i++) {
    const sourceOffset = candidates[i] * 3;
    const targetOffset = i * 3;
    array[targetOffset] = source[sourceOffset];
    array[targetOffset + 1] = source[sourceOffset + 1];
    array[targetOffset + 2] = source[sourceOffset + 2];
  }
  return new index.constructor(array, 1, index.normalized);
}
