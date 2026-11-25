// bench_1b.dart — PERF-1 / PERF-2 / IT-TRANSPORT-1 / E2E-RAWGL-1 (issue #7,
// F2 batching row, plan 4.4): the REAL full 1B stack on this machine —
// QuickJS -> real facade (BATCHING ON) -> generated packer -> FFI ->
// a1b_gl_dispatch (batched wire) -> pinned ANGLE Metal — measured.
//
// Phases:
//   raw GL fixture (E2E-RAWGL-1): clear-to-red + green triangle through the
//     facade; the JS-side gl.readPixels FNV must equal the FNV of the SAME
//     recorded batch bytes replayed directly through the C decoder on a fresh
//     surface (transport equivalence), and the pixels must be the drawn ones.
//   bench (PERF-1/PERF-2): N frames of 500 void draw calls. Every frame is
//     one `rt.eval` — the runtime drains the facade's flush microtask inside
//     the call, so the stopwatch covers encode + transport + native submit.
//
// Prints (machine-checkable lines):
//   BENCH_FLUSHES_PER_FRAME <n>
//   BENCH_P50_MS <x>   BENCH_P95_MS <x>   BENCH_P99_MS <x>
//   RAWGL_MATCH <true|false>  RAWGL_FACADE_HASH 0x...  RAWGL_DIRECT_HASH 0x...
// Exit 0 iff flushes per frame <= 1, p95 <= 4.0 ms and RAWGL_MATCH true.
//
// Library use: the perf/e2e tests (test/angle1b/perf_1_test.dart,
// perf_2_test.dart, it_transport_1_test.dart and the package e2e_rawgl test)
// import this file and call [run1bBench] / [run1bRawGlFixture] directly.
// Run from the repo root: dart run tool/three/bench_1b.dart
import 'dart:convert';
import 'dart:ffi' as ffi;
import 'dart:io';
import 'dart:typed_data';

import 'package:ffi/ffi.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

const kW = 64, kH = 64;
const kFrames = 60;
const kDrawsPerFrame = 500;
const kP95BudgetMs = 4.0;

class Shim {
  Shim() {
    lib = ffi.DynamicLibrary.open(_resolveLib());
  }

  late final ffi.DynamicLibrary lib;

  /// Null when a libangle_1b build was found, else the reason (test skip).
  static String? resolveProblem() {
    try {
      _resolveLib();
      return null;
    } catch (e) {
      return '$e';
    }
  }

  static String _resolveLib() {
    final candidates = <String>[
      if (Platform.environment['JSR_ANGLE_1B_LIB'] != null)
        Platform.environment['JSR_ANGLE_1B_LIB']!,
      'packages/jsr_three_angle/native/angle/libangle_1b.dylib',
      'packages/jsr_three_angle/native/angle/out/macos-arm64/libangle_1b.dylib',
    ];
    for (final c in candidates) {
      if (File(c).existsSync()) return c;
    }
    throw StateError(
      'libangle_1b.dylib not found (tried ${candidates.join(', ')}); '
      'run bash packages/jsr_three_angle/native/angle/build.sh',
    );
  }

  late final int Function() init = lib
      .lookupFunction<ffi.Int32 Function(), int Function()>('a1b_init');
  late final int Function(int, int, ffi.Pointer<ffi.Uint32>) createSurface = lib
      .lookupFunction<
        ffi.Int64 Function(ffi.Int32, ffi.Int32, ffi.Pointer<ffi.Uint32>),
        int Function(int, int, ffi.Pointer<ffi.Uint32>)
      >('a1b_create_surface');
  late final int Function(int) makeCurrent = lib
      .lookupFunction<ffi.Int32 Function(ffi.Int64), int Function(int)>(
        'a1b_make_current',
      );
  late final int Function(int) swapBuffers = lib
      .lookupFunction<ffi.Int32 Function(ffi.Int64), int Function(int)>(
        'a1b_swap_buffers',
      );
  late final int Function(
    int,
    ffi.Pointer<ffi.Uint8>,
    ffi.Pointer<ffi.Int32>,
    ffi.Pointer<ffi.Int32>,
  )
  readPixels = lib
      .lookupFunction<
        ffi.Int32 Function(
          ffi.Int64,
          ffi.Pointer<ffi.Uint8>,
          ffi.Pointer<ffi.Int32>,
          ffi.Pointer<ffi.Int32>,
        ),
        int Function(
          int,
          ffi.Pointer<ffi.Uint8>,
          ffi.Pointer<ffi.Int32>,
          ffi.Pointer<ffi.Int32>,
        )
      >('a1b_read_pixels');
  late final void Function(int) destroySurface = lib
      .lookupFunction<ffi.Void Function(ffi.Int64), void Function(int)>(
        'a1b_destroy_surface',
      );
  late final void Function() shutdown = lib
      .lookupFunction<ffi.Void Function(), void Function()>('a1b_shutdown');
  late final int Function(ffi.Pointer<ffi.Uint8>, int) dispatch = lib
      .lookupFunction<
        ffi.Int64 Function(ffi.Pointer<ffi.Uint8>, ffi.Int32),
        int Function(ffi.Pointer<ffi.Uint8>, int)
      >('a1b_gl_dispatch');
}

