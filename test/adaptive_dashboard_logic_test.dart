import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  if (!hasQuickjsNativeLib) return;

  group('adaptive-dashboard widget logic', () {
    late WidgetLogicHarness h;
    late QuickjsWidgetEngineBackend backend;

    setUp(() async {
      h = await bootWidget('adaptive-dashboard');
      backend = h.backend;
    });

    tearDown(() => backend.dispose());

    test('breakpoint is compact before any viewport event', () {
      expect(h.state!['breakpoint'], 'compact');
      expect(h.state!['viewport'], isNull);
    });

    test('viewport host event updates breakpoint and re-renders', () async {
      backend.dispatchHostEvent('viewport', {'width': 1000.0, 'height': 700.0});
      final deadline = DateTime.now().add(const Duration(seconds: 2));
      while (DateTime.now().isBefore(deadline)) {
        await Future<void>.delayed(const Duration(milliseconds: 20));
        if (h.state != null && h.state!['breakpoint'] == 'expanded') break;
      }
      expect(h.state!['breakpoint'], 'expanded');
      expect((h.state!['viewport'] as Map)['width'], 1000.0);
    });

    test('tile-sized viewports map to compact', () async {
      // Fa board tile sizes (~160x160, 344x160) must read as compact.
      backend.dispatchHostEvent('viewport', {'width': 344.0, 'height': 160.0});
      final deadline = DateTime.now().add(const Duration(seconds: 2));
      while (DateTime.now().isBefore(deadline)) {
        await Future<void>.delayed(const Duration(milliseconds: 20));
        final vp = h.state?['viewport'];
        if (vp is Map && vp['width'] == 344.0) break;
      }
      expect(h.state!['breakpoint'], 'compact');
    });
  });
}
