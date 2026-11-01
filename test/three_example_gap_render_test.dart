import 'package:flutter_test/flutter_test.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

const _rendered = <String, int>{
  'three-batch-lod-bvh': 3,
  'three-geometry-csg': 3,
  'three-loader-3dtiles': 3,
  'three-loader-gltf-animation-pointer': 3,
  'three-loader-gltf-progressive-lod': 3,
  'three-loader-ifc': 1,
  'three-loader-svg': 1,
  'three-loader-texture-lottie': 3,
  'three-loader-ttf': 3,
  'three-materials-texture-html': 3,
  'three-modifier-subdivision': 1,
  'three-morphtargets-webcam': 3,
  'three-postprocessing-godrays': 3,
  'three-raycaster-bvh': 3,
  'three-renderer-pathtracer': 3,
  'three-tsl-clearcoat': 3,
  'three-tsl-instancing': 3,
  'three-tsl-shadowmap': 3,
  'three-tsl-skinning': 3,
  'three-watch': 3,
  'three-worker-offscreencanvas': 3,
};

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) return;

  for (final entry in _rendered.entries) {
    final id = entry.key;
    testWidgets('gap render $id', (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: id,
        instanceId: '$id-gap-test',
      );
      final officialId =
          'webgl_${id.substring('three-'.length).replaceAll('-', '_')}';
      await pumpThreeExampleHealthy(
        tester,
        harness,
        officialId,
        targetFrames: entry.value,
      );
      await harness.dispose(tester);
    }, timeout: const Timeout(Duration(minutes: 4)));
  }
}
