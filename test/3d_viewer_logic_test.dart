import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  if (!hasQuickjsNativeLib) return;

  group('3d-viewer widget logic', () {
    late WidgetLogicHarness h;
    late QuickjsWidgetEngineBackend backend;

    setUp(() async {
      h = await bootWidget('3d-viewer');
      backend = h.backend;
    });

    tearDown(() => backend.dispose());

    test('initial state is not loaded', () {
      expect(h.state!['loaded'], isFalse);
      expect(h.state!['rotation'], [0, 0, 0]);
    });

    test('load sets loaded to true', () async {
      await h.callEvent('load');
      expect(h.state!['loaded'], isTrue);
    });

    test('rotate updates rotation and reset restores it', () async {
      await h.callEvent('load');
      await h.callEvent('rotate');
      expect(h.state!['rotation'], [45, 45, 0]);
      await h.callEvent('reset');
      expect(h.state!['rotation'], [0, 0, 0]);
    });
  });
}
