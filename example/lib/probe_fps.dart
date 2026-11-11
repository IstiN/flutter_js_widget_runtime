/// Interactive-fps probe for prepared three.js widgets: boots one widget
/// full-screen in a real macOS window (Impeller + QuickJS), samples TWO
/// presented-fps windows — static, then under a synthetic ~125 Hz
/// pointermove storm — prints both plus the surface diagnostics and
/// (JSR_OUT) a RepaintBoundary PNG capture, then exits.
///
/// Proof lane for the BatchedMesh proxy-raycast stub: with the stub the
/// storm window must hold >= 60 fps; JSR_NO_STUB=1 re-arms the default
/// InstancedMesh raycast on every renderer proxy to reproduce the pre-fix
/// collapse (measured 120 → 0-4 fps) inside the same binary.
///
/// Build + run from example/:
///   flutter build macos --release -t lib/probe_fps.dart
///   JSR_WIDGET=three-batch-lod-bvh JSR_OUT=/tmp/probe.png \
///     build/macos/Build/Products/Release/js_widget_runtime_example.app/Contents/MacOS/js_widget_runtime_example
///
/// JSR_WIDGET_PATH loads widget.js straight from disk (synthetic probes,
/// fast iteration); JSR_CAMERA_LOG appends the diagnostics lines to a file.
library;

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/rendering.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
// ignore: implementation_imports
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_host.dart'
    show FlutterGpuThreeSurface;
// ignore: implementation_imports
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'three_widget_assets.dart';

final _kWidget = Platform.environment['JSR_WIDGET'] ?? '';
final _kWidgetPath = Platform.environment['JSR_WIDGET_PATH'] ?? '';
final _kOut = Platform.environment['JSR_OUT'] ?? '';
final _kNoStub = Platform.environment['JSR_NO_STUB'] == '1';
final _kStorm = Platform.environment['JSR_STORM'] == '1';
// Attribution flag: short-circuit Raycaster.intersectObject so the storm
// measures everything EXCEPT the official module's own BVH hover raycast.
final _kSkipRaycast = Platform.environment['JSR_SKIP_RAYCAST'] == '1';
final _kRafTrace = Platform.environment['JSR_RAF_TRACE'] == '1';

void probeDiag(String line) {
  // ignore: avoid_print
  print(line);
  final path = Platform.environment['JSR_CAMERA_LOG'];
  if (path == null || path.isEmpty) return;
  try {
    File(path).writeAsStringSync(
      '${DateTime.now().toIso8601String()} $line\n',
      mode: FileMode.append,
    );
  } catch (_) {}
}

Future<String> _loadWidgetJs() {
  if (_kWidgetPath.isNotEmpty) return File(_kWidgetPath).readAsString();
  return rootBundle.loadString('widgets/$_kWidget/widget.js');
}

/// Re-arms the DEFAULT InstancedMesh raycast on every renderer proxy
/// (userData.jsrBatchedMeshProxy) so the pre-fix raycast storm reproduces
/// inside this binary: prepended to the widget source before eval.
const _kNoStubPrelude = '''
(function(){
if(!globalThis.THREE||!THREE.Object3D) return;
var def=THREE.InstancedMesh&&THREE.InstancedMesh.prototype?
THREE.InstancedMesh.prototype.raycast:null;
if(!def) return;
var origAdd=THREE.Object3D.prototype.add;
THREE.Object3D.prototype.add=function(child){
var r=origAdd.apply(this,arguments);
try{if(child&&child.userData&&child.userData.jsrBatchedMeshProxy){
child.raycast=def;}}catch(e){}
return r;
};
})();
''';

/// JSR_RAF_TRACE=1: wrap the runtime's RAF/setAnimationLoop so per-tick JS
/// errors surface as [raf-trace] console lines instead of dying silently.
const _kRafTracePrelude = '''
(function(){
var __origRaf=globalThis.requestAnimationFrame;
if(typeof __origRaf==='function'){
  globalThis.requestAnimationFrame=function(cb){
    if(typeof cb!=='function')return __origRaf(cb);
    return __origRaf(function(ms){
      try{cb(ms);}catch(e){
        console.log('[raf-trace] tick error: '+(e&&e.message?e.message:e));
        throw e;
      }
    });
  };
}
if(THREE&&THREE.WebGLRenderer&&THREE.WebGLRenderer.prototype){
  var rp=THREE.WebGLRenderer.prototype;
  var origLoop=rp.setAnimationLoop;
  if(origLoop){
    rp.setAnimationLoop=function(cb){
      if(typeof cb==='function'){
        var wrapped=function(ms){
          try{cb(ms);}catch(e){
            console.log('[raf-trace] loop error: '+(e&&e.message?e.message:e));
            throw e;
          }
        };
        return origLoop.call(this,wrapped);
      }
      return origLoop.call(this,cb);
    };
  }
}
})();
''';

