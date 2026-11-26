import 'dart:convert';
import 'dart:ffi' as ffi;
import 'dart:io';
import 'dart:typed_data';

import 'package:ffi/ffi.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import '../../tool/three/bench_1b.dart' show Shim, fnv1a;
import '../support/three_1b_engine.dart';
import '../support/three_1b_real_wire.dart';

// E2E-TARGET-* / IT-TARGET-1 (issue #8, F4b, AC2): the composer foundation
// on 1B — offscreen targets, depth, composer ping-pong, readback, resize and
// the final presentation — and the honest-degradation rule: unsupported
// capabilities fail with a NAMED error before any capture (never an
// effect-less image).
//
//   IT-TARGET-1   the REAL recorded G1 stream of a bloom frame proves
//                 offscreen framebuffers, ping-pong, depth renderbuffers,
//                 readPixels and the final default-framebuffer binding
//   E2E-TARGET-1  a real bloom frame presents (surface hash == in-JS
//                 readback hash) and resizes coherently (round trip)
//   E2E-TARGET-2  missing float render targets -> cinematic.unsupported at
//                 pipeline creation (probe-forced, exact feature named)
//   E2E-TARGET-3  missing MRT -> cinematic.unsupported at creation
//   E2E-TARGET-4  a requested-but-unsupported effect (bloom gated off)
//                 fails the barrier capture with cinematic.notCapturable
//                 naming the effect; the capture host is never invoked
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  final bundle = File('assets/three/jsr_three_web.js').readAsStringSync();
  final missing = Shim.resolveProblem();

  // ── IT-TARGET-1 / E2E-TARGET-1 over the real ANGLE wire (memoized) ─────
  final wires = <Real1BWireHost>[];
  Future<(Real1BWireHost, Map<String, dynamic>?)> runTarget() async {
    final wire = Real1BWireHost(width: 320, height: 180)
      ..facadeBootstrapOverride = real1bFacadeBootstrap();
    wires.add(wire);
    final (w, sel, state, logs) = await run1bRealEngine(
      _targetWidget,
      bundle,
      width: 320,
      height: 180,
      exportTimeout: const Duration(seconds: 30),
    );
    expect(sel?.isAngle1b, isTrue, reason: 'the target run is on native 1B');
    expect(widgetErrorLogs(logs), isEmpty);
    expect(state?['error'], isNull, reason: '${state?['error']}');
    return (w, state);
  }

  Future<(Real1BWireHost, Map<String, dynamic>?)>? targetMemo;
  Future<(Real1BWireHost, Map<String, dynamic>?)> targetRun() => missing != null
      ? Future.error(const _Skipped())
      : (targetMemo ??= runTarget());

  tearDownAll(() async {
    for (final w in wires) {
      w.dispose();
    }
  });

  test(
    'IT-TARGET-1: the recorded G1 stream of a bloom frame proves offscreen '
    'targets, ping-pong, depth bindings, readback and final presentation',
    () async {
      if (missing != null) return;
      final (wire, _) = await targetRun();
      final cmds = decodeAllStreams(wire.dispatches1B, g1Methods());
      int fboCreates = 0;
      int rbCreates = 0;
      var depthStorage = false;
      var readback = false;
      var finalNullBinding = false;
      final boundNames = <int>{};
      for (final c in cmds) {
        switch (c.method.name) {
          case 'createFramebuffer':
            fboCreates++;
          case 'createRenderbuffer':
            rbCreates++;
          case 'renderbufferStorage':
            // (target, internalformat, width, height); r186 WebGL2 defaults
            // to DEPTH_COMPONENT24 (0x81A6), legacy 16 is 0x81A5
            if (c.u(1) == 0x81A6 || c.u(1) == 0x81A5) depthStorage = true;
          case 'bindFramebuffer':
            // (target, framebuffer); FRAMEBUFFER = 0x8D40
            if (c.u(0) == 0x8D40) {
              if (c.u(1) == 0) {
                finalNullBinding = true;
              } else {
                boundNames.add(c.u(1));
              }
            }
          case 'readPixels':
            readback = true;
        }
      }
      expect(
        fboCreates,
        greaterThanOrEqualTo(3),
        reason:
            'composer ping-pong + bloom internal targets allocate '
            'offscreen framebuffers (got $fboCreates)',
      );
      expect(
        boundNames.length,
        greaterThanOrEqualTo(2),
        reason:
            'the composer ping-pongs between >= 2 distinct framebuffers '
            '(got ${boundNames.length})',
      );
      expect(
        depthStorage,
        isTrue,
        reason: 'composer targets carry depth renderbuffers',
      );
      expect(rbCreates, greaterThanOrEqualTo(1));
      expect(readback, isTrue, reason: 'the readback path is exercised');
      expect(
        finalNullBinding,
        isTrue,
        reason: 'the final pass binds the default framebuffer (presentation)',
      );
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 5)),
  );

  test(
    'E2E-TARGET-1: a real bloom frame presents over ANGLE (surface hash == '
    'readback hash) and resizes coherently (round trip)',
    () async {
      if (missing != null) return;
      final (wire, state) = await targetRun();
      // ignore: avoid_print
      print('F4B_TARGET_CHAIN ' + (state!['chainOrder'] as List).join(' '));
      print('F4B_TARGET_MEANS ' + (state['means'] as List).join(' '));
      print(
        'F4B_PLAIN_CHAIN ' +
            ((state['plainChain'] as List?)?.join(' ') ??
                state['plainError'].toString()),
      );
      final frame7 = state['frame7'] as String;
      final resized = state['resized'] as String;
      final back = state['back'] as String;
      expect(frame7, isNot('0x00000000'), reason: 'non-empty bloom render');
      // resize round trip: same frame, same size -> same hash
      expect(back, frame7, reason: 'setSize(200,124) then back to 320x180');
      expect(
        resized,
        isNot(frame7),
        reason: 'the resized frame is a real, different image',
      );
      expect(resized, isNot('0x00000000'));
      // final presentation: the presented ANGLE surface carries the final
      // pass of the last rendered frame (== frame 7 after the round trip)
      final surfaceHash = readSurfaceHash(wire);
      expect(
        surfaceHash,
        back,
        reason:
            'surface=$surfaceHash readback=$back — the final composer '
            'pass reached the presented surface',
      );
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 5)),
  );

  // ── E2E-TARGET-2..4 run everywhere (fake wire, no ANGLE needed) ────────
  test('E2E-TARGET-2: a missing float render target fails pipeline creation '
      'with the exact named feature (probe-forced, fake wire)', () async {
    const widget = '''
var results = {};
try {
  var cin = jsr.three.cinematic;
  var renderer = {
    getSize: function (v) { return v.set(320, 180); },
    getPixelRatio: function () { return 1; },
    setClearAlpha: function () {},
    capabilities: {}
  };
  cin.createPipeline({
    renderer: renderer, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(),
    effects: { bloom: true, dof: false, fxaa: false, smaa: false, colorGrade: false, film: false, vignette: false, motion: false }
  });
  results.created = true;
} catch (e) {
  results.errorName = e.name || null;
  results.errorMessage = String((e && e.message) || e);
}
jsr.exportState(results);
''';
    final counting = _CountingCaptureHost();
    final (w, _, state) = await run1bWidgetEngine(
      widget,
      threeSource: bundle,
      realFacade: true,
      cinematicCaptureHost: counting,
    );
    expect(
      state?['created'],
      isNull,
      reason:
          'creation must fail, never fall back to an effect-less '
          'pipeline',
    );
    expect(state?['errorName'], 'cinematic.unsupported');
    final message = state?['errorMessage'] as String;
    expect(
      message,
      contains('EXT_color_buffer_float'),
      reason: 'the exact missing feature is named: $message',
    );
    expect(counting.calls, 0, reason: 'no capture can happen');
    expect(
      decodeAllStreams(
        w.dispatches1B,
        g1Methods(),
      ).where((c) => c.method.name == 'createFramebuffer'),
      isEmpty,
      reason: 'no composer targets were ever dispatched',
    );
  });

  test('E2E-TARGET-3: a missing MRT capability fails pipeline creation with '
      'the exact named feature (probe-forced, fake wire)', () async {
    const widget = '''
var results = {};
try {
  var cin = jsr.three.cinematic;
  var caps = new cin.CinematicCapabilitySet({
    halfFloatTargets: true, mrt: false, mipTargets: false, smaa: false,
    lut: false, bokeh: false, bloom: false, film: false, vignette: false,
    motionBlurAccum: false, pmrem: false, cubeCamera: false
  }, 'web');
  var renderer = {
    getSize: function (v) { return v.set(320, 180); },
    getPixelRatio: function () { return 1; },
    setClearAlpha: function () {},
    capabilities: {}
  };
  cin.createPipeline({
    renderer: renderer, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(),
    capabilities: caps,
    effects: { bloom: true, dof: false, fxaa: false, smaa: false, colorGrade: false, film: false, vignette: false, motion: false }
  });
  results.created = true;
} catch (e) {
  results.errorName = e.name || null;
  results.errorMessage = String((e && e.message) || e);
}
jsr.exportState(results);
''';
    final (w, _, state) = await run1bWidgetEngine(
      widget,
      threeSource: bundle,
      realFacade: true,
    );
    expect(state?['created'], isNull);
    expect(state?['errorName'], 'cinematic.unsupported');
    final message = state?['errorMessage'] as String;
    expect(
      message,
      contains('multiple render targets'),
      reason: 'the exact missing feature is named: $message',
    );
    expect(
      message,
      isNot(contains('EXT_color_buffer_float')),
      reason: 'only the actually missing feature is listed: $message',
    );
    expect(
      decodeAllStreams(
        w.dispatches1B,
        g1Methods(),
      ).where((c) => c.method.name == 'createFramebuffer'),
      isEmpty,
    );
  });

  test('E2E-TARGET-4: a requested-but-unsupported effect (bloom gated off '
      'through the capability probe) fails the barrier capture with the '
      'named error and never returns the effect-less frame', () async {
    const widget = '''
var results = {};
try {
  var cin = jsr.three.cinematic;
  var caps = new cin.CinematicCapabilitySet({
    halfFloatTargets: false, mrt: false, mipTargets: false, smaa: true,
    lut: true, bokeh: true, bloom: false, film: false, vignette: false,
    motionBlurAccum: false, pmrem: false, cubeCamera: false
  }, 'native');
  var renderer = {
    isJsrThreeRenderer: true,
    capabilities: { backend: 'flutterGpu', r1: true },
    getSize: function (v) { return v.set(320, 180); },
    getPixelRatio: function () { return 1; },
    setClearAlpha: function () {}
  };
  var pipeline = cin.createPipeline({
    renderer: renderer, scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(),
    capabilities: caps,
    effects: { bloom: true, dof: false, fxaa: false, smaa: false, colorGrade: false, film: false, vignette: false, motion: false }
  });
  results.bloomPass = !!pipeline.passes.bloom;
  results.unsupported = pipeline.unsupported.map(function (u) { return u.effect; });
  pipeline.captureFrame(cin.clockState(3, 24, 0.5, 1, 0)).then(function (r) {
    results.captured = true;
    jsr.exportState(results);
  }, function (e) {
    results.captureErrorName = e.name || String(e);
    results.captureErrorMessage = String((e && e.message) || e);
    jsr.exportState(results);
  });
} catch (e) {
  results.error = String((e && e.message) || e);
  jsr.exportState(results);
}
''';
    final counting = _CountingCaptureHost();
    final (_, _, state) = await run1bWidgetEngine(
      widget,
      threeSource: bundle,
      cinematicCaptureHost: counting,
    );
    expect(state?['error'], isNull, reason: '${state?['error']}');
    expect(
      state?['bloomPass'],
      isFalse,
      reason:
          'the gated effect built no pass (the render would be '
          'effect-less)',
    );
    expect(state?['unsupported'], contains('bloom'));
    expect(state?['captured'], isNull);
    expect(state?['captureErrorName'], 'cinematic.notCapturable');
    expect(
      state?['captureErrorMessage'],
      contains('bloom'),
      reason: 'the exact unsupported effect is named',
    );
    expect(
      counting.calls,
      0,
      reason:
          'the barrier host must never be asked for the effect-less '
          'frame',
    );
  });
}

