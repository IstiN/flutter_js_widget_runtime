import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// webgl_instancing_scatter — the official per-instance-color showcase,
/// booted STOCK (no probe shims) on the native R1 lane.
///
/// The module samples 2000 points on a torus-knot surface and grows a
/// flower (stem + blossom InstancedMesh) at each point; every blossom
/// gets a palette color via setColorAt (the instanceColor lane), the
/// stems stay material-colored, and the instance matrices update every
/// frame (DynamicDrawUsage). The Flower.glb asset (4.8 KB) is prepared
/// with the widget and registered by it at boot.
///
/// Boot history: the module's resample() uses console.info/time/timeEnd,
/// which the QuickJS bootstrap console shim did not define — the same
/// documented gap that kept webgl_instancing_performance on probe shims.
/// The shim now defines info/debug/time/timeEnd (additive), so the stock
/// widget boots, loads the GLB and renders.

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'instancing scatter example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
      'webgl_instancing_scatter renders 2000 colored blossom instances '
      'stock on R1', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-instancing-scatter',
      instanceId: 'three-instancing-scatter-test',
    );
    // Patient pumping: Flower.glb decodes asynchronously inside QuickJS
    // before the first instanced frame exists.
    final ready = await harness.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount > 0 &&
          plan.draws.length >= 3 &&
          plan.draws.any(
            (draw) => draw.batch != null && draw.batch!.hasInstanceColors,
          ),
    );

    harness.expectHealthy('webgl_instancing_scatter');
    final exported = harness.engine.exportedState!;
    expect((exported['flower'] as Map<String, dynamic>)['registered'], isTrue);
    // count slider (0..2000), distribution dropdown, resample button.
    expect((exported['gui'] as Map<String, dynamic>)['controllers'], 3);

    // Round-3 lever 1: the Lambert torus-knot surface ALSO draws through
    // the color-batch lane now (count-1 batch, flags=3, its diffuse baked
    // into per-instance colors decoded via
    // js_three_protocol_decoder.dart:813) instead of an ordinary draw, so
    // the surface is three batches: knot (1 instance, colors), stems
    // (InstancedMesh lane, NO colors), blossoms (2000x3 palette payload).
    expect(ready, isNotNull);
    expect(ready!.draws, hasLength(3));
    final instancedBatches = ready.draws
        .map((draw) => draw.batch)
        .whereType<JsThreeDrawBatchUpsert>()
        .toList();
    expect(instancedBatches, hasLength(3));
    final blossom = instancedBatches
        .singleWhere((b) => b.hasInstanceColors && b.instanceCount == 2000);
    final knot = instancedBatches
        .singleWhere((b) => b.hasInstanceColors && b.instanceCount == 1);
    final stem = instancedBatches.singleWhere((b) => !b.hasInstanceColors);
    expect(knot.instanceCount, 1);
    expect(blossom.instanceCount, 2000);
    expect(blossom.instanceColors, hasLength(6000));
    expect(stem.instanceCount, 2000);
    expect(stem.instanceColors, isEmpty);
    // Palette colors are linearized sRGB values — every instance must
    // carry three finite components in [0, 1.1].
    for (var index = 0; index < blossom.instanceColors.length; index += 3) {
      final r = blossom.instanceColors[index];
      final g = blossom.instanceColors[index + 1];
      final b = blossom.instanceColors[index + 2];
      expect(r, inInclusiveRange(0, 1.1));
      expect(g, inInclusiveRange(0, 1.1));
      expect(b, inInclusiveRange(0, 1.1));
    }

    // ---- Live GUI: count slider down to 100 via backend.callEvent. ----
    final guiValues = (exported['gui'] as Map)['values'] as List<dynamic>;
    final countAction = guiValues
        .map((value) => (value as Map)['action'])
        .firstWhere((action) => action is String) as String;
    await harness.backend.callEvent(countAction, {'value': '100'});
    final slimmed = await harness.pumpUntil(
      tester,
      (state, plan) =>
          plan.draws.length == 3 &&
          plan.draws.any(
            (draw) =>
                (draw.batch?.hasInstanceColors ?? false) &&
                draw.instanceCount == 100,
          ),
    );
    final blossomDraws = slimmed!.draws
        .where(
          (draw) =>
              (draw.batch?.hasInstanceColors ?? false) &&
              draw.instanceCount == 100,
        )
        .toList();
    expect(blossomDraws, hasLength(1));
    expect(blossomDraws.single.instanceCount, 100);
    expect(blossomDraws.single.batch!.instanceColors, hasLength(300));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}
