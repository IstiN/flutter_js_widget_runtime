// run_1b_render.dart — M3 harness: the REAL three.js r186 scene through the
// G1 dispatch decoder into ANGLE (actual pixels). Bootstrap + scene JS are
// byte-identical to run_1b_trace.dart (M2b); only the host fns change:
// '__jsr1b_gl' -> a1b_gl_dispatch per command buffer, '__jsr1b_result' ->
// real C scratch. Per run: create+make_current surface -> boot QuickJS ->
// scene -> swap -> read_pixels -> FNV-1a (as tool/angle1b_smoke.dart) ->
// print. Runs TWICE on fresh surfaces; hashes must match. Facade stub /
// missing or unexpected C-decoder stub rc aborts with the exact hit (no
// facade forks). Run from repo root: dart run tool/three/run_1b_render.dart
import 'dart:convert';
import 'dart:ffi';
import 'dart:io';
import 'dart:typed_data';
import 'package:ffi/ffi.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';
const kTablePath = 'tool/three/webgl2_g1_methods.json';
const kPackerPath = 'tool/three/gen/g1_packer.js';
const kCorePath = 'example/web/three.core.js';
const kModulePath = 'example/web/jsr_three_web.js';
const kFacadePath = 'tool/three/src/webgl2_facade.js';
const kShimPath = 'native/angle/libangle_1b.dylib';
const kW = 320, kH = 240;
// Opcodes whose int64 rc may legitimately be -1 (GL not-found, g1_tables.h);
// any OTHER negative rc = named C stub.
const kLegitNegativeRcs = {66, 67, 68};
// ---- ANGLE 1B shim FFI bindings (style: tool/angle1b_smoke.dart) ----------
class Shim {
  final DynamicLibrary lib = DynamicLibrary.open(kShimPath);
  late final int Function() init = lib.lookupFunction<Int32 Function(), int Function()>('a1b_init');
  late final int Function(int, int, Pointer<Uint32>) createSurface = lib.lookupFunction<Int64 Function(Int32, Int32, Pointer<Uint32>), int Function(int, int, Pointer<Uint32>)>('a1b_create_surface');
  late final int Function(int) makeCurrent = lib.lookupFunction<Int32 Function(Int64), int Function(int)>('a1b_make_current');
  late final int Function(int) swapBuffers = lib.lookupFunction<Int32 Function(Int64), int Function(int)>('a1b_swap_buffers');
  late final int Function(int, Pointer<Uint8>, Pointer<Int32>, Pointer<Int32>) readPixels = lib.lookupFunction<Int32 Function(Int64, Pointer<Uint8>, Pointer<Int32>, Pointer<Int32>), int Function(int, Pointer<Uint8>, Pointer<Int32>, Pointer<Int32>)>('a1b_read_pixels');
  late final void Function(int) destroySurface = lib.lookupFunction<Void Function(Int64), void Function(int)>('a1b_destroy_surface');
  late final void Function() shutdown = lib.lookupFunction<Void Function(), void Function()>('a1b_shutdown');
  late final int Function(Pointer<Uint8>, int) dispatch = lib.lookupFunction<Int64 Function(Pointer<Uint8>, Int32), int Function(Pointer<Uint8>, int)>('a1b_gl_dispatch');
  late final int Function(Pointer<Uint8>, int) result = lib.lookupFunction<Int32 Function(Pointer<Uint8>, Int32), int Function(Pointer<Uint8>, int)>('a1b_gl_result');
}
/// FNV-1a 32-bit, identical to tool/angle1b_smoke.dart / the web ref.
int fnv1a(List<int> bytes) {
  var hash = 0x811c9dc5;
  for (final b in bytes) hash = ((hash ^ b) * 0x01000193) & 0xffffffff;
  return hash;
}
Map<int, String> loadOpcodeTable() {
  final decoded = jsonDecode(File(kTablePath).readAsStringSync());
  final methods = decoded is Map ? (decoded['methods'] ?? decoded) : decoded;
  return {if (methods is List) for (final m in methods) if (m is Map && m['opcode'] != null && m['name'] != null) m['opcode'] as int: m['name'] as String};
}
// ---- ESM transform (verbatim logic from M2b): wrap both modules in IIFE
// scopes, bridging imports/exports via globals.
List<String> _braceList(String line, String open, String close) {
  final a = line.indexOf(open) + open.length, b = line.lastIndexOf(close);
  if (a <= 0 || b < a) throw StateError('ESM list parse failed: ${line.substring(0, 60)}');
  return line.substring(a, b).split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
}
String _dropImportExports(String src) => src.split('\n').where((l) => !l.trimLeft().startsWith('import ') && !l.trimLeft().startsWith('export {')).join('\n');
String wrapThreeCore(String core) {
  final exportLine = core.split('\n').firstWhere((l) => l.trimLeft().startsWith('export {'), orElse: () => throw StateError('three.core.js: no export line'));
  final exports = _braceList(exportLine, 'export {', '};');
  return '(function () {\n${_dropImportExports(core)}\nglobalThis.__threeCore = { ${exports.join(', ')} };\n})();';
}
String wrapThreeModule(String module) {
  final lines = module.split('\n');
  final importLine = lines.firstWhere((l) => l.trimLeft().startsWith('import {'), orElse: () => throw StateError('jsr_three_web.js: no import line'));
  final importNames = _braceList(importLine, 'import {', '} from');
  final exportLines = lines.where((l) => l.trimLeft().startsWith('export {')).toList();
  final reExportLines = exportLines.where((l) => l.contains('} from')).toList();
  if (reExportLines.length != 1 || exportLines.length != 2) throw StateError('jsr_three_web.js: expected 1 re-export + 1 export, got ${exportLines.length}');
  final reExportNames = _braceList(reExportLines.first, 'export {', '} from');
  final exportNames = _braceList(exportLines.last, 'export {', '};');
  final coreBridge = reExportNames.map((n) => '$n: __threeCore["$n"]').join(', ');
  return '(function () {\nconst { ${importNames.join(', ')} } = globalThis.__threeCore;\n${_dropImportExports(module)}\n'
      'globalThis.THREE = Object.assign({ $coreBridge }, { ${exportNames.join(', ')} });\n})();';
}
// ---- JS bootstrap (byte-identical to M2b): DOM shims + __jsr1b_gl glue.
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

