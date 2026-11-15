// Bounded native Sky/Water lane for webgl_shaders_sky and webgl_shaders_ocean.
// The R1 renderer intentionally does not execute arbitrary GLSL. This module
// keeps the official uniforms and lil-gui contracts, evaluates the r186 Sky
// scattering/cloud equations on the CPU at a bounded resolution/rate, and
// submits ordinary native materials instead of neutral ShaderMaterial blits.
import {
  ACESFilmicToneMapping,
  AmbientLight,
  BackSide,
  Color,
  CubeCamera,
  DataTexture,
  DirectionalLight,
  EquirectangularReflectionMapping,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PMREMGenerator,
  RGBAFormat,
  RepeatWrapping,
  SphereGeometry,
  UniformsUtils,
  UnsignedByteType,
  Vector3,
  WebGLRenderer,
} from 'three';

const WIDTH = 64;
const HEIGHT = 32;
const CLOUD_HZ = 4;
// RGBA8 cannot retain the Sky shader's HDR range. Preserve linear radiance up
// to 256 and restore it with material/env intensity. A smaller divisor clipped
// the blue channel over most of the daytime sky, collapsing ACES output to gray.
const SKY_SCALE = 256;
const PI = Math.PI;
const skies = new Set();
const waters = new Set();
let bloomStrength = 0;
let bloomRadius = 0;
let warned = false;

const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const fract = value => value - Math.floor(value);
const mix = (a, b, t) => a + (b - a) * t;
function smoothstep(low, high, value) {
  const t = clamp((value - low) / (high - low));
  return t * t * (3 - 2 * t);
}

