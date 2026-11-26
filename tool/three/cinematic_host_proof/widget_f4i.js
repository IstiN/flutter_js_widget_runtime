// widget_f4i.js — the F4i downstream host proof program (issue #8, segment
// F4i, AC15 / E2E-HOST-YOCLIP-* / REG-HOST-CAPTURE). A plain script that
// runs against the committed three bundle (globalThis.THREE +
// jsr.three.cinematic) and drives the pipeline through the PUBLIC helper API
// only. The SAME text drives both legs:
//
//   - native 1B leg: the Dart test concatenates the staged stock
//     AfterimagePass bundle + scene_f4i.js + this file and runs it through
//     run1bWidgetEngine (real ANGLE facade, real G1 wire) with a capture
//     barrier host that writes the PNG-sequence files;
//   - web leg: ref_f4i_web.cjs evaluates it in the page after installing a
//     jsr shim backed by the real WebGL2 canvas; the shim's capture host
//     hands the PNG bytes to the driver, which writes the files.
//
// The three capture paths of a frame-driven downstream host:
//   (a) preview          — play frames 0..N sequentially, grab the frame at
//                          each checkpoint (the studio preview image);
//   (b) arbitrary frame  — a fresh pipeline per checkpoint: a direct seek to
//                          the checkpoint frame and ONE capture. The temporal
//                          checkpoint gets there by rendering the history
//                          window that pipeline.history (CinematicHistory,
//                          declared by the stock AfterimagePass window)
//                          reconstruct(clock) returns for the target frame;
//   (c) PNG sequence     — play frames 0..N sequentially and call
//                          pipeline.captureFrame(clock) after every frame;
//                          the host capture barrier writes
//                          <out>/frame_<nnnn>.png files. On the web leg the
//                          program decodes the exact PNG bytes back to RGBA
//                          in-page (own inflate + unfilter) and hashes them;
//                          on the native leg the Dart capture host decodes
//                          the file it wrote and the Dart test compares.
//
// A missing capture host (REG-HOST-CAPTURE, mode NOCAP) must fail the export
// with the named error cinematic.notCapturable before any file is written.
(function () {
  var jsr = globalThis.jsr;
  var cin = jsr && jsr.three && jsr.three.cinematic;
  var THREE = globalThis.THREE;
  var results = {
    hashes: {}, flags: {}, diffs: {}, counts: {}, composite: {},
    png: { files: 0, hashes: {} },
    exportError: null, filesWritten: 0, error: null
  };
  var NOCAP = globalThis.__F4I_NO_CAPTURE === true;
  // The page's capture host (the downstream host stand-in) encodes the
  // presented frame itself — see pngEncodeStraightRgba below.
  globalThis.__F4I_PNG_ENCODE = pngEncodeStraightRgba;
  var W = 96, H = 64;

  function finish() {
    try { jsr.exportState(results); } catch (e) { /* engine export failed */ }
  }

  function hashBytes(px) {
    var h = 0x811c9dc5;
    for (var i = 0; i < px.length; i++) { h ^= px[i]; h = Math.imul(h, 0x01000193) >>> 0; }
    return '0x' + ('00000000' + (h >>> 0).toString(16)).slice(-8);
  }
  function diffCount(a, b) {
    var n = 0;
    for (var i = 0; i < a.length; i += 4) {
      if (Math.abs(a[i] - b[i]) > 2 || Math.abs(a[i + 1] - b[i + 1]) > 2 ||
          Math.abs(a[i + 2] - b[i + 2]) > 2) n++;
    }
    return n;
  }
  // The frame grab: the presented frame, straight RGBA, read right after the
  // render (same task, no compositing in between). Both legs support it:
  // Chrome's WebGL canvas and the G1 facade both answer gl.readPixels on the
  // default framebuffer.
  function grab(renderer) {
    var gl = renderer.getContext();
    var px = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return px;
  }
  function alphaCounts(px) {
    var t = 0, o = 0, p = 0;
    for (var i = 3; i < px.length; i += 4) {
      if (px[i] === 0) t++; else if (px[i] === 255) o++; else p++;
    }
    return { t: t, o: o, p: p };
  }

  // ── The two-background composite (AC15: the overlay frame is composited
  // over a dark and a light background, as a video frame would be). Straight
  // alpha blend with integer math; probes prove opacity stays opaque,
  // transparency lets the background through, and the blend math holds.
  function compositeCheck(px) {
    var dark = [18, 18, 22], light = [224, 222, 215];
    function over(bg) {
      var out = new Uint8Array(px.length);
      for (var i = 0; i < px.length; i += 4) {
        var a = px[i + 3];
        for (var c = 0; c < 3; c++) {
          out[i + c] = Math.round((px[i + c] * a + bg[c] * (255 - a)) / 255);
        }
        out[i + 3] = 255;
      }
      return out;
    }
    var cd = over(dark), cl = over(light);
    var probes = { opaque: null, background: null, partial: null };
    for (var i = 3; i < px.length; i += 4) {
      var k = (i - 3) / 4;
      if (probes.opaque === null && px[i] === 255) probes.opaque = k;
      // The overlay background is transparent up to the premultiplied bloom
      // halo (F4b measured: the halo reaches every pixel at half-float
      // precision) — the background probe is a near-transparent pixel.
      if (probes.background === null && px[i] < 26) probes.background = k;
      if (probes.partial === null && px[i] >= 26 && px[i] < 255) probes.partial = k;
      if (probes.opaque !== null && probes.background !== null && probes.partial !== null) break;
    }
    var idx = function (k) { return k * 4; };
    var checks = { blendDark: true, blendLight: true, opaqueStable: true, backgroundLive: true };
    // Blend math holds for every probed pixel on both backgrounds.
    var samples = [probes.opaque, probes.background, probes.partial];
    for (var s = 0; s < samples.length; s++) {
      if (samples[s] === null) continue;
      var o4 = idx(samples[s]);
      for (var c2 = 0; c2 < 3; c2++) {
        var a = px[o4 + 3];
        var ed = Math.round((px[o4 + c2] * a + dark[c2] * (255 - a)) / 255);
        var el = Math.round((px[o4 + c2] * a + light[c2] * (255 - a)) / 255);
        if (Math.abs(cd[o4 + c2] - ed) > 1) checks.blendDark = false;
        if (Math.abs(cl[o4 + c2] - el) > 1) checks.blendLight = false;
      }
    }
    // An opaque overlay pixel composites identically on both backgrounds.
    if (probes.opaque !== null) {
      var o = idx(probes.opaque);
      checks.opaqueStable = Math.abs(cd[o] - cl[o]) <= 1 &&
        Math.abs(cd[o + 1] - cl[o + 1]) <= 1 && Math.abs(cd[o + 2] - cl[o + 2]) <= 1;
    }
    // The background must exist (the overlay really is transparent there)
    // and let both backgrounds through (not lost).
    checks.backgroundLive = probes.background !== null;
    if (probes.background !== null) {
      var t = idx(probes.background);
      checks.backgroundLive = Math.abs(cd[t] - cl[t]) > 30;
    }
    var overlayVisibleDark = diffCount(cd, flatFill(dark)) > 100;
    var overlayVisibleLight = diffCount(cl, flatFill(light)) > 100;
    results.composite = {
      probes: probes, checks: checks,
      overlayVisibleDark: overlayVisibleDark,
      overlayVisibleLight: overlayVisibleLight
    };
    function flatFill(rgb) {
      var f = new Uint8Array(px.length);
      for (var j = 0; j < px.length; j += 4) { f[j] = rgb[0]; f[j + 1] = rgb[1]; f[j + 2] = rgb[2]; f[j + 3] = 255; }
      return f;
    }
  }

  // ── PNG encode (web capture host): the host encodes the RGBA it read from
  // the presented frame into a real PNG file — the same flow as the native
  // capture host (surface readback → straight-alpha PNG). canvas.toDataURL
  // is NOT used: Chrome routes it through the composited, color-managed
  // copy, which is not the frame bytes the preview/screenshot grabs hash.
  // Straight-alpha (color type 6, filter 0 rows, zlib via CompressionStream).
  var CRC_TABLE = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes, from, to) {
    var c = 0xffffffff;
    for (var i = from; i < to; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function pngChunk(type, data) {
    var out = new Uint8Array(12 + data.length);
    out[0] = (data.length >>> 24) & 255; out[1] = (data.length >>> 16) & 255;
    out[2] = (data.length >>> 8) & 255; out[3] = data.length & 255;
    for (var i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
    out.set(data, 8);
    var c = crc32(out, 4, 8 + data.length);
    out[8 + data.length] = (c >>> 24) & 255; out[9 + data.length] = (c >>> 16) & 255;
    out[10 + data.length] = (c >>> 8) & 255; out[11 + data.length] = c & 255;
    return out;
  }
  function bytesToBase64(bytes) {
    var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    var out = '';
    for (var i = 0; i < bytes.length; i += 3) {
      var b0 = bytes[i], b1 = i + 1 < bytes.length ? bytes[i + 1] : 0, b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
      out += B64[b0 >> 2] + B64[((b0 & 3) << 4) | (b1 >> 4)];
      out += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | (b2 >> 6)] : '=';
      out += i + 2 < bytes.length ? B64[b2 & 63] : '=';
    }
    return out;
  }
  function pngEncodeStraightRgba(px, w, h) {
    // Filter 0 per scanline: raw | stride — the decoders on every leg
    // implement filters 0-4, this file uses the pass-through filter.
    var stride = w * 4;
    var raw = new Uint8Array(h * (stride + 1));
    for (var y = 0; y < h; y++) {
      raw[y * (stride + 1)] = 0;
      raw.set(px.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
    }
    var ihdr = new Uint8Array(13);
    ihdr[0] = (w >>> 24) & 255; ihdr[1] = (w >>> 16) & 255; ihdr[2] = (w >>> 8) & 255; ihdr[3] = w & 255;
    ihdr[4] = (h >>> 24) & 255; ihdr[5] = (h >>> 16) & 255; ihdr[6] = (h >>> 8) & 255; ihdr[7] = h & 255;
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    var ds = new CompressionStream('deflate');
    var stream = new Blob([raw]).stream().pipeThrough(ds);
    return new Response(stream).arrayBuffer().then(function (zbuf) {
      var z = new Uint8Array(zbuf);
      var parts = [
        new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
        pngChunk('IHDR', ihdr),
        pngChunk('IDAT', z),
        pngChunk('IEND', new Uint8Array(0)),
      ];
      var total = 0;
      for (var i = 0; i < parts.length; i++) total += parts[i].length;
      var png = new Uint8Array(total);
      var off = 0;
      for (var j = 0; j < parts.length; j++) { png.set(parts[j], off); off += parts[j].length; }
      return 'data:image/png;base64,' + bytesToBase64(png);
    });
  }

  // ── PNG decode (web leg): the exact PNG bytes the capture host wrote are
  // decoded back to straight RGBA in-page — own inflate (DecompressionStream,
  // the zlib wrapper PNG uses) + unfilter — so the hash compares the FILE, so
  // no browser premultiply behavior can flange the comparison.
  function base64ToBytes(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function u32(d, o) { return ((d[o] << 24) | (d[o + 1] << 16) | (d[o + 2] << 8) | d[o + 3]) >>> 0; }
  function pngUnfilter(data, w, h) {
    var stride = w * 4;
    var out = new Uint8Array(h * stride);
    var pos = 0, prev = new Uint8Array(stride);
    for (var y = 0; y < h; y++) {
      var ft = data[pos++];
      var cur = new Uint8Array(stride);
      for (var x = 0; x < stride; x++) {
        var a = x >= 4 ? cur[x - 4] : 0, b = prev[x], c = x >= 4 ? prev[x - 4] : 0;
        var v = data[pos + x];
        if (ft === 0) cur[x] = v;
        else if (ft === 1) cur[x] = (v + a) & 255;
        else if (ft === 2) cur[x] = (v + b) & 255;
        else if (ft === 3) cur[x] = (v + ((a + b) >> 1)) & 255;
        else {
          var pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
          var pred = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
          cur[x] = (v + pred) & 255;
        }
      }
      pos += stride;
      out.set(cur, y * stride);
      prev = cur;
    }
    return out;
  }
  function pngHashFromBytes(bytes) {
    var pos = 8, idat = [], w = 0, h = 0;
    while (pos + 8 <= bytes.length) {
      var len = u32(bytes, pos);
      var type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
      var d = bytes.subarray(pos + 8, pos + 8 + len);
      if (type === 'IHDR') { w = u32(d, 0); h = u32(d, 4); }
      else if (type === 'IDAT') idat.push(d);
      pos += 12 + len;
      if (type === 'IEND') break;
    }
    var total = 0;
    for (var i = 0; i < idat.length; i++) total += idat[i].length;
    var z = new Uint8Array(total), off = 0;
    for (var j = 0; j < idat.length; j++) { z.set(idat[j], off); off += idat[j].length; }
    var ds = new DecompressionStream('deflate');
    var stream = new Blob([z]).stream().pipeThrough(ds);
    return new Response(stream).arrayBuffer().then(function (buf) {
      var px = pngUnfilter(new Uint8Array(buf), w, h);
      return { hash: hashBytes(px), width: w, height: h, counts: alphaCounts(px) };
    });
  }

  // ── Pipeline construction through the helper API only. The stock
  // AfterimagePass (staged from the pinned r186 tree by stage_afterimage.mjs)
  // is the temporal pass; the host inserts it before the OutputPass and
  // declares its bounded window on the pipeline's CinematicHistory.
  function makePipeline(renderer, opts) {
    var scene = globalThis.createOverlayScene({ width: W, height: H });
    var camera = scene.userData.camera;
    var pipeline = cin.createPipeline({
      renderer: renderer, scene: scene, camera: camera,
      effects: {
        bloom: false, dof: false, fxaa: false, smaa: false,
        colorGrade: false, film: false, vignette: false, motion: false
      },
      alpha: true
    });
    if (opts.bloom) pipeline.bloom({});
    if (opts.dof) pipeline.depthOfField({ focus: 8.0, aperture: 0.004, maxBlur: 0.02 });
    if (opts.afterimage) {
      // The stock pass reads window.innerWidth/innerHeight in its
      // constructor; the host provides the DOM-ish globals the stock module
      // needs (the engine has none) and fixes the size right after.
      if (typeof globalThis.window === 'undefined') {
        globalThis.window = { innerWidth: W, innerHeight: H };
      }
      // The staged bundle's `var F4IAfterimage` is in scope when the engine
      // evals the widget as one script body (native leg) and on globalThis
      // when it is a classic script tag (web leg).
      var staged = typeof F4IAfterimage !== 'undefined'
        ? F4IAfterimage
        : globalThis.F4IAfterimage;
      var AIPass = staged && staged.AfterimagePass;
      if (!AIPass) throw new Error('f4i: the staged stock AfterimagePass is missing');
      var ai = new AIPass(0.5);
      ai.setSize(W, H);
      // Insert before the OutputPass (always the last pass of the chain).
      pipeline.composer.insertPass(ai, pipeline.composer.passes.length - 1);
      // damp 0.5: the decayed tail is flushed well within 40 frames — the
      // declared window the reconstruction replays for direct seeks.
      pipeline.history.declare({ pass: 'afterimage', frames: 40 });
      results.flags.ai_history_depth = pipeline.history.depth();
    }
    pipeline.updateScene = globalThis.updateOverlayScene;
    pipeline.setSize(W, H);
    return pipeline;
  }
  function makeRenderer(canvasId) {
    var canvas = jsr.three.createCanvas(canvasId);
    var renderer = new THREE.WebGLRenderer({
      canvas: canvas, antialias: false, premultipliedAlpha: false,
      // The capture host reads the canvas AFTER the render task; keep the
      // drawing buffer so the PNG export carries the exact frame bytes
      // (without it Chrome exports its composited copy, which is not the
      // buffer the preview/screenshot grabs hash).
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(1);
    renderer.setSize(W, H, false);
    return renderer;
  }
  function clock(frame) { return cin.clockState(frame, 24, 0.5, 1, 0); }

  // ── Main ────────────────────────────────────────────────────────────────
  var CHECKPOINTS = [
    { id: 'bloom', frame: 8 },
    { id: 'dof', frame: 16 },
    { id: 'temporal', frame: 24 }
  ];
  var FRAMES = 24; // the short export covers every checkpoint (0..24)

  // The capture paths await host responses: the whole main flow is one
  // async task the engine drains to completion before run() returns.
  (async function () {
  try {
    if (!cin || !THREE) throw new Error('f4i: bundle surface missing (THREE or jsr.three.cinematic)');

    // ONE canvas/renderer for the whole proof (the downstream host owns one
    // presented surface); the pipelines are fresh per capture path.
    var renderer = makeRenderer('main');

    if (NOCAP) {
      // REG-HOST-CAPTURE: no capture capability on this host. The export
      // (PNG-sequence capture) must fail with the named error BEFORE any
      // file is written — never an effect-less capture. Two frames are
      // rendered and two captures attempted: both must reject, none may
      // produce a file or a capture result.
      var pipeline0 = makePipeline(renderer, { bloom: true, dof: true, afterimage: true });
      pipeline0.resetHistory(0);
      for (var fn = 1; fn <= 2; fn++) {
        pipeline0.renderFrame(clock(fn));
        try {
          await pipeline0.captureFrame(clock(fn));
          results.filesWritten++;
          if (!results.exportError) {
            results.exportError = { name: 'unexpected', message: 'captureFrame resolved without a capture host' };
          }
        } catch (e) {
          results.exportError = { name: e && e.name, message: String((e && e.message) || e) };
        }
      }
      console.log('F4I_NOCAP error=' + JSON.stringify(results.exportError) + ' files=' + results.filesWritten);
      finish();
      return;
    }

    // (a) Preview: one pipeline plays 0..24; grab at the checkpoints.
    var prevPx = {};
    var pipelineA = makePipeline(renderer, { bloom: true, dof: true, afterimage: true });
    pipelineA.resetHistory(0);
    for (var f = 0; f <= FRAMES; f++) {
      pipelineA.renderFrame(clock(f));
      for (var c = 0; c < CHECKPOINTS.length; c++) {
        if (CHECKPOINTS[c].frame === f) {
          var id = CHECKPOINTS[c].id;
          prevPx[id] = grab(renderer);
          results.hashes['prev_' + id] = hashBytes(prevPx[id]);
          results.counts['prev_' + id] = alphaCounts(prevPx[id]);
        }
      }
    }
    // The two-background composite runs on a frame whose alpha still carries
    // the overlay's transparency: the stock r186 BokehShader forces
    // gl_FragColor.a = 1.0 on every pixel, so the DOF checkpoints are opaque
    // frames by stock behavior (alpha-through-finishing is the F4b E2E-ALPHA
    // scope). The composite family therefore arms bloom + the temporal pass
    // and plays to frame 12; the same grab is the reference of the temporal
    // presence diff below.
    var pipelineE = makePipeline(renderer, { bloom: true, dof: false, afterimage: true });
    pipelineE.resetHistory(0);
    var compositePx = null;
    for (var fe = 0; fe <= 12; fe++) {
      pipelineE.renderFrame(clock(fe));
      if (fe === 12) compositePx = grab(renderer);
    }
    compositeCheck(compositePx);

    // (b) Arbitrary-frame screenshot: a fresh pipeline per checkpoint, the
    // checkpoint frame captured ONCE. The stock AfterimagePass is in the
    // chain, so EVERY frame is temporal: the direct seek renders the history
    // window pipeline.history (CinematicHistory) reconstruct(clock) returns
    // for the target frame — the documented host protocol for seeking into a
    // timeline with temporal passes. The temporal checkpoint additionally
    // proves the window is NECESSARY: a single direct renderFrame(24)
    // without it genuinely differs.
    for (var c2 = 0; c2 < CHECKPOINTS.length; c2++) {
      var cp = CHECKPOINTS[c2];
      var pipelineB = makePipeline(renderer, { bloom: true, dof: true, afterimage: true });
      pipelineB.resetHistory(0);
      var rec = pipelineB.history.reconstruct(clock(cp.frame));
      results.flags['reconstruct_frames_' + cp.id] = rec.frames.length;
      for (var r = 0; r < rec.frames.length; r++) pipelineB.renderFrame(clock(rec.frames[r]));
      var shotPx = grab(renderer);
      results.hashes['shot_' + cp.id] = hashBytes(shotPx);
      results.flags['shot_equals_prev_' + cp.id] =
        results.hashes['shot_' + cp.id] === results.hashes['prev_' + cp.id];
    }
    // A bare direct seek (no history window) is NOT the protocol and MUST
    // differ: the checkpoint is genuinely temporal.
    {
      var pipelineB2 = makePipeline(renderer, { bloom: true, dof: true, afterimage: true });
      pipelineB2.resetHistory(0);
      pipelineB2.renderFrame(clock(24));
      results.flags.temporal_direct_without_window_differs =
        hashBytes(grab(renderer)) !== results.hashes['prev_temporal'];
    }

    // (c) PNG-sequence export: one pipeline plays 0..24 and captures every
    // frame through the host capture barrier; the host writes the files.
    var pipelineC = makePipeline(renderer, { bloom: true, dof: true, afterimage: true });
    pipelineC.resetHistory(0);
    for (var f2 = 0; f2 <= FRAMES; f2++) {
      pipelineC.renderFrame(clock(f2));
      var cap = pipelineC.captureFrame(clock(f2));
      globalThis.__F4I_TRACK && globalThis.__F4I_TRACK(cap);
      var done = await cap;
      results.png.files++;
      if (done && done.dataUrl) {
        var b64 = done.dataUrl.slice(done.dataUrl.indexOf(',') + 1);
        var dec = await pngHashFromBytes(base64ToBytes(b64));
        for (var c3 = 0; c3 < CHECKPOINTS.length; c3++) {
          if (CHECKPOINTS[c3].frame === f2) {
            results.png.hashes['png_' + CHECKPOINTS[c3].id] = dec.hash;
            results.counts['png_' + CHECKPOINTS[c3].id] = dec.counts;
            results.flags['png_equals_prev_' + CHECKPOINTS[c3].id] =
              dec.hash === results.hashes['prev_' + CHECKPOINTS[c3].id];
          }
        }
      }
      results.filesWritten++;
    }

    // Effect presence (E14: no silent effect removal). Each checkpoint is
    // re-rendered with the NAMED effect off; the frame must visibly change.
    // The temporal presence compares inside the no-DOF family (frame 12,
    // with vs without the AfterimagePass) so the stock DOF blur cannot mask
    // the trail.
    var presenceB = makePipeline(renderer, { bloom: false, dof: true, afterimage: true });
    presenceB.resetHistory(0);
    for (var pb = 0; pb <= 8; pb++) presenceB.renderFrame(clock(pb));
    results.diffs.presence_bloom = diffCount(grab(renderer), prevPx['bloom']);

    var presenceD = makePipeline(renderer, { bloom: true, dof: false, afterimage: true });
    presenceD.resetHistory(0);
    for (var pd = 0; pd <= 16; pd++) presenceD.renderFrame(clock(pd));
    results.diffs.presence_dof = diffCount(grab(renderer), prevPx['dof']);

    var presenceT = makePipeline(renderer, { bloom: true, dof: false, afterimage: false });
    presenceT.resetHistory(0);
    for (var pt = 0; pt <= 12; pt++) presenceT.renderFrame(clock(pt));
    results.diffs.presence_temporal = diffCount(grab(renderer), compositePx);

    // The checkpoint report lines (both legs print them through the log lane).
    var equalCount = 0;
    for (var c4 = 0; c4 < CHECKPOINTS.length; c4++) {
      var id2 = CHECKPOINTS[c4].id;
      var eq = results.flags['shot_equals_prev_' + id2] === true &&
        results.flags['png_equals_prev_' + id2] === true;
      if (eq) equalCount++;
      console.log('F4I_CHECKPOINT ' + id2 + '-' + CHECKPOINTS[c4].frame +
        ' prev=' + results.hashes['prev_' + id2] +
        ' shot=' + results.hashes['shot_' + id2] +
        ' png=' + (results.png.hashes['png_' + id2] || 'host-verified') +
        ' equal=' + eq);
    }
    console.log('F4I_SUMMARY checkpoints=' + CHECKPOINTS.length + ' equal=' + equalCount +
      ' files=' + results.png.files);
    finish();
  } catch (e) {
    results.error = String((e && e.message) || e);
    console.log('F4I_ERROR ' + results.error);
    finish();
  }
  })();
})();
