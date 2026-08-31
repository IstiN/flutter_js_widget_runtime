import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  if (!hasQuickjsNativeLib) return;

  testWidgets('JsWidgetRuntimeWidget reports the viewport after engine boot',
      (tester) async {
    // A widget whose exported state mirrors jsr.viewport().
    const js = '''
      jsr.onViewport(function(v) {
        jsr.exportState({ width: v.width, height: v.height });
      });
      jsr.exportState({ width: 0, height: 0 });
      jsr.render({type: 'text', data: 'x'});
    ''';
    final config = JsRuntimeConfig(
      onRender: (_) {},
      onSetTitle: (_) {},
      onStorageUpdate: (_) {},
    );
    final backend = QuickjsWidgetEngineBackend(config: config);
    await tester.binding.setSurfaceSize(const Size(344, 160));
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 344,
            height: 160,
            child: JsWidgetRuntimeWidget(
              jsSource: js,
              config: config.copyWith(backend: backend),
            ),
          ),
        ),
      ),
    );
    // Engine boots asynchronously; the initial layout's viewport report
    // races the boot and must be re-reported after run() completes.
    await tester.pump();
    final deadline = DateTime.now().add(const Duration(seconds: 3));
    while (DateTime.now().isBefore(deadline)) {
      await tester.pump(const Duration(milliseconds: 20));
      final w = backend.exportedState?['width'];
      if (w == 344.0) break;
    }
    expect(backend.exportedState?['width'], 344.0);
    expect(backend.exportedState?['height'], 160.0);
  });
}
