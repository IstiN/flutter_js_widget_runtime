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
    'unmodified official line colors module renders through QuickJS R1',
    (tester) async {
      final sources = await tester.runAsync(() async {
        return (
          three: await rootBundle.loadString('assets/three/three.native.js'),
          widget: await File(
            'example/widgets/three-lines-colors/widget.js',
          ).readAsString(),
        );
      });
      final host = createFlutterGpuThreeHost();
      final config = JsRuntimeConfig(
        widgetId: 'three-lines-colors',
        instanceId: 'three-lines-colors-test',
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
            host.findSurface('three-lines-colors-test', 'main#1')
                as FlutterGpuThreeSurface?;
        final state = surface?.state;
        if (state != null) {
          plan = const ThreeDrawPlanner().plan(state);
          if (state.geometryUploadCount == 6 &&
              state.materialUploadCount == 1 &&
              plan.draws.isNotEmpty &&
              state.submittedFrameCount >= 3) {
            break;
          }
        }
        await tester.pump(const Duration(milliseconds: 50));
      }

      final exported = engine.exportedState;
      expect(exported, isNotNull);
      expect(exported!['example'], 'webgl_lines_colors');
      expect(exported['backend'], 'flutterGpu');
      expect(exported['canvasCount'], 1);
      expect(exported['mounted'], isTrue);
      if (surface == null) {
        print('THREE lines diagnostics: $exported; logs=${engine.peekLogs()}');
      }
      expect(surface, isNotNull);
      final state = surface!.state!;
      expect(state.geometryUploadCount, 6);
      expect(state.textureUploadCount, 0);
      expect(state.materialUploadCount, 1);
      expect(state.submittedFrameCount, greaterThanOrEqualTo(3));
      expect(state.pendingFrameCount, lessThanOrEqualTo(2));
      expect(plan, isNotNull);
      expect(plan!.canRender, isTrue);
      expect(plan.draws, hasLength(6));
      expect(
        plan.draws.every((draw) => draw.primitive == ThreeDrawPrimitive.lines),
        isTrue,
      );
      expect(
        plan.draws.fold<int>(0, (total, draw) => total + draw.drawCount),
        2676,
      );
      expect(plan.diagnostics.warnings, isEmpty);
      expect(plan.directionalLights, isEmpty);
      await engine.dispose();
      await tester.pump();
    },
    timeout: const Timeout(Duration(seconds: 120)),
  );
}
