// cases-f4c2-lines — E2E-FINISH attribution scene: the stock r186 SMAAPass
// on pure wireframe geometry. It isolates the pass from the brick texture
// of the stock example (whose texture-filtering LSB at the SMAA edge
// threshold is the documented corpus limit): on pure geometry the pass is
// bit-identical through the facade + ANGLE vs bare-Chrome WebGL2.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const camera = new THREE.PerspectiveCamera(70, 320 / 240, 1, 1000);
camera.position.z = 300;
const scene = new THREE.Scene();
const geometry = new THREE.BoxGeometry(120, 120, 120);
const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }));
mesh.position.x = -100;
scene.add(mesh);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(320, 240);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new SMAAPass());
composer.addPass(new OutputPass());

renderer.setAnimationLoop(function () {
  composer.render();
});
