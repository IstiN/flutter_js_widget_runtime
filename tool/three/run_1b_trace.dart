// run_1b_trace.dart — M2b harness: boot the REAL three.js r186 bundle in
// QuickJS against the webgl2_facade + G1 packer, with GL execution stubbed:
// '__jsr1b_gl' appends each command buffer to a trace (no ANGLE execution)
// and returns 0; '__jsr1b_result' serves the 64 KB scratch lane (a1b_gl_result
// via FFI when the symbol exists, else the trace stub's canned payload).
//
// Acceptance: 3 frames + RT ping-pong render with ZERO facade errors/stub
// hits; /tmp/g1_trace.json written; two runs produce identical histograms.
import 'dart:collection';
import 'dart:convert';
import 'dart:ffi';
import 'dart:io';
import 'dart:typed_data';

import 'package:ffi/ffi.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

part 'run_1b_trace_lib.dart';

// ---------------------------------------------------------------------------
// JS bootstrap: DOM shims + glue, evaluated BEFORE the stripped bundles.
String bootstrapShim() => r'''
// --- minimal DOM shims for non-DOM boot (three r186 touches these) ---
(function () {
  var g = globalThis;
  g.self = g;
  g.window = g;
  g.navigator = { userAgent: 'QuickJS 1B-trace (headless)', maxTouchPoints: 0 };
  g.devicePixelRatio = 1;
  g.innerWidth = 320; g.innerHeight = 240;
  g.requestAnimationFrame = function (fn) { return 0; };
  g.cancelAnimationFrame = function (id) {};
  g.addEventListener = function () {};
  g.removeEventListener = function () {};
  g.matchMedia = function () { return { matches: false, addEventListener: function () {} }; };
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
      },
      toDataURL: function () { return 'data:,'; },
      getRootNode: function () { return g.document; }
    };
    return c;
  }
  g.document = {
    createElementNS: function (ns, tag) { return makeCanvas(); },
    createElement: function (tag) { return makeCanvas(); },
    addEventListener: function () {}, removeEventListener: function () {},
    hidden: false, visibilityState: 'visible',
    getElementById: function () { return null; },
    body: { appendChild: function () {} },
    documentElement: { style: {} }
  };
  // QuickJS has no console in the bridge; route through a Dart host fn.
  g.console = {
    log: function () { __jsr1b_console('log', Array.prototype.join.call(arguments, ' ')); },
    info: function () { __jsr1b_console('info', Array.prototype.join.call(arguments, ' ')); },
    warn: function () { __jsr1b_console('warn', Array.prototype.join.call(arguments, ' ')); },
    error: function () { __jsr1b_console('error', Array.prototype.join.call(arguments, ' ')); }
  };
  // atob polyfill (facade decodes base64 scratch payloads). Processes 4
  // input chars -> 3 bytes; handles the 1-2 byte tail after '=' stripping.
  var B64 = ''; // built programmatically; do not inline the alphabet
  for (var ci = 65; ci <= 90; ci++) B64 += String.fromCharCode(ci);
  for (var ci = 97; ci <= 122; ci++) B64 += String.fromCharCode(ci);
  for (var ci = 48; ci <= 57; ci++) B64 += String.fromCharCode(ci);
  B64 += '+/';
  g.atob = function (input) {
    var str = String(input).replace(/=+$/, '');
    if (str.length % 4 === 1) throw new Error('atob: invalid input');
    var out = '';
    for (var i = 0; i < str.length; i += 4) {
      var c0 = B64.indexOf(str[i]);
      var c1 = B64.indexOf(str[i + 1]);
      var c2 = i + 2 < str.length ? B64.indexOf(str[i + 2]) : 0;
      var c3 = i + 3 < str.length ? B64.indexOf(str[i + 3]) : 0;
      if (c0 < 0 || c1 < 0 || c2 < 0 || c3 < 0)
        throw new Error('atob: invalid input');
      var n = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
      out += String.fromCharCode((n >> 16) & 255);
      if (i + 2 < str.length) out += String.fromCharCode((n >> 8) & 255);
      if (i + 3 < str.length) out += String.fromCharCode(n & 255);
    }
    return out;
  };
  // Packer glue: the bytes lane is (name, typedArray) and void-returning in
  // quickjs_runtime 0.4.9, so the int64 return rides a companion JSON host fn
  // (__jsr1b_gl_rc). This wrapper preserves the locked __jsr1b_gl(bytes) API
  // the packer calls.
  g.__jsr1b_gl = function (bytes) {
    __jsr1b_gl_bytes('g1', bytes);
    return __jsr1b_gl_rc();
  };
  // registerHostFunction's sync lane hands the Dart return value back to JS
  // as a plain string (no JSON wrapper), so bridge it straight through; the
  // facade sees exactly the locked contract: __jsr1b_result() -> base64.
  g.__jsr1b_result = function () {
    return __jsr1b_result_host();
  };
})();
''';

