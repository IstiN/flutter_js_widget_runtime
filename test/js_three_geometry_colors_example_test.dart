import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/flutter_gpu_three_host.dart'
    show FlutterGpuThreeSurface;
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets(
    'unmodified official geometry colors renders through Flutter Canvas and R1',
    (tester) async {
      final sources = await tester.runAsync(() async {
        return (
          three: await rootBundle.loadString('assets/three/three.native.js'),
          widget: await File(
            'example/widgets/three-geometry-colors/widget.js',
          ).readAsString(),
        );
      });
      final host = createFlutterGpuThreeHost();
      final config = JsRuntimeConfig(
        widgetId: 'three-geometry-colors',
        instanceId: 'three-geometry-colors-test',
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

      FlutterGpuThreeSurface? surface;
      ThreeDrawPlan? plan;
      for (var attempt = 0; attempt < 300; attempt++) {
        surface =
            host.findSurface('three-geometry-colors-test', 'main#1')
                as FlutterGpuThreeSurface?;
        final state = surface?.state;
        if (state != null) {
          plan = const ThreeDrawPlanner().plan(state);
          if (state.geometryUploadCount == 7 &&
              state.textureUploadCount == 1 &&
              state.materialUploadCount >= 3 &&
              plan.draws.length == 9 &&
              state.submittedFrameCount >= 3) {
            break;
          }
        }
        await tester.runAsync(
          () => Future<void>.delayed(const Duration(milliseconds: 20)),
        );
        await tester.pump(const Duration(milliseconds: 50));
      }

      final exported = engine.exportedState;
      expect(exported, isNotNull);
      expect(exported!['example'], 'webgl_geometry_colors');
      expect(exported['backend'], 'flutterGpu');
      expect(exported['canvasCount'], 1);
      expect(exported['mounted'], isTrue);
      if (surface?.state == null) {
        print('THREE geometry colors diagnostics: $exported; '
            'logs=${engine.peekLogs()}');
      }
      final state = surface?.state;
      expect(state, isNotNull);
      // Three solid geometries are upgraded once when their wire child arrives.
      expect(state!.geometryUploadCount, 7);
      expect(state.textureUploadCount, 1);
      // Canvas readiness may precede the first RAF or refresh the shadow material.
      expect(state.materialUploadCount, inExclusiveRange(2, 5));
      expect(state.submittedFrameCount, greaterThanOrEqualTo(3));
      expect(state.pendingFrameCount, lessThanOrEqualTo(2));
      expect(plan, isNotNull);
      expect(plan!.canRender, isTrue);
      expect(plan.draws, hasLength(9));
      expect(
        plan.draws
            .where((draw) => draw.primitive == ThreeDrawPrimitive.lines),
        hasLength(3),
      );
      expect(
        plan.draws
            .where((draw) => draw.primitive == ThreeDrawPrimitive.triangles),
        hasLength(6),
      );
      expect(plan.triangleCount, 246);
      expect(plan.diagnostics.warnings, isEmpty);
      expect(plan.directionalLights, hasLength(1));

      final texture = state.textures.values.single;
      expect(texture.width, 128);
      expect(texture.height, 128);
      expect(texture.data.length, 128 * 128 * 4);
      final center = (64 * 128 + 64) * 4;
      expect(texture.data.sublist(center, center + 4), [210, 210, 210, 255]);
      expect(texture.data.sublist(0, 4), [255, 255, 255, 255]);

      final uploads = (
        state.geometryUploadCount,
        state.textureUploadCount,
        state.materialUploadCount,
      );
      for (var frame = 0; frame < 4; frame++) {
        await tester.runAsync(
          () => Future<void>.delayed(const Duration(milliseconds: 20)),
        );
        await tester.pump(const Duration(milliseconds: 50));
      }
      expect(state.geometryUploadCount, uploads.$1);
      expect(state.textureUploadCount, uploads.$2);
      expect(state.materialUploadCount, uploads.$3);

      await engine.dispose();
      await tester.pump();
    },
    timeout: const Timeout(Duration(seconds: 120)),
  );
}
