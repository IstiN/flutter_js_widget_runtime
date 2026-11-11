// ANGLE 1B three.js animation spike (M4-preview): the FULL 1B stack running
// live — QuickJS hosts three.js r186, every frame crosses the WebGL2 facade
// -> g1_packer binary wire -> a1b_gl_dispatch C decoder -> ANGLE EGL/Metal
// -> IOSurface -> FlutterTexture (zero-copy). FPS / JS-render ms / wire
// calls per frame are measured on-screen.
//
// Sources (packer/facade/three) are loaded from the repo checkout by walking
// up from the app bundle, same discovery as _openShim.
//
// Run: cd example && flutter run -t lib/angle1b_three_spike.dart -d macos --release
import 'dart:async';
import 'dart:convert';
import 'dart:ffi';
import 'dart:io';
import 'package:ffi/ffi.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

const _channel = MethodChannel('angle_1b');
const _kW = 1280, _kH = 960;

void a1bDiag(String msg) => stderr.writeln('[a1b-three] $msg');

// ---- ANGLE 1B shim FFI -----------------------------------------------------
final class ThreeShim {
  ThreeShim(DynamicLibrary lib)
    : init = lib.lookupFunction<Int32 Function(), int Function()>('a1b_init'),
      createSurface = lib.lookupFunction<Int64 Function(Int32, Int32, Pointer<Uint32>), int Function(int, int, Pointer<Uint32>)>('a1b_create_surface'),
      makeCurrent = lib.lookupFunction<Int32 Function(Int64), int Function(int)>('a1b_make_current'),
      swapBuffers = lib.lookupFunction<Int32 Function(Int64), int Function(int)>('a1b_swap_buffers'),
      setFinishFlag = lib.lookupFunction<Void Function(Int32), void Function(int)>('a1b_set_finish_flag'),
      dispatch = lib.lookupFunction<Int64 Function(Pointer<Uint8>, Int32), int Function(Pointer<Uint8>, int)>('a1b_gl_dispatch'),
      result = lib.lookupFunction<Int32 Function(Pointer<Uint8>, Int32), int Function(Pointer<Uint8>, int)>('a1b_gl_result'),
      destroySurface = lib.lookupFunction<Void Function(Int64), void Function(int)>('a1b_destroy_surface'),
      shutdown = lib.lookupFunction<Void Function(), void Function()>('a1b_shutdown');

  final int Function() init;
  final int Function(int, int, Pointer<Uint32>) createSurface;
  final int Function(int) makeCurrent;
  final int Function(int) swapBuffers;
  final void Function(int) setFinishFlag;
  final int Function(Pointer<Uint8>, int) dispatch;
  final int Function(Pointer<Uint8>, int) result;
  final void Function(int) destroySurface;
  final void Function() shutdown;
}

DynamicLibrary _openShim() {
  final candidates = <String>[];
  var dir = File(Platform.resolvedExecutable).parent;
  for (var i = 0; i < 16; i++) {
    candidates.add('${dir.path}/native/angle/libangle_1b.dylib');
    dir = dir.parent;
  }
  candidates
    ..add('${Directory.current.path}/native/angle/libangle_1b.dylib')
    ..add('${Directory.current.path}/../native/angle/libangle_1b.dylib');
  for (final path in candidates) {
    if (File(path).existsSync()) return DynamicLibrary.open(path);
  }
  throw StateError('libangle_1b.dylib not found (candidates: $candidates)');
}

/// Walk up from the app bundle until `tool/three/gen/g1_packer.js` appears —
/// that directory is the repo root holding all JS sources.
String _findRepoRoot() {
  var dir = File(Platform.resolvedExecutable).parent;
  for (var i = 0; i < 16; i++) {
    if (File('${dir.path}/tool/three/gen/g1_packer.js').existsSync()) return dir.path;
    dir = dir.parent;
  }
  for (final base in [Directory.current.path, '${Directory.current.path}/..']) {
    if (File('$base/tool/three/gen/g1_packer.js').existsSync()) return base;
  }
  throw StateError('repo root (tool/three/gen/g1_packer.js) not found');
}

// ---- ESM transform (verbatim logic from tool/three/run_1b_render.dart) -----
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

