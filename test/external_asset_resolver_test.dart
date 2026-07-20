import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

class _FakeResolver extends ExternalAssetResolver {
  final Map<String, Uint8List> assets;

  _FakeResolver(this.assets);

  @override
  Future<Uint8List?> resolve(String id) async => assets[id];
}

void main() {
  group('JsonWidgetRenderer external assets', () {
    testWidgets('external:<id> uses resolver bytes', (tester) async {
      final bytes = Uint8List.fromList([0, 1, 2, 3]);
      final renderer = JsonWidgetRenderer(
        onEvent: (_, __) {},
        externalAssetResolver: _FakeResolver({'avatar': bytes}),
      );
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: renderer.build({
              'type': 'image',
              'src': 'external:avatar',
              'width': 48.0,
              'height': 48.0,
            }),
          ),
        ),
      );
      await tester.pump();
      expect(find.byType(Image), findsOneWidget);
    });

    testWidgets('external:<id> without resolver shows broken icon', (
      tester,
    ) async {
      final renderer = JsonWidgetRenderer(onEvent: (_, __) {});
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: renderer.build({
              'type': 'image',
              'src': 'external:missing',
            }),
          ),
        ),
      );
      await tester.pump();
      expect(find.byIcon(Icons.broken_image), findsOneWidget);
    });
  });
}
