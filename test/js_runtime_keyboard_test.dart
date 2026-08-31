import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

import 'fake_engine_backend.dart';

void main() {
  group('JsWidgetRuntimeWidget keyboard capture', () {
    testWidgets('forwards key events as jsr.onKey host events', (tester) async {
      final backend = FakeEngineBackend();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: JsWidgetRuntimeWidget(
              jsSource: '',
              config: JsRuntimeConfig(
                widgetId: 'test',
                onRender: (_) {},
                onSetTitle: (_) {},
                onStorageUpdate: (_) {},
                backend: backend,
              ),
            ),
          ),
        ),
      );
      await tester.pump();
      await tester.pump();

      await tester.sendKeyEvent(LogicalKeyboardKey.arrowLeft);
      await tester.pump();

      // The widget also reports its viewport size as a host event — filter
      // to the key events only.
      final keyPayloads = backend.keyPayloads;
      expect(keyPayloads, hasLength(2)); // down + up
      expect(keyPayloads.first['key'], 'arrowLeft');
      expect(keyPayloads.first['down'], isTrue);
      expect(keyPayloads.first['repeat'], isFalse);
      expect(keyPayloads.last['down'], isFalse);
    });

    testWidgets('tapping the widget claims keyboard focus', (tester) async {
      final backend = FakeEngineBackend();
      // A sibling focus node simulates an embedded host (board/panel chrome)
      // holding focus when the runtime widget is first shown.
      final sibling = FocusNode();
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                Focus(focusNode: sibling, child: const SizedBox(height: 10)),
                Expanded(
                  child: JsWidgetRuntimeWidget(
                    jsSource: '',
                    config: JsRuntimeConfig(
                      widgetId: 'test',
                      onRender: (_) {},
                      onSetTitle: (_) {},
                      onStorageUpdate: (_) {},
                      backend: backend,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
      await tester.pump();
      await tester.pump();
      sibling.requestFocus();
      await tester.pump();
      backend.clear();

      // Tap the runtime widget area, then press a key.
      await tester.tap(find.byType(JsWidgetRuntimeWidget));
      await tester.pump();
      await tester.sendKeyEvent(LogicalKeyboardKey.arrowRight);
      await tester.pump();

      final keyPayloads = backend.keyPayloads;
      expect(keyPayloads, hasLength(2)); // down + up
      expect(keyPayloads.first['key'], 'arrowRight');
    });
  });
}
