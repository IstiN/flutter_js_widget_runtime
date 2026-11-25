import 'dart:io';

import 'package:flutter/foundation.dart';

import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:jsr_three_angle/jsr_three_angle.dart';

import 'fake_three_host.dart';

// Shared real-engine runner for the angle1b Dart tests: boots the QuickJS
// backend with angle1b selected and a recording wire, runs one widget, and
// returns (wire host, selection report, exported state). One definition here
// keeps the engine-config boilerplate out of every test file (duplication
// gate).
String real1bFacadeBootstrap() => Angle1bBootstrap.compose(
  packer: File('tool/three/gen/g1_packer.js').readAsStringSync(),
  facade: File('packages/jsr_three_angle/facade/webgl2_facade.js')
      .readAsStringSync(),
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
}) async {
  debugDefaultTargetPlatformOverride = TargetPlatform.macOS;
  final w = host ??
      (Fake1BWireHost()
        ..probeReason = probeReason
        ..facadeBootstrapOverride =
            realFacade ? real1bFacadeBootstrap() : null);
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
    ),
  );
  try {
    await engine.run(widget);
    consoleLogs?.addAll(engine.flushLogs());
    return (w, reported, engine.exportedState);
  } finally {
    debugDefaultTargetPlatformOverride = null;
    await engine.dispose();
  }
}