/// Attribution probe (JSR_SKIP_RAYCAST=1): returns an empty hit list from
/// every Raycaster.intersectObject call so the storm window measures the
/// input lane + render loop without the official module's BVH hover raycast.
const _kSkipRaycastPrelude = '''
(function(){
if(!globalThis.THREE||!THREE.Raycaster) return;
THREE.Raycaster.prototype.intersectObject=function(){return [];};
})();
''';

/// JSR_R1_TIMING=1: per-window renderer timing export. Wraps the R1
/// renderer's frame path and re-exports cumulative counters through
/// jsr.exportProbe so the probe can attach renderMs/renderN/loopMs/loopN/
/// fastNodeMs/fastNodeN to each measurement window.
const _kR1TimingPrelude = '''
(function(){
if(!globalThis.THREE||!THREE.WebGLRenderer) return;
var rp=THREE.WebGLRenderer.prototype;
if(!rp.render) return;
var acc=globalThis.__jsrR1Acc={renderMs:0,renderN:0,loopMs:0,loopN:0,fastNodeMs:0,fastNodeN:0};
var origRender=rp.render;
rp.render=function(scene,camera){
  var t0=Date.now();
  try{ return origRender.call(this,scene,camera); }
  finally{ acc.renderMs+=Date.now()-t0; acc.renderN++; }
};
var origLoop=rp.setAnimationLoop;
if(origLoop){
  rp.setAnimationLoop=function(cb){
    if(typeof cb!=='function') return origLoop.call(this,cb);
    return origLoop.call(this,function(ms){
      var t0=Date.now();
      try{ return cb(ms); }
      finally{ acc.loopMs+=Date.now()-t0; acc.loopN++; }
    });
  };
}
var __jsr=globalThis.jsr;
if(__jsr&&typeof __jsr.exportState==='function'){
  var origExport=__jsr.exportState;
  __jsr.exportState=function(st){
    st=st||{};
    try{ st.probe={renderMs:acc.renderMs,renderN:acc.renderN,loopMs:acc.loopMs,loopN:acc.loopN,fastNodeMs:acc.fastNodeMs,fastNodeN:acc.fastNodeN}; }catch(e){}
    return origExport.call(__jsr,st);
  };
}
})();
''';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true),
      home: Scaffold(
        backgroundColor: const Color(0xFF0F172A),
        body: FutureBuilder<String>(
          future: _loadWidgetJs(),
          builder: (context, snap) {
            if (snap.hasError) {
              return Center(child: Text('missing widget $_kWidget'));
            }
            if (!snap.hasData) {
              return const Center(child: CircularProgressIndicator());
            }
            return _ProbeFrame(
              jsSource: '${_kRafTrace ? "$_kRafTracePrelude\n" : ''}$_kR1TimingPrelude\n${_kSkipRaycast
                  ? '$_kSkipRaycastPrelude\n${snap.data!}'
                  : _kNoStub
                  ? '$_kNoStubPrelude\n${snap.data!}'
                  : snap.data!}',
            );
          },
        ),
      ),
    ),
  );
}

class _ProbeFrame extends StatefulWidget {
  const _ProbeFrame({required this.jsSource});

  final String jsSource;

  @override
  State<_ProbeFrame> createState() => _ProbeFrameState();
}

class _ProbeFrameState extends State<_ProbeFrame> {
  final _boundaryKey = GlobalKey();
  final Stopwatch _clock = Stopwatch()..start();
  JsThreeHost? _threeHost;
  JsWidgetEngine? _engine;
  Map<String, dynamic>? _tree;
  int _window = 0;
  int? _windowStartFrames;
  int _windowStartMs = 0;
  Timer? _stormTimer;
  int _bootStablePresented = -1;
  int _bootStableSinceMs = 0;
  int _stormEvents = 0;
  int _stormDispatchUs = 0;
  double _stormPhase = 0;
  bool _stormActive = false;
  bool _stormDone = false;

