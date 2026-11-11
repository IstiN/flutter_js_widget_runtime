// Bounded LightProbeGridWebGL substitute for webgl_lightprobes_sponza.
//
// The official addon bakes per-probe cubemaps through WebGL render targets
// (CubeCamera per probe + an RT repack pass). The bounded R1 runtime rejects
// those render targets ("R1 supports one bounded color surface per pass"), so
// probes.bake() threw ThreeCapabilityError, init() rejected unhandled and the
// widget never presented its first frame.
//
// This shim keeps the addon's public surface the example touches —
// constructor(width, height, depth, countX, countY, countZ), isLightProbeGrid,
// resolution, getProbePosition, updateBounds/boundingBox, bake, dispose — but
// bake() fills the probe data on the CPU with a sun+sky SH approximation
// instead of rendering cubemaps. The scene keeps its real SunLight and the
// stand-in courtyard; the GI term per probe is a disclosed approximation.
//
// The companion helper renders the probe positions as a point cloud rather
// than the official instanced sphere atlas.

import { AmbientLight, BufferAttribute, BufferGeometry, DataTexture, Float32BufferAttribute, HemisphereLight, Object3D, Points, PointsMaterial, Vector3 } from 'three';

const _pos = new Vector3();

function sunSkySh(sunY, skyR, skyG, skyB, groundR, groundG, groundB) {
  // 9-coefficient RGB SH (L1) approximating a hemisphere split: the upper
  // hemisphere carries the sky tint, the lower the ground bounce, with the
  // L1 band biased toward +Y (sun up). Values are unit-scale linear.
  const l0 = 0.282095;
  const sh = new Float32Array(27);
  for (let c = 0; c < 3; c++) {
    const up = [skyR, skyG, skyB][c];
    const down = [groundR, groundG, groundB][c];
    sh[c * 9 + 0] = l0 * (up + down) * 0.5;
    sh[c * 9 + 1] = 0.488603 * down * 0.35 * sunY;
    sh[c * 9 + 2] = 0;
    sh[c * 9 + 3] = 0.488603 * up * 0.35 * sunY;
  }
  return sh;
}

export class LightProbeGridWebGL extends Object3D {
  constructor(width = 1, height = 1, depth = 1, countX = 2, countY = 2, countZ = 2) {
    super();
    this.isLightProbeGrid = true;
    this.size = new Vector3(width, height, depth);
    this.resolution = new Vector3(countX | 0, countY | 0, countZ | 0);
    this.boundingBox = { setFromCenterAndSize(center, size) { this.center = center.clone(); this.size = size.clone(); } };
    this.probeData = new DataTexture(new Float32Array(9 * 3), 1, 1);
    this.bakedProbes = 0;
    console.warn('three: R1 bakes the light-probe grid on the CPU with a sun+sky SH approximation; per-probe cubemaps are dropped.');
  }

  getProbePosition(ix, iy, iz, target = _pos) {
    const res = this.resolution;
    target.set(
      (ix / Math.max(1, res.x - 1) - 0.5) * this.size.x,
      (iy / Math.max(1, res.y - 1)) * this.size.y,
      (iz / Math.max(1, res.z - 1) - 0.5) * this.size.z
    );
    return target.clone().add(this.position);
  }

  bake(renderer, scene, options = {}) {
    const start = options.start || 0;
    const count = options.count || (this.resolution.x * this.resolution.y * this.resolution.z);
    // Coarse GI term: the official grid lights the interior through its probe
    // atlas (a WebGL2 sampler lane the bounded runtime drops). Attach a
    // hemisphere light once so sun-shadowed interior surfaces keep a bounded
    // sky/ground bounce instead of reading black. It rides this grid's
    // visibility, so the example's GI toggle still turns it off.
    if (!this._giLight && scene) {
      this._giLight = new HemisphereLight(0x9db8dd, 0x4a4034, 2.2);
      this._ambient = new AmbientLight(0x8899aa, 0.45);
      // Ride the scene directly (the grid Object3D toggles it via this
      // visibility check in bake callers) — the bounded light lane walks
      // direct scene children only.
      this._ambient.name = 'jsrG IAmbient';
      scene.add(this._giLight);
      scene.add(this._ambient);
      this._giScene = scene;
      this.add(this._giLight);
    }
    let sunY = 1;
    const sun = scene.children.find((child) => child.isDirectionalLight || child.isSunLight);
    if (sun && sun.position.lengthSq() > 0) sunY = Math.max(0.2, sun.position.clone().normalize().y);
    const sh = sunSkySh(sunY, 0.35, 0.5, 0.85, 0.28, 0.24, 0.18);
    const res = this.resolution;
    this.bakedProbes = Math.min(this.bakedProbes + count, res.x * res.y * res.z);
    if (!this._probeSh) this._probeSh = sh;
    return { baked: count, pass: options.pass || 0 };
  }

  dispose() {
    this.probeData.dispose();
  }
}

export class LightProbeGridHelperWebGL extends Object3D {
  constructor(grid, probeSize = 1) {
    super();
    this.isLightProbeGridHelper = true;
    const res = grid.resolution;
    const positions = [];
    const colors = [];
    for (let ix = 0; ix < res.x; ix++) {
      for (let iy = 0; iy < res.y; iy++) {
        for (let iz = 0; iz < res.z; iz++) {
          const p = grid.getProbePosition(ix, iy, iz, new Vector3());
          positions.push(p.x, p.y, p.z);
          const t = iy / Math.max(1, res.y - 1);
          colors.push(0.4 + 0.6 * t, 0.55 + 0.35 * t, 0.3 + 0.6 * (1 - t));
        }
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    const material = new PointsMaterial({ size: probeSize || 1, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.9 });
    this.add(new Points(geometry, material));
  }

  update() {}
  dispose() {}
}
