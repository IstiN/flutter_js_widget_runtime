import 'package:flutter/foundation.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/model/js_three_backend.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:js_widget_runtime/src/runtime/three_backend_selection.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_flutter_js.dart';

/// 1B selection ladder (issue #7 / ADR-0003 decision 2): every branch.
/// UT-CAP-1, E2E-FALLBACK-*, REG-ENGINE-1, IT-COEXIST-1 (selection level;
/// the real-ANGLE coexistence run lives in packages/jsr_three_angle).
void main() {
  _RecordingBackend quickJsBackend() => _RecordingBackend(syncLane: true);
  _RecordingBackend asyncBackend() => _RecordingBackend(syncLane: false);

  _CountingWire wire({String? probeReason, int? androidApiLevel}) =>
      _CountingWire()
        ..probeReason = probeReason
        ..apiLevel = androidApiLevel;

  JsRuntimeConfig config({
    required JsThreeBackend backend,
    Object? host,
    void Function(JsThreeBackendSelection)? onSelected,
    bool allowCustomShaders = false,
  }) => JsRuntimeConfig(
        onRender: (_) {},
        onSetTitle: (_) {},
        onStorageUpdate: (_) {},
        threeBackend: backend,
        threeHost: host as JsThreeHost?,
        onThreeBackendSelected: onSelected,
        allowCustomShaders: allowCustomShaders,
      );

  test('r1 requested selects r1 unconditionally and never probes (REG-1A-1)',
      () {
    final w = wire();
    final selection = selectThreeBackend(
      config: config(backend: JsThreeBackend.r1, host: w),
      backend: quickJsBackend(),
    );
    expect(selection.selected, JsThreeBackend.r1);
    expect(selection.reason, isNull);
    expect(w.probeCalls, 0, reason: 'no ANGLE init without angle1b/auto');
  });

  test('angle1b on an async-lane backend falls back: sync channel required',
      () {
    final w = wire();
    final selection = selectThreeBackend(
      config: config(backend: JsThreeBackend.angle1b, host: w),
      backend: asyncBackend(),
    );
    expect(selection.selected, JsThreeBackend.r1);
    expect(selection.reason, 'sync channel required');
    expect(w.probeCalls, 0);
  });

  test('flutter_js backend never selects 1B (REG-ENGINE-1)', () {
    expect(
      FlutterJsWidgetEngineBackend(
        config: config(backend: JsThreeBackend.angle1b),
      ).hasSyncBinaryLane,
      isFalse,
    );
    expect(
      QuickjsWidgetEngineBackend(
        config: config(backend: JsThreeBackend.angle1b),
      ).hasSyncBinaryLane,
      isTrue,
    );
  });

  test('angle1b without a 1B wire falls back: 1B host not configured', () {
    final selection = selectThreeBackend(
      config: config(backend: JsThreeBackend.angle1b, host: null),
      backend: quickJsBackend(),
    );
    expect(selection.selected, JsThreeBackend.r1);
    expect(selection.reason, '1B host not configured');
  });

  test('a wire that is only JsThreeHost does not qualify', () {
    final selection = selectThreeBackend(
      config: config(backend: JsThreeBackend.angle1b, host: _PlainHost()),
      backend: quickJsBackend(),
    );
    expect(selection.reason, '1B host not configured');
  });

  test('a failed native probe selects r1 with the probe reason', () {
    final selection = selectThreeBackend(
      config: config(
        backend: JsThreeBackend.angle1b,
        host: wire(probeReason: 'libangle_1b not found'),
      ),
      backend: quickJsBackend(),
    );
    expect(selection.selected, JsThreeBackend.r1);
    expect(selection.reason, 'libangle_1b not found');
  });

  test('probe (d): android api level < 28 falls back', () {
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
    try {
      final below = selectThreeBackend(
        config: config(
          backend: JsThreeBackend.angle1b,
          host: wire(androidApiLevel: 27),
        ),
        backend: quickJsBackend(),
      );
      expect(below.selected, JsThreeBackend.r1);
      expect(below.reason, 'android api level 27 < 28');

      final unknown = selectThreeBackend(
        config: config(
          backend: JsThreeBackend.angle1b,
          host: wire(androidApiLevel: null),
        ),
        backend: quickJsBackend(),
      );
      expect(unknown.reason, 'android api level unknown < 28');

      final pass = selectThreeBackend(
        config: config(
          backend: JsThreeBackend.angle1b,
          host: wire(androidApiLevel: 28),
        ),
        backend: quickJsBackend(),
      );
      expect(pass.selected, JsThreeBackend.angle1b);
      expect(pass.reason, isNull);
    } finally {
      debugDefaultTargetPlatformOverride = null;
    }
  });

  test('auto selects angle1b when every probe passes and r1 otherwise', () {
    debugDefaultTargetPlatformOverride = TargetPlatform.macOS;
    try {
      final good = selectThreeBackend(
        config: config(backend: JsThreeBackend.auto, host: wire()),
        backend: quickJsBackend(),
      );
      expect(good.selected, JsThreeBackend.angle1b);
      expect(good.reason, isNull);
    } finally {
      debugDefaultTargetPlatformOverride = null;
    }

    final bad = selectThreeBackend(
      config: config(
        backend: JsThreeBackend.auto,
        host: wire(probeReason: 'a1b_init failed (-5)'),
      ),
      backend: quickJsBackend(),
    );
    expect(bad.selected, JsThreeBackend.r1);
    expect(bad.reason, 'a1b_init failed (-5)');
  });

  test('IT-COEXIST-1 (selection level): one r1 and one angle1b engine in '
      'one host isolate scenes and report independently', () {
    debugDefaultTargetPlatformOverride = TargetPlatform.macOS;
    final w = wire();
    final r1Config = config(backend: JsThreeBackend.r1, host: w);
    final angle1bConfig = config(backend: JsThreeBackend.angle1b, host: w);
    final backendA = quickJsBackend();
    final backendB = quickJsBackend();
    final a = selectThreeBackend(config: r1Config, backend: backendA);
    final b = selectThreeBackend(config: angle1bConfig, backend: backendB);
    expect(a.selected, JsThreeBackend.r1);
    expect(b.selected, JsThreeBackend.angle1b);
    // The resolver returns the selection; the engine wrapper reports it
    // through onThreeBackendSelected (covered in the wrapper tests).
    expect(a.reason, isNull);
    expect(b.isAngle1b, isTrue);
    expect(w.probeCalls, 1, reason: 'only the angle1b engine probes ANGLE');
    debugDefaultTargetPlatformOverride = null;
  });
}

