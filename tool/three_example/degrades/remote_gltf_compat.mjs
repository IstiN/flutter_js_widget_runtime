import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function replacementFor(mode, url) {
  if (typeof url !== 'string' || !url.startsWith('https://cloud.needle.tools/')) return null;
  if (mode === 'animation') return 'models/gltf/Horse.glb';
  if (url.includes('Z2sPRdk-world')) return 'models/gltf/LittlestTokyo.glb';
  if (url.includes('ZnlceI-world')) return 'models/gltf/Horse.glb';
  return 'models/gltf/duck.glb';
}

export function installRemoteGltfCompat(mode) {
  console.warn('three: Needle remote assets use pinned local glTF stand-ins; remote-only content is explicitly degraded.');
  const host = globalThis.jsr && globalThis.jsr.three;
  if (host && typeof host.loadAsset === 'function' && !host.loadAsset.__jsrRemoteGltfCompat) {
    const originalLoadAsset = host.loadAsset;
    const loadAsset = function(url, ...args) {
      const replacement = replacementFor(mode, url);
      if (replacement) console.warn(`three: remote Needle asset replaced by pinned ${replacement}; remote-only content is explicitly degraded.`);
      return originalLoadAsset.call(this, replacement || url, ...args);
    };
    loadAsset.__jsrRemoteGltfCompat = true;
    host.loadAsset = loadAsset;
  }
  const prototype = GLTFLoader.prototype;
  if (prototype.load.__jsrRemoteGltfCompat) return;
  const original = prototype.load;
  function load(url, onLoad, onProgress, onError) {
    let replacement = null;
    let scale = 1;
    if (typeof url === 'string' && url.startsWith('https://cloud.needle.tools/')) {
      if (mode === 'animation') {
        replacement = 'models/gltf/Horse.glb';
        // The official pointer camera frames a small city at 6–7 world units,
        // not the unscaled ~200-unit Horse stand-in.
        scale = 0.01;
      } else if (url.includes('Z2sPRdk-world')) {
        replacement = 'models/gltf/LittlestTokyo.glb';
        // The official module applies another 0.1: final scale is 0.01,
        // matching the stock LittlestTokyo example's camera framing.
        scale = 0.1;
      } else if (url.includes('ZnlceI-world')) {
        replacement = 'models/gltf/Horse.glb';
        // The official airship transform applies 0.0005; keep the stand-in
        // at the same 0.01 final scale as the animation replacement.
        scale = 20;
      }
      else { replacement = 'models/gltf/duck.glb'; scale = 2; }
      console.warn(`three: remote Needle glTF replaced by pinned ${replacement}; progressive/remote-only content is explicitly degraded.`);
    }
    const wrapped = replacement && typeof onLoad === 'function' ? gltf => {
      if (scale !== 1 && gltf.scene) gltf.scene.scale.setScalar(scale);
      onLoad(gltf);
    } : onLoad;
    return original.call(this, replacement || url, wrapped, onProgress, onError);
  }
  load.__jsrRemoteGltfCompat = true;
  prototype.load = load;
}
