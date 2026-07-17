import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

void main() {
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