int fnv1a(List<int> bytes) {
  var h = 2166136261;
  for (final b in bytes) {
    h ^= b;
    h = (h * 16777619) & 0xFFFFFFFF;
  }
  return h;
}

/// Reads the `a1b_gl_result` scratch of the current surface (the data lane
/// the facade's data-returning calls consume as `__jsr1b_result` base64).
Uint8List readGlScratch(ffi.DynamicLibrary lib) {
  final result = lib
      .lookupFunction<
        ffi.Int32 Function(ffi.Pointer<ffi.Uint8>, ffi.Int32),
        int Function(ffi.Pointer<ffi.Uint8>, int)
      >('a1b_gl_result');
  final len = result(ffi.Pointer.fromAddress(0), 0);
  if (len <= 0) return Uint8List(0);
  final buf = calloc<ffi.Uint8>(len);
  try {
    final n = result(buf, len);
    return Uint8List.fromList(buf.asTypedList(n).toList());
  } finally {
    calloc.free(buf);
  }
}

String hex32(int v) => '0x${v.toRadixString(16).padLeft(8, '0')}';

/// One full pipeline: QuickJS with the real (batching) facade over real ANGLE.
class _Session {
  _Session(this.shim, this.surface) {
    rt = QuickjsRuntime();
    final ok = rt.registerHostBytesFn('__jsr1b_gl_bytes', (name, data) {
      dispatchCount++;
      if (record) {
        recorded.add(Uint8List.fromList(data)); // the view is call-scoped
      }
      final buf = calloc<ffi.Uint8>(data.length);
      try {
        buf.asTypedList(data.length).setAll(0, data);
        lastRc = shim.dispatch(buf, data.length);
      } finally {
        calloc.free(buf);
      }
    });
    if (!ok) throw StateError('the QuickJS bridge lacks the bytes lane');
    rt.registerHostFunction('__jsr1b_gl_rc', (_) => '$lastRc');
    rt.registerHostFunction('__jsr1b_result_host',
        (_) => jsonEncode(base64Encode(readScratch())));
  }

  final Shim shim;
  final int surface;
  late final QuickjsRuntime rt;
  int dispatchCount = 0;
  int lastRc = 0;
  bool record = false;
  final List<Uint8List> recorded = [];

  String? evalJs(String code, [String name = 'bench.js']) {
    final err = <String?>[];
    final r = rt.eval(code, filename: name, errMsg: err);
    if (err.isNotEmpty && err.first != null) {
      throw StateError('eval $name failed: ${err.first}');
    }
    err.clear();
    return r;
  }

  /// Reads the `a1b_gl_result` scratch of the current surface (shared with
  /// the engine-level real wire host in test/support/three_1b_real_wire.dart).
  Uint8List readScratch() => readGlScratch(shim.lib);

  void close() => rt.close();
}