// r186 Sky.js gradient()/noise(), including its sinless lattice hash.
function gradientDot(x, y, fx, fy) {
  let px = fract(x * 0.1031);
  let py = fract(y * 0.1030);
  let pz = fract(x * 0.0973);
  const dot = px * (py + 33.33) + py * (pz + 33.33) + pz * (px + 33.33);
  px += dot;
  py += dot;
  pz += dot;
  const gx = fract((px + py) * pz) * 2 - 1;
  const gy = fract((px + pz) * py) * 2 - 1;
  return gx * fx + gy * fy;
}
function noise(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = fract(x);
  const fy = fract(y);
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const a = gradientDot(ix, iy, fx, fy);
  const b = gradientDot(ix + 1, iy, fx - 1, fy);
  const c = gradientDot(ix, iy + 1, fx, fy - 1);
  const d = gradientDot(ix + 1, iy + 1, fx - 1, fy - 1);
  return mix(mix(a, b, ux), mix(c, d, ux), uy) * 1.6;
}
function fbm(x, y, drift) {
  let result = 0;
  let amplitude = 1;
  for (let octave = 0; octave < 2; octave++) {
    result += amplitude * noise(x, y);
    amplitude *= 0.5;
    x = x * 2 + drift;
    y = y * 2 + drift;
  }
  return result;
}
function radiance(uniforms, dx, dy, dz) {
  const sun = uniforms.sunPosition.value;
  const sunLength = Math.hypot(sun.x, sun.y, sun.z) || 1;
  const sx = sun.x / sunLength;
  const sy = sun.y / sunLength;
  const sz = sun.z / sunLength;
  const rayleigh = Number(uniforms.rayleigh.value);
  const turbidity = Number(uniforms.turbidity.value);
  const mieCoefficient = Number(uniforms.mieCoefficient.value);
  const g = Number(uniforms.mieDirectionalG.value);
  const cutoffAngle = 1.6110731556870734;
  const sunE = 1000 * Math.max(0, 1 - Math.exp(-((cutoffAngle - Math.acos(clamp(sy, -1, 1))) / 1.5)));
  const sunfade = 1 - clamp(1 - Math.exp(sun.y / 450000));
  const rayleighCoefficient = rayleigh - (1 - sunfade);
  const betaR = [5.804542996261093e-6, 1.3562911419845635e-5, 3.0265902468824876e-5]
    .map(value => value * rayleighCoefficient);
  const mie = 0.434 * (0.2 * turbidity) * 10e-18 * mieCoefficient;
  const betaM = [1.8399918514433978e14, 2.7798023919660528e14, 4.0790479543861094e14]
    .map(value => value * mie);
  const zenith = Math.acos(Math.max(0, dy));
  const inverse = 1 / (Math.cos(zenith) + 0.15 * Math.pow(93.885 - zenith * 180 / PI, -1.253));
  const sR = 8.4e3 * inverse;
  const sM = 1.25e3 * inverse;
  const fex = betaR.map((value, index) => Math.exp(-(value * sR + betaM[index] * sM)));
  const cosTheta = dx * sx + dy * sy + dz * sz;
  const rPhase = 0.05968310365946075 * (1 + Math.pow(cosTheta * 0.5 + 0.5, 2));
  const g2 = g * g;
  const mPhase = 0.07957747154594767 * (1 - g2) /
    Math.pow(1 - 2 * g * cosTheta + g2, 1.5);
  const lin = [0, 1, 2].map(index => {
    const theta = betaR[index] * rPhase + betaM[index] * mPhase;
    const total = betaR[index] + betaM[index];
    const base = total > 0 ? sunE * theta / total : 0;
    return Math.pow(Math.max(0, base * (1 - fex[index])), 1.5) *
      mix(1, Math.sqrt(Math.max(0, base * fex[index])), clamp(Math.pow(1 - sy, 5)));
  });
  const l0 = fex.map(value => 0.1 * value);
  const disc = clamp((cosTheta - 0.9999566769464484) * 50000) * Number(uniforms.showSunDisc.value);
  const color = [0, 1, 2].map(index => (lin[index] + l0[index]) * 0.04 +
    760 * disc * Math.min(sunE * fex[index], 80) + [0, 0.0003, 0.00075][index]);

  // Bounded UnrealBloom replacement: a smooth warm horizon band, not a
  // forward-scattering lobemap. The old aureole produced long smeared
  // reflections on the two-triangle native water plane.
  if (bloomStrength > 0 && sy > -0.15) {
    const horizon = Math.exp(-Math.abs(dy) * (10 - 6 * bloomRadius));
    const glow = horizon * bloomStrength * (0.03 + 0.05 * bloomRadius) * Math.max(0, sy + 0.1);
    for (let index = 0; index < 3; index++) color[index] += glow * [1, 0.42, 0.16][index];
  }

  const coverage = Number(uniforms.cloudCoverage.value);
  if (dy > 0 && coverage > 0) {
    const time = Number(uniforms.time.value);
    const elevation = mix(1, 0.1, Number(uniforms.cloudElevation.value));
    const scale = Number(uniforms.cloudScale.value);
    const speed = Number(uniforms.cloudSpeed.value);
    const cx = (dx / (dy * elevation)) * scale + time * speed;
    const cy = (dz / (dy * elevation)) * scale + time * speed;
    const evolve = time * speed * 300;
    const cloudNoise = clamp(fbm(cx * 1000, cy * 1000, evolve) * 0.7 + 0.5);
    const region = noise(cx * 300, cy * 300) * 0.37 + 0.5;
    const cov = clamp(coverage + (region - 0.5) * 0.6);
    const threshold = 1 - cov;
    let mask = smoothstep(threshold, threshold + 0.3, cloudNoise);
    const horizonFade = smoothstep(0, 0.03 + 0.06 * Number(uniforms.cloudElevation.value), dy);
    mask *= horizonFade;
    const dayFactor = smoothstep(-0.08, 0.3, sy);
    const depth = Math.max(0, cloudNoise - threshold);
    const beer = Math.exp(depth * -4);
    const powder = 1 - beer * beer;
    const shade = mix(0.45, 1, clamp(beer * powder * 2.6));
    const silver = clamp(0.51 / Math.pow(1.49 - cosTheta * 1.4, 1.5), 0, 3);
    const edge = mask * (1 - mask) * 4;
    const alpha = (1 - Math.exp(depth * Number(uniforms.cloudDensity.value) * -12)) * horizonFade;
    for (let index = 0; index < 3; index++) {
      const sunlight = sunE * fex[index] * 0.22 * 0.04;
      const ambient = lin[index] * 0.04 + [0, 0.0003, 0.00075][index];
      const cloud = (ambient + sunlight * shade + sunlight * silver * edge * 0.6) * Math.max(dayFactor, 0.03);
      color[index] -= l0[index] * 0.04 * alpha;
      color[index] = mix(color[index], mix(color[index], cloud, fex[index]), alpha);
    }
  }
  const dusk = 1 - smoothstep(0.04, 0.4, Math.abs(sy));
  if (dusk > 0) {
    // A small blue-hour sky floor and warm horizon keep Ocean readable in
    // RGBA8. Without the official half-float chain its low-sun radiance
    // otherwise quantizes to zero almost everywhere outside the solar core.
    const horizon = Math.exp(-Math.abs(dy) * 5);
    color[0] += dusk * (0.006 + 0.08 * horizon);
    color[1] += dusk * (0.012 + 0.018 * horizon);
    color[2] += dusk * (0.03 + 0.012 * horizon);
  }
  return color;
}

