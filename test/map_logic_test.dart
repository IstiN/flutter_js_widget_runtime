import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  if (!hasQuickjsNativeLib) return;

  group('map widget logic', () {
    late WidgetLogicHarness h;
    late QuickjsWidgetEngineBackend backend;

    setUp(() async {
      h = await bootWidget('map');
      backend = h.backend;
    });

    tearDown(() => backend.dispose());

    test('initial state has four preset markers', () {
      expect(h.state!['zoom'], 14);
      expect(h.state!['markerCount'], 4);
      expect(h.state!['userPins'], 0);
      expect(h.state!['selected'], isNull);
    });

    test('zoom in/out changes zoom within bounds', () async {
      await h.callEvent('zoom_in');
      expect(h.state!['zoom'], 15);
      await h.callEvent('zoom_out');
      expect(h.state!['zoom'], 14);
    });

    test('zoom does not drop below 3', () async {
      // Zoom out from 14 to below 3; each step must be clamped at the bound.
      for (var i = 0; i < 16; i++) {
        await h.callEvent('zoom_out', timeout: const Duration(milliseconds: 50));
      }
      expect(h.state!['zoom'], 3);
      await h.callEvent('zoom_out', timeout: const Duration(milliseconds: 50));
      expect(h.state!['zoom'], 3);
    });

    test('tapping the map adds a user pin', () async {
      await h.callEvent('map_tap', payload: {'lat': 53.68, 'lng': 23.83});
      expect(h.state!['markerCount'], 5);
      expect(h.state!['userPins'], 1);
      expect(h.state!['selected'], isNotNull);
    });

    test('marker tap selects a preset', () async {
      await h.callEvent('marker_tap', payload: {'id': 'old-castle'});
      expect(h.state!['selected'], 'old-castle');
    });

    test('select action centers on marker and flips wrapper', () async {
      await h.callEvent('select_old-castle');
      expect(h.state!['selected'], 'old-castle');
      expect(h.state!['center']['lat'], 53.6772);
    });

    test('remove action deletes a user pin', () async {
      await h.callEvent('map_tap', payload: {'lat': 53.68, 'lng': 23.83});
      final pinId = h.state!['selected'] as String;
      await h.callEvent('remove_$pinId');
      expect(h.state!['markerCount'], 4);
      expect(h.state!['userPins'], 0);
      expect(h.state!['selected'], isNull);
    });

    test('deselect clears selection', () async {
      await h.callEvent('marker_tap', payload: {'id': 'kalozha'});
      await h.callEvent('deselect');
      expect(h.state!['selected'], isNull);
    });
  });
}