// ---- JS: DOM shims + wire glue, then the raw GL fixture + bench frames ----
const String preludeJs = r'''
(function () {
  var g = globalThis;
  var listeners = {};
  function makeCanvas() {
    var c = {
      width: 300, height: 150, style: {}, dataset: {},
      addEventListener: function (t, fn) { (listeners[t] = listeners[t] || []).push(fn); },
      removeEventListener: function () {},
      setAttribute: function () {}, hasAttribute: function () { return false; },
      getAttribute: function () { return null; },
      getContext: function (type, attrs) {
        if (type !== 'webgl2' && type !== 'webgl') return null;
        if (!c.__gl2) c.__gl2 = AngleWebGL2Facade.createFacade(c, attrs || {});
        return c.__gl2;
      }
    };
    return c;
  }
  g.document = {
    createElement: function (tag) { return makeCanvas(); },
    createElementNS: function (ns, tag) { return makeCanvas(); },
    addEventListener: function () {}, removeEventListener: function () {},
    hidden: false, visibilityState: 'visible',
    body: { appendChild: function () {} },
    documentElement: { style: {} }
  };
  var B64 = '';
  for (var ci = 65; ci <= 90; ci++) B64 += String.fromCharCode(ci);
  for (var ci = 97; ci <= 122; ci++) B64 += String.fromCharCode(ci);
  for (var ci = 48; ci <= 57; ci++) B64 += String.fromCharCode(ci);
  B64 += '+/';
  g.atob = function (input) {
    var str = String(input).replace(/=+$/, '');
    var out = '';
    for (var i = 0; i < str.length; i += 4) {
      var c0 = B64.indexOf(str[i]);
      var c1 = B64.indexOf(str[i + 1]);
      var c2 = i + 2 < str.length ? B64.indexOf(str[i + 2]) : 0;
      var c3 = i + 3 < str.length ? B64.indexOf(str[i + 3]) : 0;
      var n = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
      out += String.fromCharCode((n >> 16) & 255);
      if (i + 2 < str.length) out += String.fromCharCode((n >> 8) & 255);
      if (i + 3 < str.length) out += String.fromCharCode(n & 255);
    }
    return out;
  };
  g.__jsr1b_gl = function (bytes) {
    __jsr1b_gl_bytes('g1', bytes);
    return __jsr1b_gl_rc();
  };
  g.__jsr1b_result = function () {
    return __jsr1b_result_host();
  };
})();
''';

const String setupJs = r'''
globalThis.__benchOk = (function () {
  try {
    var canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    var gl = canvas.getContext('webgl2', { antialias: false, depth: false });
    if (!gl) return 'no webgl2 context';
    function sh(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error('compile: ' + gl.getShaderInfoLog(s));
      }
      return s;
    }
    var vs = sh(gl.VERTEX_SHADER, 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }');
    var fs = sh(gl.FRAGMENT_SHADER, 'precision mediump float; void main() { gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); }');
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error('link: ' + gl.getProgramInfoLog(prog));
    }
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.0, 0.5]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, 64, 64);
    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    // One bench frame: clear + n void draws. NO data-returning call, so the
    // facade flushes exactly once at the end-of-task microtask.
    globalThis.__benchFrame = function (n) {
      gl.clear(gl.COLOR_BUFFER_BIT);
      for (var i = 0; i < n; i++) gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    // One rendered frame + readback through the facade's gl.readPixels.
    globalThis.__benchRender = function () {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      var px = new Uint8Array(64 * 64 * 4);
      gl.readPixels(0, 0, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, px);
      var h = 2166136261 >>> 0;
      for (var i = 0; i < px.length; i++) {
        h = (h ^ px[i]) >>> 0; h = Math.imul(h, 16777619) >>> 0;
      }
      var c = (32 * 64 + 32) * 4;
      return {
        hash: h >>> 0,
        center: [px[c], px[c + 1], px[c + 2], px[c + 3]],
        corner: [px[0], px[1], px[2], px[3]]
      };
    };
    return true;
  } catch (e) {
    return String(e && e.message ? e.message : e);
  }
})();
''';

/// Bench report of [run1bBench].
class BenchReport {
  BenchReport(this.frames, this.drawsPerFrame, this.flushesPerFrame, this.p50Ms,
      this.p95Ms, this.p99Ms);
  final int frames;
  final int drawsPerFrame;
  final int flushesPerFrame;
  final double p50Ms;
  final double p95Ms;
  final double p99Ms;

  bool get pass => flushesPerFrame <= 1 && p95Ms <= kP95BudgetMs;

  @override
  String toString() =>
      'frames=$frames draws=$drawsPerFrame flushes/frame=$flushesPerFrame '
      'p50=$p50Ms ms p95=$p95Ms ms p99=$p99Ms ms';
}

double _percentile(List<double> sortedMs, double q) {
  if (sortedMs.isEmpty) return 0;
  final idx = (q * (sortedMs.length - 1)).round();
  return sortedMs[idx];
}

