import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';

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
  // Every real wire the shared runner hands out is live-registered so the
  // file's single tearDownAll (disposeRegisteredReal1BWires) drains exactly
  // what is still alive — the F4-merge CI lesson (live display at process
  // exit segfaults the CI Paravirtual GPU).
  registerReal1BWire(wire0);
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

/// Like [onebProbeWidget] but the error net records the error NAME and
/// message separately — the named-gate contract of E2E-TARGET-2/3 asserts
/// the exact name, not a stringified error.
String onebNamedErrorWidget(String bodyJs) =>
    '''
var results = {};
try {
$bodyJs
} catch (e) {
  results.errorName = e.name || null;
  results.errorMessage = String((e && e.message) || e);
}
jsr.exportState(results);
''';

// ── F4b battery helpers (issue #8 F4b; one definition, no clone) ──────────

/// The native glue around the shared F4b battery (same contract as the web
/// driver of tool/three/cases_f4b/; the legs differ only in io.sleep and the
/// capture hook). The battery resolves through real timers, so the export
/// lands via exportTimeout polling.
const String f4bBatteryGlue = '''
var __f4b = null;
try {
  __f4b = globalThis.__f4bBattery(globalThis.THREE, jsr.three.cinematic, {
    sleep: function (ms) { return new Promise(function (res) { setTimeout(res, ms); }); },
    captureFrame: function (clock, pipeline) {
      return pipeline.captureFrame(clock).then(
        function (res) { return { ok: true, frame: clock.frame, path: (res && res.path) || null }; },
        function (e) { return { ok: false, error: (e && e.name) || String(e) }; });
    }
  });
} catch (e) {
  jsr.exportState({ fatal: String((e && e.message) || e) });
}
Promise.resolve(__f4b).then(function (r) { jsr.exportState(r || { fatal: 'battery returned nothing' }); },
  function (e) { jsr.exportState({ fatal: String((e && e.message) || e) }); });
''';

/// The shared post-run expectations of every native battery leg: angle1b
/// selected, no composite error on the log lane, no fatal battery error.
void f4bExpectBatteryLeg(
  JsThreeBackendSelection? sel,
  List<Map<String, dynamic>> logs,
  Map<String, dynamic>? state,
) {
  expect(sel?.isAngle1b, isTrue, reason: 'the battery runs on native 1B');
  expect(
    widgetErrorLogs(logs),
    isEmpty,
    reason: 'no composite error may reach the __jsr_log lane',
  );
  expect(state?['fatal'], isNull, reason: '${state?['fatal']}');
}

/// Asserts every named battery check of the F4B_SUMMARY report is present
/// and ok. [leg] prefixes the failure reasons of multi-leg tests.
void f4bExpectChecksAll(
  Map<String, dynamic>? s,
  List<String> names, {
  String leg = '',
}) {
  expect(s, isNotNull);
  final p = leg.isEmpty ? '' : '$leg: ';
  final checks = (s!['checks'] as List).cast<Map<String, dynamic>>();
  for (final name in names) {
    final c = checks.firstWhere(
      (c) => c['name'] == name,
      orElse: () => <String, dynamic>{},
    );
    expect(c, isNotEmpty, reason: '${p}check $name present');
    expect(c['ok'], isTrue, reason: '$p$name: ${c['detail']}');
  }
}

/// The minimal renderer stub the named-gate probes create a pipeline with
/// (320x180, DPR 1, no capabilities declared).
const String f4bRendererStub = '''
var renderer = {
  getSize: function (v) { return v.set(320, 180); },
  getPixelRatio: function () { return 1; },
  setClearAlpha: function () {},
  capabilities: {}
}''';

/// The effects map of the named-gate probes (bloom on, everything else off —
/// the probes gate bloom through the capability set, not the effects map).
const String f4bPipelineEffects =
    'effects: { bloom: true, dof: false, fxaa: false, smaa: false, '
    'colorGrade: false, film: false, vignette: false, motion: false }';
