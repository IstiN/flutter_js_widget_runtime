import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// Pins webgl_loader_nrrd's bounded steady-state: once the three volume
/// slices are up, frames keep advancing WITHOUT per-frame re-uploads — the
/// CanvasTexture adoption is upload-once (the official example only rotates a
/// trackball camera per frame; slices repaint on gui changes, never per
/// frame). A regression that re-encodes/re-uploads the slice textures per
/// frame re-creates the historic ~4 FPS QuickJS-bound behavior and fails
/// here on the texture-upload counter.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('nrrd example', () {}, skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets('webgl_loader_nrrd uploads once and keeps frames advancing', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-loader-nrrd',
      instanceId: 'three-loader-nrrd-test',
    );
    await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount > 0 &&
          state.textureUploadCount > 0 &&
          plan.draws.isNotEmpty &&
          state.submittedFrameCount >= 1,
    );
    harness.expectHealthy('webgl_loader_nrrd');

    final plan = harness.plan!;
    // Bounded per-frame work: 3 transparent slice quads (2 triangles = 6
    // vertices each) + the box helper lines (12 segments = 24 vertices).
    expect(plan.draws, hasLength(4));
    expect(
      plan.draws.fold<int>(0, (total, draw) => total + draw.drawCount),
      42,
    );

    // Steady window: pump well past the initial presentation and require
    // frames to keep coming while NOTHING re-uploads.
    final uploadsBefore = harness.state!.uploadCount;
    final texturesBefore = harness.state!.textureUploadCount;
    final geometriesBefore = harness.state!.geometryUploadCount;
    final submittedBefore = harness.state!.submittedFrameCount;
    for (var i = 0; i < 60; i++) {
      await harness.pumpFrame(tester);
    }
    final state = harness.state!;
    expect(
      state.submittedFrameCount,
      greaterThan(submittedBefore),
      reason: 'frames must keep advancing after the volume settles',
    );
    expect(
      state.textureUploadCount,
      texturesBefore,
      reason: 'slice CanvasTextures must upload once, not per frame',
    );
    expect(
      state.geometryUploadCount,
      geometriesBefore,
      reason: 'slice planes must not rebuild geometry per frame',
    );
    expect(
      state.uploadCount,
      uploadsBefore,
      reason: 'steady-state frames must submit zero new uploads',
    );

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 120)));
}
