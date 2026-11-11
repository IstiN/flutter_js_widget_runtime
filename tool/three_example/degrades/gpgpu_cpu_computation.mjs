// CPU GPUComputationRenderer for the R1 bounded runtime (three.js r186).
//
// The official misc/GPUComputationRenderer renders ping-pong fragment passes
// on float render targets; R1 lowers render targets to RGBA8 copies and
// cannot run arbitrary compute math, so webgl_gpgpu_birds / _protoplanet
// collapsed (birds: every texel sampled the STALE neutral texture -> a
// motionless stripe at the origin; protoplanet: grey noise squares with no
// gravity). This drop-in for `three/addons/misc/GPUComputationRenderer.js`
// runs the SIMULATION on the CPU with the official kernel math ported
// verbatim, while the display geometry keeps flowing through the normal R1
// pipeline:
//
//   - birds velocity/position kernels: exact port (predator flee, center
//     pull with the *2.5 y bias, separation/alignment/cohesion zones, speed
//     limit, phase flap, ±BOUNDS wrap) over an O(N) spatial hash instead of
//     the O(N²) all-pairs loop (1024 birds: ~1.0M pair checks -> ~30K).
//   - protoplanet velocity/position kernels: gravityConstant pairwise 1/r²
//     collapsed to a 24³ particle-mesh (per-cell clamped d² floor), mass
//     aggregation collisions kept pair-exact through the hash (smaller id
//     wins, larger dies), pos += vel * delta integration.
//
// Unknown kernels keep the previous neutral behaviour and warn LOUDLY so a
// future GPGPU widget cannot silently degrade.
//
// Diagnostics (the round-2 pin): globalThis.__JSR_GPGPU carries
// { kernel, frames, tickMs, posDigest, spread, avgSpeed, alive } refreshed
// every 4th compute; spread is the max |x|,|y|,|z| extent of the position
// texel — the collapsed-stripe failure mode is spread < 10 with frames > 30.
import {
  DataTexture,
  FloatType,
  RGBAFormat,
  RepeatWrapping,
  Vector2
} from 'three';

const TWO_PI = Math.PI * 2;
const BIRDS_SPEED_LIMIT = 9.0;
const BIRDS_PREY_RADIUS = 150.0;
const BIRDS_PHASE_MOD = 62.83;
const MESH_EXTENT = 24; // particle-mesh resolution (protoplanet gravity)
const DIAG_EVERY = 4;

function flatten(source) {
  return String(source).replace(/\s+/g, '');
}

function radiusFromMass(mass, density) {
  const d = density > 0 ? density : 0.45;
  if (mass <= 0) return 0;
  return Math.cbrt((3.0 / (4.0 * Math.PI)) * mass / d);
}

class BoidsVelocityKernel {
  constructor(variable, size) {
    this.size = size;
    const defines = variable.material.defines || {};
    this.upperBounds = Number(defines.BOUNDS) || 800.0;
    this.cell = 60.0; // >= typical separation zone; hash buckets
    // zone radius is re-read from uniforms each step (GUI live changes).
  }

