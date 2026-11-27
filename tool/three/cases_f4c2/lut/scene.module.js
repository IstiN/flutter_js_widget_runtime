// cases-f4c2-lut — E2E-FINISH (issue #8 AC5): the stock r186 LUTPass on the
// 1B facade + ANGLE, compared against bare-Chrome WebGL2. The stock LUT
// example (webgl_postprocessing_3dlut) is a documented corpus limit — the
// prepare pipeline stores its LUT files as prebuilt J3LT containers the
// stock loaders reject — so this scene proves the pass itself with the
// stock LUTPass.js unchanged, fed by an in-scene Data3DTexture (no external
// LUT asset on either leg).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { LUTPass } from 'three/addons/postprocessing/LUTPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const camera = new THREE.PerspectiveCamera(60, 320 / 240, 0.1, 100);
camera.position.set(0, 1.5, 5);
camera.lookAt(0, 0.5, 0);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x404040);

// Deterministic content spanning the LUT domain: neutral field, the three
// primaries, and a color ramp — grading visibly bends every region.
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
const swatches = [0xff0000, 0x00ff00, 0x0000ff];
for (let i = 0; i < 3; i++) {
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshBasicMaterial({ color: swatches[i] }));
  box.position.set(-1.6 + i * 1.6, 0.9, 0);
  scene.add(box);
}

// 8x8x8 identity-derived LUT with a deterministic creative grading:
// swap R<->B dominance and lift the midtones, so a broken pass (identity
// LUT, missing texture, skipped pass) fails the tier compare loudly.
const size = 8;
const data = new Uint8Array(size * size * size * 4);
let o = 0;
for (let z = 0; z < size; z++) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const r = x / (size - 1), g = y / (size - 1), b = z / (size - 1);
      // deterministic grading: rotate the axes, mild S-curve on green
      data[o++] = Math.round(255 * b);
      data[o++] = Math.round(255 * (g * g * (3 - 2 * g)));
      data[o++] = Math.round(255 * r);
      data[o++] = 255;
    }
  }
}
const lutTexture = new THREE.Data3DTexture(data, size, size, size);
lutTexture.format = THREE.RGBAFormat;
lutTexture.type = THREE.UnsignedByteType;
lutTexture.minFilter = THREE.LinearFilter;
lutTexture.magFilter = THREE.LinearFilter;
lutTexture.unpackAlignment = 1;
lutTexture.needsUpdate = true;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(320, 240);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const lutPass = new LUTPass({ lut: lutTexture, intensity: 1.0 });
composer.addPass(lutPass);
composer.addPass(new OutputPass());

renderer.setAnimationLoop(function () {
  composer.render();
});