function makeTexture() {
  const texture = new DataTexture(new Uint8Array(WIDTH * HEIGHT * 4), WIDTH, HEIGHT, RGBAFormat, UnsignedByteType);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

function makeWaterTexture() {
  // A smooth UV-wave albedo keeps moving water readable without derivative
  // normals. flutter_gpu reconstructs non-unit mesh normals on a two-triangle
  // plane with a zero-length derivative, which outlined the whole plane.
  const size = 64;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size * Math.PI * 2;
      const v = y / size * Math.PI * 2;
      const wave = 0.5 + 0.5 * Math.sin(u * 5 + Math.sin(v * 3) * 1.4);
      const cross = 0.5 + 0.5 * Math.sin(v * 7 - u * 2);
      const shade = 0.72 + 0.28 * wave * (0.65 + 0.35 * cross);
      const offset = (y * size + x) * 4;
      pixels[offset] = Math.round(218 * shade);
      pixels[offset + 1] = Math.round(235 * shade);
      pixels[offset + 2] = Math.round(242 * shade);
      pixels[offset + 3] = 255;
    }
  }
  const texture = new DataTexture(pixels, size, size, RGBAFormat, UnsignedByteType);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export class Sky extends Mesh {
  constructor() {
    const texture = makeTexture();
    const material = new MeshBasicMaterial({ map: texture, side: BackSide, depthWrite: false });
    material.color.setScalar(SKY_SCALE);
    // scene.environment is auto-assigned to Basic materials by R1. Do not
    // multiply the dome by the same environment a second time.
    material.reflectivity = 0;
    // A camera-centred UV sphere is the native screen-dome equivalent of
    // Sky's BackSide box and gives stable equirectangular coordinates.
    super(new SphereGeometry(1, 48, 24), material);
    this.isSky = true;
    this.frustumCulled = false;
    this.renderOrder = -1000000;
    this.material.uniforms = UniformsUtils.clone(Sky.SkyShader.uniforms);
    this._nativeTexture = texture;
    this._environmentTexture = texture.clone();
    this._environmentTexture.mapping = EquirectangularReflectionMapping;
    this._nativeSignature = '';
    this._nativeRevision = 0;
    this._nativeLastCloudTime = -Infinity;
    skies.add(this);
    this.addEventListener('dispose', () => skies.delete(this));
  }

  _syncNative(renderer, camera) {
    if (camera) {
      // Keep the backdrop inside the near/far range and centred on the view.
      // The official ocean dome radius (10000) is needlessly prone to native
      // depth precision loss; this transform does not change its view rays.
      camera.updateMatrixWorld();
      this.position.setFromMatrixPosition(camera.matrixWorld);
      this.scale.setScalar(Math.max(0.001, (camera.near || 0.1) * 2));
    }
    const u = this.material.uniforms;
    const sun = u.sunPosition.value;
    const sunLength = Math.hypot(sun.x, sun.y, sun.z) || 1;
    const lowSun = 1 - smoothstep(0.04, 0.4, Math.abs(sun.y / sunLength));
    // The native RGBA8 lane omits the official half-float post chain. Use a
    // smaller encoding range at dusk so dim gradients do not quantize to zero,
    // and lift only the display dome (never its environment reflections).
    this._nativeScale = SKY_SCALE - (SKY_SCALE - 4) * lowSun;
    this.material.color.setScalar(this._nativeScale * (1 + 23 * lowSun));
    const controlSignature = [
      u.turbidity.value, u.rayleigh.value, u.mieCoefficient.value, u.mieDirectionalG.value,
      u.sunPosition.value.x, u.sunPosition.value.y, u.sunPosition.value.z,
      u.cloudScale.value, u.cloudSpeed.value, u.cloudCoverage.value,
      u.cloudDensity.value, u.cloudElevation.value, u.showSunDisc.value,
      bloomStrength, bloomRadius,
    ].join('|');
    const time = Number(u.time.value) || 0;
    const cloudsMoving = Number(u.cloudCoverage.value) > 0 && Number(u.cloudSpeed.value) !== 0;
    const due = !cloudsMoving || time - this._nativeLastCloudTime >= 1 / CLOUD_HZ ||
      time < this._nativeLastCloudTime;
    if (controlSignature === this._nativeSignature && !due) return;
    this._nativeSignature = controlSignature;
    this._nativeLastCloudTime = time;
    const display = this._nativeTexture.image.data;
    let offset = 0;
    for (let y = 0; y < HEIGHT; y++) {
      const theta = ((y + 0.5) / HEIGHT) * PI;
      const sinTheta = Math.sin(theta);
      for (let x = 0; x < WIDTH; x++) {
        // Native equirectUv() is v=asin(y)/PI+0.5, hence theta=(1-v)*PI.
        // SphereGeometry uses the same vertical UV convention. The previous
        // +cos(theta) sampled the below-horizon white texels as the visible sky.
        const phi = ((x + 0.5) / WIDTH) * 2 * PI - PI;
        const color = radiance(u, sinTheta * Math.cos(phi), -Math.cos(theta), sinTheta * Math.sin(phi));
        for (let channel = 0; channel < 3; channel++) {
          display[offset + channel] = clamp(color[channel] / this._nativeScale) * 255 + 0.5;
        }
        display[offset + 3] = 255;
        offset += 4;
      }
    }
    this._nativeTexture.needsUpdate = true;
    this._environmentTexture.needsUpdate = true;
    this._nativeRevision++;
  }
}