  run(posData, velData, out, uniforms) {
    const n = this.size;
    const separation = Number(uniforms.separationDistance?.value) || 20.0;
    const alignment = Number(uniforms.alignmentDistance?.value) || 20.0;
    const cohesion = Number(uniforms.cohesionDistance?.value) || 20.0;
    const delta = Number(uniforms.delta?.value) || 0.016;
    const predator = uniforms.predator?.value || { x: 0, y: 0, z: 0 };
    const upper = this.upperBounds;
    const zoneRadius = separation + alignment + cohesion;
    const zoneRadiusSquared = zoneRadius * zoneRadius;
    const separationThresh = separation / zoneRadius;
    const alignmentThresh = (separation + alignment) / zoneRadius;
    const cell = Math.max(zoneRadius, this.cell);
    const invCell = 1 / cell;
    // Spatial hash: uniform grid over the ±BOUNDS cube, wrapped like the
    // position kernel so neighbours across the seam are still found.
    const gridDim = Math.ceil((upper * 2) / cell) | 0;
    const gridCells = gridDim * gridDim * gridDim;
    const head = new Int32Array(gridCells).fill(-1);
    const next = new Int32Array(n);
    const cellKey = (v) => {
      let gx = Math.floor((v[0] + upper) * invCell) % gridDim;
      let gy = Math.floor((v[1] + upper) * invCell) % gridDim;
      let gz = Math.floor((v[2] + upper) * invCell) % gridDim;
      if (gx < 0) gx += gridDim;
      if (gy < 0) gy += gridDim;
      if (gz < 0) gz += gridDim;
      return (gx * gridDim + gy) * gridDim + gz;
    };
    const px = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      px[i * 3] = posData[i * 4];
      px[i * 3 + 1] = posData[i * 4 + 1];
      px[i * 3 + 2] = posData[i * 4 + 2];
      const key = cellKey(px.subarray(i * 3, i * 3 + 3));
      next[i] = head[key];
      head[key] = i;
    }
    for (let i = 0; i < n; i++) {
      const sx = px[i * 3], sy = px[i * 3 + 1], sz = px[i * 3 + 2];
      let vx = velData[i * 4], vy = velData[i * 4 + 1], vz = velData[i * 4 + 2];
      let limit = BIRDS_SPEED_LIMIT;
      // Flee the predator (uniform scaled to the bounds cube, z dropped).
      let dx = predator.x * upper - sx, dy = predator.y * upper - sy;
      let dist = Math.hypot(dx, dy);
      if (dist < BIRDS_PREY_RADIUS && dist > 0.0001) {
        const f = ((dist * dist) / (BIRDS_PREY_RADIUS * BIRDS_PREY_RADIUS) - 1.0) * delta * 100.0;
        vx += (dx / dist) * f;
        vy += (dy / dist) * f;
        limit += 5.0;
      }
      // Attract flocks to the center (official y bias 2.5).
      {
        const len = Math.hypot(sx, sy * 2.5, sz);
        if (len > 0.0001) {
          vx -= (sx / len) * delta * 5.0;
          vy -= ((sy * 2.5) / len) * delta * 5.0;
          vz -= (sz / len) * delta * 5.0;
        }
      }
      // Neighbour zones via the wrapped hash (exact zones, O(N) neighbours).
      const ci = cellKey(px.subarray(i * 3, i * 3 + 3));
      const gx = ci / (gridDim * gridDim) | 0;
      const gy = (ci / gridDim | 0) % gridDim;
      const gz = ci % gridDim;
      for (let ox = -1; ox <= 1; ox++) {
        const cx = (gx + ox + gridDim) % gridDim;
        for (let oy = -1; oy <= 1; oy++) {
          const cy = (gy + oy + gridDim) % gridDim;
          for (let oz = -1; oz <= 1; oz++) {
            const cz = (gz + oz + gridDim) % gridDim;
            let j = head[(cx * gridDim + cy) * gridDim + cz];
            while (j !== -1) {
              if (j !== i) {
                const ddx = px[j * 3] - sx;
                const ddy = px[j * 3 + 1] - sy;
                const ddz = px[j * 3 + 2] - sz;
                const dSq = ddx * ddx + ddy * ddy + ddz * ddz;
                if (dSq > 0.00000001 && dSq < zoneRadiusSquared) {
                  const percent = dSq / zoneRadiusSquared;
                  const d = Math.sqrt(dSq);
                  if (percent < separationThresh) {
                    const f = (separationThresh / percent - 1.0) * delta;
                    vx -= (ddx / d) * f;
                    vy -= (ddy / d) * f;
                    vz -= (ddz / d) * f;
                  } else if (percent < alignmentThresh) {
                    const adjusted = (percent - separationThresh) /
                      (alignmentThresh - separationThresh);
                    const f = (0.5 - Math.cos(adjusted * TWO_PI) * 0.5 + 0.5) * delta;
                    const bvx = velData[j * 4], bvy = velData[j * 4 + 1], bvz = velData[j * 4 + 2];
                    const bl = Math.hypot(bvx, bvy, bvz) || 1;
                    vx += (bvx / bl) * f;
                    vy += (bvy / bl) * f;
                    vz += (bvz / bl) * f;
                  } else {
                    const threshDelta = 1.0 - alignmentThresh;
                    const adjusted = threshDelta === 0 ? 1 : (percent - alignmentThresh) / threshDelta;
                    const f = (0.5 - (Math.cos(adjusted * TWO_PI) * -0.5 + 0.5)) * delta;
                    vx += (ddx / d) * f;
                    vy += (ddy / d) * f;
                    vz += (ddz / d) * f;
                  }
                }
              }
              j = next[j];
            }
          }
        }
      }
      const vl = Math.hypot(vx, vy, vz);
      if (vl > limit) {
        vx = (vx / vl) * limit;
        vy = (vy / vl) * limit;
        vz = (vz / vl) * limit;
      }
      out[i * 4] = vx;
      out[i * 4 + 1] = vy;
      out[i * 4 + 2] = vz;
      out[i * 4 + 3] = 1.0;
    }
  }
}

