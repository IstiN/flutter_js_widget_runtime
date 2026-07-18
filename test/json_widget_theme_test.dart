import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

void main() {
  group('JsonWidgetTheme', () {
    test('fromAccent creates dark theme by default', () {
      final theme = JsonWidgetTheme.fromAccent(Colors.blue);
      expect(theme.primary, Colors.blue);
      expect(theme.divider, Colors.white24);
      expect(theme.surface, const Color(0xFF1e293b));
    });

    test('fromAccent creates light theme', () {
      final theme = JsonWidgetTheme.fromAccent(Colors.blue, brightness: Brightness.light);
      expect(theme.primary, Colors.blue);
      expect(theme.divider, Colors.black12);
      expect(theme.surface, Colors.white);
      expect(theme.text, Colors.black87);
    });
  });
}