// Scene (byte-identical to M2b run_1b_trace.dart sceneScript).
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

// M3 harness-owned interpositions — NOT a facade/decoder fork (webgl2_facade.js
// and gen/g1_tables.h stay untouched). Both defects surfaced by M3; M2 amendment
// M3 facade/decoder defects [A]/[B] are FIXED AT SOURCE (facade wrapValid for
// uniform location 0; decoder g_UniformMatrix*fv count/transpose order). The
// m3FacadePatch interposition was removed 2026-11-09; see docs/angle_1b.md.

// Two-call read of the real 64 KB C scratch (a1b_gl_result).
Uint8List readScratch(Shim shim) {
  final len = shim.result(nullptr.cast(), 0);
  if (len <= 0) return Uint8List(0);
  final n = len > 262144 ? 262144 : len;
  final buf = calloc<Uint8>(n);
  try {
    final actual = shim.result(buf, n);
    if (actual <= 0) return Uint8List(0);
    return Uint8List.fromList(buf.asTypedList(actual > n ? n : actual).toList());
  } finally {
    calloc.free(buf);
  }
}

class RenderResult {
  RenderResult(this.hash, this.pixels, this.dispatchCalls);
  final int hash;
  final Uint8List pixels;
  final int dispatchCalls;
}

// One full render: boot QuickJS, run the scene through the real decoder,
// swap, read back from the IOSurface, hash.
RenderResult runOnce(Shim shim, int surface, Map<int, String> opNames) {
  final rt = QuickjsRuntime();
  var calls = 0;
  var lastRc = 0;
  final stubHits = <String>[];
  try {
    final bytesOk = rt.registerHostBytesFn('__jsr1b_gl_bytes', (name, data) {
      calls++;
      final op = data.length >= 4 ? ByteData.sublistView(data).getUint32(0, Endian.little) : -1;
      final buf = calloc<Uint8>(data.length);
      try {
        buf.asTypedList(data.length).setAll(0, data);
        lastRc = shim.dispatch(buf, data.length).toInt();
      } finally {
        calloc.free(buf);
      }
      if (lastRc < 0 && !kLegitNegativeRcs.contains(op)) stubHits.add('${opNames[op] ?? 'op_$op'} (opcode $op) rc=$lastRc');

    });
    if (!bytesOk) throw StateError('quickjs bridge lacks bytes lane');
    rt.registerHostFunction('__jsr1b_gl_rc', (_) => '$lastRc');
    rt.registerHostFunction('__jsr1b_console', (argsJson) {
      final a = jsonDecode(argsJson) as List;
      stderr.writeln('[js.${a[0]}] ${a[1]}');
      return null;
    });

    rt.registerHostFunction('__jsr1b_result_host', (_) => jsonEncode(base64Encode(readScratch(shim))));
    final err = <String?>[];
    String? evalOrThrow(String code, String filename) {
      final r = rt.eval(code, filename: filename, errMsg: err);
      if (err.isNotEmpty && err.first != null) throw StateError('eval $filename failed: ${err.first}');
      err.clear();
      return r;
    }
    final sources = [
      (bootstrapShim(), 'bootstrap.js'),
      (wrapThreeCore(File(kCorePath).readAsStringSync()), 'three.core.js'),
      (wrapThreeModule(File(kModulePath).readAsStringSync()), 'jsr_three_web.js'),
      (File(kPackerPath).readAsStringSync(), 'g1_packer.js'), (File(kFacadePath).readAsStringSync(), 'webgl2_facade.js'),
      (sceneScript(), 'scene.js'),
    ];
    String? resultJson;
    for (final (code, name) in sources) { resultJson = evalOrThrow(code, name); }
    final result = jsonDecode(resultJson ?? '{}') as Map<String, dynamic>;
    if (result['ok'] != true) throw StateError('scene failed: ${result['error']}');
    final missing = (result['missingMethods'] as Map?) ?? {};
    final stubThrows = result['stubThrows'] as int? ?? 0;
    if (missing.isNotEmpty || stubThrows > 0) throw StateError('facade strict failures (M2 amendment driver): missing=$missing stubThrows=$stubThrows');

    if (stubHits.isNotEmpty) throw StateError('C-decoder stub hits (M2 amendment driver): ${stubHits.join('; ')}');
    stdout.writeln('[harness] scene ok: revision=${result['revision']} frames=${result['frames']}');
  } finally {
    rt.close();
  }
  if (shim.swapBuffers(surface) != 0) throw StateError('a1b_swap_buffers failed');
  final wOut = calloc<Int32>(), hOut = calloc<Int32>();
  final px = calloc<Uint8>(kW * kH * 4);
  late final Uint8List pixels;
  try {
    if (shim.readPixels(surface, px, wOut, hOut) != 0) throw StateError('a1b_read_pixels failed');
    if (wOut.value != kW || hOut.value != kH) throw StateError('readback size ${wOut.value}x${hOut.value} != ${kW}x$kH');
    pixels = Uint8List.fromList(px.asTypedList(kW * kH * 4).toList());
  } finally {
    calloc.free(wOut); calloc.free(hOut); calloc.free(px);
  }
  return RenderResult(fnv1a(pixels), pixels, calls);
}

