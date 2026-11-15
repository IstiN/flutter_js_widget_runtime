// Official r186 webgl_loader_gltf_instancing with one bounded R1 material
// degrade. The asset combines emissiveFactor=[1,1,1] with an emissive map;
// dropping only the unsupported map would add uniform white to every helmet.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { UltraHDRLoader } from 'three/addons/loaders/UltraHDRLoader.js';

let camera, scene, renderer;
init();
render();

function init() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
  camera.position.set(-0.90, 0.41, -0.89);
  scene = new THREE.Scene();

  new UltraHDRLoader()
    .setPath('textures/equirectangular/')
    .load('royal_esplanade_2k.hdr.jpg', function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = texture;
      scene.environment = texture;
      render();

      const loader = new GLTFLoader().setPath('models/gltf/DamagedHelmet/glTF-instancing/');
      loader.load('DamagedHelmetGpuInstancing.gltf', function (gltf) {
        gltf.scene.traverse(object => {
          if (!object.material) return;
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            if (!material.emissiveMap) continue;
            material.emissiveMap = null;
            material.emissive.setRGB(0, 0, 0);
            material.needsUpdate = true;
          }
        });
        console.warn('[degrade] R1 omits the gltf-instancing emissive map and its white emissive factor; albedo/normal/PBR lighting is preserved.');
        scene.add(gltf.scene);
        render();
      });
    });

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', render);
  controls.minDistance = 0.2;
  controls.maxDistance = 10;
  controls.target.set(0, 0.25, 0);
  controls.update();
  window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function render() {
  renderer.render(scene, camera);
}
