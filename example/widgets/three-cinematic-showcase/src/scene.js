// Showcase diorama for the deterministic cinematic pipeline.
//
// Every animated property is a PURE function of the pipeline clock state
// (clockState / subframe time `t` in absolute seconds). No Date.now, no
// Math.random, no requestAnimationFrame in this module. The one-time static
// layout is seeded through cinematicRandom so different epochs produce
// different — but fully deterministic — dioramas.

import {
  AmbientLight,
  BoxGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  Fog,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  SphereGeometry,
  TorusGeometry,
  TorusKnotGeometry
} from 'three';

import { cinematicRandom } from './pipeline.js';

const TWO_PI = Math.PI * 2;

function mul(a, b) { return a * b; }

// Static, seed-derived layout. Rebuilt identically for the same epoch seed.
function buildLayout(root, random, epoch) {
  const spinners = [];
  const orbiters = [];

  const ground = new Mesh(
    new CircleGeometry(16, 64),
    new MeshStandardMaterial({ color: 0x1d2733, roughness: 0.95, metalness: 0.0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.name = 'ground';
  root.add(ground);

  const hero = new Mesh(
    new TorusKnotGeometry(0.85, 0.28, 160, 24),
    new MeshStandardMaterial({
      color: 0x7f9cc4,
      roughness: 0.32,
      metalness: 0.65,
      emissive: 0x0a1522,
      emissiveIntensity: 0.6
    })
  );
  hero.position.set(0, 1.7, 0);
  hero.name = 'hero';
  root.add(hero);
  spinners.push({ object: hero, axis: 'y', speed: 0.35, phase: 0 });
  spinners.push({ object: hero, axis: 'x', speed: 0.11, phase: 1.3 });

  const variants = [
    { geometry: new BoxGeometry(0.9, 0.9, 0.9), color: 0xc48a6a },
    { geometry: new SphereGeometry(0.55, 32, 20), color: 0x6ac4a0 },
    { geometry: new ConeGeometry(0.5, 1.1, 24), color: 0xc4c06a },
    { geometry: new IcosahedronGeometry(0.6, 0), color: 0x9a6ac4 },
    { geometry: new TorusGeometry(0.5, 0.18, 16, 40), color: 0x6a8fc4 }
  ];

  const satellites = new Group();
  satellites.name = 'satellites';
  root.add(satellites);

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const angle = random() * TWO_PI;
    const radius = 2.6 + random() * 2.4;
    const mesh = new Mesh(v.geometry, new MeshStandardMaterial({
      color: v.color,
      roughness: 0.45 + random() * 0.3,
      metalness: 0.2 + random() * 0.4
    }));
    mesh.position.set(
      Math.cos(angle) * radius,
      0.55 + random() * 1.4,
      Math.sin(angle) * radius
    );
    mesh.name = 'sat-' + i;
    satellites.add(mesh);
    spinners.push({ object: mesh, axis: 'y', speed: 0.2 + random() * 0.7, phase: random() * TWO_PI });
    spinners.push({ object: mesh, axis: 'x', speed: 0.05 + random() * 0.2, phase: random() * TWO_PI });
  }

  // Two orbiting point lights with visible emissive markers.
  const lights = [];
  const lightSpecs = [
    { color: 0xffd9a6, radius: 4.2, height: 2.8, speed: 0.55, phase: 0.0, power: 42 },
    { color: 0x86b8ff, radius: 5.6, height: 1.6, speed: -0.38, phase: Math.PI * 0.7, power: 30 }
  ];
  for (let i = 0; i < lightSpecs.length; i++) {
    const spec = lightSpecs[i];
    const light = new PointLight(spec.color, spec.power, 0, 2);
    const marker = new Mesh(
      new SphereGeometry(0.09, 12, 8),
      new MeshStandardMaterial({ color: 0x000000, emissive: spec.color, emissiveIntensity: 3 })
    );
    light.name = 'light-' + i;
    marker.name = 'light-marker-' + i;
    root.add(light);
    root.add(marker);
    lights.push(light);
    orbiters.push({ light: light, marker: marker, spec: spec });
  }

  return { spinners: spinners, orbiters: orbiters, epoch: epoch };
}

function disposeGroup(root) {
  root.traverse(node => {
    if (node.geometry && typeof node.geometry.dispose === 'function') node.geometry.dispose();
    if (node.material) {
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      for (const material of materials) {
        if (material && typeof material.dispose === 'function') material.dispose();
      }
    }
  });
  root.clear();
}

// createShowcaseScene({ width, height, seed }) -> Scene with userData:
//   camera   — PerspectiveCamera on a deterministic slow orbit
//   random   — the seeded cinematicRandom stream (epoch-scoped)
//   reseed(epoch) — rebuild the static layout for a new deterministic epoch
export function createShowcaseScene(options = {}) {
  const width = options.width || 480;
  const height = options.height || 320;
  const seed = options.seed === undefined ? 1 : options.seed;

  const scene = new Scene();
  // alpha lanes (PNG export with transparency) need no opaque background —
  // the renderer clear alpha comes through as-is.
  if (!options.alpha) {
    scene.background = new Color(0x0a0f16);
  }
  scene.fog = new Fog(0x0a0f16, 14, 34);

  const ambient = new AmbientLight(0x40506a, 0.7);
  const hemi = new HemisphereLight(0x8fa8cc, 0x1c242e, 0.6);
  scene.add(ambient);
  scene.add(hemi);

  const camera = new PerspectiveCamera(50, width / height, 0.1, 80);
  camera.position.set(0, 3, 9);
  camera.lookAt(0, 1.2, 0);

  const root = new Group();
  root.name = 'diorama';
  scene.add(root);

  const userData = {
    camera: camera,
    epoch: 0,
    spinners: [],
    orbiters: [],
    random: cinematicRandom(seed),
    reseed: null
  };
  scene.userData = userData;

  userData.reseed = function reseed(epoch) {
    const e = (epoch === undefined ? 0 : epoch) >>> 0;
    disposeGroup(root);
    // Fixed mixing of the epoch into the seed: same epoch -> same layout,
    // different epoch -> a different but still deterministic diorama.
    const epochSeed = (mul(e, 2654435761) ^ (seed * 40503)) >>> 0;
    const random = cinematicRandom(epochSeed || 1);
    const layout = buildLayout(root, random, e);
    userData.epoch = e;
    userData.random = random;
    userData.spinners = layout.spinners;
    userData.orbiters = layout.orbiters;
  };

  userData.reseed(0);
  return scene;
}

// updateShowcaseScene(scene, clockState) — mutate positions/rotations from
// clockState ONLY. `clockState.t` is the absolute subframe time in seconds.
// All motion derives from t through fixed arithmetic (sin/cos), so direct
// rendering of frame N and sequential rendering of 0..N agree bit-for-bit.
export function updateShowcaseScene(scene, clockState) {
  const userData = scene && scene.userData;
  if (!userData) throw new Error('cinematic.invalid: showcase scene userData missing');
  const t = clockState && typeof clockState.t === 'number' ? clockState.t : 0;

  const camera = userData.camera;
  if (camera) {
    const angle = t * 0.22;
    const radius = 9.2;
    const height = 3.1 + Math.sin(t * 0.13) * 0.6;
    camera.position.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
    camera.lookAt(0, 1.3, 0);
  }

  const spinners = userData.spinners || [];
  for (let i = 0; i < spinners.length; i++) {
    const s = spinners[i];
    const value = t * s.speed + s.phase;
    if (s.axis === 'x') s.object.rotation.x = value;
    else if (s.axis === 'z') s.object.rotation.z = value;
    else s.object.rotation.y = value;
  }

  const orbiters = userData.orbiters || [];
  for (let i = 0; i < orbiters.length; i++) {
    const o = orbiters[i];
    const spec = o.spec;
    const angle = t * spec.speed + spec.phase;
    const bob = Math.sin(t * 0.9 + spec.phase) * 0.35;
    const x = Math.cos(angle) * spec.radius;
    const z = Math.sin(angle) * spec.radius;
    const y = spec.height + bob;
    o.light.position.set(x, y, z);
    if (o.marker) o.marker.position.set(x, y, z);
    // Deterministic gentle flicker — fixed arithmetic only.
    o.light.intensity = spec.power * (0.9 + 0.1 * Math.sin(t * 2.3 + spec.phase * 3.1));
  }
}