  @override
  void initState() {
    super.initState();
    // Safety exit: never wedge a probe run past 60s.
    Timer(const Duration(seconds: 60), () => exit(7));
    Timer.periodic(const Duration(milliseconds: 100), (timer) {
      final surface = _surface;
      final presented = surface?.diagnostics['presentedFrames'] ?? 0;
      // Render-on-demand widgets (webgl_clipping_intersection and the other
      // GUI-driven examples) present exactly once at boot and then wait for
      // input; requiring presented>=3 deadlocks the probe before the storm
      // window can drive them. A stable single presented frame for 3s is a
      // valid boot for that class: the storm window measures their
      // event-driven presented fps.
      final stable = presented >= 1 &&
          presented == _bootStablePresented &&
          _clock.elapsedMilliseconds - _bootStableSinceMs > 3000;
      if (presented != _bootStablePresented) {
        _bootStablePresented = presented is int ? presented : int.tryParse('$presented') ?? 0;
        _bootStableSinceMs = _clock.elapsedMilliseconds;
      }
      if (presented >= 3 || stable) {
        timer.cancel();
        // Sweep metric: boot-to-first-presented-frame.
        probeDiag(
          'THREE probe boot: ${jsonEncode({'bootMs': _clock.elapsedMilliseconds, 'presentedFrames': presented, 'onDemand': presented < 3})}',
        );
        _startWindow();
      } else if (_clock.elapsedMilliseconds > 45000) {
        timer.cancel();
        probeDiag('THREE probe: timeout (presentedFrames=$presented)');
        // PUMPDBG lane: capture the backend image before exiting.
        Future<void>(() async {
          try {
            final direct = await _surface?.capture();
            if (direct != null) {
              File('/tmp/bloom_backend_image.png')
                  .writeAsBytesSync(direct);
              probeDiag('THREE probe: backend image ${direct.lengthInBytes}B');
            } else {
              probeDiag('THREE probe: backend image NULL');
            }
          } catch (e) {
            probeDiag('THREE probe: backend image error $e');
          }
          exit(6);
        });
        return;
      }
    });
  }

  FlutterGpuThreeSurface? get _surface =>
      _threeHost?.findSurface('probe-$_kWidget', 'main#1')
          as FlutterGpuThreeSurface?;

  void _startWindow() {
    final presented = _surface?.diagnostics['presentedFrames'] ?? 0;
    if (_windowStartFrames == null) {
      // Window A: static (no input).
      _window = 0;
      _windowStartFrames = presented.toInt();
      _windowStartMs = _clock.elapsedMilliseconds;
      Timer(const Duration(seconds: 2), _finishWindow);
      return;
    }
    // Window B: storm (if enabled), otherwise mirror window A.
    if (_kStorm && !_stormActive && !_stormDone) {
      _window = 1;
      _stormActive = true;
      _stormDone = true;
      _windowStartFrames = presented.toInt();
      _windowStartMs = _clock.elapsedMilliseconds;
      _stormTimer = Timer.periodic(const Duration(milliseconds: 8), (t) {
        _stormPhase += 0.35;
        final x = (400 + 300 * _stormPhase) % 700;
        final y = 150 + 250 * (0.5 + 0.5 * (_stormPhase % 1));
        final sw = Stopwatch()..start();
        // 4 back-to-back events per tick (~100 Hz): real OS mice flood the
        // pointer channel between frames; a single event per tick would be
        // frame-rate limited and never reproduce a handler-cost collapse.
        for (var i = 0; i < 4; i++) {
          _engine?.dispatchHostEvent('three.input:main', <String, dynamic>{
            'type': 'pointermove',
            'pointerId': 7,
            'pointerType': 'mouse',
            'isPrimary': true,
            'button': 0,
            'buttons': 0,
            'clientX': x + i,
            'clientY': y,
            'pageX': x + i,
            'pageY': y,
          });
        }
        _stormDispatchUs += sw.elapsedMicroseconds;
        _stormEvents += 4;
      });
      Timer(const Duration(seconds: 2), _finishWindow);
      return;
    }
    _captureAndExit();
  }

