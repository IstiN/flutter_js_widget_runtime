import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  if (!hasQuickjsNativeLib) return;

  group('m3-showcase widget logic', () {
    late WidgetLogicHarness h;
    late QuickjsWidgetEngineBackend backend;

    setUp(() async {
      h = await bootWidget('m3-showcase');
      backend = h.backend;
    });

    tearDown(() => backend.dispose());

    test('initial state has defaults', () {
      expect(h.state!['nav'], 0);
      expect(h.state!['seg'], 'week');
      expect(h.state!['radio'], 'standard');
      expect(h.state!['created'], 0);
      expect(h.state!['banner'], isTrue);
    });

    test('banner dismiss hides banner', () async {
      await h.callEvent('banner_dismiss');
      expect(h.state!['banner'], isFalse);
    });

    test('FAB increments and decrements created counter', () async {
      await h.callEvent('fab_tap');
      expect(h.state!['created'], 1);
      await h.callEvent('fab_tap');
      expect(h.state!['created'], 2);
      await h.callEvent('fab_remove');
      expect(h.state!['created'], 1);
    });

    test('navigation cycles through destinations', () async {
      await h.callEvent('nav_changed', payload: {'value': 1});
      expect(h.state!['nav'], 1);
      await h.callEvent('nav_changed', payload: {'value': 2});
      expect(h.state!['nav'], 2);
    });

    test('segmented button changes selection', () async {
      await h.callEvent('seg_changed', payload: {'value': 'day'});
      expect(h.state!['seg'], 'day');
      await h.callEvent('seg_changed', payload: {'value': 'month'});
      expect(h.state!['seg'], 'month');
    });

    test('radio changes group value', () async {
      await h.callEvent('radio_changed', payload: {'value': 'compact'});
      expect(h.state!['radio'], 'compact');
      await h.callEvent('radio_changed', payload: {'value': 'standard'});
      expect(h.state!['radio'], 'standard');
    });

    test('menu selection is remembered', () async {
      await h.callEvent('menu_selected', payload: {'value': 'download'});
      expect(h.state!['lastMenu'], 'download');
    });

    test('reset restores defaults', () async {
      await h.callEvent('banner_dismiss');
      await h.callEvent('fab_tap');
      await h.callEvent('nav_changed', payload: {'value': 2});
      await h.callEvent('reset');
      expect(h.state!['banner'], isTrue);
      expect(h.state!['created'], 0);
      expect(h.state!['nav'], 0);
      expect(h.state!['seg'], 'week');
    });
  });
}