Sky.SkyShader = {
  name: 'SkyShader',
  uniforms: {
    turbidity: { value: 2 }, rayleigh: { value: 1 }, mieCoefficient: { value: 0.005 },
    mieDirectionalG: { value: 0.8 }, sunPosition: { value: new Vector3() },
    cloudScale: { value: 0.0002 }, cloudSpeed: { value: 0.00002 },
    cloudCoverage: { value: 0.4 }, cloudDensity: { value: 0.4 },
    cloudElevation: { value: 0.5 }, showSunDisc: { value: 1 }, time: { value: 0 },
  },
};

export class Water extends Mesh {
  constructor(geometry, options = {}) {
    const material = new MeshStandardMaterial({
      color: options.waterColor ?? 0x7f7f7f,
      map: makeWaterTexture(),
      roughness: 0.43,
      metalness: 0.45,
      envMapIntensity: 1.1,
    });
    super(geometry, material);
    this.isWater = true;
    this._nativeWaterTint = new Color(0x2c8794);
    this._nativeWaterTexture = material.map;
    const normalSampler = options.waterNormals || null;
    if (normalSampler) normalSampler.wrapS = normalSampler.wrapT = RepeatWrapping;
    // Upstream Water is dominated by reflected sky, not its nearly-black
    // absorption color. Keep that color live but retain a visible teal body
    // for R1's single-lobe, non-planar reflection approximation.
    material.emissive = this._nativeWaterTint.clone().multiplyScalar(0.35);
    material.uniforms = {
      normalSampler: { value: normalSampler }, mirrorSampler: { value: null },
      alpha: { value: options.alpha ?? 1 }, time: { value: options.time ?? 0 }, size: { value: 1 },
      distortionScale: { value: options.distortionScale ?? 20 },
      textureMatrix: { value: null }, sunColor: { value: new Color(options.sunColor ?? 0x7f7f7f) },
      sunDirection: { value: options.sunDirection?.clone() || new Vector3(0.70707, 0.70707, 0) },
      eye: { value: options.eye?.clone() || new Vector3() },
      waterColor: { value: new Color(options.waterColor ?? 0x555555) },
    };
    this._nativeSun = new DirectionalLight(0xffffff, 2.4);
    this._nativeSunTarget = this._nativeSun.target;
    this._nativeAmbient = new AmbientLight(0x9fc8dd, 0.65);
    this._nativeLightingScene = null;
    waters.add(this);
    this.addEventListener('dispose', () => waters.delete(this));
  }

