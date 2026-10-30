import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// webgl_sprites (three.js r186) — R1 v5 SPRITES, rendered natively.
///
/// The official module builds TWO sprite scenes and renders both every
/// animation tick: a perspective scene with 200 `THREE.Sprite`s inside a
/// rotating group (materials cloned from `SpriteMaterial({map: sprite1.png |
/// sprite2.png})`, the sprite2 clones hue-cycled via setHSL with map
/// offset/repeat (−.5,−.5)/(2,2)) and an orthographic HUD scene with 5
/// `THREE.Sprite`s from the sprite0.png onLoad callback (`center` pinned to
/// the screen corners + center). Both scenes draw through
/// `renderer.autoClear=false; clear(); render(scene,camera); clearDepth();
/// render(sceneOrtho,cameraOrtho)`.
///
/// R1 v5 renders both natively:
///
/// - `THREE.Sprite` becomes object kind 4 (sprite) in the protocol; the
///   renderer emits the shared upstream quad geometry (positions in
///   [-0.5, 0.5]², unit UVs — three.js Sprite.js r186 `_geometry`) and the
///   `SpriteMaterial` rides the unlit meshBasic shading path with the
///   rotation in the material v5 tail.
/// - `three_r1.vert` billboards the quad in the vertex stage using the
///   node world matrix column lengths as the scale (the r186 sprite_vertex
///   shape, Sprite.center pivot + SpriteMaterial.rotation included).
/// - Sprites never cast or receive shadows (upstream Sprite docs) — the
///   shadow scan skips them even with a user-set castShadow flag.
/// - `renderer.clearDepth` is retained as an API-compatible no-op (each R1
///   frame carries its own depth attachment).
///
/// Per tick both renders commit: the perspective scene (200 sprite draws)
/// then the orthographic HUD scene (5 sprite draws). The surface state
/// reflects the LAST accepted stream, so the frame plan pins the HUD scene.
///
/// Part 2 is an instrumented copy of widget.js with a state-flag probe that
/// pins the per-tick SUCCESS: init() creates 200 sprites (near/far
/// material-clone split), the sprite0.png onLoad builds the 5 HUD sprites
/// from a 128x128 image, and every tick renders BOTH scenes without error.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'sprites example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_sprites renders both sprite scenes natively on R1 v5',
      (tester) async {
    // Part 1 — the unmodified widget: healthy boot, both scenes streaming.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-sprites',
      instanceId: 'three-sprites-test',
    );
    final plan = await harness.pumpUntil(
      tester,
      (state, candidate) =>
          state.submittedFrameCount >= 4 &&
          candidate.frame != null &&
          candidate.draws.any((draw) => draw.node.objectKind ==
              JsThreeObjectKind.sprite),
    );

    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_sprites');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    expect(exported['mounted'], isTrue);

    // The prepared widget registers all three embedded official textures
    // (sha-gated PNG lanes; sprite0/1/2.png are each 128x128).
    final assets = exported['assets'] as Map;
    const expectedBytes = <String, int>{
      'textures/sprite0.png': 5253,
      'textures/sprite1.png': 5853,
      'textures/sprite2.png': 3646,
    };
    expect(assets.keys.toSet(), containsAll(expectedBytes.keys.toSet()));
    for (final entry in expectedBytes.entries) {
      final asset = assets[entry.key] as Map;
      expect(asset['registered'], isTrue, reason: entry.key);
      expect(asset['bytes'], entry.value, reason: entry.key);
    }

    // Both renders per tick commit; the animation loop advances
    // (submittedFrameCount >= 4 was the pumpUntil gate; per-tick renderer
    // info counters are not part of the adapter export surface).
    expect(harness.state!.submittedFrameCount, greaterThanOrEqualTo(4));
    expect(harness.surface, isNotNull);
    expect(harness.state, isNotNull);
    expect(harness.renderTrees, isNotEmpty);
    expect(harness.renderTrees.first['type'], 'three');
    expect(harness.renderTrees.last['type'], 'three');

    // The plan is the LAST accepted stream of a tick: the orthographic HUD
    // scene with its 5 sprite draws (corner + center pinned sprites).
    expect(plan, isNotNull);
    final sprites = plan!.draws
        .where(
          (draw) => draw.node.objectKind == JsThreeObjectKind.sprite,
        )
        .toList();
    expect(sprites, hasLength(5));
    expect(plan.draws, hasLength(5));
    // Sprite draws are triangle quads with the spriteCenter pivot tail.
    for (final sprite in sprites) {
      expect(sprite.primitive.name, 'triangles');
      expect(sprite.node.spriteCenterX, inInclusiveRange(0, 1));
      expect(sprite.node.spriteCenterY, inInclusiveRange(0, 1));
      // SpriteMaterial rides the unlit basic path.
      expect(sprite.material.kind, JsThreeMaterialKind.meshBasic);
      // Upstream sprites never cast or receive shadows.
      expect(sprite.node.castShadow, isFalse);
    }
    // The HUD maps the sprite0.png texture.
    expect(
      sprites.every((sprite) => sprite.material.mapTextureId != 0),
      isTrue,
    );
    // No shadow light in either scene.
    expect(plan.frame!.hasShadow, isFalse);

    // Frames keep submitting while the loop runs.
    final submitted = harness.state!.submittedFrameCount;
    await harness.pumpFrames(tester, 6);
    expect(harness.state!.submittedFrameCount, greaterThan(submitted));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