// Scene: boot WebGLRenderer on the facade, render 3 rotating frames of a
// BoxGeometry + MeshNormalMaterial + PointLight, then an FBO ping-pong with
// a ShaderMaterial fullscreen quad (core-only; UnrealBloomPass is addons).
String sceneScript() => r'''
globalThis.__result = (function () {
  try {
    var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
    canvas.width = 320; canvas.height = 240;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(320, 240, false);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, 320 / 240, 0.1, 100);
    camera.position.z = 4;
    var mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), new THREE.MeshNormalMaterial());
    scene.add(mesh);
    var light = new THREE.PointLight(0xffffff, 10, 0, 2);
    light.position.set(2, 3, 4);
    scene.add(light);
    var frames = 0;
    for (var i = 0; i < 3; i++) {
      mesh.rotation.y += 0.35; mesh.rotation.x += 0.15;
      renderer.render(scene, camera);
      frames++;
    }
    // FBO ping-pong: scene -> rtA; quad pass rtA -> rtB; quad pass rtB -> screen.
    var rtOpts = { format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true };
    var rtA = new THREE.WebGLRenderTarget(320, 240, rtOpts);
    var rtB = new THREE.WebGLRenderTarget(320, 240, rtOpts);
    var quadScene = new THREE.Scene();
    var quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, uGain: { value: 0.9 } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D tDiffuse; uniform float uGain; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tDiffuse, vUv).rgb * uGain, 1.0); }',
      depthTest: false, depthWrite: false
    }));
    quadScene.add(quad);
    renderer.setRenderTarget(rtA);
    renderer.render(scene, camera);
    quad.material.uniforms.tDiffuse.value = rtA.texture;
    quad.material.uniforms.uGain.value = 0.85;
    renderer.setRenderTarget(rtB);
    renderer.render(quadScene, quadCam);
    quad.material.uniforms.tDiffuse.value = rtB.texture;
    quad.material.uniforms.uGain.value = 1.0;
    renderer.setRenderTarget(null);
    renderer.render(quadScene, quadCam);
    var gl = renderer.getContext();
    var stats = gl.__stats || { used: {}, missing: {}, stubThrows: 0 };
    return { ok: true, frames: frames, revision: THREE.REVISION,
      usedMethods: stats.used, missingMethods: stats.missing, stubThrows: stats.stubThrows };
  } catch (e) {
    return { ok: false, error: String(e && e.stack ? e.stack : e) };
  }
})();
''';

// ---------------------------------------------------------------------------
Map<int, String> loadOpcodeTable() {
  final f = File(kTablePath);
  if (!f.existsSync()) return {};
  final decoded = jsonDecode(f.readAsStringSync());
  final methods = decoded is Map ? (decoded['methods'] ?? decoded) : decoded;
  final map = <int, String>{};
  if (methods is List) {
    for (final m in methods) {
      if (m is Map && m['opcode'] != null && m['name'] != null) {
        map[m['opcode'] as int] = m['name'] as String;
      }
    }
  }
  return map;
}

// Poll for M2a artifacts (packer + table) — the sibling agent may still be
// generating them when this harness is invoked.
void waitForArtifacts() {
  for (var i = 0; i < 600; i++) {
    if (File(kPackerPath).existsSync() && File(kTablePath).existsSync()) return;
    sleep(const Duration(seconds: 2));
  }
  throw StateError('timed out waiting for $kPackerPath / $kTablePath (M2a)');
}

typedef A1bGlResultNative = Int32 Function(Pointer<Uint8>, Int32);
typedef A1bGlResultDart = int Function(Pointer<Uint8>, int);

class ScratchLane {
  final A1bGlResultDart? fn;
  final int maxLen;
  ScratchLane(this.fn, this.maxLen);

  factory ScratchLane.open() {
    try {
      final lib = DynamicLibrary.open('$kRoot/native/angle/libangle_1b.dylib');
      final sym = lib.lookup<NativeFunction<A1bGlResultNative>>(
        'a1b_gl_result',
      );
      return ScratchLane(sym.asFunction(), 65536);
    } catch (_) {
      return ScratchLane(null, 65536); // symbol lands with M2a's relink
    }
  }

  // Two-call pattern: query length with NULL/0, then fetch.
  Uint8List read() {
    final f = fn;
    if (f == null) return Uint8List(0);
    final len = f(nullptr.cast(), 0);
    if (len <= 0) return Uint8List(0);
    final n = len > maxLen ? maxLen : len;
    final buf = calloc<Uint8>(n);
    try {
      final actual = f(buf, n);
      if (actual <= 0) return Uint8List(0);
      return buf.asTypedList(actual > n ? n : actual).toList().asUint8List();
    } finally {
      calloc.free(buf);
    }
  }
}