class _RecordingBackend implements JsWidgetEngineBackend {
  _RecordingBackend({required this.syncLane});

  final bool syncLane;

  @override
  bool get hasSyncBinaryLane => syncLane;

  @override
  void prepareThreeBackend(JsThreeBackendSelection selection) {}

  @override
  void setEngineInstanceId(String instanceId) {}

  @override
  Future<void> init() async {}

  @override
  Future<void> run(
    String widgetJs, {
    String? hostBootstrapJs,
    Map<String, dynamic> initialTheme = const {},
  }) async {}

  @override
  Future<void> callEvent(String actionId, Map<String, dynamic>? payload) async {
  }

  @override
  void dispatchHostEvent(String target, Map<String, dynamic> payload) {}

  @override
  Future<void> dispose() async {}

  @override
  List<Map<String, dynamic>> flushLogs() => const [];

  @override
  List<Map<String, dynamic>> peekLogs() => const [];

  @override
  Map<String, dynamic>? get exportedState => null;

  @override
  JsVoxelWorld? get voxelWorld => null;

  @override
  void updateTheme(Map<String, dynamic> colors) {}
}

class _PlainHost implements JsThreeHost {
  @override
  JsThreeSurface attach(
    String engineId,
    String surfaceId,
    Map<String, dynamic> config,
  ) => throw UnimplementedError();

  @override
  Widget build(
    BuildContext context,
    JsThreeSurface surface,
    Map<String, dynamic> config,
  ) =>
      throw UnimplementedError();

  @override
  void disposeEngine(String engineId) {}

  @override
  JsThreeSurface? findSurface(String engineId, String surfaceId) => null;

  @override
  Future<JsThreeAsset> loadAsset(String engineId, String url) =>
      throw UnimplementedError();

  @override
  void release(String engineId, String surfaceId) {}

  @override
  Future<JsThreeCanvas2DResult> rasterizeCanvas2D(
    String boundEngineId,
    Map<String, dynamic> request,
  ) =>
      Future.error(const JsThreeUnsupportedException('canvas2d'));

  @override
  void submit(String boundEngineId, Uint8List envelope) {}

  @override
  void submit1B(String boundEngineId, Uint8List batch) {}
}

/// Wire fake counting probe calls: proves the ladder only touches ANGLE
/// when angle1b is requested/auto.
class _CountingWire implements JsThreeHost, JsThree1BWire {
  String? probeReason;
  int? apiLevel;
  int probeCalls = 0;
  bool bootstrapEnsured = false;

  @override
  String? probeNative() {
    probeCalls++;
    return probeReason;
  }

  @override
  int? get androidApiLevel => apiLevel;

  @override
  String get facadeBootstrapJs => '/* facade */';

  @override
  Future<void> ensureFacadeBootstrap() async {
    bootstrapEnsured = true;
  }

  @override
  int dispatch1B(String engineId, Uint8List command) => 0;

  @override
  String result1BAsBase64(String engineId) => '';

  @override
  void submit1B(String boundEngineId, Uint8List batch) {}

  @override
  JsThreeSurface attach(
    String engineId,
    String surfaceId,
    Map<String, dynamic> config,
  ) => throw UnimplementedError();

  @override
  Widget build(
    BuildContext context,
    JsThreeSurface surface,
    Map<String, dynamic> config,
  ) =>
      throw UnimplementedError();

  @override
  void disposeEngine(String engineId) {}

  @override
  JsThreeSurface? findSurface(String engineId, String surfaceId) => null;

  @override
  Future<JsThreeAsset> loadAsset(String engineId, String url) =>
      throw UnimplementedError();

  @override
  void release(String engineId, String surfaceId) {}

  @override
  Future<JsThreeCanvas2DResult> rasterizeCanvas2D(
    String boundEngineId,
    Map<String, dynamic> request,
  ) =>
      Future.error(const JsThreeUnsupportedException('canvas2d'));

  @override
  void submit(String boundEngineId, Uint8List envelope) {}
}
