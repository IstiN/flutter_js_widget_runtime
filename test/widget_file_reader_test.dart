import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

void main() {
  group('AssetWidgetFileReader', () {
    const reader = AssetWidgetFileReader('test/assets');

    testWidgets('readString returns asset content', (tester) async {
      await tester.pumpWidget(const SizedBox.shrink());
      expect(await reader.readString('hello.txt'), 'hello from asset');
    });

    testWidgets('readString returns null for missing asset', (tester) async {
      await tester.pumpWidget(const SizedBox.shrink());
      expect(await reader.readString('missing.txt'), isNull);
    });

    testWidgets('exists returns true for existing asset', (tester) async {
      await tester.pumpWidget(const SizedBox.shrink());
      expect(await reader.exists('hello.txt'), isTrue);
    });
  });

  group('MemoryWidgetFileReader', () {
    test('readString returns content for known path', () async {
      final reader = MemoryWidgetFileReader({
        'widget.js': 'console.log("hello");',
        'manifest.json': '{"name": "demo"}',
      });

      expect(await reader.readString('widget.js'), 'console.log("hello");');
      expect(await reader.readString('manifest.json'), '{"name": "demo"}');
    });

    test('readString returns null for unknown path', () async {
      final reader = MemoryWidgetFileReader({'widget.js': ''});
      expect(await reader.readString('missing.json'), isNull);
    });

    test('exists reports file presence', () async {
      final reader = MemoryWidgetFileReader({'widget.js': ''});
      expect(await reader.exists('widget.js'), isTrue);
      expect(await reader.exists('manifest.json'), isFalse);
    });
  });
}
