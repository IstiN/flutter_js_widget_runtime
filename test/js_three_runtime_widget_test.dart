import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'support/three_test_config.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  testWidgets('default QuickJS config mounts and resizes a prepared canvas', (
    tester,
  ) async {
    final host = createFlutterGpuThreeHost();
    addTearDown(() => host.disposeEngine('three-runtime-widget'));
    final threeSource = await tester.runAsync(
      () => rootBundle.loadString('assets/three/three.native.js'),
    );
    final config = threeTestConfig(
      engineId: 'three-runtime-widget',
      host: host,
      threeSource: threeSource,
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Center(
          child: SizedBox(
            width: 320,
            height: 180,
            child: JsWidgetRuntimeWidget(
              config: config,
              jsSource: r'''
                const canvas = jsr.three.createCanvas('main');
                jsr.render({type: 'three', canvasId: canvas.id});
              ''',
            ),
          ),
        ),
      ),
    );

    JsThreeSurface? surface;
    for (var attempt = 0; attempt < 100; attempt++) {
      await tester.pump(const Duration(milliseconds: 20));
      surface = host.findSurface('three-runtime-widget', 'main#1');
      if (surface != null && surface.diagnostics['attached'] == 1) break;
    }

    expect(find.byType(CircularProgressIndicator), findsNothing);
    expect(surface, isNotNull);
    expect(surface!.logicalSize, const Size(320, 180));
    expect(surface.diagnostics['attached'], 1);
    expect(surface.diagnostics['surfaceWidth'], 320.0);
    expect(surface.diagnostics['surfaceHeight'], 180.0);
    expect(surface.diagnostics['backendReady'], 0);

    await tester.pumpWidget(const SizedBox());
  });
}
