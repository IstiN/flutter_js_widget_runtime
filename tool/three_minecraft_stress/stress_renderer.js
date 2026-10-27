import { pollRawPointer, reportStressRender } from './native_adapter.js';

const MIN_INSTANCE_CAPACITY = 64;
let translationRayMesh = null;
let translationLocalMatrix = null;
let translationWorldMatrix = null;
let translationSphere = null;
const translationIntersects = [];

function isTranslationMatrix(elements) {
  return elements[0] === 1 && elements[1] === 0 && elements[2] === 0 && elements[3] === 0 &&
    elements[4] === 0 && elements[5] === 1 && elements[6] === 0 && elements[7] === 0 &&
    elements[8] === 0 && elements[9] === 0 && elements[10] === 1 && elements[11] === 0 &&
    elements[15] === 1;
}

// Preserve the original linear fog and directional shadow-map request in R1.
export class StressWebGLRenderer extends globalThis.THREE.WebGLRenderer {
  constructor(parameters = {}) {
    super(parameters);
    this.isJsrMinecraftStressRenderer = true;
    this.stressProfile = 'native-linear-fog-pcf-shadows';
    this._capacityChunks = new WeakSet();
    this._capacityWorld = null;
  }

  // Upstream reserves 65,536 matrices for every block type in every chunk.
  // Compact once after generation; addBlockInstance transparently regrows.
  _manageInstancedCapacity(mesh) {
    if (!mesh.isInstancedMesh || mesh.userData.jsrCapacityManaged) return;
    mesh.userData.jsrCapacityManaged = true;
    const attribute = mesh.instanceMatrix;
    let capacity = MIN_INSTANCE_CAPACITY;
    while (capacity < mesh.count) capacity *= 2;
    if (attribute.count !== capacity) {
      const compact = new globalThis.THREE.InstancedBufferAttribute(
        attribute.array.slice(0, capacity * 16), 16
      );
      compact.usage = attribute.usage;
      mesh.instanceMatrix = compact;
    }
    const setMatrixAt = mesh.setMatrixAt;
    mesh.setMatrixAt = function (index, matrix) {
      if (index >= this.instanceMatrix.count) {
        let grownCapacity = this.instanceMatrix.count || MIN_INSTANCE_CAPACITY;
        while (grownCapacity <= index) grownCapacity *= 2;
        const previous = this.instanceMatrix;
        const grown = new globalThis.THREE.InstancedBufferAttribute(
          new Float32Array(grownCapacity * 16), 16
        );
        grown.array.set(previous.array);
        grown.usage = previous.usage;
        this.instanceMatrix = grown;
      }
      if (!isTranslationMatrix(matrix.elements)) this.userData.jsrTranslationMatrices = false;
      setMatrixAt.call(this, index, matrix);
    };
    this._installTranslationRaycast(mesh);
  }

  // Minecraft blocks use translation-only unit transforms. Reuse their exact
  // geometry bounding spheres as a scalar prefilter, then delegate candidate
  // hits to the ordinary Mesh raycast. Any other transform takes upstream's
  // full InstancedMesh path, so this changes cost rather than hit semantics.
  _installTranslationRaycast(mesh) {
    const matrices = mesh.instanceMatrix.array;
    mesh.userData.jsrTranslationMatrices = true;
    for (let index = 0; index < mesh.count; index++) {
      const offset = index * 16;
      for (let component = 0; component < 16; component++) {
        const expected = component % 5 === 0 ? 1 : 0;
        if (component >= 12 && component <= 14) continue;
        if (matrices[offset + component] !== expected) {
          mesh.userData.jsrTranslationMatrices = false;
          break;
        }
      }
      if (!mesh.userData.jsrTranslationMatrices) break;
    }
    const raycast = mesh.raycast;
    mesh.raycast = function (raycaster, intersects) {
      if (!this.userData.jsrTranslationMatrices || !isTranslationMatrix(this.matrixWorld.elements)) {
        return raycast.call(this, raycaster, intersects);
      }
      const geometry = this.geometry;
      if (!geometry || !this.material) return;
      if (geometry.boundingSphere === null) geometry.computeBoundingSphere();
      const center = geometry.boundingSphere.center;
      if (center.x !== 0 || center.y !== 0 || center.z !== 0) {
        return raycast.call(this, raycaster, intersects);
      }
      if (this.boundingSphere === null) this.computeBoundingSphere();
      if (!translationRayMesh) {
        translationRayMesh = new globalThis.THREE.Mesh();
        translationLocalMatrix = new globalThis.THREE.Matrix4();
        translationWorldMatrix = new globalThis.THREE.Matrix4();
        translationSphere = new globalThis.THREE.Sphere();
      }
      translationSphere.copy(this.boundingSphere).applyMatrix4(this.matrixWorld);
      if (!raycaster.ray.intersectsSphere(translationSphere)) return;
      translationRayMesh.geometry = geometry;
      translationRayMesh.material = this.material;
      const world = this.matrixWorld.elements;
      const origin = raycaster.ray.origin;
      const direction = raycaster.ray.direction;
      const radius = geometry.boundingSphere.radius;
      const radiusSquared = radius * radius + 0.000001;
      const values = this.instanceMatrix.array;
      for (let instanceId = 0; instanceId < this.count; instanceId++) {
        const offset = instanceId * 16;
        const vx = values[offset + 12] + world[12] - origin.x;
        const vy = values[offset + 13] + world[13] - origin.y;
        const vz = values[offset + 14] + world[14] - origin.z;
        const along = vx * direction.x + vy * direction.y + vz * direction.z;
        if (along < -radius || along > raycaster.far + radius || along + radius < raycaster.near) continue;
        const clamped = Math.max(0, along);
        const distanceSquared = vx * vx + vy * vy + vz * vz - clamped * clamped;
        if (distanceSquared > radiusSquared) continue;
        this.getMatrixAt(instanceId, translationLocalMatrix);
        translationWorldMatrix.multiplyMatrices(this.matrixWorld, translationLocalMatrix);
        translationRayMesh.matrixWorld = translationWorldMatrix;
        translationRayMesh.raycast(raycaster, translationIntersects);
        for (const hit of translationIntersects) {
          hit.instanceId = instanceId;
          hit.object = this;
          intersects.push(hit);
        }
        translationIntersects.length = 0;
      }
    };
  }

