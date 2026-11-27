// widget_f4c1.js — the F4c1 checkpoint program (issue #8, segment F4c1).
// A plain script that runs against the committed three bundle
// (globalThis.THREE + jsr.three.cinematic). The SAME text drives both legs:
//
//   - engine/1B leg: the Dart tests concatenate scene_f4c1.js + this file and
//     run it through run1bRealEngine (real ANGLE facade, real G1 wire);
//   - web leg: ref_f4c1_web.cjs evaluates it in the page after installing a
//     jsr shim backed by the real WebGL2 canvas.
//
// Every render uses present:false and hashes the OutputPass result in the
// composer's read buffer via renderer.readRenderTargetPixels — no default
// framebuffer or present/swap involvement, identical code on both legs.
// Pixel values are read as FLOAT from the half-float composer buffer and
// quantized to bytes with the same arithmetic on both sides, then FNV-1a
// hashed (same algorithm as the corpus and showcase drivers).
(function () {
  var jsr = globalThis.jsr;
  var cin = jsr && jsr.three && jsr.three.cinematic;
  var THREE = globalThis.THREE;
  var results = { hashes: {}, diffs: {}, flags: {}, dumps: {}, unsupported: null, error: null };

  function finish() {
    try { jsr.exportState(results); } catch (e) { /* engine export failed */ }
  }
  try {
    if (!cin || !THREE) throw new Error('f4c1: bundle surface missing (THREE or jsr.three.cinematic)');
    var W = 96, H = 64;

    var canvas = jsr.three.createCanvas('main');
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);

    var scene = globalThis.createMotionScene({ width: W, height: H, seededRandom: cin.cinematicRandom });
    var camera = scene.userData.camera;
    var effects = { bloom: false, dof: false, fxaa: false, smaa: false, colorGrade: false, film: false, vignette: false, motion: false, fringe: false, afterimage: false };
    var pipeline = cin.createPipeline({ renderer: renderer, scene: scene, camera: camera, effects: effects });
    pipeline.updateScene = globalThis.updateMotionScene;
    pipeline.setSize(W, H);

    var PXLEN = W * H * 4;
    // The composer buffer is HalfFloatType: three's readRenderTargetPixels
    // reads with the TARGET's GL type (HALF_FLOAT), so the destination is a
    // Uint16Array and each uint16 is decoded to a float with the standard
    // IEEE 754 half->single expansion — identical arithmetic on both legs.
    function halfToFloat(h) {
      var s = (h & 0x8000) >> 15;
      var e = (h & 0x7c00) >> 10;
      var f = h & 0x03ff;
      if (e === 0) return (s ? -1 : 1) * 6.103515625e-5 * (f / 1024);
      if (e === 0x1f) return f ? NaN : (s ? -Infinity : Infinity);
      return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / 1024);
    }
    function readPx() {
      var raw = new Uint16Array(PXLEN);
      renderer.readRenderTargetPixels(pipeline.composer.readBuffer, 0, 0, W, H, raw);
      var u8 = new Uint8Array(PXLEN);
      for (var i = 0; i < raw.length; i++) {
        var v = halfToFloat(raw[i]);
        if (v < 0) v = 0; else if (v > 1) v = 1;
        u8[i] = Math.round(v * 255);
      }
      return u8;
    }
    function hashBytes(px) {
      var h = 0x811c9dc5;
      for (var i = 0; i < px.length; i++) { h ^= px[i]; h = Math.imul(h, 0x01000193) >>> 0; }
      return '0x' + ('00000000' + (h >>> 0).toString(16)).slice(-8);
    }
    function diffCount(a, b) {
      var n = 0;
      for (var i = 0; i < a.length; i += 4) {
        var d0 = Math.abs(a[i] - b[i]), d1 = Math.abs(a[i + 1] - b[i + 1]), d2 = Math.abs(a[i + 2] - b[i + 2]);
        if (d0 > 2 || d1 > 2 || d2 > 2) n++;
      }
      return n;
    }
    var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    function b64(px) {
      var out = '';
      for (var i = 0; i < px.length; i += 3) {
        var b0 = px[i];
        var b1 = i + 1 < px.length ? px[i + 1] : 0;
        var b2 = i + 2 < px.length ? px[i + 2] : 0;
        out += B64[b0 >> 2] + B64[((b0 & 3) << 4) | (b1 >> 4)];
        out += i + 1 < px.length ? B64[((b1 & 15) << 2) | (b2 >> 6)] : '=';
        out += i + 2 < px.length ? B64[b2 & 63] : '=';
      }
      return out;
    }

    function clock(frame, shutter, samples) { return cin.clockState(frame, 24, shutter, samples, 0); }
    function direct(frame, shutter, samples) { pipeline.renderFrame(clock(frame, shutter, samples), null, { present: false }); }
    function seq(frame, shutter, samples) {
      for (var f = 0; f <= frame; f++) pipeline.renderFrame(clock(f, shutter, samples), null, { present: false });
    }
    function reset() { pipeline.resetHistory(0); }

    // ── E2E-MOTION-*: the JSR-owned CinematicMotionBlurPass at several
    // shutter settings, samples 8 (subframe accumulation).
    var pxSharp, pxSh01, pxSh05, pxSh10;
    pipeline.motionBlur({ shutter: 0.1, samples: 8 });
    reset(); direct(12, 0.1, 8);
    pxSh01 = readPx(); results.hashes.m_sh01 = hashBytes(pxSh01);

    pipeline.motionBlur({ shutter: 0.5, samples: 8 });
    reset(); direct(12, 0.5, 8);
    pxSh05 = readPx(); results.hashes.m_sh05 = hashBytes(pxSh05);
    results.dumps.m_sh05 = b64(pxSh05);

    pipeline.motionBlur({ shutter: 1.0, samples: 8 });
    reset(); direct(12, 1.0, 8);
    pxSh10 = readPx(); results.hashes.m_sh10 = hashBytes(pxSh10);

    pipeline.motionBlur({ shutter: 0.5, samples: 8 });
    reset(); seq(12, 0.5, 8);
    results.hashes.m_seq = hashBytes(readPx());

    pipeline.motionBlur({ shutter: 0.5, samples: 1 });
    reset(); direct(12, 0.5, 1);
    pxSharp = readPx(); results.hashes.m_sharp = hashBytes(pxSharp);

    // Direct seek equals sequential (the criterion of ADR-0005).
    results.flags.m_direct_equals_seq = results.hashes.m_seq === results.hashes.m_sh05;

    // Frozen clock: rendering the same frame twice changes nothing.
    reset(); direct(9, 0.5, 8);
    var fa = hashBytes(readPx());
    direct(9, 0.5, 8);
    var fb = hashBytes(readPx());
    results.flags.m_frozen_equal = fa === fb;

    // No cross-frame state: seeking to 20 after frames 0..10 equals a fresh
    // direct render of 20 (the subframe accumulator carries no history).
    reset(); seq(10, 0.5, 8); direct(20, 0.5, 8);
    var seek20 = hashBytes(readPx());
    reset(); direct(20, 0.5, 8);
    var dir20 = hashBytes(readPx());
    results.flags.m_stateless_equal = seek20 === dir20;

    // Blur amount responds to the shutter monotonically (diff vs the sharp
    // reference, per-pixel channel delta > 2).
    results.diffs.m_sh01_vs_sharp = diffCount(pxSh01, pxSharp);
    results.diffs.m_sh05_vs_sharp = diffCount(pxSh05, pxSharp);
    results.diffs.m_sh10_vs_sharp = diffCount(pxSh10, pxSharp);

    // ADR-0005 quality: the pass accumulation against an EXACT reference —
    // the same stratified subframes rendered one at a time (single subframe
    // clocks, OutputPass disabled so the chain output is LINEAR) and averaged
    // in JS. Compared in LINEAR units against the pass's accumulation target
    // (pre-tone-mapping) — the sRGB-domain comparison would compare two
    // different functions (tone-mapping the average vs averaging the
    // tone-mapped). Byte-scale delta threshold (linear delta * 255 > 2).
    var linAcc = new Float64Array(PXLEN);
    var outPass = pipeline.composer.passes[pipeline.composer.passes.length - 1];
    var outEnabled = outPass.enabled;
    outPass.enabled = false;
    var st8 = clock(12, 0.5, 8);
    function readLinear(target) {
      var raw = new Uint16Array(PXLEN);
      renderer.readRenderTargetPixels(target, 0, 0, W, H, raw);
      var f = new Float64Array(PXLEN);
      for (var i = 0; i < raw.length; i++) f[i] = halfToFloat(raw[i]);
      return f;
    }
    for (var r = 0; r < st8.subframes.length; r++) {
      pipeline.renderFrame({ frame: 12, fps: 24, shutter: 0.5, samples: 1, epoch: 0, subframes: [st8.subframes[r]] }, null, { present: false });
      var lf = readLinear(pipeline.composer.readBuffer);
      for (var q = 0; q < PXLEN; q++) linAcc[q] += lf[q];
    }
    outPass.enabled = outEnabled;
    reset();
    direct(12, 0.5, 8);
    var passLin = readLinear(pipeline.passes.motion._target);
    var linOver2 = 0, linMaxScaled = 0;
    for (var q3 = 0; q3 < PXLEN; q3 += 4) {
      for (var c3 = 0; c3 < 3; c3++) {
        // RGB only: the accumulated ALPHA is n by construction (n additive
        // alpha-1 contributions), not an averaged value.
        var d = Math.abs(passLin[q3 + c3] - linAcc[q3 + c3] / st8.subframes.length) * 255;
        if (d > linMaxScaled) linMaxScaled = d;
        if (d > 2) linOver2++;
      }
    }
    results.diffs.m_pass_vs_linear_ref = linOver2;
    results.diffs.m_pass_vs_linear_ref_max = Math.round(linMaxScaled * 1000) / 1000;
    results.flags.m_accumulation_exact = linOver2 === 0;

    // ── E2E-DOF-*: stock BokehPass focus/aperture/maxblur + the Bokeh
    // fringe helper on/off (samples 1 so only DOF moves the image).
    pipeline.motionBlur({ shutter: 0.5, samples: 1 });
    pipeline.depthOfField({ focus: 7.0, aperture: 0.03, maxBlur: 0.01 });
    reset(); direct(6, 0.5, 1);
    var pxDofNear = readPx(); results.hashes.dof_near = hashBytes(pxDofNear);
    results.dumps.dof_near = b64(pxDofNear);

    pipeline.depthOfField({ focus: 14.0, aperture: 0.03, maxBlur: 0.01 });
    reset(); direct(6, 0.5, 1);
    var pxDofFar = readPx(); results.hashes.dof_far = hashBytes(pxDofFar);
    results.diffs.dof_near_vs_far = diffCount(pxDofNear, pxDofFar);

    pipeline.depthOfField({ focus: 14.0, aperture: 0.0, maxBlur: 0.01 });
    reset(); direct(6, 0.5, 1);
    results.hashes.dof_ap0 = hashBytes(readPx());
    results.diffs.dof_ap0_vs_far = diffCount(readPx(), pxDofFar);

    pipeline.depthOfField({ focus: 14.0, aperture: 0.03, maxBlur: 0.001 });
    reset(); direct(6, 0.5, 1);
    var pxDofMb = readPx(); results.hashes.dof_mb = hashBytes(pxDofMb);
    results.diffs.dof_mb_vs_far = diffCount(pxDofMb, pxDofFar);

    // Fringe on/off on top of the dof_far configuration.
    pipeline.depthOfField({ focus: 14.0, aperture: 0.03, maxBlur: 0.01 });
    pipeline.fringe({ amount: 3.0, blur: 1.0 });
    reset(); direct(6, 0.5, 1);
    var pxFrOn = readPx(); results.hashes.fr_on = hashBytes(pxFrOn);
    results.dumps.fr_on = b64(pxFrOn);
    results.diffs.fr_on_vs_dof_far = diffCount(pxFrOn, pxDofFar);

    pipeline.fringe({ amount: 0.0, blur: 1.0 });
    reset(); direct(6, 0.5, 1);
    results.hashes.fr_off = hashBytes(readPx());
    results.flags.fr_zero_amount_equals_off = results.hashes.fr_off === results.hashes.dof_far;
    pipeline.setEffect('fringe', false);
    reset(); direct(6, 0.5, 1);
    results.hashes.fr_disabled = hashBytes(readPx());
    results.flags.fr_disabled_equals_off = results.hashes.fr_disabled === results.hashes.dof_far;

    // ── IT-HISTORY-* / E2E-MOTION (reconstruction): the stock AfterimagePass
    // with reset + bounded reconstruction (damp 0.5 -> 40-frame window).
    pipeline.setEffect('dof', false);
    pipeline.motionBlur({ shutter: 0.5, samples: 1 });
    pipeline.afterimage({ damp: 0.5 });
    results.historyDepth = pipeline.history.depth();

    reset(); seq(24, 0.5, 1);
    var pxAiSeq = readPx(); results.hashes.ai_seq24 = hashBytes(pxAiSeq);
    results.dumps.ai_seq24 = b64(pxAiSeq);

    reset(); direct(24, 0.5, 1);
    results.hashes.ai_dir24 = hashBytes(readPx());
    results.flags.ai_direct_equals_seq = results.hashes.ai_dir24 === results.hashes.ai_seq24;

    reset(); direct(9, 0.5, 1);
    var aa = hashBytes(readPx());
    direct(9, 0.5, 1);
    var ab = hashBytes(readPx());
    results.flags.ai_frozen_equal = aa === ab;

    // Mid-run reset then direct seek: the reconstruction replays from the
    // reset boundary and equals the sequential run after the same reset.
    reset(); seq(10, 0.5, 1);
    results.hashes.ai_pre_reset = hashBytes(readPx());
    pipeline.resetHistory(0);
    direct(24, 0.5, 1);
    results.hashes.ai_rsdir24 = hashBytes(readPx());
    pipeline.resetHistory(0);
    seq(10, 0.5, 1);
    pipeline.resetHistory(0);
    seq(24, 0.5, 1);
    results.hashes.ai_rsseq24 = hashBytes(readPx());
    results.flags.ai_reconstruction_equals_seq = results.hashes.ai_rsdir24 === results.hashes.ai_rsseq24;
    // reset must genuinely clear the temporal state: after a mid-run reset the
    // trail accumulation restarts, so the post-reset sequential run (24
    // frames of trails) equals the fresh 24-frame run — if the reset failed
    // to clear, the mid-reset continuation would carry 34 frames of trails
    // and DIFFER.
    results.flags.ai_reset_clears_history = results.hashes.ai_rsseq24 === results.hashes.ai_seq24;

    results.unsupported = pipeline.unsupported.map(function (u) { return u.effect + ': ' + u.reason; });
  } catch (e) {
    results.error = String(e && e.message ? e.message : e);
  }
  finish();
})();
