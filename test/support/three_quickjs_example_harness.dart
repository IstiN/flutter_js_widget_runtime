import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_host.dart'
    show FlutterGpuThreeSurface;
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

/// Shared real-QuickJS boot and frame pumping for official THREE examples.
final class ThreeQuickjsExampleHarness {
  ThreeQuickjsExampleHarness._({
    required this.instanceId,
    required this.host,
    required this.backend,
    required this.engine,
  });

  static Future<ThreeQuickjsExampleHarness> boot(
    WidgetTester tester, {
    required String widgetId,
    required String instanceId,
  }) async {
    final sources = await tester.runAsync(
      () async => (
        three: await rootBundle.loadString('assets/three/three.native.js'),
        widget: await File(
          'example/widgets/$widgetId/widget.js',
        ).readAsString(),
      ),
    );
    final host = createFlutterGpuThreeHost();
    final config = JsRuntimeConfig(
      widgetId: widgetId,
      instanceId: instanceId,
      threeEnabled: true,
      threeSource: sources!.three,
      threeHost: host,
      onRender: (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
    );
    final backend = QuickjsWidgetEngineBackend(config: config);
    final engine = JsWidgetEngine(config: config.copyWith(backend: backend));
    addTearDown(engine.dispose);
    await engine.init();
    await engine.run(sources.widget);
    return ThreeQuickjsExampleHarness._(
      instanceId: instanceId,
      host: host,
      backend: backend,
      engine: engine,
    );
  }

  final String instanceId;
  final JsThreeHost host;
  final QuickjsWidgetEngineBackend backend;
  final JsWidgetEngine engine;
  ThreeDrawPlan? plan;

  FlutterGpuThreeSurface? get surface =>
      host.findSurface(instanceId, 'main#1') as FlutterGpuThreeSurface?;

  JsThreeSurfaceState? get state => surface?.state;

  void expectHealthy(String exampleId) {
    final exported = engine.exportedState;
    expect(exported, isNotNull);
    expect(exported!['example'], exampleId);
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    expect(exported['mounted'], isTrue);
    expect(plan, isNotNull);
    expect(plan!.canRender, isTrue);
    expect(plan!.diagnostics.warnings, isEmpty);
  }

  Future<ThreeDrawPlan?> pumpUntil(
    WidgetTester tester,
    bool Function(JsThreeSurfaceState state, ThreeDrawPlan plan) ready, {
    int attempts = 300,
  }) async {
    for (var attempt = 0; attempt < attempts; attempt++) {
      final currentState = state;
      if (currentState != null) {
        plan = const ThreeDrawPlanner().plan(currentState);
        if (ready(currentState, plan!)) return plan;
      }
      await pumpFrame(tester);
    }
    return plan;
  }

  Future<void> pumpFrames(WidgetTester tester, int count) async {
    for (var frame = 0; frame < count; frame++) {
      await pumpFrame(tester);
    }
  }

  Future<void> pumpFrame(WidgetTester tester) async {
    await tester.runAsync(
      () => Future<void>.delayed(const Duration(milliseconds: 20)),
    );
    await tester.pump(const Duration(milliseconds: 50));
  }

  Future<void> dispose(WidgetTester tester) async {
    await engine.dispose();
    await tester.pump();
  }
}