extension on List<int> {
  Uint8List asUint8List() => Uint8List.fromList(this);
}

// One full harness run. Returns the trace.
Trace runOnce(Map<int, String> opNames, ScratchLane scratch) {
  final trace = Trace();
  final stub = GlStub(opNames);
  final rt = QuickjsRuntime();
  try {
    final bytesOk = rt.registerHostBytesFn('__jsr1b_gl_bytes', (name, data) {
      final op = data.length >= 4
          ? ByteData.sublistView(data).getUint32(0, Endian.little)
          : -1;
      trace.add(op, data.length);
      stub.compute(op, Uint8List.fromList(data));
    });
    if (!bytesOk) throw StateError('quickjs bridge lacks bytes lane');
    rt.registerHostFunction('__jsr1b_gl_rc', (_) => '${stub.lastRc}');
    rt.registerHostFunction('__jsr1b_console', (argsJson) {
      final a = jsonDecode(argsJson) as List;
      stderr.writeln('[js.${a[0]}] ${a[1]}');
      return null;
    });
    rt.registerHostFunction('__jsr1b_result_host', (_) {
      // Trace stub payload wins (no real decoder wrote the C scratch); when
      // empty, fall back to the FFI scratch read so the lane is real.
      final payload = stub.lastPayload;
      final bytes = payload.isNotEmpty ? payload : scratch.read();
      return jsonEncode(base64Encode(bytes));
    });

    final err = <String?>[];
    String? evalOrThrow(String code, String filename) {
      final r = rt.eval(code, filename: filename, errMsg: err);
      if (err.isNotEmpty && err.first != null) {
        throw StateError('eval $filename failed: ${err.first}');
      }
      err.clear();
      return r;
    }

    evalOrThrow(bootstrapShim(), 'bootstrap.js');
    evalOrThrow(
      wrapThreeCore(File(kCorePath).readAsStringSync()),
      'three.core.js',
    );
    evalOrThrow(
      wrapThreeModule(File(kModulePath).readAsStringSync()),
      'jsr_three_web.js',
    );
    evalOrThrow(File(kPackerPath).readAsStringSync(), 'g1_packer.js');
    evalOrThrow(File(kFacadePath).readAsStringSync(), 'webgl2_facade.js');
    final resultJson = evalOrThrow(sceneScript(), 'scene.js');
    final result = jsonDecode(resultJson ?? '{}') as Map<String, dynamic>;
    if (result['ok'] != true) {
      throw StateError('scene failed: ${result['error']}');
    }
    final missing = (result['missingMethods'] as Map?) ?? {};
    final stubThrows = result['stubThrows'] as int? ?? 0;
    if (missing.isNotEmpty || stubThrows > 0) {
      throw StateError(
        'facade strict failures: missing=$missing stubThrows=$stubThrows',
      );
    }
    stdout.writeln(
      '[harness] scene ok: revision=${result['revision']} '
      'frames=${result['frames']} distinctMethods='
      '${(result['usedMethods'] as Map).length}',
    );
  } finally {
    rt.close();
  }
  return trace;
}

void main() {
  waitForArtifacts();
  final opNames = loadOpcodeTable();
  final scratch = ScratchLane.open();
  stdout.writeln(
    '[harness] table methods: ${opNames.length}; '
    'a1b_gl_result: ${scratch.fn != null ? "ffi" : "dart-stub only"}',
  );

  final t1 = runOnce(opNames, scratch);
  final t2 = runOnce(opNames, scratch);
  String canonical(Trace t) =>
      t.histogram.entries.map((e) => '${e.key}:${e.value}').join(',');
  final deterministic =
      canonical(t1) == canonical(t2) && t1.totalBytes == t2.totalBytes;
  if (!deterministic) throw StateError('NON-DETERMINISTIC trace between runs');

  final top = t1.histogram.entries.toList()
    ..sort((a, b) => b.value.compareTo(a.value));
  stdout.writeln('total commands : ${t1.ops.length}');
  stdout.writeln('bytes on wire  : ${t1.totalBytes}');
  stdout.writeln(
    'distinct opcodes: ${t1.histogram.length} of ${opNames.length} table methods',
  );
  stdout.writeln('deterministic  : $deterministic (2 runs)');
  stdout.writeln('facade errors  : 0 (enforced: any miss/stub throw aborts)');
  stdout.writeln('top-20 opcodes :');
  for (final e in top.take(20)) {
    stdout.writeln(
      '  ${e.value.toString().padLeft(6)}  ${e.key.toString().padLeft(4)}  ${_nameOf(opNames, e.key)}',
    );
  }
  File(kTraceOut).writeAsStringSync(jsonEncode(t1.toJson(opNames)));
  stdout.writeln('trace written  : $kTraceOut');
}
