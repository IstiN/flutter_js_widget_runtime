// scene_f4i.js — the F4i downstream host proof scene (issue #8, segment F4i,
// AC15). A plain script (no imports) so the SAME text runs in the engine
// widget (concatenated after the bundle) and in the Chrome reference page.
//
// A short transparent-overlay scene, as a video frame would be: opaque
// overlay shapes over a fully transparent background, so the RGBA output
// composites over any host background (the proof composites it over a dark
// and a light one). Geometry alpha is strictly binary (opaque shapes, no
// opacity fades, antialias off): only the bloom glow introduces partial
// alpha, which is exactly the case the proof's straight-alpha PNG codec must
// carry losslessly.
//
// Every animated property is a pure function of the pipeline clock state
// (clockState subframe time t in absolute seconds): no Date.now, no
// Math.random, no RAF in this module. The sweeping mover gives the stock
// AfterimagePass its temporal trail; the two panels at different depths give
// the stock BokehPass its focus targets; the bright emissive quad feeds
// UnrealBloomPass.
(function () {
  function createOverlayScene(options) {
    options = options || {};
    var THREE = globalThis.THREE;
    if (!THREE) throw new Error('f4i: globalThis.THREE missing');
    var width = options.width || 96;
    var height = options.height || 64;

    // Transparent background: the pipeline applies clearAlpha 0 (alpha: true).
    var scene = new THREE.Scene();
    scene.background = null;

    var camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 60);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    scene.userData.camera = camera;

    // Far panel (blur target of the DOF checkpoint): opaque, mid gray.
    var far = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 4.5),
      new THREE.MeshBasicMaterial({ color: 0x3a3f46 })
    );
    far.position.set(-1.2, -0.4, -3.5);
    scene.add(far);

    // Near panel (sharp DOF target): opaque, darker, offset so both panels
    // are visible in frame.
    var near = new THREE.Mesh(
      new THREE.PlaneGeometry(5.5, 3.5),
      new THREE.MeshBasicMaterial({ color: 0x15181c })
    );
    near.position.set(1.1, 0.5, 3);
    scene.add(near);

    // Bright emissive quad (bloom source): HDR-bright, opaque, above the
    // bloom threshold (0.85) after tone mapping is bypassed by the high-pass.
    var glow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 1.1),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.9, 1.0) })
    );
    glow.position.set(-2.4, 1.5, 1);
    scene.add(glow);

    // The mover: a small opaque quad swept across the near panel; its trail
    // is the temporal checkpoint's business (stock AfterimagePass, damp 0.5).
    var mover = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.9),
      new THREE.MeshBasicMaterial({ color: 0xd8dde6 })
    );
    scene.add(mover);

    scene.userData.overlay = { mover: mover, glow: glow };
    return scene;
  }

  // updateOverlayScene(scene, clock) — pure function of clock.t (seconds).
  // The mover sweeps one period every 0.5 s (12 frames): fast enough that the
  // temporal trail separates visibly from the mover itself.
  function updateOverlayScene(scene, clock) {
    var t = (clock && typeof clock.t === 'number') ? clock.t : 0;
    var phase = (t / 0.5) % 1;
    var mover = scene.userData && scene.userData.overlay && scene.userData.overlay.mover;
    if (mover) {
      mover.position.x = -3.4 + 6.8 * phase;
      mover.position.y = 0.4;
      mover.position.z = 4; // in front of the near panel: the trail is visible
    }
  }

  globalThis.createOverlayScene = createOverlayScene;
  globalThis.updateOverlayScene = updateOverlayScene;
})();
