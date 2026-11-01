// Explicit bounded replacement for the network/WASM/GPU 3D Tiles pipeline.
// The official bytes remain pinned in official_module.js; this native scene
// keeps a geospatial globe, Tokyo camera, lighting and orbit controls visible.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
console.warn('three: bounded 3D Tiles degrade: Cesium ion, Worker/WASM loaders and Takram GPU effects are unavailable; rendering a native Tokyo globe scene.');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x081426);
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(0, 120, 360);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x26384c, 2.5));
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(200, 300, 400); scene.add(sun);
const globe = new THREE.Mesh(
  new THREE.SphereGeometry(100, 64, 32),
  new THREE.MeshStandardMaterial({ color: 0x357aa5, roughness: 0.82, metalness: 0.05 })
);
scene.add(globe);
const tokyo = new THREE.Mesh(
  new THREE.SphereGeometry(3, 12, 8),
  new THREE.MeshBasicMaterial({ color: 0xffcc44 })
);
tokyo.position.set(62, 48, 82); scene.add(tokyo);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