/// Boots the stack once, runs [frames] frames of [draws] void draw calls and
/// returns the percentiles + the (max) flush count per frame.
Future<BenchReport> run1bBench({
  int frames = kFrames,
  int draws = kDrawsPerFrame,
  Shim? shim,
  int? surface,
}) async {
  final ownShim = shim ?? Shim();
  if (shim == null && ownShim.init() != 0) {
    throw StateError('a1b_init failed (set JSR_ANGLE_DIR for the dylib dir)');
  }
  final ownSurface = surface ??
      (() {
        final slot = calloc<ffi.Uint32>();
        try {
          final s = ownShim.createSurface(kW, kH, slot);
          if (s < 1) throw StateError('a1b_create_surface failed');
          return s;
        } finally {
          calloc.free(slot);
        }
      })();
  final session = _Session(ownShim, ownSurface);
  final watch = Stopwatch();
  try {
    session.evalJs(preludeJs, 'prelude.js');
    session.evalJs(File('tool/three/gen/g1_packer.js').readAsStringSync(), 'g1_packer.js');
    session.evalJs(File('tool/three/src/webgl2_facade.js').readAsStringSync(), 'webgl2_facade.js');
    final ok = session.evalJs(setupJs, 'setup.js');
    if (ok != 'true') throw StateError('bench setup failed: $ok');
    session.evalJs('__benchFrame(1);'); // warm-up frame + flush plumbing
    // Steady-state warm-up: the first frames on a cold runner (JIT, heap
    // growth) must not contaminate the percentiles.
    for (var f = 0; f < 10; f++) {
      session.evalJs('__benchFrame($draws);');
    }
    final samples = <double>[];
    var maxFlushes = 0;
    for (var f = 0; f < frames; f++) {
      session.dispatchCount = 0;
      watch
        ..reset()
        ..start();
      session.evalJs('__benchFrame($draws);', 'frame.js');
      watch.stop();
      final ms = watch.elapsedMicroseconds / 1000.0;
      samples.add(ms);
      if (session.dispatchCount > maxFlushes) maxFlushes = session.dispatchCount;
    }
    samples.sort();
    return BenchReport(
      frames,
      draws,
      maxFlushes,
      _percentile(samples, 0.50),
      _percentile(samples, 0.95),
      _percentile(samples, 0.99),
    );
  } finally {
    session.close();
    if (surface == null) ownShim.destroySurface(ownSurface);
    if (shim == null) ownShim.shutdown();
  }
}

/// Result of the raw GL fixture ([run1bRawGlFixture]).
class RawGlResult {
  RawGlResult(this.match, this.facadeHash, this.directHash, this.center,
      this.corner);
  final bool match;
  final int facadeHash;
  final int directHash;
  final List<int> center;
  final List<int> corner;
}

