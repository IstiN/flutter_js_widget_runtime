// Smoke test for the demo app shell.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:js_widget_runtime_example/main.dart';

void main() {
  testWidgets('demo app builds its home shell', (WidgetTester tester) async {
    await tester.pumpWidget(const DemoApp());
    await tester.pump();
    // The menu lists the example widgets; a Material app shell must exist.
    expect(find.byType(Navigator), findsWidgets);
  });
}
