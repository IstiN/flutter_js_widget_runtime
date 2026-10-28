import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { pollRawPointer, reportChunkGeneration, reportChunkPhase, reportStressRender, reportStressTiming } from './native_adapter.js';

const MIN_INSTANCE_CAPACITY = 64;
let translationRayMesh = null;
let translationLocalMatrix = null;
let translationWorldMatrix = null;
let translationSphere = null;
const translationIntersects = [];
let activeStressRenderer = null;
const chunkWorldOwners = new WeakMap();
const instrumentedChunkPrototypes = new WeakSet();

function installChunkAddHook(adapter) {
  activeStressRenderer = adapter;
  const prototype = globalThis.THREE.Object3D.prototype;
  if (prototype.__jsrMinecraftStressChunkHook) return;
  const add = prototype.add;
  prototype.add = function () {
    const result = add.apply(this, arguments);
    if (typeof this.generate === 'function' && typeof this.drawDistance === 'number' &&
        this.children.length > 0) {
      let owner = chunkWorldOwners.get(this);
      if (!owner && activeStressRenderer) {
        owner = activeStressRenderer;
        chunkWorldOwners.set(this, owner);
      }
      if (owner) owner._manageChunkGeneration(this);
    }
    return result;
  };
  prototype.__jsrMinecraftStressChunkHook = true;
}

// Exact RNG algorithm from the pinned reference, kept here so incremental
// generation does not need to modify or re-import the reference modules.
function createReferenceRng(seed) {
  return {
    m_w: (123456789 + seed) & 0xffffffff,
    m_z: (987654321 - seed) & 0xffffffff,
    random() {
      this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & 0xffffffff;
      this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & 0xffffffff;
      return (((this.m_z << 16) + (this.m_w & 65535)) >>> 0) / 4294967296;
    }
  };
}

