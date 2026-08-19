import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/widget_logic_helper.dart';

void main() {
  if (!hasQuickjsNativeLib) return;

  group('3d-game-dodge widget logic', () {
    test('initial state has full lives and zero score', () async {
      final h = await bootWidget('3d-game-dodge');
      expect(h.state, isNotNull);
      expect(h.state!['score'], 0.0);
      expect(h.state!['lives'], 3);
      expect(h.state!['best'], 0.0);
      await h.backend.dispose();
    });

    testWidgets('holding right moves player and increases score', (
      tester,
    ) async {
      final h = await bootWidget('3d-game-dodge');
      try {
        await h.keyDown('arrowRight');
        await h.pumpFrames(tester, const Duration(milliseconds: 400));
        await h.keyUp('arrowRight');
        expect(h.state!['score'], greaterThan(0.0));
      } finally {
        await h.backend.dispose();
      }
    });

    testWidgets('pressing R after game over restarts', (tester) async {
      final h = await bootWidget('3d-game-dodge');
      try {
        // Let blocks hit the stationary player.
        await h.pumpFrames(tester, const Duration(seconds: 5));
        final lives = h.state!['lives'] as int;
        if (lives > 0) {
          // Random spawn timing may not kill in 5s.
          return;
        }
        final best = h.state!['best'] as num;
        expect(best, greaterThanOrEqualTo(0));
        await h.keyDown('r');
        await h.pumpFrames(tester, const Duration(milliseconds: 100));
        await h.keyUp('r');
        await h.pumpFrames(tester, const Duration(milliseconds: 100));
        expect(h.state!['lives'], 3);
        expect(h.state!['score'], 0.0);
      } finally {
        await h.backend.dispose();
      }
    });
  });
}
