import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  if (!hasQuickjsNativeLib) return;

  group('fitness-trainer widget logic', () {
    late WidgetLogicHarness h;
    late QuickjsWidgetEngineBackend backend;

    setUp(() async {
      h = await bootWidget('fitness-trainer');
      backend = h.backend;
    });

    tearDown(() => backend.dispose());

    test('initial state is home screen with zero sessions', () {
      expect(h.state!['screen'], 'home');
      expect(h.state!['sessionsCompleted'], 0);
    });

    test('start enters workout screen', () async {
      await h.callEvent('start');
      expect(h.state!['screen'], 'workout');
      expect(h.state!['step'], 'Jumping Jacks');
      expect(h.state!['secondsLeft'], 40);
    });

    test('pause toggles paused flag', () async {
      await h.callEvent('start');
      expect(h.state!['paused'], isFalse);
      await h.callEvent('pause');
      expect(h.state!['paused'], isTrue);
      await h.callEvent('pause');
      expect(h.state!['paused'], isFalse);
    });

    test('skip advances to next exercise', () async {
      await h.callEvent('start');
      await h.callEvent('skip');
      expect(h.state!['step'], 'rest');
    });

    test('quit returns home', () async {
      await h.callEvent('start');
      await h.callEvent('quit');
      expect(h.state!['screen'], 'home');
    });
  });
}