class BoidsPositionKernel {
  constructor(variable, size) {
    this.size = size;
    const defines = variable.material.defines || {};
    this.upper = Number(defines.BOUNDS) || 800.0;
  }

  run(posData, velData, out, uniforms) {
    const n = this.size;
    const delta = Number(uniforms.delta?.value) || 0.016;
    const upper = this.upper;
    for (let i = 0; i < n; i++) {
      const k = i * 4;
      let x = posData[k], y = posData[k + 1], z = posData[k + 2];
      let phase = posData[k + 3];
      const vx = velData[k], vy = velData[k + 1], vz = velData[k + 2];
      phase = ((phase + delta +
        Math.hypot(vx, vz) * delta * 3.0 +
        Math.max(vy, 0.0) * delta * 6.0) % BIRDS_PHASE_MOD + BIRDS_PHASE_MOD) % BIRDS_PHASE_MOD;
      x += vx * delta * 15.0;
      y += vy * delta * 15.0;
      z += vz * delta * 15.0;
      if (x < -upper) x += 2.0 * upper; else if (x > upper) x -= 2.0 * upper;
      if (y < -upper) y += 2.0 * upper; else if (y > upper) y -= 2.0 * upper;
      if (z < -upper) z += 2.0 * upper; else if (z > upper) z -= 2.0 * upper;
      out[k] = x; out[k + 1] = y; out[k + 2] = z; out[k + 3] = phase;
    }
  }
}

class ProtoVelocityKernel {
  // Budget note: the official kernel is O(N²) (4096² = 16.7M pair probes —
  // hopeless in QuickJS). Collapsed to: pair-exact aggregation collisions on a
  // fine local hash evaluated every 4th tick (agregation is a slow process;
  // a 15Hz scan is visually identical and cuts the pair traversal 4×), and
  // gravityConstant pairwise 1/r² collapsed onto an 8³ particle-mesh
  // (±400u cells of 100u, 8 cell reads per particle, clamped d² floor like
  // the official min(g, 1000) clamp). All buffers persist across ticks.
  constructor(variable, size) {
    this.size = size;
    this.tick = 0;
    const dim = 25; // collision hash: cell 32u over ±400u
    this.dim = dim;
    this.cellSize = 32.0;
    this.head = new Int32Array(dim * dim * dim);
    this.next = new Int32Array(size);
    const meshDim = 8; // particle-mesh: cell 100u over ±400u
    this.meshDim = meshDim;
    this.meshCell = 100.0;
    this.meshExtent = 400.0;
    this.meshMass = new Float32Array(meshDim * meshDim * meshDim);
    this.meshX = new Float32Array(meshDim * meshDim * meshDim);
    this.meshY = new Float32Array(meshDim * meshDim * meshDim);
    this.meshZ = new Float32Array(meshDim * meshDim * meshDim);
  }

