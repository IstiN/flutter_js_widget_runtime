// Depth-texture visualization degrade for webgl_depth_texture (three.js r186).
//
// Root cause of the blue screen: the bounded R1 RT lane stores a render
// target's DepthTexture aliased onto the SAME color attachment as
// target.texture, and the bounded ShaderMaterial lowering renders the color
// attachment — so the official post quad keeps sampling the blue torus-knot
// scene for both tDiffuse and tDepth, and the depth inset is flat blue.
//
// This degrade routes the depth through the color channel instead. Every
// render-target-bound scene pass gets scene.overrideMaterial = MeshDepthMaterial
// while it renders, so the RT color attachment HOLDS grayscale linearized view
// depth (R1 v7 MeshDepthMaterial lane, shaders/three_r1.frag kind 12:
// BasicDepthPacking; RGBA/RGB depth packings are rejected loudly upstream of
// this lane). The post quad then samples real depth structure in both its
// tDiffuse view and its tDepth inset — same attachment, so the alias is
// harmless here. The post composite uses native SubtractiveBlending over a
// white clear to restore the official `1.0 - depth` black-far/white-near
// polarity after the bounded ShaderMaterial-to-Basic lowering. The RT clear is
// white so empty space represents far depth. Other null-target passes and an
// existing scene.overrideMaterial are respected rather than replaced.
//
// Documented no-ops: the official GUI's format / type / samples toggles still
// rebuild the render target (that path works), but the DepthTexture
// format/type/MSAA samples they choose have NO visual effect in the R1 lane —
// depth storage is the aliased color attachment, not a real depth format.
// The toggles are left functional so the module's wiring stays upstream-
// exact; they simply do not change what the lane renders.
//
// Scope: this patch lives inside this widget's bundle, so it cannot leak into
// other widgets. The web (WebGL2) backend is untouched: real WebGLRenderer
// instances there are the upstream class from the same facade, and the patch
// only engages while a render target is bound.

export function installDepthTextureVisualization() {
  const THREE = globalThis.THREE;
  if (!THREE || !THREE.WebGLRenderer || !THREE.MeshDepthMaterial) return;
  const prototype = THREE.WebGLRenderer.prototype;
  if (typeof prototype.render !== 'function' || prototype.render.__jsrDepthViz) return;
  const nativeRender = prototype.render;
  const depthMaterial = new THREE.MeshDepthMaterial();
  const white = new THREE.Color(0xffffff);
  const render = function render(scene, camera) {
    if (!scene || scene.overrideMaterial != null || typeof this.getRenderTarget !== 'function') {
      return nativeRender.call(this, scene, camera);
    }
    const target = this.getRenderTarget();
    if (target === null || target === undefined) {
      // native_renderer deliberately drops arbitrary post-process GLSL and
      // previously substituted an ordinary textured MeshBasicMaterial. The
      // depth values were therefore displayed directly (dark near / white
      // far), not through the official readDepth() `1.0 - depth` inversion.
      // Native SubtractiveBlending implements that missing inversion with
      // dst=white: result = white * (1 - src). The post clear is white and
      // the RT clear is white (far depth), so the far field becomes black.
      let postMaterial = null;
      scene.traverse(object => {
        const material = object.material;
        if (material?.uniforms?.tDiffuse && material.uniforms.tDepth &&
            material.uniforms.cameraNear && material.uniforms.cameraFar) postMaterial = material;
      });
      if (postMaterial) {
        scene.background = white;
        if (postMaterial.blending !== THREE.SubtractiveBlending) {
          postMaterial.blending = THREE.SubtractiveBlending;
          postMaterial.premultipliedAlpha = true;
          postMaterial.needsUpdate = true;
        }
      }
      return nativeRender.call(this, scene, camera);
    }
    const previousBackground = scene.background;
    scene.background = white;
    scene.overrideMaterial = depthMaterial;
    try {
      return nativeRender.call(this, scene, camera);
    } finally {
      scene.overrideMaterial = null;
      scene.background = previousBackground;
    }
  };
  render.__jsrDepthViz = true;
  prototype.render = render;
  console.warn('three: webgl_depth_texture uses native linear view-depth color plus white/far subtractive post inversion; real depth-texture sampling and depth format/type/MSAA effects remain outside R1.');
}