function ensureInstanceCapacity(mesh, index) {
  if (index < mesh.instanceMatrix.count) return;
  let capacity = mesh.instanceMatrix.count || MIN_INSTANCE_CAPACITY;
  while (capacity <= index) capacity *= 2;
  const previous = mesh.instanceMatrix;
  const grown = new globalThis.THREE.InstancedBufferAttribute(
    new Float32Array(capacity * 16), 16
  );
  grown.array.set(previous.array);
  grown.usage = previous.usage;
  mesh.instanceMatrix = grown;
}

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
    this.shadowMap.autoUpdate = false;
    this.shadowMap.needsUpdate = true;
    installChunkAddHook(this);
    this._capacityChunks = new WeakSet();
    this._generationWorlds = new WeakSet();
    this._capacityWorld = null;
    this._globalBatchGroup = null;
    this._globalBatchMeshes = new Map();
    this._globalBatchStates = new WeakMap();
    this._globalBatchRegionChunks = new Map();
    this._globalBatchMergeJob = null;
    this._globalBatchOverlaySlots = [];
    this._globalBatchOverlayRegions = new Map();
    this._globalBatchOverlaySerial = 0;
    this._globalBatchForce = true;
    this._stressSun = null;
    this._stressSunAnchor = null;
    this._stressMotionTarget = null;
    this._stressLastMotionAt = -Infinity;
    this._chunkWorkQueue = [];
    this._chunkWorkDrainScheduled = false;
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
      ensureInstanceCapacity(this, index);
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

  _manageChunkGeneration(world) {
    const owner = chunkWorldOwners.get(world);
    if (owner && owner !== this) return;
    if (!owner) chunkWorldOwners.set(world, this);
    if (!this._chunkMeshTemplates) {
      const source = world.children.find(chunk => chunk.loaded &&
        chunk.children.some(child => child.isInstancedMesh));
      if (source) {
        this._chunkMeshTemplates = source.children.filter(child => child.isInstancedMesh);
      }
    }
    const firstChunk = world.children[0];
    const prototype = firstChunk && firstChunk.constructor.prototype;
    if (!prototype || this._generationWorlds.has(world)) return;
    this._generationWorlds.add(world);

    if (!instrumentedChunkPrototypes.has(prototype)) {
      instrumentedChunkPrototypes.add(prototype);
      // Applying saved edits must scale with the edit count, not 32^3 keys.
      const loadPlayerChanges = prototype.loadPlayerChanges;
      prototype.loadPlayerChanges = function () {
        const data = this.dataStore.data;
        const keys = Object.keys(data);
        if (keys.length > 32768) return loadPlayerChanges.call(this);
        for (const key of keys) {
          const blockId = data[key];
          if (blockId === undefined) continue;
          const parts = key.split(',');
          if (parts.length !== 5) continue;
          const values = parts.map(Number);
          if (values[0] !== this.position.x || values[1] !== this.position.z) continue;
          this.setBlockId(values[2], values[3], values[4], blockId);
        }
      };
      for (const name of ['initializeTerrain', 'generateTerrain', 'generateClouds', 'loadPlayerChanges', 'generateMeshes']) {
        const phase = prototype[name];
        prototype[name] = function () {
          const started = performance.now();
          try {
            return phase.apply(this, arguments);
          } finally {
            reportChunkPhase(name, performance.now() - started);
          }
        };
      }
    }

    const adapter = this;
    const WorldChunk = firstChunk.constructor;
    const generate = prototype.generate;
    const wrapGenerate = chunk => {
      chunk.generate = function () {
        if (!adapter._chunkMeshTemplates) {
          const started = performance.now();
          try {
            const result = generate.call(this);
            const meshes = this.children.filter(child => child.isInstancedMesh);
            if (this.loaded && meshes.length) adapter._chunkMeshTemplates = meshes;
            return result;
          } finally {
            reportChunkGeneration(performance.now() - started, this);
          }
        }
        return adapter._generateChunkIncrementally(this, world);
      };
      return chunk;
    };
    for (const chunk of world.children) wrapGenerate(chunk);
    // Own each world's factory instead of patching the shared WorldChunk
    // prototype: synchronous worlds must stay synchronous, and parallel
    // renderers must never capture each other's partially generated chunks.
    world.generateChunk = function (x, z) {
      const chunk = wrapGenerate(new WorldChunk(this.chunkSize, this.params, this.dataStore));
      chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
      chunk.userData = { x, z };
      if (this.asyncLoading) {
        globalThis.requestIdleCallback(chunk.generate.bind(chunk), { timeout: 100 });
      } else {
        chunk.generate();
      }
      this.add(chunk);
      console.log(`Adding chunk at X: ${x} Z: ${z}`);
    };
  }

  _scheduleChunkWork(run) {
    this._chunkWorkQueue.push(run);
    if (this._chunkWorkDrainScheduled) return;
    this._chunkWorkDrainScheduled = true;
    globalThis.requestIdleCallback(() => this._drainChunkWork(), { timeout: 100 });
  }

  _drainChunkWork() {
    this._chunkWorkDrainScheduled = false;
    const started = performance.now();
    while (this._chunkWorkQueue.length && performance.now() - started < 4) {
      // Finish one chunk before starting the next. Round-robin makes a whole
      // row complete together and recreates the very GPU upload spike this
      // queue is meant to avoid.
      const complete = this._chunkWorkQueue[0]();
      if (complete) this._chunkWorkQueue.shift();
    }
    if (this._chunkWorkQueue.length) {
      this._chunkWorkDrainScheduled = true;
      globalThis.requestIdleCallback(() => this._drainChunkWork(), { timeout: 100 });
    }
  }

  _generateChunkIncrementally(chunk, world) {
    const templates = this._chunkMeshTemplates;
    const blocks = globalThis.__jsrMinecraftStressBlocks;
    if (!blocks) throw new Error('Reference blocks were not initialized');
    const rng = createReferenceRng(chunk.params.seed);
    const matrix = new globalThis.THREE.Matrix4();
    const meshes = {};
    const meshList = [];
    let phase = 0;
    let x = 0;
    let y = 0;
    let z = 0;
    let simplex = null;
    let cpuMs = 0;
    let complete = false;
    let addedMeshes = 0;

    const step = () => {
      const started = performance.now();
      if (phase === 0) {
        if (x === 0) chunk.data = [];
        const slice = [];
        for (let y = 0; y < chunk.size.height; y++) {
          const row = [];
          for (let z = 0; z < chunk.size.width; z++) {
            row.push({ id: blocks.empty.id, instanceId: null });
          }
          slice.push(row);
        }
        chunk.data.push(slice);
        x++;
        if (x === chunk.size.width) {
          phase++;
          x = 0;
        }
      } else if (phase === 1) {
        // Preserve the reference's single SimplexNoise/RNG stream and exact
        // X→Z→descending-Y order across arbitrarily small idle slices.
        if (!simplex) {
          simplex = new SimplexNoise(rng);
          y = chunk.size.height;
        }
        while (x < chunk.size.width) {
          const biome = chunk.getBiome(simplex, x, z);
          const value = simplex.noise(
            (chunk.position.x + x) / chunk.params.terrain.scale,
            (chunk.position.z + z) / chunk.params.terrain.scale
          );
          const scaledNoise = chunk.params.terrain.offset +
            chunk.params.terrain.magnitude * value;
          let height = Math.floor(scaledNoise);
          height = Math.max(0, Math.min(height, chunk.size.height - 1));
          while (y >= 0) {
            if (y <= chunk.params.terrain.waterOffset && y === height) {
              chunk.setBlockId(x, y, z, blocks.sand.id);
            } else if (y === height) {
              let groundBlockType;
              if (biome === 'Desert') {
                groundBlockType = blocks.sand.id;
              } else if (biome === 'Temperate' || biome === 'Jungle') {
                groundBlockType = blocks.grass.id;
              } else if (biome === 'Tundra') {
                groundBlockType = blocks.snow.id;
              } else if (biome === 'Jungle') {
                groundBlockType = blocks.jungleGrass.id;
              }
              chunk.setBlockId(x, y, z, groundBlockType);
              if (rng.random() < chunk.params.trees.frequency) {
                chunk.generateTree(rng, biome, x, height + 1, z);
              }
            } else if (y < height && chunk.getBlock(x, y, z).id === blocks.empty.id) {
              chunk.generateResourceIfNeeded(simplex, x, y, z);
            }
            y--;
            if (performance.now() - started >= 2) break;
          }
          if (y >= 0) break;
          z++;
          if (z === chunk.size.width) {
            z = 0;
            x++;
          }
          y = chunk.size.height;
          if (performance.now() - started >= 2) break;
        }
        if (x === chunk.size.width) {
          phase++;
          x = 0;
          simplex = null;
        }
      } else if (phase === 2) {
        if (x === 0) simplex = new SimplexNoise(rng);
        for (let z = 0; z < chunk.size.width; z++) {
          const value = (simplex.noise(
            (chunk.position.x + x) / chunk.params.clouds.scale,
            (chunk.position.z + z) / chunk.params.clouds.scale
          ) + 1) * 0.5;
          if (value < chunk.params.clouds.density) {
            chunk.setBlockId(x, chunk.size.height - 1, z, blocks.cloud.id);
          }
        }
        x++;
        if (x === chunk.size.width) {
          phase++;
          x = 0;
          simplex = null;
        }
      } else if (phase === 3) {
        chunk.loadPlayerChanges();
        phase++;
      } else if (phase === 4) {
        chunk.clear();
        chunk.generateWater();
        for (const template of templates) {
          const mesh = new globalThis.THREE.InstancedMesh(
            template.geometry, template.material, MIN_INSTANCE_CAPACITY
          );
          mesh.name = template.name;
          mesh.updateMatrix();
          mesh.matrixAutoUpdate = false;
          mesh.count = 0;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          meshes[mesh.name] = mesh;
          meshList.push(mesh);
        }
        phase++;
        x = 0;
        y = 0;
        z = 0;
      } else {
        // Preserve the reference X→Y→Z order exactly, but make the budget
        // resumable at one block rather than after a whole expensive X slice.
        while (x < chunk.size.width) {
          const blockId = chunk.getBlock(x, y, z).id;
          const mesh = meshes[blockId];
          if (mesh && !chunk.isBlockObscured(x, y, z)) {
            const instanceId = mesh.count;
            ensureInstanceCapacity(mesh, instanceId);
            matrix.setPosition(x, y, z);
            mesh.setMatrixAt(instanceId, matrix);
            chunk.setBlockInstanceId(x, y, z, instanceId);
            mesh.count++;
          }
          z++;
          if (z === chunk.size.width) {
            z = 0;
            y++;
            if (y === chunk.size.height) {
              y = 0;
              x++;
            }
          }
          if (performance.now() - started >= 2) break;
        }
        if (x === chunk.size.width) {
          // Do not publish thirteen new native instance buffers in one frame.
          // The original mesh order (and therefore all instance IDs) is kept.
          const end = Math.min(addedMeshes + 2, meshList.length);
          while (addedMeshes < end) {
            const mesh = meshList[addedMeshes++];
            mesh.visible = false;
            chunk.add(mesh);
          }
          if (addedMeshes === meshList.length) {
            chunk.loaded = true;
            complete = true;
          }
        }
      }
      const elapsed = performance.now() - started;
      cpuMs += elapsed;
      reportChunkPhase('generateStep', elapsed);
      if (complete) reportChunkGeneration(cpuMs, chunk);
    };
    if (!world.asyncLoading) {
      while (!complete) step();
      return;
    }
    const run = () => {
      step();
      return complete;
    };
    this._scheduleChunkWork(run);
  }

  _manageChunkResources(scene) {
    const world = this._capacityWorld || scene.children.find(
      child => typeof child.generate === 'function' && typeof child.drawDistance === 'number'
    );
    if (!world) return;
    this._capacityWorld = world;
    if (world.matrixAutoUpdate) {
      world.updateMatrix();
      world.matrixAutoUpdate = false;
    }
    this._manageChunkGeneration(world);
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
      chunk.updateMatrix();
      chunk.matrixAutoUpdate = false;
      for (const child of chunk.children) {
        child.updateMatrix();
        child.matrixAutoUpdate = false;
        this._manageInstancedCapacity(child);
      }
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
    return world;
  }

  _globalBatchRegionKey(chunk) {
    const width = chunk.size.width * 3;
    return Math.floor(chunk.position.x / width) + ':' + Math.floor(chunk.position.z / width);
  }

  _createOverlayMeshes(templates) {
    const slotIndex = this._globalBatchOverlaySerial++;
    const meshes = [];
    for (const template of templates) {
      const mesh = new globalThis.THREE.InstancedMesh(
        template.geometry, template.material, MIN_INSTANCE_CAPACITY
      );
      mesh.name = template.name;
      mesh.updateMatrix();
      mesh.matrixAutoUpdate = false;
      mesh.count = 0;
      mesh.castShadow = template.castShadow;
      mesh.receiveShadow = template.receiveShadow;
      mesh.userData.jsrGlobalBatch = true;
      mesh.userData.jsrRetainEmptyBatch = true;
      mesh.userData.jsrRegionKey = 'overlay:' + slotIndex;
      this._globalBatchGroup.add(mesh);
      meshes.push(mesh);
    }
    return meshes;
  }

  _syncChunkOverlays(currentRegions, pendingRegions, deferCompaction) {
    const templates = this._chunkMeshTemplates;
    const overlayRegions = new Map();
    for (const [regionKey, chunks] of currentRegions) {
      const included = this._globalBatchRegionChunks.get(regionKey);
      // Existing regions append directly into stable buffers. Only a wholly
      // new region needs a temporary overlay before its zero-upload promote.
      if (this._globalBatchRegionChunks.has(regionKey)) continue;
      for (const chunk of chunks) {
        if (included && included.has(chunk)) continue;
        let overlay = overlayRegions.get(regionKey);
        if (!overlay) overlayRegions.set(regionKey, overlay = []);
        overlay.push(chunk);
      }
    }
    const localMatrix = new globalThis.THREE.Matrix4();
    const composedMatrix = new globalThis.THREE.Matrix4();
    for (const [regionKey, chunks] of overlayRegions) {
      let slot = this._globalBatchOverlayRegions.get(regionKey);
      // Publish once per complete incoming region, not after every chunk.
      // An already published slot remains valid while the next group streams.
      if (pendingRegions.has(regionKey)) continue;
      if (!slot) {
        slot = this._globalBatchOverlaySlots.find(candidate => !candidate.regionKey);
        if (!slot) {
          slot = {
            regionKey: null,
            meshes: this._createOverlayMeshes(templates),
            signature: null,
            chunkSet: new Set()
          };
          this._globalBatchOverlaySlots.push(slot);
        }
        slot.regionKey = regionKey;
        slot.signature = null;
        this._globalBatchOverlayRegions.set(regionKey, slot);
      }
      const signature = chunks.map(chunk => chunk.id + ':' + chunk.children.map(child => {
        if (!child.isInstancedMesh) return '';
        const world = child.matrixWorld.elements;
        return child.instanceMatrix.version + ':' + child.count + ':' +
          world[12] + ':' + world[13] + ':' + world[14];
      }).join(',')).join('|');
      if (slot.signature !== signature) {
        slot.signature = signature;
        slot.chunkSet = new Set(chunks);
        slot.buildIndex = 0;
        slot.ready = false;
        for (const mesh of slot.meshes) {
          mesh.count = 0;
          mesh.instanceMatrix.version++;
          mesh.boundingSphere = null;
        }
      }
      if (slot.ready) continue;
      const end = Math.min(slot.buildIndex + (deferCompaction ? 1 : 2), templates.length);
      for (; slot.buildIndex < end; slot.buildIndex++) {
        const template = templates[slot.buildIndex];
        const mesh = slot.meshes[slot.buildIndex];
        mesh.count = 0;
        for (const chunk of chunks) {
          for (const child of chunk.children) {
            if (!child.isInstancedMesh || child.name !== template.name) continue;
            if (child.count) ensureInstanceCapacity(mesh, mesh.count + child.count - 1);
            const source = child.instanceMatrix.array;
            const target = mesh.instanceMatrix.array;
            const world = child.matrixWorld.elements;
            const translationOnly = isTranslationMatrix(world);
            for (let instance = 0; instance < child.count; instance++) {
              const sourceOffset = instance * 16;
              const targetOffset = mesh.count * 16;
              if (translationOnly) {
                for (let component = 0; component < 16; component++) {
                  target[targetOffset + component] = source[sourceOffset + component];
                }
                target[targetOffset + 12] += world[12];
                target[targetOffset + 13] += world[13];
                target[targetOffset + 14] += world[14];
              } else {
                localMatrix.fromArray(source, sourceOffset);
                composedMatrix.multiplyMatrices(child.matrixWorld, localMatrix);
                mesh.setMatrixAt(mesh.count, composedMatrix);
              }
              mesh.count++;
            }
          }
        }
        mesh.instanceMatrix.version++;
        mesh.boundingSphere = null;
      }
      slot.ready = slot.buildIndex === templates.length;
      if (slot.ready) this.shadowMap.needsUpdate = true;
    }
    for (const slot of this._globalBatchOverlaySlots) {
      if (!slot.regionKey || overlayRegions.has(slot.regionKey)) continue;
      this._globalBatchOverlayRegions.delete(slot.regionKey);
      slot.regionKey = null;
      slot.signature = null;
      slot.chunkSet = new Set();
      for (const mesh of slot.meshes) {
        mesh.count = 0;
        mesh.instanceMatrix.version++;
        mesh.boundingSphere = null;
      }
    }
    const freeRegionalSlots = this._globalBatchOverlaySlots.filter(slot => !slot.regionKey).length;
    if (!deferCompaction && freeRegionalSlots > 1) {
      const index = this._globalBatchOverlaySlots.findIndex(slot => !slot.regionKey);
      if (index >= 0) {
        const slot = this._globalBatchOverlaySlots[index];
        for (const mesh of slot.meshes) this._globalBatchGroup.remove(mesh);
        this._globalBatchOverlaySlots.splice(index, 1);
      }
    }
  }

  _updateStressMotion(scene) {
    if (!this._stressSun || this._stressSun.parent !== scene) {
      this._stressSun = scene.children.find(child => child.isDirectionalLight && child.castShadow) || null;
      this._stressMotionTarget = null;
    }
    if (!this._stressSun) return;
    const target = this._stressSun.target.position;
    const previous = this._stressMotionTarget;
    if (previous && (Math.abs(target.x - previous.x) + Math.abs(target.y - previous.y) +
        Math.abs(target.z - previous.z) > 0.0001)) {
      this._stressLastMotionAt = performance.now();
    }
    this._stressMotionTarget = { x: target.x, y: target.y, z: target.z };
  }

  _hideChunkSources(currentRegions) {
    for (const chunks of currentRegions.values()) {
      for (const chunk of chunks) {
        // Only instanced block sources are replaced by regional batches. Keep
        // the chunk group visible for ordinary meshes such as the water plane.
        chunk.visible = true;
        chunk.updateMatrix();
        chunk.matrixAutoUpdate = false;
        for (const child of chunk.children) {
          if (!child.isInstancedMesh) continue;
          child.visible = false;
          child.updateMatrix();
          child.matrixAutoUpdate = false;
        }
      }
    }
  }

  _promoteOverlayRegion(regionKey, chunks, templates) {
    if (!chunks || this._globalBatchRegionChunks.has(regionKey)) return false;
    const slot = this._globalBatchOverlayRegions.get(regionKey);
    if (!slot || !slot.ready) return false;
    for (const template of templates) {
      if (this._globalBatchMeshes.has(regionKey + '|' + template.name)) return false;
    }
    for (let index = 0; index < templates.length; index++) {
      const mesh = slot.meshes[index];
      mesh.userData.jsrRegionKey = regionKey;
      this._globalBatchMeshes.set(regionKey + '|' + templates[index].name, mesh);
    }
    this._globalBatchOverlayRegions.delete(regionKey);
    const slotIndex = this._globalBatchOverlaySlots.indexOf(slot);
    if (slotIndex >= 0) this._globalBatchOverlaySlots.splice(slotIndex, 1);
    this._globalBatchRegionChunks.set(regionKey, new Set(chunks));
    for (const chunk of chunks) {
      for (const child of chunk.children) {
        if (!child.isInstancedMesh) continue;
        this._globalBatchStates.set(child, {
          attribute: child.instanceMatrix,
          version: child.instanceMatrix.version,
          count: child.count,
          world: child.matrixWorld.elements.slice()
        });
      }
    }
    return true;
  }

  _continueRegionMerge(regionKey, chunks, templates, meshBudget = 2) {
    let job = this._globalBatchMergeJob;
    if (job && !chunks && job.chunks.length > 0) {
      this._globalBatchMergeJob = job = null;
    }
    if (!job) {
      job = { regionKey, chunks: chunks ? chunks.slice() : [], index: 0 };
      this._globalBatchMergeJob = job;
    }
    const localMatrix = new globalThis.THREE.Matrix4();
    const composedMatrix = new globalThis.THREE.Matrix4();
    const end = Math.min(job.index + meshBudget, templates.length);
    for (; job.index < end; job.index++) {
      const template = templates[job.index];
      const meshKey = job.regionKey + '|' + template.name;
      let mesh = this._globalBatchMeshes.get(meshKey);
      if (!mesh) {
        mesh = new globalThis.THREE.InstancedMesh(
          template.geometry, template.material, MIN_INSTANCE_CAPACITY
        );
        mesh.name = template.name;
        mesh.updateMatrix();
        mesh.matrixAutoUpdate = false;
        mesh.castShadow = template.castShadow;
        mesh.receiveShadow = template.receiveShadow;
        mesh.userData.jsrGlobalBatch = true;
        mesh.userData.jsrRetainEmptyBatch = true;
        mesh.userData.jsrRegionKey = job.regionKey;
        this._globalBatchMeshes.set(meshKey, mesh);
        this._globalBatchGroup.add(mesh);
      }
      mesh.count = 0;
      for (const chunk of job.chunks) {
        for (const child of chunk.children) {
          if (!child.isInstancedMesh || child.name !== template.name) continue;
          this._globalBatchStates.set(child, {
            attribute: child.instanceMatrix,
            version: child.instanceMatrix.version,
            count: child.count,
            world: child.matrixWorld.elements.slice()
          });
          if (!child.count) continue;
          ensureInstanceCapacity(mesh, mesh.count + child.count - 1);
          const source = child.instanceMatrix.array;
          const target = mesh.instanceMatrix.array;
          const world = child.matrixWorld.elements;
          const translationOnly = isTranslationMatrix(world);
          for (let instance = 0; instance < child.count; instance++) {
            const sourceOffset = instance * 16;
            const targetOffset = mesh.count * 16;
            if (translationOnly) {
              for (let component = 0; component < 16; component++) {
                target[targetOffset + component] = source[sourceOffset + component];
              }
              target[targetOffset + 12] += world[12];
              target[targetOffset + 13] += world[13];
              target[targetOffset + 14] += world[14];
            } else {
              localMatrix.fromArray(source, sourceOffset);
              composedMatrix.multiplyMatrices(child.matrixWorld, localMatrix);
              mesh.setMatrixAt(mesh.count, composedMatrix);
            }
            mesh.count++;
          }
        }
      }
      mesh.instanceMatrix.version++;
      mesh.boundingSphere = null;
      const overlay = this._globalBatchOverlayRegions.get(job.regionKey);
      if (overlay) {
        const overlayMesh = overlay.meshes[job.index];
        overlayMesh.count = 0;
        overlayMesh.instanceMatrix.version++;
        overlayMesh.boundingSphere = null;
      }
    }
    if (job.index === templates.length) {
      this._globalBatchRegionChunks.set(job.regionKey, new Set(job.chunks));
      this.shadowMap.needsUpdate = true;
      this._globalBatchMergeJob = null;
    }
  }

  _syncGlobalBatches(scene, world) {
    const templates = this._chunkMeshTemplates;
    if (!templates || !templates.length) return;
    scene.updateMatrix();
    scene.matrixAutoUpdate = false;
    world.updateMatrix();
    world.matrixAutoUpdate = false;
    if (!this._globalBatchGroup) {
      this._globalBatchGroup = new globalThis.THREE.Group();
      this._globalBatchGroup.name = 'jsr-global-block-batches';
      this._globalBatchGroup.updateMatrix();
      this._globalBatchGroup.matrixAutoUpdate = false;
    }
    if (this._globalBatchGroup.parent !== scene) scene.add(this._globalBatchGroup);

    const currentRegions = new Map();
    const pendingRegions = new Set();
    let pending = this._chunkWorkDrainScheduled || this._chunkWorkQueue.length > 0 ||
      performance.now() - this._stressLastMotionAt < 500;
    for (const chunk of world.children) {
      const regionKey = this._globalBatchRegionKey(chunk);
      if (!chunk.loaded) {
        pendingRegions.add(regionKey);
        pending = true;
        continue;
      }
      let chunks = currentRegions.get(regionKey);
      if (!chunks) currentRegions.set(regionKey, chunks = []);
      chunks.push(chunk);
    }
    const dirtyRegions = new Set();
    for (const [regionKey, chunks] of currentRegions) {
      const included = this._globalBatchRegionChunks.get(regionKey);
      for (const chunk of chunks) {
        // A chunk outside the stable baseline uses a pooled overlay below.
        // Originals remain hidden reference data and never churn native IDs.
        if (!included || !included.has(chunk)) {
          for (const child of chunk.children) {
            if (child.isInstancedMesh) child.visible = false;
          }
          continue;
        }
        for (const child of chunk.children) {
          if (!child.isInstancedMesh) continue;
          const attribute = child.instanceMatrix;
          const state = this._globalBatchStates.get(child);
          if (!state || state.attribute !== attribute ||
              state.version !== attribute.version || state.count !== child.count) {
            dirtyRegions.add(regionKey);
            continue;
          }
          const elements = child.matrixWorld.elements;
          for (let index = 0; index < 16; index++) {
            if (state.world[index] !== elements[index]) {
              dirtyRegions.add(regionKey);
              break;
            }
          }
        }
      }
    }
    const regionKeys = new Set([
      ...this._globalBatchRegionChunks.keys(),
      ...currentRegions.keys()
    ]);
    for (const regionKey of regionKeys) {
      const previous = this._globalBatchRegionChunks.get(regionKey);
      const current = currentRegions.get(regionKey);
      let same = !!previous && previous.size === (current ? current.length : 0);
      if (same && current) {
        for (const chunk of current) {
          if (!previous.has(chunk)) {
            same = false;
            break;
          }
        }
      }
      const removing = !!previous && previous.size > (current ? current.length : 0);
      if (!same && !pendingRegions.has(regionKey) && (!pending || !removing)) {
        dirtyRegions.add(regionKey);
      }
    }
    if (!dirtyRegions.size && !this._globalBatchMergeJob) {
      this._syncChunkOverlays(currentRegions, pendingRegions, pending);
      this._hideChunkSources(currentRegions);
      this._globalBatchForce = false;
      return;
    }

    const localMatrix = new globalThis.THREE.Matrix4();
    const composedMatrix = new globalThis.THREE.Matrix4();
    const saveState = child => {
      this._globalBatchStates.set(child, {
        attribute: child.instanceMatrix,
        version: child.instanceMatrix.version,
        count: child.count,
        world: child.matrixWorld.elements.slice()
      });
    };
    const removeRegion = regionKey => {
      for (const template of templates) {
        const meshKey = regionKey + '|' + template.name;
        const mesh = this._globalBatchMeshes.get(meshKey);
        if (!mesh) continue;
        this._globalBatchGroup.remove(mesh);
        this._globalBatchMeshes.delete(meshKey);
      }
      this._globalBatchRegionChunks.delete(regionKey);
    };
    if (!this._globalBatchForce) {
      // Publish any incoming overlay before transferring its block types into
      // the stable region, two GPU buffers per frame. Movement does not pause
      // this bounded merge, so overlay draw calls cannot accumulate.
      this._syncChunkOverlays(currentRegions, pendingRegions, pending);
      if (!this._globalBatchMergeJob) {
        const promotedRegion = dirtyRegions.values().next().value;
        if (promotedRegion !== undefined && this._promoteOverlayRegion(
          promotedRegion, currentRegions.get(promotedRegion), templates
        )) {
          this._hideChunkSources(currentRegions);
          this._globalBatchForce = false;
          return;
        }
      }
      const mergeRegion = this._globalBatchMergeJob ? this._globalBatchMergeJob.regionKey :
        dirtyRegions.values().next().value;
      const mergeOverlay = mergeRegion === undefined ? null :
        this._globalBatchOverlayRegions.get(mergeRegion);
      if (!this._globalBatchMergeJob && mergeOverlay && !mergeOverlay.ready) {
        this._hideChunkSources(currentRegions);
        this._globalBatchForce = false;
        return;
      }
      if (mergeRegion !== undefined) {
        this._continueRegionMerge(mergeRegion, currentRegions.get(mergeRegion), templates, pending ? 1 : 2);
      }
      if (!pending && !this._globalBatchMergeJob && this._globalBatchRegionChunks.size > 24) {
        for (const [regionKey, chunks] of this._globalBatchRegionChunks) {
          if (chunks.size !== 0) continue;
          removeRegion(regionKey);
          break;
        }
      }
      this._hideChunkSources(currentRegions);
      this._globalBatchForce = false;
      return;
    }
    // Initial generation establishes the complete baseline in one pass.
    const regions = Array.from(dirtyRegions);
    for (const regionKey of regions) {
      const chunks = currentRegions.get(regionKey);
      if (!chunks) {
        // Retain the native batch allocation but submit no instances. Physical
        // removal is reserved for the bounded empty-region LRU below.
        for (const template of templates) {
          const mesh = this._globalBatchMeshes.get(regionKey + '|' + template.name);
          if (!mesh) continue;
          mesh.count = 0;
          mesh.instanceMatrix.version++;
          mesh.boundingSphere = null;
        }
        this._globalBatchRegionChunks.set(regionKey, new Set());
        continue;
      }
      for (const template of templates) {
        const meshKey = regionKey + '|' + template.name;
        let mesh = this._globalBatchMeshes.get(meshKey);
        if (!mesh) {
          mesh = new globalThis.THREE.InstancedMesh(
            template.geometry, template.material, MIN_INSTANCE_CAPACITY
          );
          mesh.name = template.name;
          mesh.updateMatrix();
          mesh.matrixAutoUpdate = false;
          mesh.castShadow = template.castShadow;
          mesh.receiveShadow = template.receiveShadow;
          mesh.userData.jsrGlobalBatch = true;
          mesh.userData.jsrRetainEmptyBatch = true;
          mesh.userData.jsrRegionKey = regionKey;
          this._globalBatchMeshes.set(meshKey, mesh);
          this._globalBatchGroup.add(mesh);
        }
        mesh.count = 0;
      }
      for (const chunk of chunks) {
        for (const child of chunk.children) {
          if (!child.isInstancedMesh) continue;
          const mesh = this._globalBatchMeshes.get(regionKey + '|' + child.name);
          if (!mesh || child.count === 0) {
            child.visible = false;
            saveState(child);
            continue;
          }
          ensureInstanceCapacity(mesh, mesh.count + child.count - 1);
          const source = child.instanceMatrix.array;
          const worldElements = child.matrixWorld.elements;
          const translationOnly = isTranslationMatrix(worldElements);
          const target = mesh.instanceMatrix.array;
          for (let instance = 0; instance < child.count; instance++) {
            const sourceOffset = instance * 16;
            const targetOffset = mesh.count * 16;
            if (translationOnly) {
              for (let component = 0; component < 16; component++) {
                target[targetOffset + component] = source[sourceOffset + component];
              }
              target[targetOffset + 12] += worldElements[12];
              target[targetOffset + 13] += worldElements[13];
              target[targetOffset + 14] += worldElements[14];
            } else {
              localMatrix.fromArray(source, sourceOffset);
              composedMatrix.multiplyMatrices(child.matrixWorld, localMatrix);
              mesh.setMatrixAt(mesh.count, composedMatrix);
            }
            mesh.count++;
          }
          child.visible = false;
          saveState(child);
        }
      }
      for (const template of templates) {
        const mesh = this._globalBatchMeshes.get(regionKey + '|' + template.name);
        mesh.instanceMatrix.version++;
        mesh.boundingSphere = null;
      }
      this._globalBatchRegionChunks.set(regionKey, new Set(chunks));
    }
    if (!pending && this._globalBatchRegionChunks.size > 24) {
      for (const [regionKey, chunks] of this._globalBatchRegionChunks) {
        if (chunks.size !== 0) continue;
        removeRegion(regionKey);
        break;
      }
    }
    if (regions.length) this.shadowMap.needsUpdate = true;
    this._syncChunkOverlays(currentRegions, pendingRegions, pending);
    this._hideChunkSources(currentRegions);
    this._globalBatchForce = false;
  }

  _stabilizeShadowSun(scene) {
    if (!this._stressSun || this._stressSun.parent !== scene) {
      this._stressSun = scene.children.find(child => child.isDirectionalLight && child.castShadow) || null;
      this._stressSunAnchor = null;
    }
    const sun = this._stressSun;
    if (!sun) return;
    const shadow = sun.shadow;
    const shadowCamera = shadow.camera;
    const fogFar = scene.fog && scene.fog.isFog && Number.isFinite(scene.fog.far)
      ? scene.fog.far : 0;
    const shadowHalfExtent = Math.max(40, Math.ceil(fogFar + 5));
    let shadowConfigChanged = false;
    if (shadow.mapSize && shadow.mapSize.x !== 2048) {
      shadow.mapSize.set(2048, 2048);
      shadowConfigChanged = true;
    }
    if (shadowCamera.left !== -shadowHalfExtent || shadowCamera.right !== shadowHalfExtent ||
        shadowCamera.bottom !== -shadowHalfExtent || shadowCamera.top !== shadowHalfExtent) {
      shadowCamera.left = -shadowHalfExtent;
      shadowCamera.right = shadowHalfExtent;
      shadowCamera.bottom = -shadowHalfExtent;
      shadowCamera.top = shadowHalfExtent;
      shadowCamera.updateProjectionMatrix();
      shadowConfigChanged = true;
    }
    if (shadowConfigChanged) this.shadowMap.needsUpdate = true;
    const target = sun.target.position;
    const direction = new globalThis.THREE.Vector3().subVectors(sun.position, target).normalize();
    const right = new globalThis.THREE.Vector3().crossVectors(shadow.camera.up, direction).normalize();
    const up = new globalThis.THREE.Vector3().crossVectors(direction, right).normalize();
    if (!Number.isFinite(right.x + right.y + right.z + up.x + up.y + up.z)) return;
    const texelX = (shadow.camera.right - shadow.camera.left) / shadow.mapSize.x;
    const texelY = (shadow.camera.top - shadow.camera.bottom) / shadow.mapSize.y;
    const lightX = target.dot(right);
    const lightY = target.dot(up);
    const snappedX = Math.round(lightX / texelX) * texelX;
    const snappedY = Math.round(lightY / texelY) * texelY;
    const delta = new globalThis.THREE.Vector3()
      .addScaledVector(right, snappedX - lightX)
      .addScaledVector(up, snappedY - lightY);
    // Snap only within one shadow texel, preserving the light direction and
    // world-anchored shadows without a 16-block camera jump.
    sun.position.add(delta);
    target.add(delta);
    const anchor = this._stressSunAnchor;
    if (!anchor || anchor.x !== target.x || anchor.y !== target.y || anchor.z !== target.z) {
      this._stressSunAnchor = { x: target.x, y: target.y, z: target.z };
      this.shadowMap.needsUpdate = true;
    }
  }

  render(scene, camera) {
    pollRawPointer();
    this._updateStressMotion(scene);
    const world = this._manageChunkResources(scene);
    if (world) this._syncGlobalBatches(scene, world);
    this._stabilizeShadowSun(scene);
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
    const renderStarted = performance.now();
    try {
      return super.render(scene, camera);
    } catch (caught) {
      error = caught;
      throw caught;
    } finally {
      reportStressTiming(performance.now() - renderStarted);
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
