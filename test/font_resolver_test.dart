import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

void main() {
  group('JsonWidgetRenderer font resolver', () {
    setUp(() => JsFontLoader.reset());

    testWidgets('custom fontFamily calls fontResolver', (tester) async {
      String? requestedFamily;
      final renderer = JsonWidgetRenderer(
        onEvent: (_, __) {},
        fontResolver: (family) async {
          requestedFamily = family;
          return Uint8List.fromList([0, 1, 2, 3]);
        },
      );
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: renderer.build({
              'type': 'text',
              'text': 'Hello',
              'style': {'fontFamily': 'CustomFont'},
            }),
          ),
        ),
      );
      await tester.pump();
      expect(requestedFamily, 'CustomFont');
      expect(find.text('Hello'), findsOneWidget);
    });

    testWidgets('fontResolver is not called without fontFamily', (
      tester,
    ) async {
      var called = false;
      final renderer = JsonWidgetRenderer(
        onEvent: (_, __) {},
        fontResolver: (_) async {
          called = true;
          return Uint8List(0);
        },
      );
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: renderer.build({
              'type': 'text',
              'text': 'Plain',
            }),
          ),
        ),
      );
      expect(called, isFalse);
    });
  });
}