/// E2E-RAWGL-1: raw GL through the facade renders the fixture; the recorded
/// batch bytes replayed DIRECTLY through the C decoder on a fresh surface
/// must produce the identical readback (transport equivalence), and both
/// readbacks must show the drawn pixels (red clear, green triangle).
Future<RawGlResult> run1bRawGlFixture({Shim? shim, int? surface}) async {
  final ownShim = shim ?? Shim();
  if (shim == null && ownShim.init() != 0) {
    throw StateError('a1b_init failed (set JSR_ANGLE_DIR for the dylib dir)');
  }
  int newSurface() {
    final slot = calloc<ffi.Uint32>();
    try {
      final s = ownShim.createSurface(kW, kH, slot);
      if (s < 1) throw StateError('a1b_create_surface failed');
      return s;
    } finally {
      calloc.free(slot);
    }
  }

  final facadeSurface = surface ?? newSurface();
  final directSurface = newSurface();
  final session = _Session(ownShim, facadeSurface);
  try {
    if (ownShim.makeCurrent(facadeSurface) != 0) {
      throw StateError('a1b_make_current failed');
    }
    session.record = true;
    session.evalJs(preludeJs, 'prelude.js');
    session.evalJs(File('tool/three/gen/g1_packer.js').readAsStringSync(), 'g1_packer.js');
    session.evalJs(File('tool/three/src/webgl2_facade.js').readAsStringSync(), 'webgl2_facade.js');
    final ok = session.evalJs(setupJs, 'setup.js');
    if (ok != 'true') throw StateError('fixture setup failed: $ok');
    final rendered =
        jsonDecode(session.evalJs('__benchRender();', 'render.js') ?? '{}')
            as Map<String, dynamic>;
    session.record = false;
    if (ownShim.swapBuffers(facadeSurface) != 0) {
      throw StateError('a1b_swap_buffers failed (facade surface)');
    }
    // Replay the recorded bytes DIRECTLY on a fresh surface (no facade).
    if (ownShim.makeCurrent(directSurface) != 0) {
      throw StateError('a1b_make_current failed (direct surface)');
    }
    for (final bytes in session.recorded) {
      final buf = calloc<ffi.Uint8>(bytes.length);
      try {
        buf.asTypedList(bytes.length).setAll(0, bytes);
        ownShim.dispatch(buf, bytes.length);
      } finally {
        calloc.free(buf);
      }
    }
    // glReadPixels is synchronous; finishing (not swapping) keeps the default
    // framebuffer readable without presenting the IOSurface.
    final finishCmd = Uint8List(4)..buffer.asByteData().setUint32(0, 3, Endian.little);
    {
      final buf = calloc<ffi.Uint8>(finishCmd.length);
      try {
        buf.asTypedList(finishCmd.length).setAll(0, finishCmd);
        ownShim.dispatch(buf, finishCmd.length);
      } finally {
        calloc.free(buf);
      }
    }
    final facadeHash = (rendered['hash'] as num).toInt();
    final directHash = _readPixelsHash(ownShim, directSurface);
    final center = (rendered['center'] as List).cast<int>();
    final corner = (rendered['corner'] as List).cast<int>();
    final match = facadeHash == directHash &&
        center[0] <= 8 && center[1] >= 248 && corner[0] >= 248 && corner[1] <= 8;
    return RawGlResult(match, facadeHash, directHash, center, corner);
  } finally {
    session.close();
    ownShim.destroySurface(directSurface);
    if (surface == null) ownShim.destroySurface(facadeSurface);
    if (shim == null) ownShim.shutdown();
  }
}

int _readPixelsHash(Shim shim, int surface) {
  final wOut = calloc<ffi.Int32>();
  final hOut = calloc<ffi.Int32>();
  final px = calloc<ffi.Uint8>(kW * kH * 4);
  try {
    if (shim.readPixels(surface, px, wOut, hOut) != 0) {
      throw StateError('a1b_read_pixels failed');
    }
    if (wOut.value != kW || hOut.value != kH) {
      throw StateError('readback size ${wOut.value}x${hOut.value}');
    }
    return fnv1a(px.asTypedList(kW * kH * 4));
  } finally {
    calloc.free(wOut);
    calloc.free(hOut);
    calloc.free(px);
  }
}

Future<void> main() async {
  final missing = Shim.resolveProblem();
  if (missing != null) {
    stderr.writeln('bench_1b: $missing');
    exit(2);
  }
  final rawGl = await run1bRawGlFixture();
  final report = await run1bBench();
  stdout.writeln(
    'RAWGL_MATCH ${rawGl.match} '
    'RAWGL_FACADE_HASH ${hex32(rawGl.facadeHash)} '
    'RAWGL_DIRECT_HASH ${hex32(rawGl.directHash)} '
    'center=${rawGl.center} corner=${rawGl.corner}',
  );
  stdout.writeln(
    'BENCH_FLUSHES_PER_FRAME ${report.flushesPerFrame} '
    'BENCH_P50_MS ${report.p50Ms.toStringAsFixed(3)} '
    'BENCH_P95_MS ${report.p95Ms.toStringAsFixed(3)} '
    'BENCH_P99_MS ${report.p99Ms.toStringAsFixed(3)}',
  );
  if (!rawGl.match) {
    stderr.writeln(
      'bench_1b: raw GL fixture mismatch '
      '(facade ${hex32(rawGl.facadeHash)} vs direct ${hex32(rawGl.directHash)}, '
      'center=${rawGl.center} corner=${rawGl.corner})',
    );
  }
  if (!report.pass) {
    stderr.writeln(
      'bench_1b: PERF budget violated — ${report} '
      '(budget: flushes <= 1, p95 <= $kP95BudgetMs ms)',
    );
  }
  exit(rawGl.match && report.pass ? 0 : 1);
}
