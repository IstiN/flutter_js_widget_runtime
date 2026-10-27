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
    'unmodified official Minecraft module renders through QuickJS R1',
    (tester) async {
      final sources = await tester.runAsync(() async {
        return (
          three: await rootBundle.loadString('assets/three/three.native.js'),
          widget: await File(
            'example/widgets/three-minecraft/widget.js',
          ).readAsString(),
        );
      });
      final host = createFlutterGpuThreeHost();
      final config = JsRuntimeConfig(
        widgetId: 'three-minecraft',
        instanceId: 'three-minecraft-test',
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
            host.findSurface('three-minecraft-test', 'main#1')
                as FlutterGpuThreeSurface?;
        final state = surface?.state;
        if (state != null) {
          plan = const ThreeDrawPlanner().plan(state);
          if (state.textureUploadCount == 1 &&
              state.geometryUploadCount == 1 &&
              plan.draws.isNotEmpty &&
              state.submittedFrameCount >= 3) {
            break;
          }
        }
        await tester.pump(const Duration(milliseconds: 50));
      }

      final exported = engine.exportedState;
      expect(exported, isNotNull);
      expect(exported!['example'], 'webgl_geometry_minecraft');
      expect(exported['backend'], 'flutterGpu');
      expect(exported['canvasCount'], 1);
      expect(exported['mounted'], isTrue);
      if (surface == null) {
        // Surface creation is driven by the first binary envelope; retain the
        // JS renderer/exported state in the failure to distinguish an
        // upstream animation problem from a bridge/protocol rejection.
        print(
          'THREE example diagnostics: $exported; logs=${engine.peekLogs()}',
        );
      }
      expect(surface, isNotNull);
      final state = surface!.state!;
      expect(state.geometryUploadCount, 1);
      expect(state.textureUploadCount, 1);
      expect(state.materialUploadCount, 1);
      expect(state.submittedFrameCount, greaterThanOrEqualTo(3));
      expect(state.pendingFrameCount, lessThanOrEqualTo(2));
      expect(plan, isNotNull);
      expect(plan!.canRender, isTrue);
      expect(plan.draws, hasLength(1));
      final triangles = plan.draws.fold<int>(
        0,
        (total, draw) => total + draw.drawCount ~/ 3,
      );
      expect(triangles, greaterThan(1000));
      expect(plan.diagnostics.warnings, isEmpty);
      expect(plan.directionalLights, hasLength(1));
      await engine.dispose();
      await tester.pump();
    },
    timeout: const Timeout(Duration(seconds: 120)),
  );
}
