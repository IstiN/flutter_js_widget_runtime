import 'dart:io';

import 'package:flutter/foundation.dart';

import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:jsr_three_angle/jsr_three_angle.dart';

import 'fake_three_host.dart';
import 'three_1b_real_wire.dart';

// Shared real-engine runner for the angle1b Dart tests: boots the QuickJS
// backend with angle1b selected and a recording wire, runs one widget, and
// returns (wire host, selection report, exported state). One definition here
// keeps the engine-config boilerplate out of every test file (duplication
// gate).
String real1bFacadeBootstrap() => Angle1bBootstrap.compose(
  packer: File('tool/three/gen/g1_packer.js').readAsStringSync(),
  facade: File(
    'packages/jsr_three_angle/facade/webgl2_facade.js',
  ).readAsStringSync(),
);

Future<(Fake1BWireHost, JsThreeBackendSelection?, Map<String, dynamic>?)>
run1bWidgetEngine(
  String widget, {
  JsThreeBackend backend = JsThreeBackend.angle1b,
  String threeSource = 'var THREE = {};',
  bool allowCustomShaders = false,
  String? probeReason,
  Fake1BWireHost? host,
  bool realFacade = false,

  /// Filled with the engine's console log after run() — the observable the
  /// F2c silent-failure fix mirrors composite errors into (`[E] Widget
  /// error: …`).
  List<Map<String, dynamic>>? consoleLogs,

  /// Optional cinematic capture barrier host (issue #8 F4a IT-HELPER-*):
  /// wired straight into the engine config.
  JsCinematicCaptureHost? cinematicCaptureHost,

  /// When set, poll [JsWidgetEngine.exportedState] up to this long after
  /// run() — the battery widgets resolve their export through REAL timer
  /// awaits (host delays), which complete after run()'s single pending-job
  /// drain. Zero (default) keeps the one-shot behavior of the older tests.
  Duration exportTimeout = Duration.zero,
}) async {
  debugDefaultTargetPlatformOverride = TargetPlatform.macOS;
  final w =
      host ??
      (Fake1BWireHost()
        ..probeReason = probeReason
        ..facadeBootstrapOverride = realFacade
            ? real1bFacadeBootstrap()
            : null);
  JsThreeBackendSelection? reported;
  final engine = JsWidgetEngine(
    config: JsRuntimeConfig(
      onRender: (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      backendFactory: (cfg) => QuickjsWidgetEngineBackend(config: cfg),
      threeEnabled: true,
      threeSource: threeSource,
      threeBackend: backend,
      threeHost: w,
      allowCustomShaders: allowCustomShaders,
      onThreeBackendSelected: (s) => reported = s,
      cinematicCaptureHost: cinematicCaptureHost,
    ),
  );
  try {
    await engine.run(widget);
    Map<String, dynamic>? state = engine.exportedState;
    if (exportTimeout > Duration.zero) {
      final deadline = DateTime.now().add(exportTimeout);
      while (state == null && DateTime.now().isBefore(deadline)) {
        await Future<void>.delayed(const Duration(milliseconds: 50));
        state = engine.exportedState;
      }
    }
    consoleLogs?.addAll(engine.flushLogs());
    return (w, reported, state);
  } finally {
    debugDefaultTargetPlatformOverride = null;
    await engine.dispose();
  }
}

/// Real-1B engine run for the angle1b E2E tests: real ANGLE wire with the
/// real composed facade, console-log plumbing, no fake leftovers. Returns
/// (wire, selection, exported state, engine log). `wire.dispose` belongs to
/// the caller (`addTearDown`). [width]/[height] size the IOSurface the wire
/// presents into — widgets whose canvas is larger than the surface crash
/// the process (SIGBUS), so continuous-RAF widgets must pass their canvas
/// size (E2E-SHOWCASE-1 pairs this with a `jsr.viewport` prelude).
Future<
  (
    Real1BWireHost,
    JsThreeBackendSelection?,
    Map<String, dynamic>?,
    List<Map<String, dynamic>>,
  )
>
run1bRealEngine(
  String widget,
  String threeSource, {
  int width = 64,
  int height = 64,
  JsCinematicCaptureHost? cinematicCaptureHost,
  Duration exportTimeout = Duration.zero,

  /// Caller-provided wire (F4b battery legs): capture hosts read the
  /// presented surface of THIS wire, so it must be the engine's wire.
  /// Defaults to a fresh wire created here.
  Real1BWireHost? wire,
}) async {
  final wire0 =
      wire ??
      (Real1BWireHost(width: width, height: height)
        ..facadeBootstrapOverride = real1bFacadeBootstrap());
  final logs = <Map<String, dynamic>>[];
  final (w, sel, state) = await run1bWidgetEngine(
    widget,
    threeSource: threeSource,
    realFacade: true,
    host: wire0,
    consoleLogs: logs,
    cinematicCaptureHost: cinematicCaptureHost,
    exportTimeout: exportTimeout,
  );
  return (w as Real1BWireHost, sel, state, logs);
}

/// The `[E] Widget error: …` lines of an engine log — the named record the
/// F2c silent-failure fix mirrors every composite failure into.
List<String> widgetErrorLogs(List<Map<String, dynamic>> logs) => logs
    .map((l) => '${l['msg']}')
    .where((m) => m.startsWith('[E]') && m.contains('Widget error'))
    .toList();

/// JS: the custom-shader policy probe — IT-SHADER-2 and the policy unit
/// test exercise the SAME block (one definition, no clone). Requires a
/// `results` map in scope.
const String onebShaderPolicyProbeJs = '''
try {
  var sm = new THREE.ShaderMaterial();
  results.shaderMaterial = sm.isShaderMaterial === true ? 'constructed' : 'wrong-identity';
} catch (e) {
  results.shaderMaterial = String(e.message);
}
try {
  var rsm = new THREE.RawShaderMaterial();
  results.rawShaderMaterial = rsm.isRawShaderMaterial === true ? 'constructed' : 'wrong-identity';
} catch (e) {
  results.rawShaderMaterial = String(e.message);
}
try {
  var m = new THREE.MeshBasicMaterial();
  m.onBeforeCompile = function () {};
  results.onBeforeCompile = 'set';
} catch (e) {
  results.onBeforeCompile = String(e.message);
}
''';

/// JS: a minimal cube render through an existing `renderer` — the shared
/// one-render payload of the 1B lifecycle widgets (one definition, no
/// clone). [colorHex] is a JS hex literal (`0x00ff00`).
String onebRenderCubeJs(String colorHex) =>
    '''
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 3;
  scene.add(new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: $colorHex })));
  renderer.render(scene, camera);
''';

/// Wraps a probe [bodyJs] in the shared widget template: fresh `results`
/// map ([init] overrides the declaration), one error net that mirrors the
/// failure into `results.error`, `jsr.exportState` at the end (one
/// definition, no clone).
String onebProbeWidget(String bodyJs, {String init = 'var results = {};'}) =>
    '''
$init
try {
$bodyJs
} catch (e) {
  results.error = String((e && e.message) || e);
}
jsr.exportState(results);
''';