  // The selection ray has a three-block range. Exclude only chunk AABBs it
  // cannot reach, and restore the complete world before rendering continues.
  _installRaycastBroadphase(player) {
    if (!player) return;
    if (!player.userData) player.userData = {};
    if (player.userData.jsrRaycastBroadphase) return;
    player.userData.jsrRaycastBroadphase = true;
    const updateRaycaster = player.updateRaycaster;
    player.updateRaycaster = function (world) {
      const raycaster = this.raycaster;
      const camera = this.camera;
      const children = world && world.children;
      if (!raycaster || !camera || !Array.isArray(children) ||
          !Number.isFinite(raycaster.far) || raycaster.far < 0) {
        return updateRaycaster.call(this, world);
      }
      const origin = camera.position;
      const farSquared = raycaster.far * raycaster.far;
      const candidates = children.filter(chunk => {
        const size = chunk.size;
        const position = chunk.position;
        if (!size || !position) return true;
        const dx = origin.x < position.x ? position.x - origin.x :
          origin.x > position.x + size.width ? origin.x - position.x - size.width : 0;
        const dy = origin.y < position.y ? position.y - origin.y :
          origin.y > position.y + size.height ? origin.y - position.y - size.height : 0;
        const dz = origin.z < position.z ? position.z - origin.z :
          origin.z > position.z + size.width ? origin.z - position.z - size.width : 0;
        return dx * dx + dy * dy + dz * dz <= farSquared;
      });
      if (candidates.length === children.length) return updateRaycaster.call(this, world);
      world.children = candidates;
      try {
        return updateRaycaster.call(this, world);
      } finally {
        world.children = children;
      }
    };
  }

  _manageChunkResources(scene) {
    const world = this._capacityWorld || scene.children.find(
      child => typeof child.generate === 'function' && typeof child.drawDistance === 'number'
    );
    if (!world) return;
    this._capacityWorld = world;
    if (this._raycastWorld !== world) {
      this._raycastWorld = world;
      const adapter = this;
      const updateWorld = world.update;
      world.update = function (player) {
        adapter._installRaycastBroadphase(player);
        return updateWorld.apply(this, arguments);
      };
    }
    for (const chunk of world.children) {
      if (!chunk.loaded || this._capacityChunks.has(chunk)) continue;
      for (const child of chunk.children) this._manageInstancedCapacity(child);
      const disposeInstances = chunk.disposeInstances;
      chunk.disposeInstances = function () {
        // Water owns per-chunk geometry/material; block resources are shared.
        this.traverse(object => {
          if (!object.isMesh || object.isInstancedMesh) return;
          if (object.geometry) object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) if (material) material.dispose();
        });
        return disposeInstances.call(this);
      };
      this._capacityChunks.add(chunk);
    }
  }

  render(scene, camera) {
    pollRawPointer();
    this._manageChunkResources(scene);
    const fog = scene.fog;
    const shadowEnabled = this.shadowMap.enabled;
    const shadowType = this.shadowMap.type;
    const requested = {
      fog: fog ? {
        near: fog.near,
        far: fog.far,
        color: fog.color && typeof fog.color.getHex === 'function' ? fog.color.getHex() : null
      } : null,
      shadows: { enabled: !!shadowEnabled, type: shadowType === undefined ? null : shadowType }
    };
    let error = null;
    try {
      return super.render(scene, camera);
    } catch (caught) {
      error = caught;
      throw caught;
    } finally {
      reportStressRender(this, scene, camera, {
        requested,
        rendered: { fog: requested.fog, shadows: requested.shadows },
        restored: {
          fog: scene.fog === fog,
          shadows: this.shadowMap.enabled === shadowEnabled && this.shadowMap.type === shadowType
        },
        error: error && error.message ? error.message : null
      });
    }
  }
}
