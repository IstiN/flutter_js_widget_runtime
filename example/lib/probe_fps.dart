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
final _kQueue = Platform.environment['JSR_QUEUE'] ?? '';
final _kNoStub = Platform.environment['JSR_NO_STUB'] == '1';
final _kStorm = Platform.environment['JSR_STORM'] == '1';
// Keep the second measurement window but leave it free for a real macOS
// window-drag stressor instead of injecting synthetic pointer events.
final _kOsStorm = Platform.environment['JSR_OS_STORM'] == '1';
final _kWindowSeconds =
    int.tryParse(Platform.environment['JSR_WINDOW_SECONDS'] ?? '') ?? 2;
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

Future<String> _loadWidgetJs(String id) {
  if (_kWidgetPath.isNotEmpty) return File(_kWidgetPath).readAsString();
  return rootBundle.loadString('widgets/$id/widget.js');
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
globalThis.__JSR_R1_STAGES=1;
globalThis.__JSR_BATCH_DEBUG=1;
globalThis.__JSR_R1PROBE={};
if(!globalThis.THREE||!THREE.WebGLRenderer) return;
var rp=THREE.WebGLRenderer.prototype;
if(!rp.render) return;
var acc=globalThis.__jsrR1Acc={renderMs:0,renderN:0,loopMs:0,loopN:0,fastNodeMs:0,fastNodeN:0,
  sendMs:0,sendN:0,worldMs:0,worldN:0,walkMs:0,walkN:0,stageN:0,stageWorld:0,stageWalk:0,stageFlush:0,stageEmit:0,
  batchGroups:0,batchMembers:0,batchEvictA:0,batchEvictB:0,batchJoins:0,
  batchWalkCalls:0,batchRejMesh:0,batchRejKind:0,batchRejVis:0,batchRejElig:0,batchRejGeom:0,batchRejKey:0,batchRejGroup:0,
  eligFlag:0,eligKind:0,eligBlend:0,eligMap:0,eligClip:0};
var now=globalThis.performance&&performance.now?function(){return performance.now();}:function(){return Date.now();};
var __profileNames=[['_ensureGeometry','geoMs'],['_uploadAttribute','attrMs'],['_adaptDrawable','adaptMs'],['_geometrySignatureCached','sigMs'],['_ensureMaterial','matMs'],['_ensureNode','nodeMs']];
__profileNames.forEach(function(pair){
  var original=rp[pair[0]]; if(typeof original!=='function') return;
  acc[pair[1]]=0; acc[pair[1]+'N']=0;
  rp[pair[0]]=function(){ var t0=now(); try{ return original.apply(this,arguments); }
    finally{ acc[pair[1]]+=now()-t0; acc[pair[1]+'N']++; } };
});
var origRender=rp.render;
rp.render=function(scene,camera){
  var t0=now();
  try{ return origRender.call(this,scene,camera); }
  finally{
    acc.renderMs+=now()-t0; acc.renderN++;
    try{
      var st=this._stageSum;
      if(st&&st.n!==acc.stageN){ acc.stageN=st.n; acc.stageWorld=st.worldMs; acc.stageWalk=st.walkMs;
        acc.stageFlush=st.flushMs; acc.stageEmit=st.emitMs; }
      var bd=this._batchDiag;
      if(bd){ acc.batchGroups=bd.groups; acc.batchMembers=bd.members; acc.batchEvictA=bd.evictA;
        acc.batchEvictB=bd.evictB; acc.batchJoins=bd.joins; acc.batchWalkCalls=bd.walkCalls;
        acc.batchRejMesh=bd.rejectMesh; acc.batchRejKind=bd.rejectKind; acc.batchRejVis=bd.rejectVisible;
        acc.batchRejElig=bd.rejectEligible; acc.batchRejGeom=bd.rejectGeom; acc.batchRejKey=bd.rejectKey;
        acc.batchRejGroup=bd.rejectGroup;
        acc.eligFlag=bd.eligFlag||0; acc.eligKind=bd.eligKind||0; acc.eligBlend=bd.eligBlend||0;
        acc.eligMap=bd.eligMap||0; acc.eligClip=bd.eligClip||0; }
    }catch(e){}
  }
};
var osp=rp._sendCommands;
if(osp){ rp._sendCommands=function(){ var t0=now();
  try{ return osp.apply(this,arguments); }
  finally{ acc.sendMs+=now()-t0; acc.sendN++; } }; }
var oumw=THREE.Object3D&&THREE.Object3D.prototype&&THREE.Object3D.prototype.updateMatrixWorld;
if(oumw){ THREE.Object3D.prototype.updateMatrixWorld=function(){ var t0=now();
  try{ return oumw.apply(this,arguments); }
  finally{ acc.worldMs+=now()-t0; acc.worldN++; } }; }
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
    try{ st.probe={renderMs:acc.renderMs,renderN:acc.renderN,loopMs:acc.loopMs,loopN:acc.loopN,fastNodeMs:acc.fastNodeMs,fastNodeN:acc.fastNodeN,sendMs:acc.sendMs,sendN:acc.sendN,worldMs:acc.worldMs,worldN:acc.worldN,stageN:acc.stageN,stageWorld:acc.stageWorld,stageWalk:acc.stageWalk,stageFlush:acc.stageFlush,stageEmit:acc.stageEmit,batchGroups:acc.batchGroups,batchMembers:acc.batchMembers,batchEvictA:acc.batchEvictA,batchEvictB:acc.batchEvictB,batchJoins:acc.batchJoins,batchWalkCalls:acc.batchWalkCalls,batchRejMesh:acc.batchRejMesh,batchRejKind:acc.batchRejKind,batchRejVis:acc.batchRejVis,batchRejElig:acc.batchRejElig,batchRejGeom:acc.batchRejGeom,batchRejKey:acc.batchRejKey,batchRejGroup:acc.batchRejGroup,eligFlag:acc.eligFlag,eligKind:acc.eligKind,eligBlend:acc.eligBlend,eligMap:acc.eligMap,eligClip:acc.eligClip}; st.probe.fast=globalThis.__JSR_R1PROBE; __profileNames.forEach(function(pair){ st.probe[pair[1]]=acc[pair[1]]||0; st.probe[pair[1]+'N']=acc[pair[1]+'N']||0; }); }catch(e){}
    return origExport.call(__jsr,st);
  };
}
})();
''';

/// Friendly fallback for an id whose assets are absent from this build
/// (e.g. a Release build made before `prepare` finished): states the problem
/// instead of a bare dead-end string.
class _MissingWidgetCard extends StatelessWidget {
  const _MissingWidgetCard({required this.id});

  final String id;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, size: 40, color: Colors.amber),
          const SizedBox(height: 12),
          Text('Widget unavailable in this build: $id',
              style: const TextStyle(fontSize: 16)),
          const SizedBox(height: 6),
          const Text(
            'Rebuild the example app so all prepared widgets are embedded.',
            style: TextStyle(fontSize: 12, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // Resident sweep mode: JSR_QUEUE names a file of widget ids (one per
  // line); the app boots each in turn inside ONE window (a macOS instance
  // can refuse per-widget relaunches when new windows cannot become
  // visible), consuming the queue head-first, then exits when it empties.
  if (_kQueue.isNotEmpty) {
    runApp(
      MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: ThemeData.dark(useMaterial3: true),
        home: const _QueueHost(),
      ),
    );
    return;
  }
  runApp(
    MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true),
      home: Scaffold(
        backgroundColor: const Color(0xFF0F172A),
        body: FutureBuilder<String>(
          future: _loadWidgetJs(_kWidget),
          builder: (context, snap) {
            if (snap.hasError) {
              return _MissingWidgetCard(id: _kWidget);
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

/// Consumes [JSR_QUEUE] head-first, booting one [_ProbeFrame] per id in
/// this same window. Results stream to JSR_CAMERA_LOG in order, delimited
/// by `THREE probe widgetBegin/End` markers.
class _QueueHost extends StatefulWidget {
  const _QueueHost();

  @override
  State<_QueueHost> createState() => _QueueHostState();
}

class _QueueHostState extends State<_QueueHost> {
  String? _current;

  @override
  void initState() {
    super.initState();
    _advance();
  }

  void _advance() {
    List<String> lines;
    try {
      final q = File(_kQueue);
      if (!q.existsSync()) { exit(4); return; }
      lines = q
          .readAsStringSync()
          .split('\n')
          .where((l) => l.trim().isNotEmpty)
          .toList();
    } catch (_) {
      exit(4);
      return;
    }
    if (lines.isEmpty) { exit(0); return; }
    final id = lines.first.trim();
    try {
      File(_kQueue).writeAsStringSync(lines.skip(1).join('\n'));
    } catch (_) {}
    if (!mounted) { exit(0); return; }
    setState(() => _current = id);
  }

  @override
  Widget build(BuildContext context) {
    final id = _current;
    if (id == null) {
      return const Scaffold(
        backgroundColor: Color(0xFF0F172A),
        body: Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: FutureBuilder<String>(
        // ignore: discarded_futures
        future: _loadWidgetJs(id),
        builder: (context, snap) {
          if (snap.hasError) {
            probeDiag('THREE probe widgetBegin: $id');
            probeDiag('THREE probe widgetEnd: $id missing-widget');
            WidgetsBinding.instance.addPostFrameCallback((_) => _advance());
            return _MissingWidgetCard(id: id);
          }
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          return _ProbeFrame(
            key: ValueKey(id),
            widgetId: id,
            jsSource:
                '${_kRafTrace ? "$_kRafTracePrelude\n" : ''}$_kR1TimingPrelude\n${_kSkipRaycast
                    ? '$_kSkipRaycastPrelude\n${snap.data!}'
                    : _kNoStub
                    ? '$_kNoStubPrelude\n${snap.data!}'
                    : snap.data!}',
            onDone: (_) => _advance(),
          );
        },
      ),
    );
  }
}

class _ProbeFrame extends StatefulWidget {
  const _ProbeFrame({
    super.key,
    required this.jsSource,
    this.widgetId = '',
    this.onDone,
  });

  final String jsSource;
  final String widgetId;

  /// Resident queue mode: called with the probe's exit code instead of
  /// exiting the process, so one window can sweep many widgets.
  final void Function(int exitCode)? onDone;

  @override
  State<_ProbeFrame> createState() => _ProbeFrameState();
}

class _ProbeFrameState extends State<_ProbeFrame> {
  String get _id => widget.widgetId.isEmpty ? _kWidget : widget.widgetId;
  final _boundaryKey = GlobalKey();
  Timer? _safety;
  Timer? _ticker;
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
    probeDiag('THREE probe widgetBegin: $_id');
    // Safety exit: never wedge a probe run past 60s (per widget).
    _safety = Timer(const Duration(seconds: 60), () => _exit(7));
    _ticker = Timer.periodic(const Duration(milliseconds: 100), (timer) {
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
          _exit(6);
        });
        return;
      }
    });
  }

  FlutterGpuThreeSurface? get _surface =>
      _threeHost?.findSurface('probe-$_id', 'main#1')
          as FlutterGpuThreeSurface?;

  /// Resident mode hands the exit code to [onDone]; standalone mode exits.
  void _exit(int code) {
    _safety?.cancel();
    _ticker?.cancel();
    _stormTimer?.cancel();
    if (!mounted) { exit(code); return; }
    probeDiag('THREE probe widgetEnd: $_id code=$code');
    if (widget.onDone != null) {
      Future.microtask(() => widget.onDone!(code));
      return;
    }
    exit(code);
  }

  void _startWindow() {
    final presented = _surface?.diagnostics['presentedFrames'] ?? 0;
    if (_windowStartFrames == null) {
      // Window A: static (no input).
      _window = 0;
      _windowStartFrames = presented.toInt();
      _windowStartMs = _clock.elapsedMilliseconds;
      Timer(Duration(seconds: _kWindowSeconds), _finishWindow);
      return;
    }
    // Window B: storm (if enabled), otherwise mirror window A.
    if (_kStorm && !_stormActive && !_stormDone) {
      _window = 1;
      _stormActive = true;
      _stormDone = true;
      _windowStartFrames = presented.toInt();
      _windowStartMs = _clock.elapsedMilliseconds;
      if (!_kOsStorm) _stormTimer = Timer.periodic(const Duration(milliseconds: 8), (t) {
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
      Timer(Duration(seconds: _kWindowSeconds), _finishWindow);
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
            // Resident mode: one png per widget so sweeps keep every capture.
            final out = _id == _kWidget || _kQueue.isEmpty
                ? _kOut
                : '${_kOut.replaceAll(RegExp(r'\.png$'), '')}-$_id.png';
            await File(
              out,
            ).writeAsBytes(bytes.buffer.asUint8List(), flush: true);
            probeDiag('probe png written: $out');
          }
          image.dispose();
        } else {
          exitCode = 3;
        }
      }
    } finally {
      await _engine?.dispose();
      _exit(exitCode);
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
    final threeHost = _id.startsWith('three-')
        ? createFlutterGpuThreeHost(
            assetLoader: WidgetBundleThreeAssets.forWidget(_id).load,
          )
        : null;
    _threeHost = threeHost;
    final config = JsRuntimeConfig(
      widgetId: _id,
      instanceId: 'probe-$_id',
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
