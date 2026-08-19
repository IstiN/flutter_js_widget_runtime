import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// Regression tripwire for the GameWidget attach crash.
///
/// `JsFlame3dGame` once overrode `Game.hasLayout` as
/// `isMounted && size != Vector2.zero()`. flame's `GameWidget.loaderFuture`
/// asserts `game.hasLayout` BEFORE `game.mount()`, so every fresh attach in
/// an asserts-on build died with 'game.hasLayout: is not true'
/// (game_widget.dart:209) — the red screen yoclip hit on its first GLB
/// scene (big_idea_v2 monolith). Release builds strip asserts, which is why
/// it slipped through the release harness.
///
/// A live attach test would be ideal but is impossible headless:
/// `FlameGame3D`'s constructor eagerly builds a flutter_gpu GraphicsDevice.
/// So this test guards the invariant at the source level: the host file
/// must not declare its own `hasLayout` getter. Verified manually both ways
/// with a debug (asserts-on) harness build: bad override → red assert
/// screen; stock semantics → GLB renders.
void main() {
  test('JsFlame3dGame does not override Game.hasLayout', () {
    final src = File(
      'lib/src/renderer/nodes/hosts/flame_3d_host.dart',
    ).readAsStringSync();

    expect(
      RegExp(r'bool get hasLayout').hasMatch(src),
      isFalse,
      reason: 'Overriding Game.hasLayout breaks the GameWidget attach '
          'assert (loaderFuture runs before mount). Use hasEverLaidOut '
          'for dispose guards instead.',
    );
  });
}
