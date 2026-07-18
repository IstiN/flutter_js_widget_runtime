import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/js_widget_runtime.dart';

void main() {
  group('JsRuntimeConfig', () {
    JsRuntimeConfig makeConfig() {
      return JsRuntimeConfig(
        onRender: (tree) {},
        onSetTitle: (title) {},
        onStorageUpdate: (storage) {},
      );
    }

    test('defaults are populated', () {
      final config = makeConfig();
      expect(config.widgetId, 'default');
      expect(config.appDir, isNull);
      expect(config.initialTheme, isA<Map<String, dynamic>>());
      expect(config.initialStorage, isEmpty);
      expect(config.hostBootstrapJs, isNull);
    });

    test('copyWith overrides values', () {
      final config = makeConfig().copyWith(
        widgetId: 'w1',
        appDir: '/tmp/widgets',
        initialTheme: const {'isDark': false},
        initialStorage: const {'k': 'v'},
        hostBootstrapJs: 'jsr.yoloit = {};',
        onLog: (msg) {},
      );
      expect(config.widgetId, 'w1');
      expect(config.appDir, '/tmp/widgets');
      expect(config.initialTheme['isDark'], false);
      expect(config.initialStorage['k'], 'v');
      expect(config.hostBootstrapJs, 'jsr.yoloit = {};');
      expect(config.onLog, isNotNull);
    });

    test('copyWith keeps original values when null', () {
      final original = makeConfig().copyWith(widgetId: 'w2');
      final copy = original.copyWith();
      expect(copy.widgetId, 'w2');
      expect(copy.appDir, original.appDir);
    });
  });
}
