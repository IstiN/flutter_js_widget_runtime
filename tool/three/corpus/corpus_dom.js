// corpus_dom.js — shared deterministic DOM/env shim for the M4 corpus runner.
// Evaluated identically on BOTH sides:
//   1B:   tool/three/run_1b_corpus.dart (QuickJS, after the Dart prelude that
//         provides __jsr1b_gl/__jsr1b_result/atob + asset host fns)
//   Web:  tool/three/ref_1b_corpus.cjs (Playwright Chrome, after the web
//         driver sets __assetReadRaw/__decodeImageRaw + canvas stash)
//
// Per-side bridges (looked up lazily at call time, so eval order is free):
//   g.__assetReadRaw(path)        -> base64 string | Uint8Array | null  (sync on 1B, may return a Promise on Web)
//   g.__decodeImageFromPath(path) -> {width,height,dataB64|data} | Promise (Web)
//   g.__decodeImageFromBytes(bytes, type) -> same (Web async)
//   g.__consoleBridge(level, msg) -> optional sink (1B routes to host fn)
//
// Everything here is harness glue: no three sources are patched, no facade
// semantics are touched. Determinism: pinned clock, pinned Math.random,
// captured animation loop driven by __corpusTick(n) at 16.6667 ms/frame.
(function () {
  var g = globalThis;
  // Install a value over possibly read-only window accessors (document,
  // navigator, performance are getters on Window.prototype in browsers; in
  // QuickJS they are plain assignments). defineProperty shadows the
  // prototype accessor when configurable; fall back silently otherwise.
  function def(name, value) {
    try { Object.defineProperty(g, name, { value: value, configurable: true, writable: true }); return; } catch (e) {}
    try { g[name] = value; } catch (e2) {}
  }
  var IS_WEB = !!g.__nativeCreateElementNS; // set by the ref driver init script
  g.self = g;
  if (!g.window) def('window', g);
  if (!g.navigator) def('navigator', { userAgent: 'a1b-corpus/1.0 (headless)', maxTouchPoints: 0, hardwareConcurrency: 4 });
  if (!g.location) def('location', { href: 'http://localhost/', origin: 'http://localhost', protocol: 'http:', hostname: 'localhost', port: '', pathname: '/', search: '', hash: '', reload: function () {}, replace: function () {}, assign: function () {} });
  def('devicePixelRatio', 1);
  def('innerWidth', 320); def('innerHeight', 240);
  g.devicePixelContentBoxSize = undefined;

  // ---- pinned clock -------------------------------------------------------
  var __now = 0;
  if (IS_WEB) {
    // Augment, never shadow: Playwright's injected utility world shares this
    // window and breaks if document/performance are replaced.
    g.performance.now = function () { return __now; };
  } else {
    def('performance', { now: function () { return __now; } });
  }
  var __dateNow = Date.now;
  Date.now = function () { return Math.floor(__now); };
  var __randState = 0x2545F4914F6CDD1D % 0x80000000;
  Math.random = function () {
    // Numerical Recipes LCG — deterministic, identical on both sides.
    __randState = (Math.imul(__randState, 1664525) + 1013904223) & 0x7fffffff;
    return __randState / 0x80000000;
  };

  // ---- corpus state -------------------------------------------------------
  var __loop = null, __raf = null;
  var __errors = [];
  var __warnings = [];
  g.__corpusErrors = __errors;
  g.__corpusWarnings = __warnings;
  g.__corpusBegin = function () { __loop = null; __raf = null; __errors.length = 0; __warnings.length = 0; __now = 0; __vtimers.length = 0; };
  g.__corpusLoopState = function () { return { loop: !!__loop, raf: !!__raf, warnings: __warnings.slice() }; };
  g.__corpusTick = function (n) {
    if (!__loop && !__raf) {
      // On-demand scenes (render() driven by load callbacks / GUI stubs)
      // register no animation loop; the frame settles during microtask
      // drains. Warn — the harnesses separately gate on real GL draw
      // activity so a scene that never drew still fails.
      __warnings.push('no animation loop registered; on-demand render scene?');
      return true;
    }
    for (var i = 1; i <= n; i++) {
      __now = i * 16.6667;
      __runDueTimers();
      var fn = __loop || __raf;
      try { fn(); } catch (e) { __errors.push('tick ' + i + ': ' + String(e && e.stack ? e.stack : e)); return false; }
    }
    return true;
  };

  // ---- console ------------------------------------------------------------
  function __log(level, args) {
    var msg = Array.prototype.join.call(args, ' ');
    if (level === 'error') {
      var stk = '';
      for (var ai = 0; ai < args.length; ai++) {
        if (args[ai] && args[ai].stack) { stk = String(args[ai].stack); break; }
      }
      if (!stk) { try { stk = String(new Error('corpus-trace').stack || ''); } catch (eStk) {} }
      __errors.push('console.error: ' + msg + (stk ? '\n' + stk : ''));
      msg += (stk ? '\n' + stk : '');
    }
    if (g.__consoleBridge) { try { g.__consoleBridge(level, msg); } catch (e) {} }
    else if (g.console && level in g.console) { try { g.console[level](msg); } catch (e) {} }
  }
  var __timers = {};
  g.console = {
    log: function () { __log('log', arguments); },
    info: function () { __log('info', arguments); },
    warn: function () { __log('warn', arguments); },
    error: function () { __log('error', arguments); },
    debug: function () { __log('debug', arguments); },
    // Perf-timing facade used by several example scenes (instancing-scatter,
    // instancing-performance, ...). No-op state only; identical on both tiers.
    time: function (label) { __timers[String(label)] = (__now || 0); },
    timeEnd: function (label) { delete __timers[String(label)]; },
    timeLog: function (label) { return __timers[String(label)]; },
    timeStamp: function () {},
    group: function () {}, groupEnd: function () {}, groupCollapsed: function () {},
    count: function () {}, countReset: function () {},
    table: function () {}, trace: function () {},
    dir: function () {}, dirxml: function () {},
    assert: function (cond) { if (!cond) __log('error', ['console.assert failed'].concat(Array.prototype.slice.call(arguments, 1))); },
    clear: function () {}
  };

  // ---- base64 helpers (QuickJS prelude also defines atob; harmless) --------
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  g.__b64toBytes = function (input) {
    var str = String(input).replace(/=+$/, '');
    if (str.length % 4 === 1) throw new Error('b64: invalid input');
    var out = new Uint8Array(Math.floor(str.length * 3 / 4)), o = 0;
    for (var i = 0; i < str.length; i += 4) {
      var c0 = B64.indexOf(str[i]), c1 = B64.indexOf(str[i + 1]);
      var c2 = i + 2 < str.length ? B64.indexOf(str[i + 2]) : 0;
      var c3 = i + 3 < str.length ? B64.indexOf(str[i + 3]) : 0;
      if (c0 < 0 || c1 < 0 || c2 < 0 || c3 < 0) throw new Error('b64: invalid input');
      var n = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
      if (o < out.length) out[o++] = (n >> 16) & 255;
      if (i + 2 < str.length && o < out.length) out[o++] = (n >> 8) & 255;
      if (i + 3 < str.length && o < out.length) out[o++] = n & 255;
    }
    return out.subarray(0, o);
  };
  g.__bytesToB64 = function (bytes) {
    var s = '', i;
    for (i = 0; i + 2 < bytes.length; i += 3) {
      var n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
      s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
    }
    var rem = bytes.length - i;
    if (rem === 1) { var m = bytes[i] << 16; s += B64[(m >> 18) & 63] + B64[(m >> 12) & 63] + '=='; }
    else if (rem === 2) { var m2 = (bytes[i] << 16) | (bytes[i + 1] << 8); s += B64[(m2 >> 18) & 63] + B64[(m2 >> 12) & 63] + B64[(m2 >> 6) & 63] + '='; }
    return s;
  };
  g.__bytesToText = function (bytes) {
    // UTF-8 decode, chunked (mirrors the R1 runtime decoder semantics).
    var out = [], i = 0;
    while (i < bytes.length) {
      var c = bytes[i];
      if (c < 0x80) { out.push(c); i++; }
      else if (c < 0xe0) { out.push(((c & 31) << 6) | (bytes[i + 1] & 63)); i += 2; }
      else if (c < 0xf0) { out.push(((c & 15) << 12) | ((bytes[i + 1] & 63) << 6) | (bytes[i + 2] & 63)); i += 3; }
      else { var cp = ((c & 7) << 18) | ((bytes[i + 1] & 63) << 12) | ((bytes[i + 2] & 63) << 6) | (bytes[i + 3] & 63); cp -= 0x10000; out.push(0xd800 | (cp >> 10), 0xdc00 | (cp & 1023)); i += 4; }
    }
    var s = '';
    for (i = 0; i < out.length; i += 32768) s += String.fromCharCode.apply(null, out.slice(i, i + 32768));
    return s;
  };
  g.__textToBytes = function (str) {
    var out = new Uint8Array(str.length * 4), o = 0;
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) out[o++] = c;
      else if (c < 0x800) { out[o++] = 0xc0 | (c >> 6); out[o++] = 0x80 | (c & 63); }
      else if (c >= 0xd800 && c < 0xdc00 && i + 1 < str.length) { c = 0x10000 + ((c - 0xd800) << 10) + (str.charCodeAt(++i) - 0xdc00); out[o++] = 0xf0 | (c >> 18); out[o++] = 0x80 | ((c >> 12) & 63); out[o++] = 0x80 | ((c >> 6) & 63); out[o++] = 0x80 | (c & 63); }
      else { out[o++] = 0xe0 | (c >> 12); out[o++] = 0x80 | ((c >> 6) & 63); out[o++] = 0x80 | (c & 63); }
    }
    return out.subarray(0, o);
  };

  // TextDecoder stub (GLTFLoader et al.) — options {fatal} ignored.
  g.TextDecoder = function (label, options) {
    this.decode = function (buffer) { return g.__bytesToText(new Uint8Array(buffer.buffer || buffer, buffer.byteOffset || 0, buffer.byteLength !== undefined ? buffer.byteLength : buffer.length)); };
  };

  // ---- WebAudio stubs (1B side; browsers keep their native AudioContext) ---
  // webaudio-* examples gate scene construction on AudioLoader success;
  // decodeAudioData resolves a deterministic silent buffer so the scene
  // completes and draws. Analyser output is zeros — same bytes every run.
  function __makeAudioBuffer(byteLength) {
    var sampleRate = 44100;
    var length = Math.max(1, Math.floor((byteLength || 44100) / 8));
    var channels = [];
    for (var c = 0; c < 2; c++) channels.push(new Float32Array(length));
    return {
      sampleRate: sampleRate, length: length, duration: length / sampleRate,
      numberOfChannels: 2,
      getChannelData: function (i) { return channels[Math.min(1, Math.max(0, i | 0))]; },
      copyFromChannel: function (dst, ch, off) { dst.set(channels[Math.min(1, Math.max(0, ch | 0))].subarray(off || 0, (off || 0) + dst.length)); },
      copyToChannel: function () {}
    };
  }
  function __makeAudioParam(v) {
    var p = { value: v, setValueAtTime: function () { return p; }, linearRampToValueAtTime: function () { return p; },
      exponentialRampToValueAtTime: function () { return p; }, setTargetAtTime: function () { return p; },
      cancelScheduledValues: function () { return p; }, setValueCurveAtTime: function () { return p; } };
    return p;
  }
  function __makeAudioNode(ctx) {
    return {
      context: ctx,
      connect: function (node) { return node || this; },
      disconnect: function () {},
      start: function () {}, stop: function () {},
      onended: null
    };
  }
  function CorpusAudioContext(opts) {
    var ctx = this;
    this.sampleRate = (opts && opts.sampleRate) || 44100;
    this.state = 'running';
    this.destination = __makeAudioNode(this);
    this.listener = {
      positionX: __makeAudioParam(0), positionY: __makeAudioParam(0), positionZ: __makeAudioParam(0),
      forwardX: __makeAudioParam(0), forwardY: __makeAudioParam(0), forwardZ: __makeAudioParam(-1),
      upX: __makeAudioParam(0), upY: __makeAudioParam(1), upZ: __makeAudioParam(0),
      setPosition: function () {}, setOrientation: function () {}, setListener: function () {}
    };
    this.decodeAudioData = function (bytes, ok, err) {
      var buf = __makeAudioBuffer(bytes && bytes.byteLength);
      if (typeof ok === 'function') { try { ok(buf); } catch (e) {} }
      return Promise.resolve(buf);
    };
    this.createBuffer = function (ch, len, rate) { return __makeAudioBuffer(len * ch); };
    this.createBufferSource = function () {
      var n = __makeAudioNode(this); n.buffer = null; n.loop = false; n.playbackRate = __makeAudioParam(1); return n;
    };
    this.createGain = function () { var n = __makeAudioNode(this); n.gain = __makeAudioParam(1); return n; };
    this.createAnalyser = function () {
      var n = __makeAudioNode(this);
      n.fftSize = 2048; n.smoothingTimeConstant = 0.8; n.minDecibels = -100; n.maxDecibels = -30;
      Object.defineProperty(n, 'frequencyBinCount', { get: function () { return (n.fftSize / 2) | 0; } });
      n.getByteFrequencyData = function (arr) { for (var i = 0; i < arr.length; i++) arr[i] = 0; };
      n.getFloatFrequencyData = function (arr) { for (var i = 0; i < arr.length; i++) arr[i] = -100; };
      n.getByteTimeDomainData = function (arr) { for (var i = 0; i < arr.length; i++) arr[i] = 128; };
      return n;
    };
    this.createPanner = function () {
      var n = __makeAudioNode(this);
      n.panningModel = 'HRTF'; n.distanceModel = 'inverse';
      n.positionX = __makeAudioParam(0); n.positionY = __makeAudioParam(0); n.positionZ = __makeAudioParam(0);
      n.orientationX = __makeAudioParam(0); n.orientationY = __makeAudioParam(0); n.orientationZ = __makeAudioParam(0);
      n.setPosition = function () {}; n.setOrientation = function () {};
      return n;
    };
    this.createBiquadFilter = function () { var n = __makeAudioNode(this); n.frequency = __makeAudioParam(350); n.Q = __makeAudioParam(1); n.type = 'lowpass'; return n; };
    this.createOscillator = function () { var n = __makeAudioNode(this); n.frequency = __makeAudioParam(440); n.type = 'sine'; return n; };
    this.createConvolver = function () { var n = __makeAudioNode(this); n.buffer = null; return n; };
    this.createDynamicsCompressor = function () { var n = __makeAudioNode(this); n.threshold = __makeAudioParam(-24); n.ratio = __makeAudioParam(12); return n; };
    this.createChannelMerger = function () { return __makeAudioNode(this); };
    this.createChannelSplitter = function () { return __makeAudioNode(this); };
    this.createStereoPanner = function () { var n = __makeAudioNode(this); n.pan = __makeAudioParam(0); return n; };
    this.createWaveShaper = function () { return __makeAudioNode(this); };
    this.createDelay = function () { var n = __makeAudioNode(this); n.delayTime = __makeAudioParam(0); return n; };
    this.suspend = function () { ctx.state = 'suspended'; return Promise.resolve(); };
    this.resume = function () { ctx.state = 'running'; return Promise.resolve(); };
    this.close = function () { ctx.state = 'closed'; return Promise.resolve(); };
    this.currentTime = 0;
    this.baseLatency = 0;
    this._tickAdvance = function (dt) { ctx.currentTime += dt; };
  }
  if (!g.AudioContext) {
    def('AudioContext', CorpusAudioContext);
    def('webkitAudioContext', CorpusAudioContext);
    def('OfflineAudioContext', CorpusAudioContext);
  }

  // ---- event plumbing -----------------------------------------------------
  var __winListeners = {};
  g.addEventListener = function (t, fn) { (__winListeners[t] = __winListeners[t] || []).push(fn); };
  g.removeEventListener = function (t, fn) {
    var a = __winListeners[t]; if (!a) return;
    var i = a.indexOf(fn); if (i >= 0) a.splice(i, 1);
  };
  g.dispatchEvent = function (ev) {
    var a = __winListeners[ev && ev.type] || [];
    for (var i = 0; i < a.length; i++) { try { a[i].call(g, ev); } catch (e) {} }
    return true;
  };
  g.matchMedia = function () { return { matches: false, addEventListener: function () {}, removeEventListener: function () {}, addListener: function () {}, removeListener: function () {} }; };
  g.getComputedStyle = function () { return { getPropertyValue: function () { return ''; } }; };
  if (!g.location) def('location', { protocol: 'file:', hostname: '', host: '', href: 'file:///corpus/scene/', pathname: '/corpus/scene/', search: '', hash: '', port: '' });

  // ---- asset registry -----------------------------------------------------
  // __assetMap: exact url -> flattened file (from prepare_manifest.json
  // assetDiscovery). __assetFiles: all files present in the widget dir.
  g.__assetMap = g.__assetMap || {};
  g.__assetFiles = g.__assetFiles || [];
  function __normAssetPath(p) {
    // Resolve '.' / '..' segments (GLTF sibling refs like
    // 'models/gltf/./embedded-0.png' or 'a/./../b/x.bin') before flattening.
    var segs = String(p).split('/'), out = [];
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      if (s === '' || s === '.') continue;
      if (s === '..') { if (out.length) out.pop(); continue; }
      out.push(s);
    }
    return out.join('/');
  }
  g.__resolveAssetPath = function (url) {
    url = String(url).split('#')[0].split('?')[0];
    if (url.slice(0, 5) === 'data:') return null;
    url = __normAssetPath(url);
    if (Object.prototype.hasOwnProperty.call(g.__assetMap, url)) return g.__assetMap[url];
    var flat = url.replace(/\//g, '__');
    if (g.__assetFiles.indexOf(flat) >= 0) return flat;
    var base = url.split('/').pop();
    if (g.__assetFiles.indexOf(base) >= 0) return base;
    return flat;
  };

  // ---- fetch / Request / Headers / AbortController (FileLoader stack) -----
  g.Headers = function (init) { this.get = function () { return null; }; this.has = function () { return false; }; };
  g.AbortSignal = { any: function (signals) { return { aborted: false, addEventListener: function () {}, removeEventListener: function () {} }; } };
  g.AbortController = function () {
    this.signal = { aborted: false, addEventListener: function () {}, removeEventListener: function () {} };
    this.abort = function () { this.signal.aborted = true; };
  };
  g.Request = function (url, opts) { this.url = String(url); this.headers = (opts && opts.headers) || {}; this.credentials = (opts && opts.credentials) || 'same-origin'; this.signal = (opts && opts.signal) || null; this.method = (opts && opts.method) || 'GET'; };

  function __normalizeRaw(raw) {
    if (raw == null) return null;
    if (typeof raw === 'string') return g.__b64toBytes(raw);
    if (raw instanceof Uint8Array) return raw;
    if (raw.buffer) return new Uint8Array(raw.buffer, raw.byteOffset || 0, raw.byteLength);
    return null;
  }

  var __blobRegistry = {}, __blobSeq = 0;
  if (typeof g.URL !== 'function') {
    // Minimal URL (DRACOLoader builds decoder URLs; never fetched for our
    // non-draco assets). Resolves relative refs against a synthetic base.
    function __resolveUrl(url, base) {
      url = String(url);
      if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) return url;
      base = base ? String(base) : 'file:///corpus/scene/';
      var q = base.split('#')[0].split('?')[0];
      var proto = '', pathPart = q;
      var pm = /^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/)(.*)$/.exec(q);
      if (pm) { proto = pm[1]; pathPart = pm[2]; }
      if (url.charAt(0) === '/') return proto + url;
      var segs = pathPart.split('/');
      segs.pop();
      url.split('/').forEach(function (s) {
        if (s === '' || s === '.') return;
        if (s === '..') segs.pop();
        else segs.push(s);
      });
      return proto + segs.join('/');
    }
    var __urlCtor = function URL(url, base) { this.href = __resolveUrl(url, base); };
    __urlCtor.prototype.toString = function () { return this.href; };
    __urlCtor.createObjectURL = function (blob) {
      var u = 'blob:corpus-' + (++__blobSeq);
      __blobRegistry[u] = blob;
      return u;
    };
    __urlCtor.revokeObjectURL = function (u) { delete __blobRegistry[u]; };
    def('URL', __urlCtor);
  } else if (!g.URL.createObjectURL) {
    g.URL.createObjectURL = function (blob) {
      var u = 'blob:corpus-' + (++__blobSeq);
      __blobRegistry[u] = blob;
      return u;
    };
    g.URL.revokeObjectURL = function (u) { delete __blobRegistry[u]; };
  }

  g.Blob = function (parts, opts) {
    this.type = (opts && opts.type) || '';
    var chunks = [];
    (parts || []).forEach(function (p) {
      if (p == null) return;
      if (typeof p === 'string') chunks.push(g.__textToBytes(p));
      else if (p instanceof Uint8Array) chunks.push(p);
      else if (p instanceof ArrayBuffer) chunks.push(new Uint8Array(p));
      else if (ArrayBuffer.isView && ArrayBuffer.isView(p)) chunks.push(new Uint8Array(p.buffer, p.byteOffset || 0, p.byteLength));
      else if (p.buffer) chunks.push(new Uint8Array(p.buffer, p.byteOffset || 0, p.byteLength));
    });
    var total = 0; chunks.forEach(function (c) { total += c.length; });
    var all = new Uint8Array(total), o = 0;
    chunks.forEach(function (c) { all.set(c, o); o += c.length; });
    this.__bytes = all; this.size = total;
    this.arrayBuffer = function () { var b = this.__bytes; return Promise.resolve(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
    this.text = function () { return Promise.resolve(g.__bytesToText(this.__bytes)); };
  };

  function __makeResponse(url, bytes, path) {
    return {
      status: 200, statusText: 'OK', ok: true, url: url,
      headers: { get: function () { return null; }, has: function () { return false; } },
      body: undefined,
      __bytes: bytes, __path: path,
      arrayBuffer: function () { var b = bytes; return Promise.resolve(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); },
      text: function () { return Promise.resolve(g.__bytesToText(bytes)); },
      json: function () { return Promise.resolve(JSON.parse(g.__bytesToText(bytes))); },
      blob: function () { return Promise.resolve(new g.Blob([bytes])); },
      clone: function () { return __makeResponse(url, bytes, path); }
    };
  }

  g.fetch = function (input, opts) {
    return g.__corpusTrackAsync(__fetchInner(input, opts));
  };
  function __fetchInner(input, opts) {
    var url = typeof input === 'string' ? input : input.url;
    return Promise.resolve().then(function () {
      if (Object.prototype.hasOwnProperty.call(__blobRegistry, url)) {
        var regBlob = __blobRegistry[url];
        var resp = __makeResponse(url, regBlob.__bytes, null);
        // Preserve the registered blob (mime type + bytes) for response.blob().
        resp.blob = function () { return Promise.resolve(new g.Blob([regBlob.__bytes], { type: regBlob.type })); };
        return resp;
      }
      if (String(url).slice(0, 5) === 'data:') {
        var comma = String(url).indexOf(',');
        return __makeResponse(url, g.__b64toBytes(String(url).slice(comma + 1)), null);
      }
      var path = g.__resolveAssetPath(url);
      var raw = g.__assetReadRaw(path);
      if (raw && typeof raw.then === 'function') {
        return raw.then(function (r) { return __finish(url, path, r); });
      }
      return __finish(url, path, raw);
    });
    function __finish(url, path, raw) {
      var bytes = __normalizeRaw(raw);
      if (!bytes) throw new Error('corpus: asset not found: ' + url + ' (resolved: ' + path + ')');
      return __makeResponse(url, bytes, path);
    }
  };

  // ---- image decode -------------------------------------------------------
  // Result shape: { width, height, dataB64? | data } — data = RGBA8 top-down,
  // unpremultiplied, sRGB bytes.
  function __flipRGBA(img) {
    if (img.__flipped || !img.data) return img;
    var w = img.width, h = img.height, d = img.data;
    var row = new Uint8Array(w * 4);
    for (var y = 0; y < (h >> 1); y++) {
      var a = y * w * 4, b = (h - 1 - y) * w * 4;
      row.set(d.subarray(a, a + w * 4), 0);
      d.set(d.subarray(b, b + w * 4), a);
      d.set(row, b);
    }
    img.__flipped = true;
    return img;
  }
  g.__decodeImage = function (pathOrBytes, mimeType, flipY) {
    var p = (pathOrBytes instanceof Uint8Array || (pathOrBytes && pathOrBytes.buffer))
      ? g.__decodeImageFromBytes(g.__bytesToB64(pathOrBytes), mimeType)
      : g.__decodeImageFromPath(pathOrBytes);
    return Promise.resolve(p).then(function (img) {
      if (!img) throw new Error('corpus: image decode failed: ' + (mimeType || pathOrBytes));
      if (img.dataB64) img.data = g.__b64toBytes(img.dataB64);
      if (flipY) __flipRGBA(img);
      return img;
    });
  };

  g.ImageData = function (data, width, height) { this.data = data; this.width = width; this.height = height; };
  g.ImageBitmap = function (img) { this.data = img.data; this.width = img.width; this.height = img.height; this.close = function () {}; };
  g.createImageBitmap = function (blob, opts) {
    opts = opts || {};
    // Web: decode with the REAL Chrome pipeline (native Blob → native
    // createImageBitmap) so texImage2D accepts the result and the decoded
    // pixels are genuine ground truth. 1B: software-decoded stub carrying
    // RGBA .data for the facade upload path.
    if (IS_WEB) {
      var bytes0 = blob && blob.__bytes ? blob.__bytes : blob;
      var mime0 = (blob && blob.type) || '';
      return g.__corpusTrackAsync(window.__nativeCreateImageBitmap(new window.__nativeBlob([bytes0], { type: mime0 }), opts));
    }
    return g.__corpusTrackAsync(new Promise(function (resolve, reject) {
      // The blob may be a fetch response body carrying __path, or raw bytes.
      var bytes = blob && blob.__bytes ? blob.__bytes : blob;
      g.__decodeImage(bytes, (blob && blob.type) || 'image/png', opts.imageOrientation === 'flipY')
        .then(function (img) { resolve(new g.ImageBitmap(img)); })
        .catch(function (e) { __errors.push(String(e && e.stack ? e.stack : e)); reject(e); });
    }));
  };

  // ---- DOM ---------------------------------------------------------------
  function makeDiv(tag) {
    var listeners = {};
    var el = {
      tagName: String(tag || 'div').toUpperCase(),
      style: {},
      dataset: {},
      children: [],
      parentNode: null,
      width: 0, height: 0,
      clientWidth: 320, clientHeight: 240,
      offsetWidth: 320, offsetHeight: 240,
      scrollWidth: 320, scrollHeight: 240,
      clientLeft: 0, clientTop: 0, offsetLeft: 0, offsetTop: 0,
      getBoundingClientRect: function () { return { left: 0, top: 0, right: 320, bottom: 240, width: 320, height: 240, x: 0, y: 0 }; },
      appendChild: function (c) { if (c) { c.parentNode = el; el.children.push(c); } return c; },
      insertBefore: function (c) { if (c) { c.parentNode = el; el.children.push(c); } return c; },
      removeChild: function (c) { var i = el.children.indexOf(c); if (i >= 0) el.children.splice(i, 1); return c; },
      remove: function () {},
      addEventListener: function (t, fn) { (listeners[t] = listeners[t] || []).push(fn); },
      removeEventListener: function (t, fn) { var a = listeners[t]; if (a) { var i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); } },
      dispatchEvent: function (ev) { var a = listeners[ev.type] || []; for (var i = 0; i < a.length; i++) a[i].call(el, ev); return true; },
      // <canvas id=...> looked up via getElementById and generic divs used as
      // render targets (multiple-elements) both reach getContext through the
      // stub element, not makeCanvas.
      getContext: function (type, attrs) {
        if (type === 'webgl2' || type === 'webgl') {
          if (!el.__gl2) {
            if (IS_WEB) {
              // Hand out a REAL canvas context (same sanction as makeCanvas).
              el.__glReal = el.__glReal || g.__nativeCreateElementNS('http://www.w3.org/1999/xhtml', 'canvas');
              el.__gl2 = el.__glReal.getContext(type, attrs);
            } else {
              el.__gl2 = g.AngleWebGL2Facade.createFacade(el, attrs || {});
            }
          }
          return el.__gl2;
        }
        if (type === '2d') { if (!el.__2d) el.__2d = make2dContext(el); return el.__2d; }
        return null;
      },
      // Media-element surface used by the video examples (play/pause, no-op;
      // VideoTexture samples width/height 0 — same on both sides).
      play: function () { el.paused = false; return Promise.resolve(); },
      pause: function () { el.paused = true; },
      load: function () {},
      canPlayType: function () { return ''; },
      requestVideoFrameCallback: function () { return 0; },
      paused: true, muted: false, loop: false, autoplay: false,
      currentTime: 0, duration: 0, readyState: 0, volume: 1,
      videoWidth: 0, videoHeight: 0,
      offsetWidth: 320, offsetHeight: 240, scrollTop: 0,
      setAttribute: function () {}, getAttribute: function () { return null; }, hasAttribute: function () { return false; },
      getRootNode: function () { return g.document; },
      getBoundingClientRect: function () { return { left: 0, top: 0, right: 320, bottom: 240, width: 320, height: 240, x: 0, y: 0 }; },
      focus: function () {}, blur: function () {},
      querySelector: function () { return null; }, querySelectorAll: function () { return []; },
      getElementsByTagName: function () { return []; },
      classList: { add: function () {}, remove: function () {}, toggle: function () {}, contains: function () { return false; } },
      ownerDocument: null,
      textContent: '', innerHTML: '',
      get firstChild() { return el.children[0] || null; }
    };
    el.ownerDocument = g.document;
    return el;
  }

  function __sniffMimeBytes(bytes) {
    if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
    if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
    if (bytes.length > 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif';
    if (bytes.length > 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) return 'image/bmp';
    return 'image/png';
  }
  function makeImage() {
    // Web: a REAL Image element fed through a data: URL — native Chrome
    // decode, natively accepted by texImage2D, genuine ground truth. The
    // virtual-asset indirection only rewrites src; load/error events fire
    // natively. 1B: stub img carrying decoded RGBA .data for the facade.
    if (IS_WEB) {
      var real = g.__nativeCreateElementNS('http://www.w3.org/1999/xhtml', 'img');
      var srcDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
      var currentSrc = '';
      Object.defineProperty(real, 'src', {
        configurable: true,
        get: function () { return currentSrc; },
        set: function (url) {
          currentSrc = String(url);
          var path = g.__resolveAssetPath(currentSrc);
          Promise.resolve(g.__assetReadRaw(path)).then(function (raw) {
            if (raw == null) {
              real.dispatchEvent(new g.Event('error'));
              return;
            }
            var bytes = typeof raw === 'string' ? g.__b64toBytes(raw) : raw;
            srcDesc.set.call(real, 'data:' + __sniffMimeBytes(bytes) + ';base64,' + g.__bytesToB64(bytes));
          }, function () { real.dispatchEvent(new g.Event('error')); });
        }
      });
      return real;
    }
    var img = makeDiv('img');
    img.complete = false;
    img.crossOrigin = null;
    var _src = '';
    Object.defineProperty(img, 'src', {
      get: function () { return _src; },
      set: function (url) {
        _src = url;
        // GLTFLoader materializes embedded textures as blob: URLs
        // (URL.createObjectURL over our Blob stub); decode those bytes
        // directly from the registry instead of hitting the asset host.
        if (String(url).slice(0, 5) === 'blob:' && __blobRegistry[url]) {
          Promise.resolve().then(function () {
            return g.__decodeImage(__blobRegistry[url].__bytes, __blobRegistry[url].type, false);
          }).then(function (decoded) {
            img.width = decoded.width; img.height = decoded.height;
            img.data = decoded.data; img.naturalWidth = decoded.width; img.naturalHeight = decoded.height;
            img.complete = true;
            img.dispatchEvent({ type: 'load', target: img });
          }, function () {
            img.dispatchEvent({ type: 'error', target: img });
          });
          return;
        }
        var path = g.__resolveAssetPath(url);
        Promise.resolve().then(function () {
          return g.__decodeImage(path, null, false);
        }).then(function (decoded) {
          img.width = decoded.width; img.height = decoded.height;
          img.data = decoded.data; img.naturalWidth = decoded.width; img.naturalHeight = decoded.height;
          img.complete = true;
          img.dispatchEvent({ type: 'load', target: img });
        }).catch(function (e) {
          img.dispatchEvent({ type: 'error', target: img, error: e });
        });
      }
    });
    return img;
  }
  if (!g.Image) def('Image', function Image() { return makeImage(); });

  // ---- software 2D canvas context ------------------------------------------
  // Examples generate textures via 2D canvas (fillRect etc.). A tiny
  // deterministic software rasterizer covers the upstream ops; pixels are
  // exposed as canvas.data (RGBA8, row-major) so three's texture upload path
  // (texStorage2D + texSubImage2D with image.data) is identical on both sides.
  function __parseColor(style, fallback) {
    if (typeof style !== 'string') return fallback;
    var s = style.trim().toLowerCase();
    var named = { black: [0, 0, 0, 255], white: [255, 255, 255, 255], red: [255, 0, 0, 255], green: [0, 128, 0, 255], lime: [0, 255, 0, 255], blue: [0, 0, 255, 255], yellow: [255, 255, 0, 255], cyan: [0, 255, 255, 255], magenta: [255, 0, 255, 255], gray: [128, 128, 128, 255], grey: [128, 128, 128, 255], orange: [255, 165, 0, 255], purple: [128, 0, 128, 255], transparent: [0, 0, 0, 0] };
    if (named[s]) return named[s];
    var m = /^#([0-9a-f]{3})$/.exec(s);
    if (m) return [parseInt(m[1][0] + m[1][0], 16), parseInt(m[1][1] + m[1][1], 16), parseInt(m[1][2] + m[1][2], 16), 255];
    m = /^#([0-9a-f]{6})$/.exec(s);
    if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16), 255];
    m = /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)$/.exec(s);
    if (m) return [Math.round(Number(m[1])), Math.round(Number(m[2])), Math.round(Number(m[3])), m[4] === undefined ? 255 : Math.round(Number(m[4]) * 255)];
    return fallback;
  }
  function make2dContext(el) {
    var ctx = {
      canvas: el,
      fillStyle: '#000000',
      strokeStyle: '#000000',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      imageSmoothingEnabled: true,
      _ensure: function () {
        var w = el.width | 0 || 1, h = el.height | 0 || 1;
        if (!el.data || el.__w !== w || el.__h !== h) {
          el.data = new Uint8ClampedArray(w * h * 4);
          el.__w = w; el.__h = h;
        }
        return el.data;
      },
      fillRect: function (x, y, w, h) {
        var px = ctx._ensure(), cw = el.__w, ch = el.__h;
        var c = __parseColor(ctx.fillStyle, [0, 0, 0, 255]);
        var x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y));
        var x1 = Math.min(cw, Math.ceil(x + w)), y1 = Math.min(ch, Math.ceil(y + h));
        for (var yy = y0; yy < y1; yy++) for (var xx = x0; xx < x1; xx++) {
          var o = (yy * cw + xx) * 4;
          px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = c[3];
        }
      },
      clearRect: function (x, y, w, h) {
        var px = ctx._ensure(), cw = el.__w, ch = el.__h;
        var x0 = Math.max(0, Math.floor(x)), y0 = Math.max(0, Math.floor(y));
        var x1 = Math.min(cw, Math.ceil(x + w)), y1 = Math.min(ch, Math.ceil(y + h));
        for (var yy = y0; yy < y1; yy++) for (var xx = x0; xx < x1; xx++) {
          var o = (yy * cw + xx) * 4;
          px[o] = px[o + 1] = px[o + 2] = px[o + 3] = 0;
        }
      },
      getImageData: function (x, y, w, h) {
        ctx._ensure();
        var out = new Uint8ClampedArray(w * h * 4), cw = el.__w;
        for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
          var so = (((y + yy)) * cw + (x + xx)) * 4, dofs = (yy * w + xx) * 4;
          out[dofs] = el.data[so]; out[dofs + 1] = el.data[so + 1]; out[dofs + 2] = el.data[so + 2]; out[dofs + 3] = el.data[so + 3];
        }
        return { data: out, width: w, height: h };
      },
      putImageData: function (imageData, dx, dy) {
        ctx._ensure();
        var cw = el.__w, d = imageData.data, w = imageData.width, h = imageData.height;
        for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) {
          var so = (yy * w + xx) * 4, dofs = (((dy + yy)) * cw + (dx + xx)) * 4;
          el.data[dofs] = d[so]; el.data[dofs + 1] = d[so + 1]; el.data[dofs + 2] = d[so + 2]; el.data[dofs + 3] = d[so + 3];
        }
      },
      createRadialGradient: function () { return { addColorStop: function () {} }; },
      createLinearGradient: function () { return { addColorStop: function () {} }; },
      createPattern: function () { return null; },
      drawImage: function (img, dx, dy, dw, dh) {
        if (!img || !img.data) return;
        ctx._ensure();
        var cw = el.__w, sw = img.width, sh = img.height;
        dw = dw === undefined ? sw : dw; dh = dh === undefined ? sh : dh;
        for (var yy = 0; yy < dh; yy++) for (var xx = 0; xx < dw; xx++) {
          var sx = Math.floor(xx * sw / dw), sy = Math.floor(yy * sh / dh);
          var so = (sy * sw + sx) * 4, dofs = (((dy + yy)) * cw + (dx + xx)) * 4;
          el.data[dofs] = img.data[so]; el.data[dofs + 1] = img.data[so + 1]; el.data[dofs + 2] = img.data[so + 2]; el.data[dofs + 3] = img.data[so + 3];
        }
      },
      beginPath: function () {}, closePath: function () {}, moveTo: function () {}, lineTo: function () {},
      arc: function () {}, rect: function () {}, fill: function () {}, stroke: function () {}, clip: function () {},
      save: function () {}, restore: function () {}, translate: function () {}, scale: function () {}, rotate: function () {},
      setTransform: function () {}, resetTransform: function () {}, measureText: function () { return { width: 0 }; },
      fillText: function () {}, strokeText: function () {}, drawFocusIfNeeded: function () {},
      // CanvasTexture scenes draw into 2D canvases; the stub raster is
      // empty but the API surface must exist (web side draws for real).
      beginPath: function () {}, closePath: function () {}, moveTo: function () {}, lineTo: function () {},
      quadraticCurveTo: function () {}, bezierCurveTo: function () {}, ellipse: function () {},
      fillRect: function () {}, clearRect: function () {}, strokeRect: function () {},
      drawImage: function () {}, putImageData: function () {},
      getImageData: function (x, y, w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; },
      createImageData: function (w, h) { return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }; },
      createLinearGradient: function () { return { addColorStop: function () {} }; },
      createRadialGradient: function () { return { addColorStop: function () {} }; },
      createPattern: function () { return {}; }
    };
    return ctx;
  }

  function makeCanvas() {
    // Web side: hand out a REAL canvas (the driver captures the native
    // createElementNS and wraps getContext for preserveDrawingBuffer). 1B
    // side: build the stub canvas backed by AngleWebGL2Facade.
    if (g.__nativeCreateElementNS) {
      var real = g.__nativeCreateElementNS('http://www.w3.org/1999/xhtml', 'canvas');
      real.width = 300; real.height = 150;
      real.toDataURL = real.toDataURL || function () { return 'data:,'; };
      var nativeGetCtx = real.getContext.bind(real);
      real.getContext = function (type, attrs) {
        if (type === 'webgl2' || type === 'webgl') {
          // Stash the RENDER canvas here (first webgl context), not the
          // first canvas: scenes may create 2D canvases (CanvasTexture)
          // before the renderer.
          if (!g.__sceneCanvas) g.__sceneCanvas = real;
          return nativeGetCtx(type, attrs);
        }
        if (type === '2d') { if (!real.__2d) real.__2d = make2dContext(real); return real.__2d; }
        return null;
      };
      return real;
    }
    var canvas = makeDiv('canvas');
    canvas.width = 300; canvas.height = 150;
    canvas.getContext = function (type, attrs) {
      if (type === 'webgl2' || type === 'webgl') {
        if (!canvas.__gl2) canvas.__gl2 = g.AngleWebGL2Facade.createFacade(canvas, attrs || {});
        return canvas.__gl2;
      }
      if (type === '2d') { if (!canvas.__2d) canvas.__2d = make2dContext(canvas); return canvas.__2d; }
      return null;
    };
    canvas.toDataURL = function () { return 'data:,'; };
    return canvas;
  }

  function createElementFor(tag) {
    tag = String(tag || 'div').toLowerCase();
    if (tag === 'canvas') return makeCanvas();
    if (tag === 'img') return makeImage();
    return makeDiv(tag);
  }

  // ---- DOMParser stub (1B only; Chrome provides the real one) -------------
  // Minimal regex-backed XML facade: enough for UltraHDRLoader XMP metadata
  // (flat rdf:Description / Container:Directory getElementsByTagName +
  // getAttribute). Deep XML consumers (Collada/SVG/AMF DOM walks) still
  // fail later with their own error; tolerated by design.
  if (!g.DOMParser) def('DOMParser', function DOMParser() {
    this.parseFromString = function (text, mime) {
      text = String(text == null ? '' : text);
      function attrsOf(attrText) {
        var m, map = {}, re = /([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
        while ((m = re.exec(attrText))) map[m[1]] = m[3] !== undefined ? m[3] : m[4];
        return map;
      }
      function makeNode(name, attrText) {
        var attrs = attrsOf(attrText || '');
        return {
          nodeName: name, tagName: name, attributes: attrs,
          getAttribute: function (n) { return Object.prototype.hasOwnProperty.call(attrs, n) ? attrs[n] : null; },
          hasAttribute: function (n) { return Object.prototype.hasOwnProperty.call(attrs, n); },
          textContent: '', childNodes: [], children: [],
          getElementsByTagName: function () { return []; },
          getElementsByTagNameNS: function () { return []; }
        };
      }
      return {
        documentElement: null,
        getElementsByTagName: function (name) {
          var out = [], re = new RegExp('<' + name + '\\b([^>]*)>', 'g'), m;
          while ((m = re.exec(text))) out.push(makeNode(name, m[1]));
          return out;
        },
        getElementsByTagNameNS: function () { return []; },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; }
      };
    };
  });

  var __byId = {};
  var __stubDocument = {
    createElementNS: function (ns, tag) { return createElementFor(tag); },
    createElement: function (tag) { return createElementFor(tag); },
    createTextNode: function (t) { return makeDiv('#text'); },
    getElementById: function (id) {
      if (!__byId[id]) {
        __byId[id] = makeDiv('div');
        __byId[id].id = id;
        if (g.__htmlIdText && Object.prototype.hasOwnProperty.call(g.__htmlIdText, id)) {
          __byId[id].textContent = g.__htmlIdText[id];
        }
      }
      return __byId[id];
    },
    querySelector: function (sel) {
      // Auto-vivify for ANY selector (not just #id): scenes grab chrome like
      // '.slider' from the original page markup; a stub keeps both harnesses
      // identical (web driver routes through this same stub document).
      if (String(sel)[0] === '#') return __stubDocument.getElementById(String(sel).slice(1));
      var key = 'qs:' + String(sel);
      if (!__byId[key]) { __byId[key] = makeDiv('div'); }
      return __byId[key];
    },
    querySelectorAll: function () { return []; },
    getElementsByTagName: function () { return []; },
    addEventListener: function (t, fn) { g.addEventListener(t, fn); },
    removeEventListener: function (t, fn) { g.removeEventListener(t, fn); },
    hidden: false, visibilityState: 'visible', visibilitychange: null,
    readyState: 'complete',
    body: null, documentElement: null,
    createEvent: function () { return { initEvent: function () {} }; }
  };
  __stubDocument.body = makeDiv('body');
  if (IS_WEB) {
    // Augment the real document: own-property method shadows only. body
    // becomes a tolerant stub too — scene glue appends non-Node objects
    // (stats.dom is a plain object) and the 1B stub document accepts those;
    // the real body would throw 'parameter 1 is not of type Node'.
    g.document.createElementNS = __stubDocument.createElementNS;
    g.document.createElement = __stubDocument.createElement;
    g.document.getElementById = __stubDocument.getElementById;
    g.document.querySelector = __stubDocument.querySelector;
    try { Object.defineProperty(g.document, 'body', { value: __stubDocument.body, configurable: true }); } catch (eBody) {}
  } else {
    def('document', __stubDocument);
    try {
      g.document.body = makeDiv('body');
      g.document.documentElement = makeDiv('html');
      g.document.documentElement.style = {};
    } catch (eDoc) {}
  }
  var __container = makeDiv('div');
  __container.id = 'container';
  __byId['container'] = __container;

  // OffscreenCanvas not provided: loaders fall back to DOM image paths.

  // ---- animation loop capture --------------------------------------------
  g.requestAnimationFrame = function (cb) { __raf = cb; return 1; };
  g.cancelAnimationFrame = function (id) {};
  g.queueMicrotask = g.queueMicrotask || function (fn) { Promise.resolve().then(fn); };

  // ---- deterministic virtual-clock timers ---------------------------------
  // Scenes and three internals use setTimeout for async settle steps
  // (compileAsync's shader-status polling, GI accumulation steps, debounce).
  // Real timers are wall-clock and nondeterministic — and inside this shim
  // they previously never fired at all, hanging every consumer. Instead
  // schedule them on the pinned virtual clock (__now) advanced by
  // __corpusTick: callbacks fire only inside ticks, at most once per timer
  // per tick, so both tiers observe identical quantized timing.
  var __timerSeq = 1;
  var __vtimers = [];
  function __clearTimer(id) {
    for (var k = 0; k < __vtimers.length; k++) if (__vtimers[k].id === id) __vtimers[k].cleared = true;
  }
  function __runDueTimers() {
    for (var k = 0; k < __vtimers.length; k++) {
      var t = __vtimers[k];
      if (!t || t.cleared || t.at > __now) continue;
      if (t.interval > 0) {
        t.at += t.interval; // at most one firing per tick; no burst catch-up
        if (t.at <= __now) t.at = __now + 1;
      } else {
        t.cleared = true;
      }
      try { t.fn(); } catch (e) { __errors.push('timer: ' + String(e && e.stack ? e.stack : e)); }
    }
  }
  g.setTimeout = function (fn, ms) {
    var t = { id: __timerSeq++, at: __now + Math.max(0, ms || 0), fn: fn, interval: 0, cleared: false };
    __vtimers.push(t);
    return t.id;
  };
  g.setInterval = function (fn, ms) {
    var iv = Math.max(1, ms || 1);
    var t = { id: __timerSeq++, at: __now + iv, fn: fn, interval: iv, cleared: false };
    __vtimers.push(t);
    return t.id;
  };
  g.clearTimeout = function (id) { __clearTimer(id); };
  g.clearInterval = function (id) { __clearTimer(id); };

  // ---- pending-async accounting (web driver drain gate) -------------------
  // 1B drains by emptying the microtask queue; the web tier additionally
  // performs genuinely async native work (image decode). Count both so the
  // web driver can wait for settle before driving the pinned frames.
  var __pending = 0;
  g.__corpusPending = function () { return __pending; };
  g.__corpusTrackAsync = function (p) {
    __pending++;
    return Promise.resolve(p).then(function (v) { __pending--; return v; }, function (e) { __pending--; throw e; });
  };

  // Patch AFTER three is loaded (called from the scene driver):
  g.__corpusHookThree = function () {
    if (!g.THREE || !g.THREE.WebGLRenderer) return;
    g.THREE.WebGLRenderer.prototype.setAnimationLoop = function (cb) { __loop = cb; };
  };
})();