void main() {
  String hex32(int v) => '0x${v.toRadixString(16).padLeft(8, '0')}';
  if (!File(kShimPath).existsSync()) { stderr.writeln('libangle_1b.dylib not found; run `bash native/angle/build.sh`'); exit(2); }
  final opNames = loadOpcodeTable();
  final shim = Shim();
  if (shim.init() != 0) throw StateError('a1b_init failed');
  final hashes = <int>[];
  for (var run = 1; run <= 2; run++) {
    final iosurfaceId = calloc<Uint32>();
    final surface = shim.createSurface(kW, kH, iosurfaceId);
    if (surface < 1) throw StateError('a1b_create_surface failed');
    try {
      if (shim.makeCurrent(surface) != 0) throw StateError('a1b_make_current failed');
      stdout.writeln('[harness] run $run: surface=$surface iosurfaceId=${iosurfaceId.value}');
      final r = runOnce(shim, surface, opNames);
      hashes.add(r.hash);
      final corner = (r.pixels[0], r.pixels[1], r.pixels[2], r.pixels[3]);
      final co = ((kH ~/ 2) * kW + (kW ~/ 2)) * 4;
      final center = (r.pixels[co], r.pixels[co + 1], r.pixels[co + 2], r.pixels[co + 3]);
      stdout.writeln('1B_RUN$run hash=${hex32(r.hash)} (${r.hash})');
      stdout.writeln('1B_RUN$run corner=$corner center=$center dispatchCalls=${r.dispatchCalls}');
      File('/tmp/angle1b_run$run.rgba').writeAsBytesSync(r.pixels);
    } finally {
      calloc.free(iosurfaceId);
      shim.destroySurface(surface);
    }
  }
  shim.shutdown();
  final deterministic = hashes[0] == hashes[1];
  stdout.writeln('1B_DETERMINISTIC $deterministic');
  if (!deterministic) { stderr.writeln('1B FAIL: run hashes differ'); exit(1); }
}
