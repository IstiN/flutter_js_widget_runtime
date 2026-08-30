import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  if (!hasQuickjsNativeLib) return;

  group('webview-showcase widget logic', () {
    late WidgetLogicHarness h;
    late QuickjsWidgetEngineBackend backend;

    setUp(() async {
      h = await bootWidget('webview-showcase');
      backend = h.backend;
    });

    tearDown(() => backend.dispose());

    test('initial state loads the first preset', () {
      expect(h.state!['url'], 'https://example.com');
      expect(h.state!['lastMessage'], '');
    });

    test('preset switches the url', () async {
      await h.callEvent('preset', payload: {'value': '1'});
      expect(h.state!['url'], 'https://en.wikipedia.org');
      await h.callEvent('preset', payload: {'value': ['2']});
      expect(h.state!['url'], contains('openstreetmap.org'));
    });

    test('go navigates to the drafted url and adds https://', () async {
      await h.callEvent('draft', payload: {'value': 'dart.dev'});
      await h.callEvent('go');
      expect(h.state!['url'], 'https://dart.dev');
    });

    test('draft alone does not navigate', () async {
      await h.callEvent('draft', payload: {'value': 'flutter.dev'});
      expect(h.state!['url'], 'https://example.com');
    });

    test('webViewMessage updates the status line', () async {
      await h.callEvent('webViewMessage', payload: {'value': 'hello from page'});
      expect(h.state!['lastMessage'], 'hello from page');
    });
  });
}