String readSurfaceHash(Real1BWireHost wire) {
  final wOut = calloc<ffi.Int32>();
  final hOut = calloc<ffi.Int32>();
  final px = calloc<ffi.Uint8>(wire.width * wire.height * 4);
  try {
    // CPU IOSurface readback: the EGL context is current on the engine's
    // worker isolate, glReadPixels from the main isolate is
    // INVALID_OPERATION.
    if (wire.shim.readSurfaceCpu(wire.surface, px, wOut, hOut) != 0) {
      throw StateError('a1b_read_surface_cpu failed');
    }
    final hash = fnv1a(px.asTypedList(wOut.value * hOut.value * 4));
    return '0x${(hash & 0xFFFFFFFF).toRadixString(16).padLeft(8, '0')}';
  } finally {
    calloc.free(wOut);
    calloc.free(hOut);
    calloc.free(px);
  }
}

class _CountingCaptureHost extends JsCinematicCaptureHost {
  int calls = 0;
  @override
  Future<Map<String, dynamic>> capture(
    String engineId,
    Map<String, dynamic> clock,
  ) async {
    calls++;
    return {'width': 320, 'height': 180};
  }
}

class _Skipped implements Exception {
  const _Skipped();
}

// ── G1 recorded-stream decoder (same wire walk as ut_gl_1_test.js) ────────

