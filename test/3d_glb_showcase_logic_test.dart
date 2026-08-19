import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  if (!hasQuickjsNativeLib) return;

  group('3d-glb-showcase widget logic', () {
    late WidgetLogicHarness h;
    late QuickjsWidgetEngineBackend backend;

    setUp(() async {
      h = await bootWidget('3d-glb-showcase');
      backend = h.backend;
    });

    tearDown(() => backend.dispose());

    test('initial state is rotating at half speed', () {
      expect(h.state!['rotating'], isTrue);
      expect(h.state!['speed'], 0.5);
    });

    test('toggle rotation flips state', () async {
      await h.callEvent('toggle_rotation');
      expect(h.state!['rotating'], isFalse);
      await h.callEvent('toggle_rotation');
      expect(h.state!['rotating'], isTrue);
    });

    test('slider changes speed', () async {
      await h.callEvent('set_speed', payload: {'value': 2.0});
      expect(h.state!['speed'], 2.0);
    });
  });
}