  run(posData, velData, out, uniforms) {
    const n = this.size;
    const gravityConstant = Number(uniforms.gravityConstant?.value) || 100.0;
    const density = Number(uniforms.density?.value) || 0.45;
    const delta = Number(uniforms.delta?.value) || (1.0 / 60.0);
    const doCollisions = (this.tick % 4) === 0;
    this.tick++;
    const dim = this.dim, cell = this.cellSize, invCell = 1 / cell, cells = dim * dim * dim;
    const head = this.head, next = this.next;
    head.fill(-1);
    const dead = this._dead || (this._dead = new Uint8Array(n));
    dead.fill(0);
    const clampCell = (v) => {
      let g = Math.floor((v + 400) * invCell);
      return g < 0 ? 0 : g >= dim ? dim - 1 : g;
    };
    for (let i = 0; i < n; i++) {
      const m = velData[i * 4 + 3];
      if (m <= 0) { dead[i] = 1; continue; }
      const key = (clampCell(posData[i * 4]) * dim + clampCell(posData[i * 4 + 1])) * dim +
        clampCell(posData[i * 4 + 2]);
      next[i] = head[key];
      head[key] = i;
    }
    // Particle-mesh gravity buckets.
    const meshDim = this.meshDim, meshCell = this.meshCell, extent = this.meshExtent;
    const meshMass = this.meshMass, meshX = this.meshX, meshY = this.meshY, meshZ = this.meshZ;
    meshMass.fill(0);
    const toCell = (v) => {
      let c = Math.floor((v + extent) / meshCell);
      return c < 0 ? 0 : c >= meshDim ? meshDim - 1 : c;
    };
    for (let i = 0; i < n; i++) {
      const m = velData[i * 4 + 3];
      if (m <= 0) continue;
      const c = (toCell(posData[i * 4]) * meshDim + toCell(posData[i * 4 + 1])) * meshDim +
        toCell(posData[i * 4 + 2]);
      if (meshMass[c] === 0) {
        meshMass[c] = m;
        meshX[c] = posData[i * 4];
        meshY[c] = posData[i * 4 + 1];
        meshZ[c] = posData[i * 4 + 2];
      } else {
        meshMass[c] += m;
        const w = m / meshMass[c];
        meshX[c] += (posData[i * 4] - meshX[c]) * w;
        meshY[c] += (posData[i * 4 + 1] - meshY[c]) * w;
        meshZ[c] += (posData[i * 4 + 2] - meshZ[c]) * w;
      }
    }
    const dFloor = meshCell * meshCell * 0.25;
    for (let i = 0; i < n; i++) {
      const k = i * 4;
      if (dead[i]) {
        out[k] = 0; out[k + 1] = 0; out[k + 2] = 0; out[k + 3] = 0;
        continue;
      }
      const sx = posData[k], sy = posData[k + 1], sz = posData[k + 2];
      let mass = velData[k + 3];
      let vx = velData[k], vy = velData[k + 1], vz = velData[k + 2];
      let ax = 0, ay = 0, az = 0;
      if (doCollisions) {
        // Pair-exact aggregation collisions through the local hash. Smaller
        // id aggregates the larger (official rule); a dead particle stops
        // participating (official `break`), the aggregate keeps scanning.
        const gx = clampCell(sx), gy = clampCell(sy), gz = clampCell(sz);
        const selfRadius = radiusFromMass(mass, density);
        outer:
        for (let ox = -1; ox <= 1; ox++) {
          const cx = gx + ox; if (cx < 0 || cx >= dim) continue;
          for (let oy = -1; oy <= 1; oy++) {
            const cy = gy + oy; if (cy < 0 || cy >= dim) continue;
            for (let oz = -1; oz <= 1; oz++) {
              const cz = gz + oz; if (cz < 0 || cz >= dim) continue;
              let j = head[(cx * dim + cy) * dim + cz];
              while (j !== -1) {
                if (j !== i && !dead[j]) {
                  const jk = j * 4;
                  const dx = posData[jk] - sx;
                  const dy = posData[jk + 1] - sy;
                  const dz = posData[jk + 2] - sz;
                  const dSq = dx * dx + dy * dy + dz * dz;
                  const otherMass = velData[jk + 3];
                  const contactSq = selfRadius + radiusFromMass(otherMass, density);
                  if (dSq < contactSq * contactSq && dSq > 0.0001) {
                    if (i < j) {
                      const total = mass + otherMass;
                      vx = (vx * mass + velData[jk] * otherMass) / total;
                      vy = (vy * mass + velData[jk + 1] * otherMass) / total;
                      vz = (vz * mass + velData[jk + 2] * otherMass) / total;
                      mass = total;
                      out[k + 3] = total;
                      dead[j] = 2;
                    } else {
                      dead[i] = 3;
                      break outer;
                    }
                  }
                }
                j = next[j];
              }
            }
          }
        }
        if (dead[i]) { out[k] = 0; out[k + 1] = 0; out[k + 2] = 0; out[k + 3] = 0; continue; }
      }
      // Mesh gravity: the 2x2x2 cell neighborhood around the particle.
      const mx = toCell(sx), my = toCell(sy), mz = toCell(sz);
      for (let ox = -1; ox <= 1; ox += 2) {
        const cx = mx + ox; if (cx < 0 || cx >= meshDim) continue;
        for (let oy = -1; oy <= 1; oy += 2) {
          const cy = my + oy; if (cy < 0 || cy >= meshDim) continue;
          for (let oz = -1; oz <= 1; oz += 2) {
            const cz = mz + oz; if (cz < 0 || cz >= meshDim) continue;
            const c = (cx * meshDim + cy) * meshDim + cz;
            const m2 = meshMass[c];
            if (m2 <= 0) continue;
            const dx = meshX[c] - sx;
            const dy = meshY[c] - sy;
            const dz = meshZ[c] - sz;
            let dSq = dx * dx + dy * dy + dz * dz;
            if (dSq < dFloor) dSq = dFloor;
            let g = gravityConstant * m2 / dSq;
            if (g > 1000.0) g = 1000.0;
            const invD = 1 / Math.sqrt(dSq);
            ax += dx * invD * g;
            ay += dy * invD * g;
            az += dz * invD * g;
          }
        }
      }
      vx += delta * ax;
      vy += delta * ay;
      vz += delta * az;
      out[k] = vx; out[k + 1] = vy; out[k + 2] = vz; out[k + 3] = mass;
    }
  }
}


