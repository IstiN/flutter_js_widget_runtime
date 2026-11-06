import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'collada skinning',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_loader_collada_skinning submits the Stormtrooper mesh', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-loader-collada-skinning',
      instanceId: 'three-collada-skinning-test',
    );
    // The 2.2MB Collada asset ships as an external widget file and its XML
    // parse takes seconds in QuickJS — wait for the model, not for frames.
    final plan = await harness.pumpUntil(
      tester,
      (state, candidate) =>
          state.nodes.values.where((node) => node.geometryId != 0).length >= 2,
      attempts: 600,
    );
    harness.expectHealthy('webgl_loader_collada_skinning');
    expect(
      harness.state!.nodes.values.where((node) => node.geometryId != 0),
      isNotEmpty,
    );
    // The offline collada→GLB lane rehydrates the Stormtrooper through
    // GLTFLoader, so the DAE's Phong material arrives as a PBR
    // MeshStandardMaterial (GLTFExporter/Loader round trip); accept either
    // Phong-family kind but require the loaded mesh, not the grid helpers.
    expect(
      plan!.draws.any(
        (draw) =>
            (draw.material.kind.name == 'meshPhong' ||
                draw.material.kind.name == 'meshStandard') &&
            draw.geometry.vertexCount > 1000,
      ),
      isTrue,
      reason: 'the grid helpers alone are not the loaded Stormtrooper',
    );
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 240)));
}