  _syncNative(scene, camera) {
    const u = this.material.uniforms;
    const time = Number(u.time.value) || 0;
    const size = Math.max(0.1, Number(u.size.value) || 1);
    const distortion = Math.max(0, Number(u.distortionScale.value) || 0);
    this.material.color.copy(u.waterColor.value).lerp(this._nativeWaterTint, 0.92);
    this.material.roughness = clamp(0.58 - distortion * 0.04, 0.18, 0.58);
    this._nativeWaterTexture.repeat.set(size, size);
    this._nativeWaterTexture.offset.set(
      fract(time * (0.008 + distortion * 0.002)), fract(time * 0.011),
    );
    const normals = u.normalSampler.value;
    if (normals) normals.wrapS = normals.wrapT = RepeatWrapping;
    const sun = u.sunDirection.value;
    this._nativeSun.position.copy(sun).normalize().multiplyScalar(100);
    this._nativeSun.color.copy(u.sunColor.value);
    this._nativeSun.intensity = 2 + 3.5 * Math.max(0.15, sun.y);
    this._nativeAmbient.intensity = 1.5 + 1.5 * Math.max(0.1, sun.y);
    if (camera) u.eye.value.setFromMatrixPosition(camera.matrixWorld);
    if (this._nativeLightingScene !== scene) {
      scene.add(this._nativeSun, this._nativeAmbient, this._nativeSunTarget);
      this._nativeLightingScene = scene;
    }
  }
}

// setEffects() has no arbitrary composer lane. Ocean's bloom facade instead
// feeds the generated Sky's bounded solar aureole, so both official controls
// remain live instead of changing an ignored pass object.
export class UnrealBloomPass {
  constructor() { this.threshold = 0; this._strength = 1; this._radius = 0; }
  get strength() { return this._strength; }
  set strength(value) { this._strength = Number(value); bloomStrength = this._strength; }
  get radius() { return this._radius; }
  set radius(value) { this._radius = Number(value); bloomRadius = this._radius; }
  render() {}
  dispose() {}
}

const nativeFromScene = PMREMGenerator.prototype.fromScene;
PMREMGenerator.prototype.fromScene = function fromScene(scene, ...args) {
  const sky = scene?.children?.find(child => child.isSky && child._environmentTexture);
  if (sky) {
    sky._syncNative(this._renderer || this.renderer || { toneMapping: ACESFilmicToneMapping, toneMappingExposure: 0.1 });
    return { texture: sky._environmentTexture, dispose() {} };
  }
  return nativeFromScene.call(this, scene, ...args);
};

const nativeCubeUpdate = CubeCamera.prototype.update;
CubeCamera.prototype.update = function update(renderer, scene) {
  const sky = scene?.children?.find(child => child.isSky && child._nativeTexture);
  if (!sky) return nativeCubeUpdate.call(this, renderer, scene);
  sky._syncNative(renderer);
  scene.traverse(object => {
    if (!object.isMesh || !object.material?.envMap?.isRenderTargetTexture) return;
    object.material.envMap = sky._environmentTexture;
    object.material.color.setScalar(sky._nativeScale);
    object.material.needsUpdate = true;
  });
  // One current equirectangular reflection replaces six identical flat RT
  // passes; unlike the old 2D-as-cube fallback it contains real sky pixels.
};

const nativeRender = WebGLRenderer.prototype.render;
WebGLRenderer.prototype.render = function render(scene, camera) {
  if (scene?.isScene) {
    scene.traverse(object => {
      if (object.isSky && object._nativeTexture) object._syncNative(this, camera);
      else if (object.isWater && object.material?.uniforms) object._syncNative(scene, camera);
    });
    const environment = scene.environment;
    const sky = [...skies].find(candidate => candidate._environmentTexture === environment);
    if (sky) scene.traverse(object => {
      if (object.isMesh && object.material?.isMeshStandardMaterial) object.material.envMapIntensity = sky._nativeScale * (object.isWater ? 2.2 : 2);
    });
  }
  return nativeRender.call(this, scene, camera);
};

if (!warned) {
  warned = true;
  console.warn('three: native Sky/Water use bounded CPU r186 scattering at 64x32 (two-octave clouds at 4 Hz), equirectangular reflections, animated UV-wave water, and solar-aureole bloom; arbitrary GLSL, mirror RTs, and bloom mips are omitted.');
}