class ProtoPositionKernel {
  constructor(variable, size) {
    this.size = size;
  }

  run(posData, velData, out, uniforms) {
    const n = this.size;
    const delta = Number(uniforms.delta?.value) || 0.016;
    for (let i = 0; i < n; i++) {
      const k = i * 4;
      const mass = velData[k + 3];
      if (mass <= 0) { out[k] = 0; out[k + 1] = 0; out[k + 2] = 0; out[k + 3] = 1.0; continue; }
      out[k] = posData[k] + velData[k] * delta;
      out[k + 1] = posData[k + 1] + velData[k + 1] * delta;
      out[k + 2] = posData[k + 2] + velData[k + 2] * delta;
      out[k + 3] = 1.0;
    }
  }
}

function classify(name, computeFragmentShader) {
  const flat = flatten(computeFragmentShader);
  if (flat.includes('zoneRadiusSquared') && flat.includes('separationThresh')) return 'birds-velocity';
  if (flat.includes('62.83') && flat.includes('phase')) return 'birds-position';
  if (flat.includes('gravityField') && flat.includes('radiusFromMass')) return 'proto-velocity';
  if (flat.includes('pos+=vel*delta') && flat.includes('vec4(pos,1.0)')) return 'proto-position';
  return null;
}

export class GPUComputationRenderer {
  constructor(sizeX, sizeY, renderer) {
    this.renderer = renderer;
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.dataType = FloatType;
    this.variables = [];
    this.currentTextureIndex = 0;
    this._neutral = false;
    this._frames = 0;
    this._tickSum = 0;
    this._posDigest = 0;
    this._spread = 0;
    this._avgSpeed = 0;
    this._alive = 0;
  }

