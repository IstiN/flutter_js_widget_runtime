// scene_f4c1.js — the deterministic F4c1 test scene (issue #8, segment F4c1:
// E2E-MOTION-* / IT-HISTORY-* / E2E-DOF-*). A plain script (no imports) so
// the SAME text runs in the engine widget (concatenated after the bundle)
// and in the web reference page (tool/three/cases_f4c1/ref_f4c1_web.cjs).
//
// Every animated property is a pure function of the pipeline clock state
// (clockState / subframe time t in absolute seconds): no Date.now, no
// Math.random, no RAF in this module. The moving bars give the shutter blur
// its geometry; the two checker planes at different depths give the stock
// BokehPass its focus targets.
(function () {
  function createMotionScene(options) {
    options = options || {};
    var THREE = globalThis.THREE;
    if (!THREE) throw new Error('f4c1: globalThis.THREE missing');
    var width = options.width || 96;
    var height = options.height || 64;
    var seededRandom = typeof options.seededRandom === 'function' ? options.seededRandom : function () { return 0.5; };

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101418);

    var camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 60);
    camera.position.set(0, 0, 6);
    camera.lookAt(0, 0, 0);
    scene.userData.camera = camera;

    // 32x32 two-value checker DataTexture — image frequency for the DOF
    // blur, deterministic bytes on every lane.
    var N = 32;
    var data = new Uint8Array(N * N * 4);
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        var on = (((x >> 2) + (y >> 2)) & 1) === 0;
        var i = (y * N + x) * 4;
        data[i] = on ? 226 : 28;
        data[i + 1] = on ? 46 : 32;
        data[i + 2] = on ? 66 : 44;
        data[i + 3] = 255;
      }
    }
    var tex = new THREE.DataTexture(data, N, N);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 4);
    tex.needsUpdate = true;

    // Two checker planes at different depths: focus 7 sharpens the front
    // plane, focus 14 the back one (camera at z=6).
    var front = new THREE.Mesh(new THREE.PlaneGeometry(7, 4.5), new THREE.MeshBasicMaterial({ map: tex }));
    front.position.set(0, 0.4, -1);
    scene.add(front);
    var back = new THREE.Mesh(new THREE.PlaneGeometry(9, 6), new THREE.MeshBasicMaterial({ map: tex }));
    back.position.set(0, 0.2, -8);
    scene.add(back);

    // Three bright bars moving horizontally at fixed speeds (world units per
    // second) — the shutter blur geometry. x is a pure function of t.
    var bars = [];
    var specs = [
      { color: 0xff3b30, speed: 6, y: -1.4 },
      { color: 0x34c759, speed: 9, y: -0.9 },
      { color: 0xffffff, speed: 14, y: -0.4 }
    ];
    for (var b = 0; b < specs.length; b++) {
      var bar = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.24),
        new THREE.MeshBasicMaterial({ color: specs[b].color })
      );
      bar.position.set(0, specs[b].y, 3);
      scene.add(bar);
      bars.push({ mesh: bar, speed: specs[b].speed, phase: b * 2.1 });
    }

    scene.userData.bars = bars;
    // The static layout is epoch-independent (only the bars move, purely in
    // t), so reseed is a no-op — resetHistory changes the temporal state, not
    // the layout.
    scene.userData.reseed = function () {};
    // seededRandom is consumed (same contract as the showcase scene) so the
    // pipeline RNG wiring is exercised identically on both legs.
    seededRandom(1);
    return scene;
  }

  function updateMotionScene(scene, clockState) {
    var t = clockState && typeof clockState.t === 'number' ? clockState.t : 0;
    var bars = scene.userData.bars;
    for (var i = 0; i < bars.length; i++) {
      var b = bars[i];
      // wrap [-6, 6): pure in t; a frame whose subframes straddle the wrap
      // still renders deterministically (both legs use the same arithmetic).
      b.mesh.position.x = ((t * b.speed + b.phase) % 12) - 6;
    }
  }

  globalThis.createMotionScene = createMotionScene;
  globalThis.updateMotionScene = updateMotionScene;
})();