class _G1Method {
  _G1Method(this.name, this.opcode, this.args);
  final String name;
  final int opcode;
  final String args;
}

class _G1Command {
  _G1Command(this.method);
  final _G1Method method;
  final ints = <int>[];
  final strings = <String>[];

  int u(int index) => ints[index];
}

List<_G1Method> _methodsCache = const [];

List<_G1Method> g1Methods() {
  if (_methodsCache.isNotEmpty) return _methodsCache;
  final decoded =
      jsonDecode(
            File('tool/three/webgl2_g1_methods.json').readAsStringSync(),
          )['methods']
          as List;
  _methodsCache = decoded
      .map(
        (m) => _G1Method(
          m['name'] as String,
          m['opcode'] as int,
          m['args'] as String,
        ),
      )
      .toList();
  return _methodsCache;
}

int _u32(Uint8List b, int o) =>
    ByteData.sublistView(b).getUint32(o, Endian.little);

List<_G1Command> decodeAllStreams(
  List<Uint8List> dispatches,
  List<_G1Method> methods,
) {
  final byOpcode = {for (final m in methods) m.opcode: m};
  final out = <_G1Command>[];

  /// Decodes one command at [off]; returns the consumed size.
  int decodeOne(Uint8List b, int off) {
    final op = _u32(b, off);
    off += 4;
    final m = byOpcode[op];
    if (m == null) throw StateError('unknown opcode $op in recorded stream');
    final cmd = _G1Command(m);
    final start = off - 4;
    // Raw G1 framing: 'u'/'i'/'f' args are fixed 4-byte words; 's'/'b' are
    // [u32 len][bytes].
    for (var i = 0; i < m.args.length; i++) {
      final ch = m.args[i];
      if (ch == 'u') {
        cmd.ints.add(_u32(b, off));
        off += 4;
      } else if (ch == 'i') {
        cmd.ints.add(ByteData.sublistView(b).getInt32(off, Endian.little));
        off += 4;
      } else if (ch == 'f') {
        cmd.ints.add(
          ByteData.sublistView(b).getFloat32(off, Endian.little).round(),
        );
        off += 4;
      } else {
        final len = _u32(b, off);
        off += 4;
        if (ch == 's') {
          cmd.strings.add(
            utf8.decode(b.sublist(off, off + len), allowMalformed: true),
          );
        }
        off += len;
      }
    }
    out.add(cmd);
    return off - start;
  }

  for (final b in dispatches) {
    if (b.length < 4) continue;
    if (_u32(b, 0) == 0) {
      final count = _u32(b, 4);
      var off = 8;
      for (var i = 0; i < count; i++) {
        off += decodeOne(b, off);
      }
    } else {
      decodeOne(b, 0);
    }
  }
  return out;
}

