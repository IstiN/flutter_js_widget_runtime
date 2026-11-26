// cases-f4c2-vignette — E2E-FINISH (issue #8 AC5): the stock r186
// VignetteShader through a stock ShaderPass on the 1B facade + ANGLE,
// compared against bare-Chrome WebGL2. No stock vignette example exists at
// the pin, so this scene uses the stock shader file unchanged.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { VignetteShader } from 'three/addons/shaders/VignetteShader.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const camera = new THREE.PerspectiveCamera(60, 320 / 240, 0.1, 100);
camera.position.set(0, 1.5, 5);
camera.lookAt(0, 0.5, 0);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // maximally visible darkening

// Deterministic content: bright field + colored slabs reaching into the
// corners, where the vignette darkening is strongest.
const slabColors = [0xffaa00, 0x00aa88, 0x6622cc];
for (let i = 0; i < 3; i++) {
  const slab = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.2), new THREE.MeshBasicMaterial({ color: slabColors[i] }));
  slab.position.set(-1.8 + i * 1.8, 0.95, 0);
  scene.add(slab);
}
const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshBasicMaterial({ color: 0xeeeeee }));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(320, 240);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const vignette = new ShaderPass(VignetteShader);
vignette.uniforms.offset.value = 0.95;
vignette.uniforms.darkness.value = 1.2;
composer.addPass(vignette);
composer.addPass(new OutputPass());

renderer.setAnimationLoop(function () {
  composer.render();
});
