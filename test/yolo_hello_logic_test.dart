import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  if (!hasQuickjsNativeLib) return;

  group('yolo-hello widget logic', () {
    late WidgetLogicHarness h;
    late QuickjsWidgetEngineBackend backend;

    setUp(() async {
      h = await bootWidget('yolo-hello');
      backend = h.backend;
    });

    tearDown(() => backend.dispose());

    test('initial state shows zero taps and default scale', () {
      expect(h.state, isNotNull);
      expect(h.state!['tapCount'], 0);
      expect(h.state!['scale'], 1.0);
      expect(h.state!['bouncing'], isFalse);
    });

    test('tap increments counter and rotates hue', () async {
      final beforeHue = h.state!['hue'] as num;
      await h.callEvent('tap');
      expect(h.state!['tapCount'], 1);
      expect(((h.state!['hue'] as num) - beforeHue) % 360, 30);
    });

    test('color button rotates hue further', () async {
      final beforeHue = h.state!['hue'] as num;
      await h.callEvent('color');
      expect(((h.state!['hue'] as num) - beforeHue) % 360, 60);
    });

    test('resize toggles scale between 1.0 and 1.3', () async {
      expect(h.state!['scale'], 1.0);
      await h.callEvent('resize');
      expect(h.state!['scale'], 1.3);
      await h.callEvent('resize');
      expect(h.state!['scale'], 1.0);
    });

    test('bounce starts the physics animation', () async {
      expect(h.state!['bouncing'], isFalse);
      await h.callEvent('bounce');
      expect(h.state!['bouncing'], isTrue);
    });
  });
}
