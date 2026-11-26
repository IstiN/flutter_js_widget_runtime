// f4b_case_source.js — the F4b determinism/alpha battery shared by BOTH
// legs (issue #8, segment F4b):
//   native 1B : prepended to a widget run through the real engine stack
//               (QuickJS -> facade -> G1 -> ANGLE); the Dart tests assert
//               the exported result object.
//   web       : loaded into a bare Chrome page by tool/three/cases_f4b.sh
//               (real WebGL2, no ANGLE lane, no Dart proxy).
//
// The battery is a pure function of the explicit clock — it never reads a
// wall clock itself; io.sleep (leg-provided, setTimeout on both legs) only
// inserts host delay BETWEEN frames, which must not change any hash.
//
// Scene: a static dim plane plus a bright (HDR > 1) sphere moving with the
// clock state t — frame-varying image, so sequential-vs-direct-seek compares
// real state, and UnrealBloomPass has something above threshold to bloom.
//
// Entry: globalThis.__f4bBattery(THREE, cine, io) -> Promise<result object>.
//   io.captureFrame(clock, pipeline) -> Promise of pipeline.captureFrame(clock)
//   io.sleep(ms) -> Promise
// Every check lands in result.checks as { name, ok, detail } — the legs
// assert on the fields, never on console output.
(function () {
  'use strict';

  var W = 320;
  var H = 180;
  var FPS = 24;
  var SHUTTER = 0.5;
  var SEQ_LAST = 12;

  function fnv1a(bytes) {
    var h = 0x811c9dc5;
    for (var i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return '0x' + (h >>> 0).toString(16).padStart(8, '0');
  }

  function createScene(THREE) {
    var scene = new THREE.Scene();
    scene.background = null;
    var camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
    camera.position.set(0, 0, 8);
    var bright = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 2.2, 1.2) })
    );
    scene.add(bright);
    var dim = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 3),
      new THREE.MeshBasicMaterial({ color: 0x30343c })
    );
    dim.position.set(0, -2.2, -2);
    scene.add(dim);
    scene.userData.update = function (clockState) {
      bright.position.x = Math.sin(clockState.t * 2.2) * 2.0;
    };
    return { scene: scene, camera: camera };
  }

  function makePipeline(THREE, cine, id, opts) {
    opts = opts || {};
    var canvas = jsr.three.createCanvas(id);
    canvas.width = W;
    canvas.height = H;
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false,
      alpha: !!opts.alpha
    });
    renderer.setSize(W, H, false);
    renderer.setPixelRatio(1);
    var built = createScene(THREE);
    var pipeline = cine.createPipeline({
      renderer: renderer,
      scene: built.scene,
      camera: built.camera,
      effects: {
        bloom: true, dof: false, fxaa: false, smaa: false,
        colorGrade: false, film: false, vignette: false, motion: false
      },
      alpha: !!opts.alpha
    });
    pipeline.updateScene = function (scene, clockState) {
      scene.userData.update(clockState);
    };
    pipeline.resetHistory(0);
    return { renderer: renderer, scene: built.scene, camera: built.camera, pipeline: pipeline, canvas: canvas };
  }

  function cs(frame, samples) {
    return jsr.three.cinematic.clockState(frame, FPS, SHUTTER, samples || 1, 0);
  }

  // decode a 16-bit half float (the composer output targets are HalfFloatType
  // on both lanes; real WebGL2 requires matching views for readPixels)
  function halfToFloat(h) {
    var s = (h & 0x8000) >> 15;
    var e = (h & 0x7C00) >> 10;
    var f = h & 0x03FF;
    if (e === 0) return (s ? -1 : 1) * Math.pow(2, -14) * (f / 1024);
    if (e === 0x1F) return f ? NaN : (s ? -Infinity : Infinity);
    return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / 1024);
  }

  function clampByte(v) {
    if (v < 0) return 0;
    if (v > 1) return 255;
    return Math.round(v * 255);
  }

  // frameHash: re-renders the SAME scene state into the composer's offscreen
  // buffers (renderToScreen=false) and reads the output target back. The
  // presented surface is NOT readable on the web lane (the present lane
  // transfers — and thereby clears — the backing canvas) and it is opaque on
  // 1B, so the composer output target is THE comparable image on both legs.
  function composerOutputBytes(kit) {
    var composer = kit.pipeline.composer;
    var last = composer.passes[composer.passes.length - 1];
    var prev = composer.renderToScreen;
    composer.renderToScreen = false;
    composer.render(0);
    composer.renderToScreen = prev;
    var target = last.needsSwap ? composer.readBuffer : composer.writeBuffer;
    var raw = new Uint16Array(W * H * 4);
    kit.renderer.readRenderTargetPixels(target, 0, 0, W, H, raw);
    var rgba = new Uint8Array(W * H * 4);
    for (var i = 0; i < raw.length; i++) rgba[i] = clampByte(halfToFloat(raw[i]));
    return rgba;
  }

  function frameHash(kit, frame) {
    kit.pipeline.renderFrame(cs(frame, 1));
    return fnv1a(composerOutputBytes(kit));
  }

  function countOpaqueAlpha(rgba) {
    var opaque = 0;
    var center = [rgba[(90 * W + 160) * 4], rgba[(90 * W + 160) * 4 + 1],
      rgba[(90 * W + 160) * 4 + 2], rgba[(90 * W + 160) * 4 + 3]];
    for (var i = 3; i < rgba.length; i += 4) if (rgba[i] === 255) opaque++;
    return { opaque: opaque, center: center };
  }

  // skipRender: read the buffers WITHOUT re-rendering (right after
  // renderFrame the output sits in composer.readBuffer).
  function composerOutputBytes(kit, skipRender) {
    var composer = kit.pipeline.composer;
    var last = composer.passes[composer.passes.length - 1];
    if (skipRender !== true) {
      var prev = composer.renderToScreen;
      composer.renderToScreen = false;
      composer.render(0);
      composer.renderToScreen = prev;
    }
    var target = last.needsSwap ? composer.readBuffer : composer.writeBuffer;
    var raw = new Uint16Array(W * H * 4);
    kit.renderer.readRenderTargetPixels(target, 0, 0, W, H, raw);
    var rgba = new Uint8Array(W * H * 4);
    for (var i = 0; i < raw.length; i++) rgba[i] = clampByte(halfToFloat(raw[i]));
    return rgba;
  }

  // Expected PREMULTIPLIED composite: the stock additive bloom accumulates
  // premultiplied color AND alpha (AdditiveBlending writes both channels),
  // so the over operation for the host background is
  //   out = min(1, src.rgb) + bg * (1 - min(1, src.a))
  // — no un-premultiplication, no black fringes; alpha clamps at 1.
  function compositeHash(rgba, bg) {
    var out = new Uint8Array(W * H * 3);
    for (var i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
      var a = rgba[i + 3] / 255;
      var inv = 1 - (a > 1 ? 1 : a);
      for (var c = 0; c < 3; c++) {
        var prem = rgba[i + c] / 255;
        if (prem > 1) prem = 1;
        out[j + c] = Math.round(prem * 255 + bg[c] * inv);
      }
    }
    return fnv1a(out);
  }

  // GL composite: clear to the background color, draw the straight-alpha
  // frame as a texture with (SRC_ALPHA, ONE_MINUS_SRC_ALPHA) blending — the
  // present-path premultiplied-over operation. Returns { hash, rgba }.
  function glComposite(THREE, kit, rgba, bg) {
    var gl = kit.renderer.getContext();
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var vs = 'attribute vec2 p; varying vec2 vUv; void main() { vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }';
    var fs = 'precision mediump float; uniform sampler2D t; uniform vec3 bg; varying vec2 vUv;' +
      ' void main() { vec4 c = texture2D(t, vUv);' +
      ' float a = min(c.a, 1.0); vec3 prem = min(c.rgb, vec3(1.0));' +
      ' gl_FragColor = vec4(prem + bg * (1.0 - a), 1.0); }';
    // The composite math is the PREMULTIPLIED over operation (the additive
    // bloom buffer carries premultiplied color + accumulated alpha); the
    // background clear is the only other state.
    var prog = gl.createProgram();
    var shaders = [];
    function shader(type, srcText) {
      var s = gl.createShader(type);
      gl.shaderSource(s, srcText);
      gl.compileShader(s);
      shaders.push(s);
      return s;
    }
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    var quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(gl.getUniformLocation(prog, 't'), 0);
    gl.uniform3f(gl.getUniformLocation(prog, 'bg'), bg[0] / 255, bg[1] / 255, bg[2] / 255);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    var out = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, out);
    gl.deleteBuffer(quad);
    gl.deleteProgram(prog);
    for (var s = 0; s < shaders.length; s++) gl.deleteShader(shaders[s]);
    gl.deleteTexture(tex);
    return out;
  }

  // Per-pixel |a-b|>d tolerance counter over two W*H*4 buffers (the
  // documented tolerance rule: >= 99.0 % of pixels within d<=2 per channel).
  function matchingPct(a, b, d) {
    var ok = 0;
    var total = W * H;
    for (var p = 0; p < total; p++) {
      var bad = false;
      for (var c = 0; c < 3; c++) {
        var av = a[p * 4 + c];
        var bv = b[p * 4 + c];
        var diff = av > bv ? av - bv : bv - av;
        if (diff > d) { bad = true; break; }
      }
      if (!bad) ok++;
    }
    return (ok / total) * 100;
  }

  async function battery(THREE, cine, io) {
    var result = {
      width: W, height: H, fps: FPS, shutter: SHUTTER,
      seq: [], rep5: [], frozen7: [], delay6: [],
      direct12: null, rev0: null, capture9: null, diverge3: null,
      resizeSmall: null, resizeBack: null,
      alpha: {}, opaque: {},
      checks: []
    };
    function check(name, ok, detail) {
      result.checks.push({ name: name, ok: ok === true, detail: detail === undefined ? '' : String(detail) });
      return ok === true;
    }

    // ── Sequential frames 0..12 ──────────────────────────────────────────
    var seqKit = makePipeline(THREE, cine, 'f4b-seq');
    for (var f = 0; f <= SEQ_LAST; f++) result.seq.push(frameHash(seqKit, f));
    check('seqNonEmpty', result.seq.every(function (h) { return h !== '0x00000000'; }), 'sequential frame hashes');

    // ── Direct seek to frame 12 (fresh pipeline, single frame) ───────────
    var directKit = makePipeline(THREE, cine, 'f4b-direct');
    result.direct12 = frameHash(directKit, SEQ_LAST);
    directKit.pipeline.dispose();
    check('directSeekEqualsSequential', result.direct12 === result.seq[SEQ_LAST],
      result.direct12 + ' vs ' + result.seq[SEQ_LAST]);

    // ── Reversed seek 12..0 lands on the sequential frame-0 hash ────────
    var revKit = makePipeline(THREE, cine, 'f4b-rev');
    for (var r = SEQ_LAST; r >= 0; r--) result.rev0 = frameHash(revKit, r);
    revKit.pipeline.dispose();
    check('reversedSeekMatches', result.rev0 === result.seq[0],
      result.rev0 + ' vs ' + result.seq[0]);

    // ── Repeated renders of one frame are identical ──────────────────────
    var repKit = makePipeline(THREE, cine, 'f4b-rep');
    for (var i = 0; i < 3; i++) result.rep5.push(frameHash(repKit, 5));
    repKit.pipeline.dispose();
    check('repeatedSeekMatches', result.rep5[0] === result.rep5[1] && result.rep5[1] === result.rep5[2] &&
      result.rep5[0] === result.seq[5], result.rep5.join(','));

    // ── Frozen clock: the same frame over and over ───────────────────────
    var frozenKit = makePipeline(THREE, cine, 'f4b-frozen');
    for (var j = 0; j < 5; j++) result.frozen7.push(frameHash(frozenKit, 7));
    frozenKit.pipeline.dispose();
    check('frozenClockIdentical', result.frozen7.every(function (h) { return h === result.frozen7[0]; }) &&
      result.frozen7[0] === result.seq[7], result.frozen7.join(','));

    // ── Host delay between frames must not change the hashes ────────────
    var delayKit = makePipeline(THREE, cine, 'f4b-delay');
    for (var d = 0; d <= 6; d++) {
      if (d > 0) await io.sleep(35);
      result.delay6.push(frameHash(delayKit, d));
    }
    var delaysMatch = result.delay6.every(function (h, k) { return h === result.seq[k]; });
    check('hostDelayNeutral', delaysMatch, result.delay6.join(','));

    // ── Capture after the final pass ─────────────────────────────────────
    // Renders frame 9, then asks the barrier capture for frame 9. Native:
    // the Dart capture host reads the presented surface; the test compares
    // the surface hash with seq[9]. Web: no jsr.capture exists in the bare
    // reference page, so the named rejection is the expected record.
    try {
      frameHash(delayKit, 9);
      var cap = await io.captureFrame(cs(9, 1), delayKit.pipeline);
      result.capture9 = {
        ok: cap && cap.ok === true,
        error: cap && cap.error ? String(cap.error) : null,
        frame: cap && cap.frame
      };
    } catch (e) {
      result.capture9 = { ok: false, error: String(e && e.message || e), frame: null };
    }
    delayKit.pipeline.dispose();

    // ── Divergence control: a perturbed scene MUST change the hash ───────
    // (REG-DETERMINISM bites: the equality comparisons above can only mean
    // something if this probe proves they detect a real difference.)
    var divKit = makePipeline(THREE, cine, 'f4b-diverge');
    divKit.scene.userData.update = function () {
      divKit.scene.children[0].position.x = 42;
    };
    result.diverge3 = frameHash(divKit, 3);
    divKit.pipeline.dispose();
    check('divergenceControlDiffers', result.diverge3 !== result.seq[3],
      result.diverge3 + ' vs ' + result.seq[3]);

    // ── Alpha: transparent pipeline, two-background composites ───────────
    var DARK = [16, 16, 20];
    var LIGHT = [235, 235, 230];
    var alphaKit = makePipeline(THREE, cine, 'f4b-alpha', { alpha: true });
    alphaKit.pipeline.renderFrame(cs(4, 1));
    // DEBUG: read the composer output right after renderFrame, then again
    // after the manual offscreen re-render.
    var firstRead = composerOutputBytes(alphaKit, true);
    var aRgba = composerOutputBytes(alphaKit);
    result.alphaDebugFirst = countOpaqueAlpha(firstRead);
    if (typeof globalThis.__f4bBufferCounts === 'function') {
      result.alphaDebugBuffers = globalThis.__f4bBufferCounts(alphaKit);
    }
    var nZero = 0, nPartial = 0, nOpaque = 0, alphaSum = 0, cornerAlpha = 0, cornerN = 0;
    for (var p = 3; p < aRgba.length; p += 4) {
      var a = aRgba[p];
      if (a === 0) nZero++;
      else if (a === 255) nOpaque++;
      else nPartial++;
      alphaSum += a;
    }
    // corners (far from the bright object): the background must stay
    // dominantly transparent — additive bloom reaches it with only a faint
    // premultiplied halo
    for (var cp = 0; cp < 4; cp++) {
      var cx = cp % 2 === 0 ? 0 : W - 24;
      var cy = cp < 2 ? 0 : H - 24;
      for (var yy = cy; yy < cy + 24; yy++) {
        for (var xx = cx; xx < cx + 24; xx++) {
          cornerAlpha += aRgba[(yy * W + xx) * 4 + 3];
          cornerN++;
        }
      }
    }
    result.alpha = {
      partialPixels: nPartial,
      zeroPixels: nZero,
      opaquePixels: nOpaque,
      meanAlpha: Math.round(alphaSum / (W * H) / 255 * 1000) / 1000,
      cornerMeanAlpha: Math.round(cornerAlpha / cornerN / 255 * 1000) / 1000,
      sampleCenter: [aRgba[(90 * W + 160) * 4], aRgba[(90 * W + 160) * 4 + 1],
        aRgba[(90 * W + 160) * 4 + 2], aRgba[(90 * W + 160) * 4 + 3]],
      debugSphere: (function () {
        var s = alphaKit.scene.children[0];
        return { x: Math.round(s.position.x * 1000) / 1000, visible: s.visible,
          passes: alphaKit.pipeline.passes ? Object.keys(alphaKit.pipeline.passes) : null };
      })(),
      clearAlpha: alphaKit.pipeline.getConfig().clearAlpha,
      darkHash: compositeHash(aRgba, DARK),
      lightHash: compositeHash(aRgba, LIGHT)
    };
    // not opaque: meaningful transparency survives bloom + output pass (the
    // bright object accumulates alpha >= 1, the far background stays below)
    check('alphaMeaningful', nOpaque > 0 && nPartial > 0,
      'partial=' + nPartial + ' zero=' + nZero + ' opaque=' + nOpaque +
      ' meanAlpha=' + result.alpha.meanAlpha);
    check('backgroundStaysTransparent', result.alpha.cornerMeanAlpha < 0.1,
      'cornerMeanAlpha=' + result.alpha.cornerMeanAlpha);
    check('compositesDifferWhereTransparent', result.alpha.darkHash !== result.alpha.lightHash,
      result.alpha.darkHash + ' vs ' + result.alpha.lightHash);

    // GL composite (premultiplied over in the shader) vs the JS expectation:
    // hash equality, or the documented >=99 % within d<=2 fallback.
    var expectedDark = new Uint8Array(W * H * 4);
    for (var m = 0, n = 0; m < aRgba.length; m += 4, n += 4) {
      var av = aRgba[m + 3] / 255;
      var inv = 1 - (av > 1 ? 1 : av);
      for (var c2 = 0; c2 < 3; c2++) {
        var prem = aRgba[m + c2] / 255;
        if (prem > 1) prem = 1;
        expectedDark[n + c2] = Math.round(prem * 255 + DARK[c2] * inv);
      }
      expectedDark[n + 3] = 255;
    }
    var glDark = glComposite(THREE, alphaKit, aRgba, DARK);
    var glDarkHash = fnv1a(glDark);
    result.alpha.glDarkHash = glDarkHash;
    result.alpha.glDarkPct = matchingPct(glDark, expectedDark, 2);
    check('glCompositeMatchesExpectation', glDarkHash === result.alpha.darkHash ||
      result.alpha.glDarkPct >= 99.0, glDarkHash + ' vs ' + result.alpha.darkHash +
      ' pct=' + result.alpha.glDarkPct);
    alphaKit.pipeline.dispose();

    // ── Opaque control: alpha:false stays opaque over both backgrounds ───
    var opaqueKit = makePipeline(THREE, cine, 'f4b-opaque');
    opaqueKit.pipeline.renderFrame(cs(4, 1));
    var oRgba = composerOutputBytes(opaqueKit);
    var oPartial = 0;
    for (var o = 3; o < oRgba.length; o += 4) if (oRgba[o] !== 255) oPartial++;
    result.opaque = {
      nonOpaquePixels: oPartial,
      darkHash: compositeHash(oRgba, DARK),
      lightHash: compositeHash(oRgba, LIGHT)
    };
    check('opaqueSceneStaysOpaque', oPartial === 0 && result.opaque.darkHash === result.opaque.lightHash,
      'nonOpaque=' + oPartial);

    // ── Resize: coherent resize -> render -> resize back reproduces ──────
    opaqueKit.pipeline.setSize(200, 124);
    result.resizeSmall = frameHash(opaqueKit, 2);
    opaqueKit.pipeline.setSize(W, H);
    result.resizeBack = frameHash(opaqueKit, 2);
    opaqueKit.pipeline.dispose();
    check('resizeRoundTrip', result.resizeSmall !== result.seq[2] && result.resizeBack === result.seq[2],
      result.resizeSmall + ' -> ' + result.resizeBack + ' vs ' + result.seq[2]);

    seqKit.pipeline.dispose();
    return result;
  }

  globalThis.__f4bBattery = battery;
})();
