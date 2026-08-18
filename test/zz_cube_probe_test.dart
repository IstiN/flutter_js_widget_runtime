import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

void main() {
  testWidgets('probe cube scene in widget tree', (tester) async {
    final host = Cube3dHost.fresh()..skipAnimationLoop = true;
    final renders = <Map<String, dynamic>>[];
    final backend = QuickjsWidgetEngineBackend(
      config: JsRuntimeConfig(
        widgetId: 'probe',
        js3dHost: host,
        onRender: renders.add,
        onSetTitle: (_) {},
        onStorageUpdate: (_) {},
      ),
    );
    await backend.init();
    backend.run(File('example/widgets/3d-showcase/widget.js').readAsStringSync());
    for (var i = 0; i < 50 && renders.isEmpty; i++) {
      await Future<void>.delayed(const Duration(milliseconds: 10));
    }
    backend.debugStopTimers();

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: JsonWidgetRenderer(
              onEvent: (_, __) {},
              js3dHost: host,
            ).build(renders.last),
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump();

    for (final c in host.liveControllers.values) {
      final cc = c as Cube3dController;
      print('after pump: scene=${cc.sceneId} objects=${cc.objects.keys.toList()} pending=${cc.pendingLength}');
    }
    await backend.dispose();
  });
}
