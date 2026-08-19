import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';
import 'package:quickjs_runtime/quickjs_runtime.dart';

/// Interactive test for the 3d-showcase shape/color buttons: the real
/// widget.js runs on the QuickJS backend, `shape_*`/`color_*` events are
/// fired through the bridge, and the cube host must swap the live object.
final bool _hasNativeLib = File(QuickjsFfi.libraryPath).existsSync();

void main() {
  if (!_hasNativeLib) return;

  testWidgets('3d-showcase shape and color buttons swap the scene object',
      (tester) async {
    // runAsync: the QuickJS engine and the bridge live on the REAL event
    // loop; fake-zone `Future.delayed` waits would deadlock the test.
    await tester.runAsync(() async {
      final host = Cube3dHost.fresh()..skipAnimationLoop = true;
      final renders = <Map<String, dynamic>>[];
      final backend = QuickjsWidgetEngineBackend(
        config: JsRuntimeConfig(
          widgetId: '3d-showcase',
          instanceId: 'test',
          js3dHost: host,
          onRender: renders.add,
          onSetTitle: (_) {},
          onStorageUpdate: (_) {},
        ),
      );
      await backend.init();
      addTearDown(backend.dispose);

      unawaited(
        backend
            .run(
              File('example/widgets/3d-showcase/widget.js').readAsStringSync(),
            )
            .catchError((_) {}),
      );
      for (var i = 0; i < 50 && renders.isEmpty; i++) {
        await Future<void>.delayed(const Duration(milliseconds: 10));
      }
      expect(renders, isNotEmpty, reason: 'widget never rendered');

      Future<void> pumpTree() async {
        await tester.binding.setSurfaceSize(const Size(420, 860));
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: JsonWidgetRenderer(
                onEvent: (_, __) {},
                js3dHost: host,
              ).build(renders.last),
            ),
          ),
        );
        // The Cube widget creates its scene after the first frame; commands
        // buffered in the controller drain on onSceneCreated.
        await tester.pump(const Duration(milliseconds: 16));
        await tester.pump(const Duration(milliseconds: 16));
      }

      await pumpTree();
      expect(host.liveControllers, hasLength(1), reason: 'no controller');
      final controller = host.liveControllers.values.single;
      final initial = controller.objects['shape'];
      expect(initial, isNotNull, reason: 'initial cube missing');
      final initialVerts = initial!.mesh.vertices.length;

      // Tap "Torus": the widget removes and re-adds the model with the
      // torus primitive — a NEW object with a different mesh must appear.
      final beforeTaps = renders.length;
      await backend.callEvent('shape_torus');
      for (var i = 0; i < 30 && renders.length <= beforeTaps; i++) {
        await Future<void>.delayed(const Duration(milliseconds: 10));
      }
      expect(renders.length, greaterThan(beforeTaps),
          reason: 'shape_torus produced no re-render');
      await pumpTree();

      final torus = controller.objects['shape'];
      expect(torus, isNotNull, reason: 'shape_torus removed the model');
      expect(
        identical(initial, torus),
        isFalse,
        reason: 'shape_torus did not replace the object',
      );
      expect(
        torus!.mesh.vertices.length,
        isNot(initialVerts),
        reason: 'shape_torus kept the cube mesh',
      );

      // Tap a color dot: same swap, and the new material carries the color.
      await backend.callEvent('color_#ef4444');
      for (var i = 0; i < 30; i++) {
        await Future<void>.delayed(const Duration(milliseconds: 10));
      }
      await pumpTree();

      final red = controller.objects['shape'];
      expect(red, isNotNull, reason: 'color tap removed the model');
      expect(identical(torus, red), isFalse);
      expect(red!.mesh.material.diffuse.x, closeTo(0xef / 255, 0.01));
      expect(red.mesh.material.diffuse.y, closeTo(0x44 / 255, 0.01));
      expect(red.mesh.material.diffuse.z, closeTo(0x44 / 255, 0.01));
    });
  });
}