  // No-op for API compatibility (upstream carries YCbCr option handling).
  setDataType() {}

  createTexture() {
    const data = new Float32Array(this.sizeX * this.sizeY * 4);
    const texture = new DataTexture(data, this.sizeX, this.sizeY, RGBAFormat, FloatType);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.minFilter = texture.magFilter = 10046; // NearestFilter equivalent
    texture.needsUpdate = true;
    return texture;
  }

  addVariable(variableName, computeFragmentShader, initialValueTexture) {
    const material = {
      uniforms: { resolution: { value: new Vector2(this.sizeX, this.sizeY) } },
      defines: {},
      computeFragmentShader: String(computeFragmentShader)
    };
    const variable = {
      name: variableName,
      initialValueTexture,
      material,
      dependencies: null,
      renderTargets: [],
      wrapS: RepeatWrapping,
      wrapT: RepeatWrapping,
      minFilter: 10046,
      magFilter: 10046,
      texture: initialValueTexture
    };
    // Both render targets ALIAS the live texture: the CPU kernels write
    // in place, so getCurrentRenderTarget(v).texture stays current without
    // a ping-pong and renderTexture(initial, target) propagates instantly.
    variable.renderTargets = [{ texture: initialValueTexture }, { texture: initialValueTexture }];
    this.variables.push(variable);
    return variable;
  }

  setVariableDependencies(variable, dependencies) {
    variable.dependencies = dependencies;
    for (const depVariable of dependencies) {
      variable.material.uniforms[depVariable.name] = { value: null };
    }
  }

  init() {
    this._kernels = new Map();
    const size = this.sizeX * this.sizeY;
    for (const variable of this.variables) {
      const kind = classify(variable.name, variable.material.computeFragmentShader || '');
      if (!kind) {
        this._neutral = true;
        console.warn(
          `[jsr-gpgpu] CPU kernels: variable "${variable.name}" has no ported kernel; ` +
          'the simulation stays on the R1 neutral lane (positions static).');
        continue;
      }
      const Kernel = kind === 'birds-velocity' ? BoidsVelocityKernel
        : kind === 'birds-position' ? BoidsPositionKernel
        : kind === 'proto-velocity' ? ProtoVelocityKernel
        : ProtoPositionKernel;
      this._kernels.set(variable.name, new Kernel(variable, size));
      // Bind dependency textures (aliased live DataTextures).
      for (const dep of variable.dependencies || []) {
        variable.material.uniforms[dep.name].value = dep.texture;
      }
    }
    if (this._neutral) {
      console.warn(`[jsr-gpgpu] ${this.variables.map(v => v.name).join(', ')}: neutral fallback.`);
      return null;
    }
    console.log(
      `[jsr-gpgpu] CPU kernels active: ${[...this._kernels.keys()].join(', ')} ` +
      `(${this.sizeX}x${this.sizeY} texels)`);
    return null; // upstream returns an error string or null
  }

