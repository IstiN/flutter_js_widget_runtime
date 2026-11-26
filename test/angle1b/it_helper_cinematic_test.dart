import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import '../support/three_1b_engine.dart';

// IT-HELPER-* (issue #8, F4a, ADR-0004 decisions 2+4): the Dart side of the
// core `jsr.three.cinematic` surface inside the REAL engine stack. The JS
// surface comes from the committed native bundle (the same file the host
// loads when threeEnabled); the capture barrier crosses the existing
// `__jsr_capture` channel with options {engineId, clock, barrier:
// 'final-pass'} and lands on JsRuntimeConfig.cinematicCaptureHost. A host
// without the capability rejects with the NAMED error
// `cinematic.notCapturable` — never an effect-free capture.
void main() {
  final bundle = File('assets/three/jsr_three_native.js').readAsStringSync();

  /// The shared probe widget: creates the pipeline from the core surface
  /// with a minimal mock renderer (no GPU — the pipeline constructs without
  /// rendering) and exercises captureFrame(clock).
  String captureWidget({required bool withHost}) => '''
var results = { firstLine: true };
try {
  var cin = jsr.three.cinematic;
  if (!cin || typeof cin.createPipeline !== 'function') {
    throw new Error('cinematic.surfaceMissing: jsr.three.cinematic is not installed');
  }
  results.surface = 'core';
  var mockRenderer = {
    isJsrThreeRenderer: true,
    capabilities: { backend: 'flutterGpu', r1: true },
    getSize: function (v) { return v.set(64, 64); },
    getPixelRatio: function () { return 1; },
    setClearAlpha: function () {}
  };
  var pipeline = cin.createPipeline({
    renderer: mockRenderer,
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera()
  });
  var clock = cin.clockState(3, 24, 0.5, 1, 0);
  pipeline.captureFrame(clock).then(function (r) {
    results.captured = { path: r.path || null, width: r.width || null };
    jsr.exportState(results);
  }, function (e) {
    results.captureError = e.name || String(e);
    results.captureMessage = String(e && e.message || e);
    jsr.exportState(results);
  });
} catch (err) {
  results.error = String(err && err.message || err);
  jsr.exportState(results);
}
''';

  final recorded = <String, Map<String, dynamic>>{};

  JsCinematicCaptureHost recordingHost() => _RecordingCaptureHost(recorded);

  test(
    'IT-HELPER-1: the core surface installs in the engine and the '
    'final-pass capture reaches the host with {engineId, clock, barrier}',
    () async {
      recorded.clear();
      final (_, reported, state) = await run1bWidgetEngine(
        captureWidget(withHost: true),
        threeSource: bundle,
        cinematicCaptureHost: recordingHost(),
      );
      expect(reported?.isAngle1b, isTrue, reason: 'the 1B lane is selected');
      expect(state?['firstLine'], isTrue);
      expect(
        state?['surface'],
        'core',
        reason: 'the pipeline came from the core copy, not a private one',
      );
      expect(state?['error'], isNull);
      expect(state?['captured']?['path'], '/tmp/it-helper-1.png');
      expect(
        state?['captured']?['width'],
        64,
        reason: 'the host result reaches the JS promise',
      );
      // The barrier contract: exactly the documented clock reaches the host,
      // tagged with the engine instance id. (The wire options themselves —
      // {engineId, clock, barrier: 'final-pass'} — are pinned by UT-HELPER-5
      // on the JS side; the bridge routing is pinned by IT-HELPER-3 below.)
      expect(recorded.keys, hasLength(1));
      final engineId = recorded.keys.single;
      expect(engineId, isNotEmpty, reason: '__IID tags the engine');
      final call = recorded[engineId]!;
      expect(call['frame'], 3);
      expect(call['fps'], 24);
      expect(call['shutter'], 0.5);
      expect(call['samples'], 1);
      expect(call['epoch'], 0);
    },
  );

  test('IT-HELPER-3: the bridge routes barrier: final-pass capture to the '
      'cinematic host, and plain captures keep the legacy handler', () async {
    recorded.clear();
    final resolved = <String, dynamic>{};
    final legacy = <Map<String, dynamic>>[];
    final bridge = JsWidgetBridge(
      widgetId: 'it-helper-3',
      onRender: (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
      onLog: (_) {},
      isDisposed: () => false,
      resolveCallback: (id, value) => resolved[id] = value,
      fetchHandler: (_, __, ___, ____) async {},
      secretsGetHandler: (_, __) async {},
      secretsSetHandler: (_, __, ___) async {},
      loadAssetHandler: (_, __) async {},
      execHandler: (_, __) async {},
      intervalTickHandler: (_) {},
      rafTickHandler: (_, __) {},
      captureHandler: (opts) async {
        legacy.add(opts);
        return <String, dynamic>{'path': '/tmp/legacy.png'};
      },
      cinematicCaptureHost: recordingHost(),
      initialStorage: const {},
    );
    addTearDown(bridge.dispose);

    // A barrier request reaches the cinematic host, NOT the legacy handler.
    await bridge.dispatch(
      '__jsr_capture',
      jsonEncode({
        'id': 'b1',
        'opts': {
          'engineId': 'i0',
          'clock': {
            'frame': 7,
            'fps': 24,
            'shutter': 0.5,
            'samples': 8,
            'epoch': 0,
          },
          'barrier': 'final-pass',
        },
      }),
    );
    expect(resolved['b1']?['path'], '/tmp/it-helper-1.png');
    expect(recorded['i0']?['frame'], 7);
    expect(
      legacy,
      isEmpty,
      reason: 'the barrier never falls through to the tree rasterizer',
    );

    // A plain capture keeps the legacy handler.
    await bridge.dispatch(
      '__jsr_capture',
      '{"id":"b2","opts":{"name":"shot"}}',
    );
    expect(resolved['b2']?['path'], '/tmp/legacy.png');
    expect(legacy.single['name'], 'shot');
  });

  test(
    'IT-HELPER-2: a host without the barrier capability rejects with '
    'the NAMED error cinematic.notCapturable (never an effect-free capture)',
    () async {
      recorded.clear();
      final (_, _, state) = await run1bWidgetEngine(
        captureWidget(withHost: false),
        threeSource: bundle,
        // No cinematicCaptureHost: the capability is absent on this host.
      );
      expect(state?['firstLine'], isTrue);
      expect(state?['surface'], 'core');
      expect(state?['captureError'], 'cinematic.notCapturable');
      expect(state?['captureMessage'], contains('cinematicCaptureHost'));
      expect(state?['captured'], isNull, reason: 'no capture result was faked');
      expect(recorded, isEmpty, reason: 'no host capture was invoked');
    },
  );
}

class _RecordingCaptureHost extends JsCinematicCaptureHost {
  _RecordingCaptureHost(this.recorded);
  final Map<String, Map<String, dynamic>> recorded;

  @override
  Future<Map<String, dynamic>> capture(
    String engineId,
    Map<String, dynamic> clock,
  ) async {
    recorded[engineId] = Map<String, dynamic>.of(clock);
    return <String, dynamic>{
      'path': '/tmp/it-helper-1.png',
      'echo': clock['frame'],
      'width': 64,
      'height': 64,
    };
  }
}
