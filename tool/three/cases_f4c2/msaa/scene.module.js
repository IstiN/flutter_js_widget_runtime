// cases-f4c2-msaa — E2E-FINISH (issue #8 AC5/AC8): hardware MSAA through
// the 1B facade + ANGLE, compared against bare-Chrome WebGL2. No stock MSAA
// example exists at the pin; this scene exercises BOTH MSAA paths a classic
// WebGL2 scene has: (a) an antialias:true default framebuffer (the facade
// reports the sample count via __jsr1b_set_samples and the EGL surface is
// built with matching MSAA), and (b) a multisampled composer render target
// (WebGLRenderTarget samples: 4, resolved through blitFramebuffer).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const camera = new THREE.PerspectiveCamera(60, 320 / 240, 0.1, 100);
camera.position.set(0, 1.2, 4.5);
camera.lookAt(0, 0.5, 0);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// High-contrast thin geometry: the classic aliasing fixture. Wireframe
// grids (1 px lines) and thin slivers only sharpen correctly when MSAA is
// actually applied; without it the 1B/web pair still matches, so the tier
// compare proves the RESOLVE agrees, while the per-context sample count is
// asserted by the facade attribute path below.
const grid = new THREE.GridHelper(6, 24, 0xffffff, 0x8899aa);
grid.position.y = 0.001;
scene.add(grid);
for (let i = 0; i < 3; i++) {
  const sliver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.8, 0.06), new THREE.MeshBasicMaterial({ color: [0xffffff, 0xffff00, 0x00ffff][i] }));
  sliver.position.set(-1.2 + i * 1.2, 0.9, 0);
  sliver.rotation.z = (i - 1) * 0.35;
  scene.add(sliver);
}

// antialias:true — the default-framebuffer MSAA path.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(320, 240);

// samples: 4 — the multisampled-render-target resolve path.
const msaaTarget = new THREE.WebGLRenderTarget(320, 240, { samples: 4, type: THREE.HalfFloatType });
const composer = new EffectComposer(renderer, msaaTarget);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new OutputPass());

renderer.setAnimationLoop(function () {
  composer.render();
});
