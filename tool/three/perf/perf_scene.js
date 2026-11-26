// perf_scene.js — F4f cinematic performance scene (issue #8, PERF-CINEMATIC-*,
// REG-UPLOADS). Runs BYTE-IDENTICAL on both legs: the native 1B leg (QuickJS
// -> webgl2 facade over ANGLE, corpus boot: dartPrelude + corpus_dom +
// three.core.js + jsr_three_web.js + g1_packer.js + facade) and the web leg
// (headless Chrome WebGL2 over the same wrapped bundles). Public helper API
// only — everything goes through `jsr.three.cinematic`
// (createPipeline/setPreset/renderFrame/resetHistory/setSize/dispose).
//
// Scene: 9 shared-material boxes over ONE static 256x256 DataTexture color
// map, static lights, per-frame rotation driven by the explicit clock frame
// (never a wall clock). The pipeline per preset owns every offscreen target;
// nothing asset-like changes between frames, so after a quiet warm-up three.js
// must not compile/link a shader or upload ANY texture per frame — that is
// the gated REG-UPLOADS check, measured with the facade's own call counters
// (`__stats.used`) cross-checked against a thin per-texture attribution
// wrapper installed around the facade context (uploads attributed by bound
// texture object identity, so a resize's render-target re-allocation can be
// told apart from a re-upload of an unchanged asset).
//
// Counters/objects conventions (stated for the report):
//   compiles/links    delta of gl.compileShader/gl.linkProgram calls.
//   uploads           delta of texImage2D/texSubImage2D/texImage3D/
//                     texSubImage3D/compressedTexImage2D/
//                     compressedTexSubImage2D/compressedTexSubImage3D calls.
//   asset textures    the scene color texture + the pipeline LUT
//                     (passes.colorGrade.uniforms.lut.value) + the SMAA
//                     lookup textures when present. They never change.
//   GL object counts  facade counter deltas: used.createX - used.deleteX.
//   offscreen bytes   composer.renderTarget1/2 + accum target (HalfFloatType
//                     RGBA of the drawing-buffer size — cinematic.js
//                     ensureAccum descriptor; the target itself is not
//                     exposed by the pipeline API) + every render target
//                     reachable from the passes; bytes = w*h*bytesPerPixel
//                     (+w*h*4 when a depth attachment is enabled).
(function () {
  'use strict';
  var g = globalThis;

  var UPLOAD_FNS = ['texImage2D', 'texSubImage2D', 'texImage3D', 'texSubImage3D',
    'compressedTexImage2D', 'compressedTexSubImage2D', 'compressedTexSubImage3D'];
  var OBJECT_FNS = [['createTexture', 'deleteTexture', 'textures'],
    ['createFramebuffer', 'deleteFramebuffer', 'framebuffers'],
    ['createRenderbuffer', 'deleteRenderbuffer', 'renderbuffers'],
    ['createProgram', 'deleteProgram', 'programs'],
    ['createBuffer', 'deleteBuffer', 'buffers'],
    ['createShader', 'deleteShader', 'shaders'],
    ['createSampler', 'deleteSampler', 'samplers']];

  var cell = null; // the live cell (setup/dispose lifecycle below)

  // ---- static scene inputs -------------------------------------------------

  function makeColorTexture() {
    var W = 256, H = 256, data = new Uint8Array(W * H * 4);
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var i = (y * W + x) * 4;
        data[i] = (x * 255 / (W - 1)) | 0;
        data[i + 1] = (y * 255 / (H - 1)) | 0;
        data[i + 2] = (x ^ y) & 255;
        data[i + 3] = 255;
      }
    }
    var t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.needsUpdate = true;
    return t;
  }

  function buildScene() {
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101418);
    var texture = makeColorTexture();
    var material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6, metalness: 0.1 });
    var group = new THREE.Group();
    var geo = new THREE.BoxGeometry(1, 1, 1);
    for (var i = 0; i < 9; i++) {
      var mesh = new THREE.Mesh(geo, material);
      mesh.position.set(((i % 3) - 1) * 2.2, (Math.floor(i / 3) - 1) * 2.2, 0);
      group.add(mesh);
    }
    scene.add(group);
    var dir = new THREE.DirectionalLight(0xffffff, 2.2);
    dir.position.set(4, 6, 8);
    scene.add(dir);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    var camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 100);
    camera.position.set(0, -3.5, 11);
    camera.lookAt(0, 0, 0);
    return { scene: scene, camera: camera, texture: texture, group: group };
  }

  // Deterministic animation: a pure function of the clock frame index.
  function updateScene(scene, clock) {
    var frame = clock.frame;
    scene.userData.__group.rotation.y = frame * 0.01;
    scene.userData.__group.rotation.x = Math.sin(frame * 0.01) * 0.15;
    var cam = scene.userData.__camera;
    var a = frame * 0.004;
    cam.position.set(Math.sin(a) * 3.5, -3.5 + Math.cos(a * 0.5) * 0.6, Math.cos(a) * 3.5 + 8);
    cam.lookAt(0, 0, 0);
  }

  // ---- instrumentation (both legs; wrapping preserves call semantics) ------

  function instrument(gl) {
    var bound = {};
    var compiles = 0, links = 0;
    var uploads = {};
    var perTex = []; // [{ obj, uploads }] — object identity attribution
    var texIndex = new Map();

    function wrap(name, pre) {
      var orig = gl[name].bind(gl);
      gl[name] = function () { pre.apply(null, arguments); return orig.apply(null, arguments); };
    }
    wrap('bindTexture', function (target, tex) { bound[target] = tex || null; });
    UPLOAD_FNS.forEach(function (name) {
      if (typeof gl[name] !== 'function') return;
      uploads[name] = 0;
      wrap(name, function (target) {
        uploads[name]++;
        var tex = bound[target];
        if (tex) {
          var e = texIndex.get(tex);
          if (!e) { e = { obj: tex, id: texIndex.size + 1, uploads: 0 }; texIndex.set(tex, e); perTex.push(e); }
          e.uploads++;
        }
      });
    });
    wrap('compileShader', function () { compiles++; });
    wrap('linkProgram', function () { links++; });
    return {
      compiles: function () { return compiles; },
      links: function () { return links; },
      uploads: function () { return Object.assign({}, uploads); },
      totalUploads: function () { var n = 0; for (var k in uploads) n += uploads[k]; return n; },
      perTexSnapshot: function () {
        return perTex.map(function (e) { return { id: e.id, uploads: e.uploads }; });
      },
      uploadsFor: function (objs) {
        var ids = new Set(objs.map(function (o) { return texIndex.get(o); }).filter(Boolean).map(function (e) { return e.id; }));
        return perTex.filter(function (e) { return ids.has(e.id); }).reduce(function (a, e) { return a + e.uploads; }, 0);
      }
    };
  }

  function facadeCounters(gl) {
    // Facade-only (1B leg); the real Chrome context has no __stats — null.
    if (!gl.__stats) return null;
    var used = gl.__stats.used;
    return {
      compileShader: used.compileShader || 0,
      linkProgram: used.linkProgram || 0,
      texImage2D: used.texImage2D || 0,
      texSubImage2D: used.texSubImage2D || 0,
      texImage3D: used.texImage3D || 0,
      texSubImage3D: used.texSubImage3D || 0,
      compressedTexImage2D: used.compressedTexImage2D || 0,
      compressedTexSubImage2D: used.compressedTexSubImage2D || 0,
      compressedTexSubImage3D: used.compressedTexSubImage3D || 0,
      flushes: gl.__stats.flushes,
      dispatchCalls: gl.__stats.dispatchCalls
    };
  }

  function objectCounts(gl) {
    if (!gl.__stats) return null;
    var used = gl.__stats.used, out = {};
    OBJECT_FNS.forEach(function (f) {
      out[f[2]] = (used[f[0]] || 0) - (used[f[1]] || 0);
    });
    return out;
  }

  // ---- offscreen target inventory -----------------------------------------

  var BYTES_PER_PIXEL = { 5121: 4, 5131: 8 }; // UnsignedByteType RGBA8 : HalfFloatType RGBA16F
  function rtBytesPerPixel(rt) {
    // RGBA formats only in the owned set (any exotic type surfaces via the
    // type dump in the report).
    return BYTES_PER_PIXEL[rt.texture.type] || 4;
  }

  function collectTargets(pipeline, width, height) {
    var list = [];
    function push(rt, tag) {
      if (!rt || !rt.isRenderTarget) return;
      var bpp = rtBytesPerPixel(rt);
      var bytes = rt.width * rt.height * bpp;
      if (rt.depthBuffer !== false) bytes += rt.width * rt.height * 4; // DEPTH24_STENCIL8 attachment
      list.push({ tag: tag, width: rt.width, height: rt.height, type: rt.texture.type, format: rt.texture.format, bytes: bytes });
    }
    push(pipeline.composer.renderTarget1, 'composer-read');
    push(pipeline.composer.renderTarget2, 'composer-write');
    Object.keys(pipeline.passes).forEach(function (name) {
      var pass = pipeline.passes[name];
      Object.keys(pass).forEach(function (key) {
        var v = pass[key];
        if (v && v.isRenderTarget) push(v, name + ':' + key);
        if (Array.isArray(v)) v.forEach(function (el, i) { if (el && el.isRenderTarget) push(el, name + ':' + key + '[' + i + ']'); });
      });
    });
    // Accum target (cinematic.js ensureAccum): exists iff subframe accumulation
    // is active — one HalfFloatType RGBA target of the drawing-buffer size.
    var accumActive = pipeline.capabilities.supports('multisample') &&
      (pipeline.getConfig().samples > 1);
    if (accumActive) {
      var bytes = width * height * 8 + width * height * 4; // HalfFloat RGBA, no depth
      list.push({ tag: 'accum', width: width, height: height, type: 32820, format: 6408, bytes: bytes });
    }
    return list;
  }

  function assetsOf(pipeline, built) {
    var assets = [built.texture];
    var grade = pipeline.passes.colorGrade;
    if (grade && grade.uniforms && grade.uniforms.lut && grade.uniforms.lut.value) {
      assets.push(grade.uniforms.lut.value);
    }
    var smaa = pipeline.passes.smaa;
    ['areaTexture', 'searchTexture'].forEach(function (k) {
      if (smaa && smaa[k]) assets.push(smaa[k]);
    });
    return assets;
  }

  // ---- cell lifecycle -------------------------------------------------------

  g.__perfCellSetup = function (opts) {
    try {
      var canvas = document.createElement('canvas');
      canvas.width = opts.width;
      canvas.height = opts.height;
      var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false });
      renderer.setSize(opts.width, opts.height, false);
      var built = buildScene();
      built.scene.userData.__group = built.group;
      built.scene.userData.__camera = built.camera;
      built.camera.aspect = opts.width / opts.height;
      built.camera.updateProjectionMatrix();
      var cine = g.jsr.three.cinematic;
      var pipeline = cine.createPipeline({ renderer: renderer, scene: built.scene, camera: built.camera });
      var applied = pipeline.setPreset(opts.preset);
      pipeline.updateScene = function (scene, clock) { updateScene(scene, clock); };
      var gl = renderer.getContext();
      var inst = instrument(gl);
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      // The named clock component (ADR-0004 decision 3): fixed at the preset
      // settings; the resetHistory event bumps the epoch explicitly.
      var cfg = pipeline.getConfig();
      cell = {
        renderer: renderer, pipeline: pipeline, built: built, gl: gl, inst: inst,
        width: opts.width, height: opts.height, preset: opts.preset, canvas: canvas,
        clock: cine.createFrameClock({ fps: cfg.fps, shutter: cfg.shutter, samples: cfg.samples, epoch: cfg.epoch }),
        assets: assetsOf(pipeline, built)
      };
      return {
        ok: true,
        lane: pipeline.lane,
        capabilities: {
          halfFloatTargets: pipeline.capabilities.halfFloatTargets === true,
          motionBlurAccum: pipeline.capabilities.motionBlurAccum === true,
          smaa: pipeline.capabilities.smaa === true,
          lut: pipeline.capabilities.lut === true,
          bloom: pipeline.capabilities.bloom === true,
          bokeh: pipeline.capabilities.bokeh === true
        },
        applied: applied,
        unsupported: pipeline.unsupported.slice(),
        rendererString: String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)),
        vendorString: String(ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR)),
        glVersion: String(gl.getParameter(gl.VERSION)),
        assets: cell.assets.length
      };
    } catch (e) {
      return { ok: false, error: String((e && (e.message ? e.message + '\n' + e.stack : e.stack)) || e) };
    }
  };

  g.__perfRender = function (frame) {
    cell.pipeline.renderFrame(cell.clock.state(frame));
    return true;
  };

  g.__perfResize = function (width, height) {
    cell.renderer.setSize(width, height, false);
    cell.pipeline.setSize(width, height);
    return true;
  };

  g.__perfResetHistory = function (epoch) {
    return cell.pipeline.resetHistory(epoch);
  };

  // Cumulative structural counters since setup (the drivers diff snapshots).
  g.__perfFrameCounters = function () {
    return JSON.stringify({
      c: cell.inst.compiles(),
      l: cell.inst.links(),
      u: cell.inst.totalUploads(),
      au: cell.inst.uploadsFor(cell.assets),
      f: facadeCounters(cell.gl)
    });
  };

  g.__perfCounters = function () {
    return JSON.stringify({
      compiles: cell.inst.compiles(),
      links: cell.inst.links(),
      uploads: cell.inst.uploads(),
      perTex: cell.inst.perTexSnapshot(),
      assets: cell.inst.uploadsFor(cell.assets),
      facade: facadeCounters(cell.gl),
      objects: objectCounts(cell.gl),
      targets: collectTargets(cell.pipeline, cell.width, cell.height)
    });
  };

  g.__perfDispose = function () {
    cell.pipeline.dispose();
    cell.renderer.dispose();
    var objects = objectCounts(cell.gl);
    cell = null;
    return JSON.stringify({ objectsAfterDispose: objects });
  };
})();
