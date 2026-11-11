import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

Future<WidgetManifest?> _manifest(String icon) async {
  final reader = MemoryWidgetFileReader({
    'widgets/demo/widget.js': 'jsr.render({type:"text"});',
    'widgets/demo/manifest.json': jsonEncode({
      'id': 'demo',
      'name': 'Demo Widget',
      'description': 'demo',
      'version': '1.0.0',
      'icon': icon,
      'network': false,
      'allowedCommands': <String>[],
    }),
  });
  return WidgetManifest.fromStorage('widgets/demo', reader: reader);
}

void main() {
  testWidgets('emoji icon renders as text in the demo menu', (tester) async {
    final manifest = await _manifest('🧮');
    await tester.pumpWidget(MaterialApp(
      home: JsWidgetDemoMenu(
        manifests: [manifest!],
        reader: MemoryWidgetFileReader(const {}),
        makeConfig: ([String? _]) => JsRuntimeConfig(
          onRender: (_) {},
          onSetTitle: (_) {},
          onStorageUpdate: (_) {},
        ),
      ),
    ));
    expect(find.text('🧮'), findsOneWidget);
  });

  testWidgets('svg markup icon never leaks raw markup', (tester) async {
    final manifest = await _manifest(
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M12 2'/></svg>");
    await tester.pumpWidget(MaterialApp(
      home: JsWidgetDemoMenu(
        manifests: [manifest!],
        reader: MemoryWidgetFileReader(const {}),
        makeConfig: ([String? _]) => JsRuntimeConfig(
          onRender: (_) {},
          onSetTitle: (_) {},
          onStorageUpdate: (_) {},
        ),
      ),
    ));
    expect(find.textContaining('<svg'), findsNothing);
    expect(find.byIcon(Icons.widgets), findsOneWidget);
  });
}
