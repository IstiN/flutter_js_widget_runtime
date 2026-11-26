// cases-f4c2-film — E2E-FINISH (issue #8 AC5): the stock r186 FilmPass
// (grain) through the 1B facade + ANGLE, compared against bare-Chrome
// WebGL2 by the F4c2 corpus driver. No stock FilmPass example exists at the
// pin, so this scene uses the stock pass file unchanged. The grain is
// deterministic: FilmPass advances its `time` uniform by the composer
// deltaTime, and the animate loop passes a fixed 1/24 s per tick (the
// corpus driver pins the clock; no wall-clock randomness).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const camera = new THREE.PerspectiveCamera(60, 320 / 240, 0.1, 100);
camera.position.set(0, 1.5, 5);
camera.lookAt(0, 0.5, 0);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101522);

// Deterministic content: a color-ramp plane plus three emissive-toned boxes
// so the grain lands on distinct, easily comparable color fields.
const rampCanvas = document.createElement('canvas');
rampCanvas.width = 64;
rampCanvas.height = 8;
const rctx = rampCanvas.getContext('2d');
for (let x = 0; x < 64; x++) {
  const t = x / 63;
  rctx.fillStyle = 'rgb(' + Math.round(255 * t) + ',' + Math.round(255 * (1 - t)) + ',128)';
  rctx.fillRect(x, 0, 1, 8);
}
const ramp = new THREE.CanvasTexture(rampCanvas);
const plane = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({ map: ramp }));
plane.position.y = 0.5;
scene.add(plane);
const boxColors = [0xff5533, 0x33cc66, 0x3366ff];
for (let i = 0; i < 3; i++) {
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), new THREE.MeshBasicMaterial({ color: boxColors[i] }));
  box.position.set(-1.8 + i * 1.8, 0.95, 0);
  scene.add(box);
}

const renderer = new THREE.WebGLRenderer();
renderer.setSize(320, 240);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new FilmPass(1.0, false));
composer.addPass(new OutputPass());

renderer.setAnimationLoop(function () {
  composer.render(1 / 24);
});
