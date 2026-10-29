import 'dart:io';
import 'dart:math' as math;

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_host.dart'
    show FlutterGpuThreeSurface;
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_state.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets('official terrain OrbitControls and generated texture reach R1', (
    tester,
  ) async {
    final sources = await tester.runAsync(
      () async => (
        three: await rootBundle.loadString('assets/three/three.native.js'),
        widget: await File(
          'example/widgets/three-geometry-terrain-raycast/widget.js',
        ).readAsString(),
      ),
    );
    final host = createFlutterGpuThreeHost();
    const instanceId = 'three-terrain-controls-test';
    final config = JsRuntimeConfig(
      widgetId: 'three-geometry-terrain-raycast',
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

    JsThreeSurfaceState? state;
    ThreeDrawPlan? plan;
    for (var attempt = 0; attempt < 400; attempt++) {
      state = (host.findSurface(
        instanceId,
        'main#1',
      ) as FlutterGpuThreeSurface?)?.state;
      if (state != null) {
        plan = const ThreeDrawPlanner().plan(state);
        if (state.geometryUploadCount == 2 &&
            state.textureUploadCount == 1 &&
            state.submittedFrameCount >= 3 &&
            plan.draws.length == 2)
          break;
      }
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(milliseconds: 20)),
      );
      await tester.pump(const Duration(milliseconds: 30));
    }
    expect(engine.exportedState?['example'], 'webgl_geometry_terrain_raycast');
    expect(
      state,
      isNotNull,
      reason: '${engine.exportedState}; ${engine.peekLogs()}',
    );
    expect(plan, isNotNull);
    expect(plan!.diagnostics.warnings, isEmpty);
    expect(plan!.triangleCount, 130056);
    final terrain = plan!.draws.singleWhere(
      (draw) => draw.geometry.vertexCount == 65536,
    );
    expect(terrain.drawCount, 390150);
    expect(terrain.indexed, isTrue);
    expect(terrain.material.kind, JsThreeMaterialKind.meshBasic);
    expect(terrain.material.mapTextureId, isNot(0));
    expect(
      plan!.draws.where(
        (draw) => draw.material.kind == JsThreeMaterialKind.meshNormal,
      ),
      hasLength(1),
    );
    final texture = state!.textures.values.single;
    expect(texture.width, 1024);
    expect(texture.height, 1024);
    expect(texture.encoding, JsThreeTextureEncoding.rawRgba8);
    expect(texture.data.length, 1024 * 1024 * 4);
    expect(texture.data.any((byte) => byte != 0), isTrue);

    List<double> cameraMatrix() =>
        List<double>.from(state!.camera!.matrixWorld);
    final initial = cameraMatrix();
    void input(Map<String, dynamic> event) => backend.dispatchHostEvent(
      'three.input:main',
      {'type': event['type'], ...event},
    );
    input({
      'type': 'pointerdown',
      'pointerId': 7,
      'pointerType': 'mouse',
      'button': 0,
      'buttons': 1,
      'clientX': 100.0,
      'clientY': 100.0,
      'pageX': 100.0,
      'pageY': 100.0,
    });
    input({
      'type': 'pointermove',
      'pointerId': 7,
      'pointerType': 'mouse',
      'button': 0,
      'buttons': 1,
      'clientX': 155.0,
      'clientY': 125.0,
      'pageX': 155.0,
      'pageY': 125.0,
    });
    input({
      'type': 'pointerup',
      'pointerId': 7,
      'pointerType': 'mouse',
      'button': 0,
      'buttons': 0,
      'clientX': 155.0,
      'clientY': 125.0,
      'pageX': 155.0,
      'pageY': 125.0,
    });
    for (var attempt = 0; attempt < 80; attempt++) {
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(milliseconds: 20)),
      );
      await tester.pump(const Duration(milliseconds: 30));
      if (cameraMatrix().join(',') != initial.join(',')) break;
    }
    expect(
      cameraMatrix().join(','),
      isNot(initial.join(',')),
      reason: 'pinned OrbitControls drag must mutate the R1 camera',
    );
    final dragged = cameraMatrix();
    input({
      'type': 'wheel',
      'pointerId': 0,
      'deltaY': -120.0,
      'deltaX': 0.0,
      'deltaMode': 0,
      'clientX': 155.0,
      'clientY': 125.0,
    });
    for (var attempt = 0; attempt < 80; attempt++) {
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(milliseconds: 20)),
      );
      await tester.pump(const Duration(milliseconds: 30));
      if (cameraMatrix().join(',') != dragged.join(',')) break;
    }
    expect(
      cameraMatrix().join(','),
      isNot(dragged.join(',')),
      reason: 'pinned OrbitControls wheel must mutate the R1 camera',
    );
    await engine.dispose();
    await tester.pump();
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets(
    'official orientation GUI checkbox selects instant lookAt in R1',
    (tester) async {
      final sources = await tester.runAsync(
        () async => (
          three: await rootBundle.loadString('assets/three/three.native.js'),
          widget: await File(
            'example/widgets/three-math-orientation-transform/widget.js',
          ).readAsString(),
        ),
      );
      final host = createFlutterGpuThreeHost();
      const instanceId = 'three-orientation-gui-test';
      final config = JsRuntimeConfig(
        widgetId: 'three-math-orientation-transform',
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

      JsThreeSurfaceState? state;
      ThreeDrawPlan? plan;
      for (var attempt = 0; attempt < 300; attempt++) {
        state = (host.findSurface(
          instanceId,
          'main#1',
        ) as FlutterGpuThreeSurface?)?.state;
        if (state != null) {
          plan = const ThreeDrawPlanner().plan(state);
          if (state.geometryUploadCount == 3 &&
              state.submittedFrameCount >= 3 &&
              plan.draws.length == 3 &&
              engine.exportedState?['gui'] != null)
            break;
        }
        await tester.runAsync(
          () => Future<void>.delayed(const Duration(milliseconds: 20)),
        );
        await tester.pump(const Duration(milliseconds: 30));
      }
      expect(
        engine.exportedState?['example'],
        'webgl_math_orientation_transform',
      );
      expect(plan, isNotNull);
      expect(plan!.diagnostics.warnings, isEmpty);
      expect(plan!.draws, hasLength(3));
      final cone = plan!.draws.singleWhere(
        (draw) => draw.material.kind == JsThreeMaterialKind.meshNormal,
      );
      expect(cone.drawCount, 48);
      final target = plan!.draws.singleWhere(
        (draw) =>
            draw.material.kind == JsThreeMaterialKind.meshBasic &&
            !draw.material.wireframe,
      );
      final gui = engine.exportedState!['gui'] as Map<String, dynamic>;
      final values = gui['values'] as List<dynamic>;
      expect(values, hasLength(1));
      expect(values[0]['value'], isFalse);
      final action = values[0]['action'] as String;
      await backend.callEvent(action, {'value': true});
      expect(
        (engine.exportedState!['gui']['values'] as List)[0]['value'],
        isTrue,
      );

      var aligned = false;
      for (var attempt = 0; attempt < 100; attempt++) {
        await tester.runAsync(
          () => Future<void>.delayed(const Duration(milliseconds: 20)),
        );
        await tester.pump(const Duration(milliseconds: 30));
        state = (host.findSurface(
          instanceId,
          'main#1',
        ) as FlutterGpuThreeSurface?)?.state;
        if (state == null) continue;
        plan = const ThreeDrawPlanner().plan(state);
        final currentCone = plan.draws.singleWhere(
          (draw) => draw.node.nodeId == cone.node.nodeId,
        );
        final currentTarget = plan.draws.singleWhere(
          (draw) => draw.node.nodeId == target.node.nodeId,
        );
        final matrix = currentCone.node.matrixWorld;
        final targetMatrix = currentTarget.node.matrixWorld;
        final length = math.sqrt(
          targetMatrix[12] * targetMatrix[12] +
              targetMatrix[13] * targetMatrix[13] +
              targetMatrix[14] * targetMatrix[14],
        );
        final dot =
            (matrix[8] * targetMatrix[12] +
                matrix[9] * targetMatrix[13] +
                matrix[10] * targetMatrix[14]) /
            length;
        if ((dot - 1).abs() < 0.0001) {
          aligned = true;
          break;
        }
      }
      expect(
        aligned,
        isTrue,
        reason: 'the JSR checkbox must switch the official animation to mesh.lookAt',
      );
      await engine.dispose();
      await tester.pump();
    },
    timeout: const Timeout(Duration(seconds: 120)),
  );
}
