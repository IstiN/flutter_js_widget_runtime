import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

const _examples = <(String, String, bool)>[
  (
    'three-interactive-raycasting-points',
    'webgl_interactive_raycasting_points',
    false,
  ),
  ('three-interactive-cubes', 'webgl_interactive_cubes', false),
  ('three-interactive-cubes-ortho', 'webgl_interactive_cubes_ortho', false),
  ('three-interactive-lines', 'webgl_interactive_lines', false),
  (
    'three-interactive-buffergeometry',
    'webgl_interactive_buffergeometry',
    false,
  ),
  ('three-clipping', 'webgl_clipping', false),
  (
    'three-clipping-intersection',
    'webgl_clipping_intersection',
    false,
  ),
  ('three-lights-spotlights', 'webgl_lights_spotlights', false),
  ('three-helpers', 'webgl_helpers', false),
  ('three-geometry-spline-editor', 'webgl_geometry_spline_editor', false),
  ('three-instancing-raycast', 'webgl_instancing_raycast', false),
  ('three-extrude-shapes', 'webgl_geometry_extrude_shapes', false),
  ('three-math-obb', 'webgl_math_obb', false),
  (
    'three-buffergeometry-points-interleaved',
    'webgl_buffergeometry_points_interleaved',
    false,
  ),
  ('three-interactive-voxelpainter', 'webgl_interactive_voxelpainter', false),
  ('three-panorama-equirectangular', 'webgl_panorama_equirectangular', true),
  ('three-buffergeometry', 'webgl_buffergeometry', false),
  ('three-camera', 'webgl_camera', false),
  (
    'three-buffergeometry-lines-indexed',
    'webgl_buffergeometry_lines_indexed',
    false,
  ),
  ('three-clipping-advanced', 'webgl_clipping_advanced', false),
  ('three-geometry-extrude-splines', 'webgl_geometry_extrude_splines', false),
  ('three-loader-ply', 'webgl_loader_ply', false),
  ('three-loader-stl', 'webgl_loader_stl', false),
  // Wave-2 additions: only modules that boot AND render stock (no probe
  // shims) join this suite — its gate requires non-empty draw plans. The
  // still-gap modules (sprites, raycaster-sprite, raycaster-texture,
  // texture-filters, texture-anisotropy, camera-logarithmicdepthbuffer,
  // cubemap-refraction, instancing-performance) carry their own dedicated
  // tests. Wave-3 graduated geometry-shapes, texture-rotation, shadowmap-pointlight
  // and points-billboards from that list (UV transforms, alphaMap, FogExp2).
  ('three-materials-texture-rotation', 'webgl_materials_texture_rotation', false),
  ('three-geometry-shapes', 'webgl_geometry_shapes', false),
  ('three-shadowmap-pointlight', 'webgl_shadowmap_pointlight', false),
  ('three-points-billboards', 'webgl_points_billboards', false),
  ('three-loader-xyz', 'webgl_loader_xyz', false),
  ('three-geometry-text-shapes', 'webgl_geometry_text_shapes', false),
  ('three-geometry-convex', 'webgl_geometry_convex', false),
  // Stock boot of geometry-cube is the untextured white box (the gif
  // texture lane needs the fetch→resolveAsset shim lane covered by its
  // dedicated test), so no texture gate here.
  ('three-geometry-cube', 'webgl_geometry_cube', false),
];

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'expanded native THREE examples',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  for (final (widgetId, exampleId, needsTexture) in _examples) {
    testWidgets('$exampleId renders through native QuickJS R1', (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: widgetId,
        instanceId: '$widgetId-test',
      );
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            state.geometryUploadCount > 0 &&
            (!needsTexture || state.textureUploadCount > 0) &&
            plan.draws.isNotEmpty &&
            state.submittedFrameCount >= 1,
      );

      if (harness.engine.exportedState?['mounted'] != true ||
          harness.plan == null) {
        print(
          '$exampleId diagnostics: exported=${harness.engine.exportedState}; '
          'logs=${harness.engine.peekLogs()}; plan=${harness.plan?.diagnostics}; '
          'render=${harness.renderTrees.isEmpty ? null : harness.renderTrees.last}',
        );
      }
      harness.expectHealthy(exampleId);
      final state = harness.state;
      expect(state, isNotNull);
      expect(state!.geometryUploadCount, greaterThan(0));
      if (needsTexture) expect(state.textureUploadCount, greaterThan(0));
      expect(state.submittedFrameCount, greaterThanOrEqualTo(1));
      expect(state.pendingFrameCount, lessThanOrEqualTo(2));
      expect(harness.plan!.draws, isNotEmpty);
      if (exampleId == 'webgl_interactive_cubes_ortho') {
        final nativePlan = const ThreeDrawPlanner(
          autoInstance: true,
        ).plan(state);
        expect(nativePlan.drawCallCount, lessThanOrEqualTo(3));
        expect(
          nativePlan.draws.fold<int>(
            0,
            (total, draw) => total + draw.instanceCount,
          ),
          2000,
        );
      }
      await harness.dispose(tester);
    }, timeout: const Timeout(Duration(seconds: 120)));
  }
}
