import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';

import 'support/three_example_render_contract.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'texture canvas',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
    'webgl_materials_texture_canvas recreates the HTML canvas and paints its cube map',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-materials-texture-canvas',
        instanceId: 'three-materials-texture-canvas-test',
      );
      final presentation = await pumpThreeExampleHealthy(
        tester,
        harness,
        'webgl_materials_texture_canvas',
      );
      final draw = presentation.draws.single;
      expect(draw.material.kind, JsThreeMaterialKind.meshBasic);
      expect(draw.material.mapTextureId, isNot(0));
      expect(
        harness.state!.textures.values.any(
          (texture) =>
              texture.width == 128 &&
              texture.height == 128 &&
              texture.encoding == JsThreeTextureEncoding.rawRgba8,
        ),
        isTrue,
        reason:
            'the white 128x128 Canvas2D background reaches the material map',
      );
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );
}