// ---- JS bootstrap (DOM shims + __jsr1b_gl glue; animation scene) -----------
String bootstrapShim() => r'''
(function () {
  var g = globalThis;
  g.self = g;
  g.window = g;
  g.navigator = { userAgent: 'QuickJS 1B-three-spike', maxTouchPoints: 0 };
  g.devicePixelRatio = 1;
  g.innerWidth = 1280; g.innerHeight = 960;
  g.requestAnimationFrame = function (fn) { return 0; };
  g.cancelAnimationFrame = function (id) {};
  g.addEventListener = function () {};
  g.removeEventListener = function () {};
  g.matchMedia = function () { return { matches: false, addEventListener: function () {} }; };
  function makeCanvas() {
    var c = {
      width: 300, height: 150, style: {}, dataset: {},
      addEventListener: function () {},
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
  g.console = {
    log: function () { __jsr1b_console('log', Array.prototype.join.call(arguments, ' ')); },
    info: function () { __jsr1b_console('info', Array.prototype.join.call(arguments, ' ')); },
    warn: function () { __jsr1b_console('warn', Array.prototype.join.call(arguments, ' ')); },
    error: function () { __jsr1b_console('error', Array.prototype.join.call(arguments, ' ')); }
  };
  var B64 = '';
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
      if (c0 < 0 || c1 < 0 || c2 < 0 || c3 < 0) throw new Error('atob: invalid input');
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

// Animated scene: cube(s) driven by absolute time; optional RT ping-pong
// (same pipeline shape as the M3 acceptance scene, re-rendered per frame).
String sceneScript() => r'''
globalThis.__setup = (function () {
  try {
    var canvas = document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
    canvas.width = 1280; canvas.height = 960;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(1280, 960, false);
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, 1280 / 960, 0.1, 100);
    camera.position.z = 4;
    var light = new THREE.PointLight(0xffffff, 10, 0, 2);
    light.position.set(2, 3, 4);
    scene.add(light);
    var group = new THREE.Group();
    scene.add(group);
    var geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    var mat = new THREE.MeshNormalMaterial();
    var cubeCount = 0;
    function setCubes(n) {
      while (group.children.length) group.remove(group.children[0]);
      cubeCount = n;
      if (n === 1) {
        group.add(new THREE.Mesh(geo, mat));
      } else {
        var side = Math.ceil(Math.cbrt(n));
        var k = 0;
        for (var x = 0; x < side && k < n; x++)
          for (var y = 0; y < side && k < n; y++)
            for (var z = 0; z < side && k < n; z++, k++) {
              var m = new THREE.Mesh(geo, mat);
              m.position.set((x - (side - 1) / 2) * 1.6, (y - (side - 1) / 2) * 1.6, (z - (side - 1) / 2) * 1.6);
              group.add(m);
            }
      }
    }
    setCubes(1);
    // RT ping-pong pipeline (matches M3 acceptance scene shape).
    var rtOpts = { format: THREE.RGBAFormat, type: THREE.UnsignedByteType,
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true };
    var rtA = new THREE.WebGLRenderTarget(1280, 960, rtOpts);
    var rtB = new THREE.WebGLRenderTarget(1280, 960, rtOpts);
    var quadScene = new THREE.Scene();
    var quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, uGain: { value: 0.9 } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D tDiffuse; uniform float uGain; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tDiffuse, vUv).rgb * uGain, 1.0); }',
      depthTest: false, depthWrite: false
    }));
    quadScene.add(quad);
    var rtFx = false;
    globalThis.__setRtFx = function (on) { rtFx = !!on; };
    globalThis.__setCubes = function (n) { setCubes(n | 0); };
    globalThis.__tick = function (tMs) {
      var t = tMs * 0.001;
      group.rotation.y = t * 0.9;
      group.rotation.x = t * 0.5;
      renderer.render(scene, camera);
      if (rtFx) {
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
      }
    };
    return JSON.stringify({ ok: true, revision: THREE.REVISION });
  } catch (e) {
    return JSON.stringify({ ok: false, error: String(e && e.stack ? e.stack : e) });
  }
})();
''';


void main() => runApp(const ThreeSpikeApp());

class ThreeSpikeApp extends StatefulWidget {
  const ThreeSpikeApp({super.key});

  @override
  State<ThreeSpikeApp> createState() => _ThreeSpikeAppState();
}

class _ThreeSpikeAppState extends State<ThreeSpikeApp> {
  late final ThreeShim _gl;
  QuickjsRuntime? _rt;
  int _surface = 0;
  int _textureId = -1;
  String _status = 'booting QuickJS + three.js…';
  bool _rtFx = false;
  int _cubes = 1;
  bool _finishFlag = true;

  // FPS accounting.
  Timer? _pump, _fpsTimer;
  final Stopwatch _clock = Stopwatch();
  int _totalFrames = 0; // cumulative frames
  double _fps = 0;
  double _jsMs = 0; // avg JS render+wire ms per frame
  int _wireCallsTotal = 0; // cumulative wire calls
  int _wireCallsPerFrame = 0;
  String? _error;

  @override
  void initState() {
    super.initState();
    _start();
  }

  Future<void> _start() async {
    try {
      _gl = ThreeShim(_openShim());
      if (_gl.init() != 0) throw StateError('a1b_init failed');
      _gl.setFinishFlag(1);
      final iosurfaceId = calloc<Uint32>();
      _surface = _gl.createSurface(_kW, _kH, iosurfaceId);
      if (_surface <= 0) throw StateError('a1b_create_surface failed');
      final surfaceIoId = iosurfaceId.value;
      calloc.free(iosurfaceId);
      final texture = await _channel.invokeMethod<Map<dynamic, dynamic>>('createSurface', [surfaceIoId, _kW, _kH]);
      if (texture == null) throw StateError('plugin createSurface returned null');
      _textureId = (texture['textureId'] as num?)?.toInt() ?? -1;
      if (_gl.makeCurrent(_surface) != 0) throw StateError('a1b_make_current failed');

      final repo = _findRepoRoot();
      a1bDiag('repo root: $repo');
      _rt = _bootEngine(repo);
      _status = 'running — three.js r186 through the 1B stack';

      _clock.start();
      _pump = Timer.periodic(const Duration(milliseconds: 1), (_) => _pumpFrame());
      _fpsTimer = Timer.periodic(const Duration(milliseconds: 500), (_) => _reportFps());
      setState(() {});
    } catch (e) {
      a1bDiag('boot error: $e');
      setState(() {
        _status = 'error';
        _error = '$e';
      });
    }
  }

  // Two-call read of the 64 KB C scratch (a1b_gl_result).
  Uint8List _readScratch() {
    final len = _gl.result(nullptr.cast(), 0);
    if (len <= 0) return Uint8List(0);
    final n = len > 65536 ? 65536 : len;
    final buf = calloc<Uint8>(n);
    try {
      final actual = _gl.result(buf, n);
      if (actual <= 0) return Uint8List(0);
      return Uint8List.fromList(buf.asTypedList(actual > n ? n : actual).toList());
    } finally {
      calloc.free(buf);
    }
  }

  QuickjsRuntime _bootEngine(String repo) {
    final rt = QuickjsRuntime();
    var lastRc = 0;
    final err = <String?>[];
    final bytesOk = rt.registerHostBytesFn('__jsr1b_gl_bytes', (name, data) {
      _wireCallsTotal++;
      final buf = calloc<Uint8>(data.length);
      try {
        buf.asTypedList(data.length).setAll(0, data);
        lastRc = _gl.dispatch(buf, data.length).toInt();
      } finally {
        calloc.free(buf);
      }
      if (lastRc == -2147483647) throw StateError('dispatch: no current surface');
    });
    if (!bytesOk) throw StateError('quickjs bridge lacks bytes lane');
    rt.registerHostFunction('__jsr1b_gl_rc', (_) => '$lastRc');
    rt.registerHostFunction('__jsr1b_console', (argsJson) {
      final a = jsonDecode(argsJson) as List;
      stderr.writeln('[js.${a[0]}] ${a[1]}');
      return null;
    });
    rt.registerHostFunction('__jsr1b_result_host', (_) => jsonEncode(base64Encode(_readScratch())));

    String? evalOrThrow(String code, String filename) {
      final r = rt.eval(code, filename: filename, errMsg: err);
      if (err.isNotEmpty && err.first != null) throw StateError('eval $filename failed: ${err.first}');
      err.clear();
      return r;
    }

    final sources = <(String, String)>[
      (bootstrapShim(), 'bootstrap.js'),
      (wrapThreeCore(File('$repo/example/web/three.core.js').readAsStringSync()), 'three.core.js'),
      (wrapThreeModule(File('$repo/example/web/jsr_three_web.js').readAsStringSync()), 'jsr_three_web.js'),
      (File('$repo/tool/three/gen/g1_packer.js').readAsStringSync(), 'g1_packer.js'),
      (File('$repo/tool/three/src/webgl2_facade.js').readAsStringSync(), 'webgl2_facade.js'),
      (sceneScript(), 'scene.js'),
    ];
    String? resultJson;
    for (final (code, name) in sources) {
      resultJson = evalOrThrow(code, name);
    }
    var decoded = jsonDecode(resultJson ?? '{}');
    if (decoded is String) decoded = jsonDecode(decoded); // eval wraps string results
    final result = decoded as Map<String, dynamic>;
    if (result['ok'] != true) throw StateError('scene setup failed: ${result['error']}');
    a1bDiag('scene ok, three revision=${result['revision']}');
    return rt;
  }

  int _pumpLogCount = 0;
  void _pumpFrame() {
    final rt = _rt;
    if (rt == null || _surface <= 0 || _error != null) return;
    if (_pumpLogCount < 3) a1bDiag('pump #${_pumpLogCount++} at ${_clock.elapsedMilliseconds}ms');
    final err = <String?>[];
    final sw = Stopwatch()..start();
    try {
      rt.eval('__tick(${_clock.elapsedMicroseconds ~/ 1000})', filename: 'tick', errMsg: err);
      if (err.isNotEmpty && err.first != null) throw StateError('tick: ${err.first}');
      if (_gl.swapBuffers(_surface) != 0) throw StateError('swap failed');
      unawaited(_channel.invokeMethod<void>('frameAvailable', [_textureId]));
      _totalFrames++;
      _jsMs = _jsMs * 0.9 + sw.elapsedMicroseconds / 1000 * 0.1;
    } catch (e) {
      _error = '$e';
      _pump?.cancel();
      setState(() => _status = 'frame error');
    }
  }

  int _windowStartFrames = 0;
  int _windowStartCalls = 0;

  int _mode = 0;
  void _reportFps() {
    final framesInWindow = _totalFrames - _windowStartFrames;
    final callsInWindow = _wireCallsTotal - _windowStartCalls;
    final fps = framesInWindow * 2.0; // 500 ms window
    _wireCallsPerFrame = framesInWindow > 0 ? callsInWindow ~/ framesInWindow : 0;
    _windowStartFrames = _totalFrames;
    _windowStartCalls = _wireCallsTotal;
    a1bDiag('fps=${fps.toStringAsFixed(0)} jsMs=${_jsMs.toStringAsFixed(2)} wire=$_wireCallsPerFrame/f cubes=$_cubes rtFx=$_rtFx finish=$_finishFlag');
    setState(() => _fps = fps);
    // mode auto-cycle: 0 base -> 1 rtFx -> 2 +64 cubes -> 3 finish off -> hold
    final sec = _clock.elapsedMilliseconds ~/ 1000;
    final want = sec < 8 ? 0 : sec < 16 ? 1 : 2;
    if (want != _mode) {
      _mode = want;
      if (want >= 1 && !_rtFx) _setRtFx(true);
      if (want >= 2 && _cubes == 1) _setCubes(64);
    }
  }

  Future<void> _setRtFx(bool on) async {
    _rt?.eval('__setRtFx(${on ? 1 : 0})', errMsg: []);
    setState(() => _rtFx = on);
  }

  Future<void> _setCubes(int n) async {
    _rt?.eval('__setCubes($n)', errMsg: []);
    setState(() => _cubes = n);
  }

  Future<void> _setFinishFlag(bool on) async {
    _gl.setFinishFlag(on ? 1 : 0);
    setState(() => _finishFlag = on);
  }

  @override
  void dispose() {
    _pump?.cancel();
    _fpsTimer?.cancel();
    _rt?.close();
    if (_textureId >= 0) unawaited(_channel.invokeMethod<void>('destroySurface', [_textureId]));
    if (_surface > 0) _gl.destroySurface(_surface);
    _gl.shutdown();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true),
      home: Scaffold(
        backgroundColor: const Color(0xFF0F172A),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                decoration: BoxDecoration(border: Border.all(color: Colors.white24)),
                width: 960,
                height: 720,
                child: _textureId >= 0
                    ? Texture(textureId: _textureId)
                    : const Center(child: CircularProgressIndicator()),
              ),
              const SizedBox(height: 12),
              Text(
                '${_fps.toStringAsFixed(0)} FPS   ·   js+wire ${_jsMs.toStringAsFixed(2)} ms/frame   ·   wire ~${_wireCallsPerFrame ~/ 1}/frame',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(_error ?? _status, style: const TextStyle(fontSize: 12, color: Colors.white70)),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                alignment: WrapAlignment.center,
                children: [
                  FilterChip(
                    label: Text('RT ping-pong fx: ${_rtFx ? 'ON' : 'OFF'}'),
                    selected: _rtFx,
                    onSelected: (v) => _setRtFx(v),
                  ),
                  FilterChip(
                    label: Text('cubes: $_cubes'),
                    selected: _cubes > 1,
                    onSelected: (v) => _setCubes(v ? 64 : 1),
                  ),
                  FilterChip(
                    label: Text('glFinish: ${_finishFlag ? 'ON' : 'OFF'}'),
                    selected: _finishFlag,
                    onSelected: (v) => _setFinishFlag(v),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
