import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  if (!hasQuickjsNativeLib) return;

  group('charts-showcase widget logic', () {
    late WidgetLogicHarness h;
    late QuickjsWidgetEngineBackend backend;

    setUp(() async {
      h = await bootWidget('charts-showcase');
      backend = h.backend;
    });

    tearDown(() => backend.dispose());

    test('exports ready state after first render', () {
      expect(h.state, isNotNull);
      expect(h.state!['ready'], isTrue);
    });
  });
}
