import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_host.dart'
    show FlutterGpuThreeSurface;
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'three_test_config.dart';

/// Shared real-QuickJS boot and frame pumping for official THREE examples.
final class ThreeQuickjsExampleHarness {
  ThreeQuickjsExampleHarness._({
    required this.instanceId,
    required this.host,
    required this.backend,
    required this.engine,
    required this.renderTrees,
  });

  static Future<ThreeQuickjsExampleHarness> boot(
    WidgetTester tester, {
    required String widgetId,
    required String instanceId,
    bool useIsolate = false,
  }) async {
    final sources = await tester.runAsync(
      () async => (
        three: await rootBundle.loadString('assets/three/three.native.js'),
        widget: await File(
          'example/widgets/$widgetId/widget.js',
        ).readAsString(),
      ),
    );
    return _start(
      threeSource: sources!.three,
      widgetSource: sources.widget,
      widgetId: widgetId,
      instanceId: instanceId,
      useIsolate: useIsolate,
      tester: tester,
    );
  }

  static Future<ThreeQuickjsExampleHarness> bootSource(
    WidgetTester tester, {
    required String source,
    required String instanceId,
  }) async {
    final threeSource = await tester.runAsync(
      () => rootBundle.loadString('assets/three/three.native.js'),
    );
    return _start(
      threeSource: threeSource!,
      widgetSource: source,
      widgetId: 'three-native-test',
      instanceId: instanceId,
      tester: tester,
    );
  }

  static Future<ThreeQuickjsExampleHarness> _start({
    required String threeSource,
    required String widgetSource,
    required String widgetId,
    required String instanceId,
    required WidgetTester tester,
    bool useIsolate = false,
  }) async {
    final host = createFlutterGpuThreeHost();
    final renderTrees = <Map<String, dynamic>>[];
    final config = threeTestConfig(
      engineId: instanceId,
      widgetId: widgetId,
      host: host,
      threeSource: threeSource,
      onRender: renderTrees.add,
    );
    final backend = useIsolate
        ? createQuickjsIsolateWidgetEngineBackend(config)
        : QuickjsWidgetEngineBackend(config: config);
    final engine = JsWidgetEngine(config: config.copyWith(backend: backend));
    addTearDown(() => tester.runAsync(engine.dispose));
    await engine.init();
    if (useIsolate) {
      await tester.runAsync(() => engine.run(widgetSource));
    } else {
      await engine.run(widgetSource);
    }
    return ThreeQuickjsExampleHarness._(
      instanceId: instanceId,
      host: host,
      backend: backend,
      engine: engine,
      renderTrees: renderTrees,
    );
  }

  final String instanceId;
  final JsThreeHost host;
  final JsWidgetEngineBackend backend;
  final JsWidgetEngine engine;
  final List<Map<String, dynamic>> renderTrees;
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
    await tester.runAsync(engine.dispose);
    await tester.pump();
  }
}