  compute() {
    if (this._neutral) return;
    const t0 = Date.now ? Date.now() : 0;
    const size = this.sizeX * this.sizeY;
    if (!this._scratch || this._scratch.length !== size * 4) {
      this._scratch = new Float32Array(size * 4);
    }
    const scratch = this._scratch;
    for (const variable of this.variables) {
      const kernel = this._kernels.get(variable.name);
      if (!kernel) continue;
      const uniforms = variable.material.uniforms;
      const own = variable.texture.image.data;
      // Resolve dependency buffers through the uniform bindings init() set
      // (aliased live DataTextures); `own` wins when the variable feeds
      // itself, so a kernel always reads the CURRENT tick state exactly like
      // the upstream per-variable ping-pong pass.
      const posBuf = variable.name === 'texturePosition' ? own
        : (uniforms.texturePosition?.value?.image?.data || own);
      const velBuf = variable.name === 'textureVelocity' ? own
        : (uniforms.textureVelocity?.value?.image?.data || own);
      kernel.run(posBuf, velBuf, scratch, uniforms);
      own.set(scratch);
      variable.texture.needsUpdate = true;
    }
    this.currentTextureIndex = this.currentTextureIndex === 0 ? 1 : 0;
    this._frames++;
    if (this._frames % DIAG_EVERY === 0) {
      this._publishDiagnostics(t0);
    }
  }

  _publishDiagnostics(t0) {
    const positionVariable = this.variables.find(v => v.name === 'texturePosition');
    if (!positionVariable) return;
    const data = positionVariable.texture.image.data;
    let digest = 0, spread = 0, speed = 0, alive = 0;
    const velocityVariable = this.variables.find(v => v.name === 'textureVelocity');
    const velData = velocityVariable ? velocityVariable.texture.image.data : null;
    const n = Math.min(data.length / 4, 65536);
    for (let i = 0; i < n; i++) {
      const x = data[i * 4], y = data[i * 4 + 1], z = data[i * 4 + 2];
      digest += Math.abs(x) + Math.abs(y) + Math.abs(z);
      const a = Math.abs(x); if (a > spread) spread = a;
      const b = Math.abs(y); if (b > spread) spread = b;
      const c = Math.abs(z); if (c > spread) spread = c;
      if (velData) {
        speed += Math.hypot(velData[i * 4], velData[i * 4 + 1], velData[i * 4 + 2]);
      }
      const mass = velData ? velData[i * 4 + 3] : 1;
      if (mass > 0 || !velData) alive++;
    }
    this._posDigest = Math.round(digest);
    this._spread = Math.round(spread * 100) / 100;
    this._avgSpeed = Math.round((speed / n) * 1000) / 1000;
    this._alive = alive;
    const tickMs = Date.now() - t0;
    this._tickSum = this._tickSum * 0.75 + tickMs * 0.25;
    const kernelName = [...this._kernels.keys()].some(k => k.startsWith('texturePosition'))
      ? (this._kernels.get('texturePosition')?.constructor?.name || 'unknown')
      : 'unknown';
    globalThis.__JSR_GPGPU = {
      kernel: kernelName,
      frames: this._frames,
      tickMs: Math.round(this._tickSum * 100) / 100,
      posDigest: this._posDigest,
      spread: this._spread,
      avgSpeed: this._avgSpeed,
      alive: this._alive
    };
  }

  getCurrentRenderTarget(variable) {
    return variable.renderTargets[this.currentTextureIndex];
  }

  getAlternateRenderTarget(variable) {
    return variable.renderTargets[this.currentTextureIndex === 0 ? 1 : 0];
  }

  addResolutionUniform(material) {
    material.uniforms.resolution = { value: new Vector2(this.sizeX, this.sizeY) };
  }

  renderTexture(input, output) {
    const source = input.image?.data;
    const target = output.texture ?? output;
    if (!source || !target?.image?.data) return;
    target.image.data.set(source);
    target.needsUpdate = true;
  }

  dispose() {
    this.variables = [];
    this._kernels = null;
  }
}

export default GPUComputationRenderer;
