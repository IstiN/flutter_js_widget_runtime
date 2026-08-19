import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  if (!hasQuickjsNativeLib) return;

  group('3d-showcase widget logic', () {
    late WidgetLogicHarness h;
    late QuickjsWidgetEngineBackend backend;

    setUp(() async {
      h = await bootWidget('3d-showcase');
      backend = h.backend;
    });

    tearDown(() => backend.dispose());

    test('initial state is cube / blue / rotating', () {
      expect(h.state!['shape'], 'cube');
      expect(h.state!['color'], '#3b82f6');
      expect(h.state!['rotating'], isTrue);
      expect(h.state!['speed'], 0.5);
    });

    test('shape buttons switch primitive', () async {
      for (final shape in ['sphere', 'torus', 'city', 'cube']) {
        await h.callEvent('shape_$shape');
        expect(h.state!['shape'], shape);
      }
    });

    test('color buttons switch color', () async {
      await h.callEvent('color_#ef4444');
      expect(h.state!['color'], '#ef4444');
      await h.callEvent('color_#10b981');
      expect(h.state!['color'], '#10b981');
    });

    test('toggle rotation flips state', () async {
      await h.callEvent('toggle_rotation');
      expect(h.state!['rotating'], isFalse);
      await h.callEvent('toggle_rotation');
      expect(h.state!['rotating'], isTrue);
    });

    test('slider changes speed', () async {
      await h.callEvent('set_speed', payload: {'value': 1.5});
      expect(h.state!['speed'], 1.5);
    });
  });
}