  void _finishWindow() {
    _stormTimer?.cancel();
    _stormActive = false;
    final presented = _surface?.diagnostics['presentedFrames'] ?? 0;
    final elapsedMs = _clock.elapsedMilliseconds - _windowStartMs;
    final fps =
        (presented - (_windowStartFrames ?? 0)) *
        1000 /
        (elapsedMs < 1 ? 1 : elapsedMs);
    probeDiag(
      'THREE probe: ${jsonEncode({'window': _window == 0 ? 'static' : 'storm', 'presentedFps': double.parse(fps.toStringAsFixed(1)), 'sampleMs': elapsedMs, 'stormEvents': _stormEvents, 'dispatchMsPerEvent': _stormEvents == 0 ? 0.0 : double.parse((_stormDispatchUs / _stormEvents / 1000).toStringAsFixed(2)), 'noStub': _kNoStub, 'skipRaycast': _kSkipRaycast})}',
    );
    _startWindow();
  }

  Future<void> _captureAndExit() async {
    final surface = _surface;
    probeDiag('THREE probe diagnostics: ${surface?.diagnostics}');
    // Widget self-reported status (cinematic-style widgets exportState their
    // lane/error status) — sweep error signal.
    try {
      final exported = _engine?.exportedState;
      if (exported != null) {
        final status = exported['status'];
        if (status != null) probeDiag('THREE probe widgetStatus: $status');
      }
    } catch (_) {}
    // TEMPORARY attribution lane: dump the JS-side R1 timing accumulator.
    try {
      final exported = _engine?.exportedState;
      probeDiag('THREE probe r1timing: ${exported?['probe']}');
    } catch (e) {
      probeDiag('THREE probe r1timing error: $e');
    }
    // Direct backend-image capture (PUMPDBG lane): what did the GPU render?
    try {
      final direct = await surface?.capture();
      if (direct != null) {
        File('/tmp/bloom_backend_image.png').writeAsBytesSync(direct);
        probeDiag('THREE probe: backend image ${direct.lengthInBytes}B');
      } else {
        probeDiag('THREE probe: backend image NULL');
      }
    } catch (e) {
      probeDiag('THREE probe: backend image error $e');
    }
    var exitCode = 0;
    try {
      if (_kOut.isNotEmpty) {
        await Future<void>.delayed(const Duration(milliseconds: 400));
        final boundary = _boundaryKey.currentContext?.findRenderObject();
        if (boundary is RenderRepaintBoundary) {
          final image = await boundary.toImage(pixelRatio: 2.0);
          final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
          if (bytes != null) {
            await File(
              _kOut,
            ).writeAsBytes(bytes.buffer.asUint8List(), flush: true);
            probeDiag('probe png written: $_kOut');
          }
          image.dispose();
        } else {
          exitCode = 3;
        }
      }
    } finally {
      await _engine?.dispose();
      exit(exitCode);
    }
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      key: _boundaryKey,
      child: Container(
        color: const Color(0xFF0F172A),
        child: _tree == null
            ? const Center(child: CircularProgressIndicator())
            : JsonWidgetRenderer(
                onEvent: (_, _) {},
                threeHost: _threeHost,
                onThreeEvent: (canvasId, payload) => _engine?.dispatchHostEvent(
                  'three.input:$canvasId',
                  payload,
                ),
                voxelWorld: _engine?.voxelWorld,
              ).build(_tree),
      ),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _startEngine();
  }

  Future<void> _startEngine() async {
    if (_engine != null) return;
    final threeHost = _kWidget.startsWith('three-')
        ? createFlutterGpuThreeHost(
            assetLoader: WidgetBundleThreeAssets.forWidget(_kWidget).load,
          )
        : null;
    _threeHost = threeHost;
    final config = JsRuntimeConfig(
      widgetId: _kWidget,
      instanceId: 'probe-$_kWidget',
      threeEnabled: threeHost != null,
      threeHost: threeHost,
      onRender: (tree) {
        if (mounted) setState(() => _tree = tree);
      },
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
    );
    // JSR_ISOLATE=1: worker-isolate backend (the catalog app lane) instead
    // of the direct in-process QuickJS backend.
    final backend = Platform.environment['JSR_ISOLATE'] == '1'
        ? createQuickjsIsolateWidgetEngineBackend(config)
        : QuickjsWidgetEngineBackend(config: config);
    final engine = JsWidgetEngine(config: config.copyWith(backend: backend));
    _engine = engine;
    await engine.init();
    await engine.run(widget.jsSource).catchError((Object error) {
      probeDiag('THREE probe runError: $error');
    });
  }
}