/// The target widget: the plain-composer control first, then the bloom
/// frame chain — the surface ends on the LAST bloom present so the
/// surface-vs-readback comparison targets the bloom frame.
const String _targetWidget = '''
var results = {};
try {
  var cin = jsr.three.cinematic;
  var canvas = jsr.three.createCanvas('f4b-target');
  canvas.width = 320; canvas.height = 180;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
  renderer.setSize(320, 180, false);
  renderer.setPixelRatio(1);
  var scene = new THREE.Scene();
  scene.background = null;
  var camera = new THREE.PerspectiveCamera(60, 320 / 180, 0.1, 100);
  camera.position.set(0, 0, 8);
  var bright = new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 2.2, 1.2) }));
  bright.position.x = 1.2;
  scene.add(bright);
  var dim = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 3),
    new THREE.MeshBasicMaterial({ color: 0x30343c }));
  dim.position.set(0, -2.2, -2);
  scene.add(dim);
  // plain-composer control first: RenderPass + OutputPass only, same
  // resize chain (the bloom pipeline below renders LAST — the presented
  // surface must end on a bloom frame for the surface comparison)
  try {
    var canvas2 = jsr.three.createCanvas('f4b-plain');
    canvas2.width = 320; canvas2.height = 180;
    var r2 = new THREE.WebGLRenderer({ canvas: canvas2, antialias: false });
    r2.setSize(320, 180, false);
    r2.setPixelRatio(1);
    var scene2 = new THREE.Scene();
    var cam2 = new THREE.PerspectiveCamera(60, 320 / 180, 0.1, 100);
    cam2.position.set(0, 0, 8);
    scene2.add(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 2.2, 1.2) })));
    var composer2 = jsr.three.cinematic.createPipeline({ renderer: r2, scene: scene2, camera: cam2,
      effects: { bloom: false, dof: false, fxaa: false, smaa: false, colorGrade: false, film: false, vignette: false, motion: false } });
    function hash2() {
      composer2.renderFrame(jsr.three.cinematic.clockState(7, 24, 0.5, 1, 0));
      var gl2 = r2.getContext();
      var p2 = new Uint8Array(320 * 180 * 4);
      gl2.readPixels(0, 0, 320, 180, gl2.RGBA, gl2.UNSIGNED_BYTE, p2);
      var h2 = 0x811c9dc5;
      for (var w2 = 0; w2 < p2.length; w2++) { h2 ^= p2[w2]; h2 = Math.imul(h2, 0x01000193) >>> 0; }
      return '0x' + (h2 >>> 0).toString(16).padStart(8, '0');
    }
    var a1 = hash2(); composer2.setSize(200, 124); var a2 = hash2(); composer2.setSize(320, 180);
    results.plainChain = [a1, a2, hash2(), hash2()];
  } catch (e2) { results.plainError = String((e2 && e2.message) || e2); }
  var pipeline = cin.createPipeline({
    renderer: renderer, scene: scene, camera: camera,
    effects: { bloom: true, dof: false, fxaa: false, smaa: false,
      colorGrade: false, film: false, vignette: false, motion: false }
  });
  function renderHash() {
    pipeline.renderFrame(cin.clockState(7, 24, 0.5, 1, 0));
    var gl = renderer.getContext();
    var px = new Uint8Array(320 * 180 * 4);
    gl.readPixels(0, 0, 320, 180, gl.RGBA, gl.UNSIGNED_BYTE, px);
    var sum = 0;
    for (var q = 0; q < px.length; q += 4) sum += px[q];
    means.push(sum / (320 * 180));
    var h = 0x811c9dc5;
    for (var i = 0; i < px.length; i++) {
      h ^= px[i];
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return '0x' + (h >>> 0).toString(16).padStart(8, '0');
  }
  var means = [];
  results.frame7 = renderHash();
  results.frame7b = renderHash();
  results.frame7c = renderHash();
  pipeline.setSize(320, 180);
  results.noop = renderHash();
  pipeline.setSize(200, 124);
  results.resized = renderHash();
  pipeline.setSize(320, 180);
  results.back = renderHash();
  results.back2 = renderHash();
  results.chainOrder = [results.frame7, results.frame7b, results.frame7c, results.noop, results.resized, results.back, results.back2];
  results.means = means;
  jsr.exportState(results);
} catch (e) {
  results.error = String((e && e.message) || e);
  jsr.exportState(results);
}
''';
