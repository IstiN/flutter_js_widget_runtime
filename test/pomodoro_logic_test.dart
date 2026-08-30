import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  if (!hasQuickjsNativeLib) return;

  group('pomodoro widget logic', () {
    late WidgetLogicHarness h;
    late QuickjsWidgetEngineBackend backend;

    setUp(() async {
      h = await bootWidget('pomodoro');
      backend = h.backend;
    });

    tearDown(() => backend.dispose());

    test('initial state is a fresh 25 min focus phase', () {
      expect(h.state!['mode'], 'focus');
      expect(h.state!['remaining'], 25 * 60);
      expect(h.state!['running'], isFalse);
      expect(h.state!['completed'], 0);
    });

    test('start_pause toggles running', () async {
      await h.callEvent('start_pause');
      expect(h.state!['running'], isTrue);
      await h.callEvent('start_pause');
      expect(h.state!['running'], isFalse);
    });

    test('timer ticks down while running', () async {
      await h.callEvent('start_pause');
      // The 1s interval is host-driven — give it real time to fire twice.
      final deadline = DateTime.now().add(const Duration(seconds: 3));
      while (DateTime.now().isBefore(deadline)) {
        await Future<void>.delayed(const Duration(milliseconds: 100));
        if ((h.state!['remaining'] as int) < 25 * 60) break;
      }
      expect(h.state!['remaining'], lessThan(25 * 60));
    });

    test('reset restores the fresh focus phase', () async {
      await h.callEvent('start_pause');
      await h.callEvent('skip');
      await h.callEvent('reset');
      expect(h.state!['mode'], 'focus');
      expect(h.state!['remaining'], 25 * 60);
      expect(h.state!['running'], isFalse);
    });

    test('skip on focus counts a completed pomodoro and starts a break', () async {
      await h.callEvent('skip');
      expect(h.state!['completed'], 1);
      expect(h.state!['mode'], 'break');
      expect(h.state!['remaining'], 5 * 60);
    });

    test('skip on break returns to focus without counting', () async {
      await h.callEvent('skip'); // -> break, completed 1
      await h.callEvent('skip'); // -> focus, still 1
      expect(h.state!['mode'], 'focus');
      expect(h.state!['completed'], 1);
    });

    test('every 4th break is a long one', () async {
      for (var i = 0; i < 3; i++) {
        await h.callEvent('skip'); // focus -> break
        await h.callEvent('skip'); // break -> focus
      }
      expect(h.state!['completed'], 3);
      await h.callEvent('skip'); // 4th pomodoro done -> long break
      expect(h.state!['completed'], 4);
      expect(h.state!['mode'], 'break');
      expect(h.state!['remaining'], 15 * 60);
    });
  });

  group('pomodoro storage', () {
    test('completed counter hydrates from storage on boot', () async {
      final h = await bootWidget(
        'pomodoro',
        initialStorage: {'completed': 7},
      );
      // storage.get resolves asynchronously — wait for the re-export.
      final deadline = DateTime.now().add(const Duration(seconds: 2));
      while (DateTime.now().isBefore(deadline)) {
        await Future<void>.delayed(const Duration(milliseconds: 50));
        if (h.state != null && h.state!['completed'] == 7) break;
      }
      expect(h.state!['completed'], 7);
      h.backend.dispose();
    });
  });
}
