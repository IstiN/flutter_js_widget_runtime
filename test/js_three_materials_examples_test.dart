import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// Official three.js r186 *materials* examples on the native R1 pipeline.
///
/// All three modules land on documented facade gaps rather than green R1
/// draws; each test below pins the exact failure mode instead of forcing
/// a pass:
///
/// - `webgl_materials_bumpmap`: `validateMaterial` rejects every texture
///   slot except `map` — `tool/three/src/native_renderer.js:200-201` lists
///   `bumpMap` among the unsupported `materialTexture` slots. The GLB head
///   and its 4096² displacement jpg both load from the registered offline
///   assets and the lil-gui builds, but the first frame that draws the
///   Phong material throws the capability error card.
/// - `webgl_materials_texture_canvas`: the drawing canvas is an HTML-only
///   element (`<canvas id="drawing-canvas">`, original.html:30) that the
///   prepared facade never synthesizes — `tool/three_example/prepare.mjs`
///   only feeds inline `<script id>` blocks to `getElementById`. The module
///   throws `cannot read property 'getContext' of null` during init, while
///   the already-mounted R1 surface keeps rendering the (untextured) box:
///   the interactive paint path would additionally need the bounded
///   Canvas2D profile to grow `moveTo`/`lineTo`/`stroke`.
/// - `webgl_materials_texture_rotation`: R1 declares no UV transform
///   fields at all (`tool/three/src/native_renderer.js:510`, feature
///   `textureTransform`) and no `capabilities.getMaxAnisotropy`
///   (`tool/three/src/native_renderer.js:226-232`), so the texture onLoad
///   dies at the anisotropy assignment and the loader swallows the throw
///   because the official module passes no onError
///   (`tool/three/src/native_loaders.js:103-109`).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'materials examples',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
    'webgl_materials_bumpmap boots assets and GUI but every frame throws '
    'the bumpMap materialTexture gap',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-materials-bumpmap',
        instanceId: 'three-materials-bumpmap-test',
      );
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            harness.renderTrees.any(
              (tree) => tree.toString().contains('materialTexture'),
            ) ||
            harness.renderTrees.length > 4,
        attempts: 120,
      );

      // Boot facts from the module: both offline assets register (the
      // 4096^2 displacement jpg and the LeePerrySmith GLB) ...
      final exported = harness.engine.exportedState!;
      expect(exported['example'], 'webgl_materials_bumpmap');
      expect(exported['backend'], 'flutterGpu');
      expect(exported['canvasCount'], 1);
      expect(exported['mounted'], isTrue);
      final assets = exported['assets'] as Map<String, dynamic>;
      final jpg =
          assets['models/gltf/LeePerrySmith/'
                  'Infinite-Level_02_Disp_NoSmoothUV-4096.jpg']
              as Map<String, dynamic>;
      final glb =
          assets['models/gltf/LeePerrySmith/LeePerrySmith.glb']
              as Map<String, dynamic>;
      expect(jpg['registered'], isTrue);
      expect(jpg['bytes'] as int, greaterThan(100000));
      expect(glb['registered'], isTrue);
      expect(glb['bytes'] as int, greaterThan(100000));

      // ... and the lil-gui builds both official controllers.
      final gui = exported['gui'] as Map<String, dynamic>;
      expect(gui['native'], isTrue);
      expect(gui['controllers'], 2);
      final values = (gui['values'] as List).cast<Map<String, dynamic>>();
      expect(values, hasLength(2));
      expect(values[0]['property'], 'enableBumpMap');
      expect(values[0]['value'], isTrue);
      expect(values[1]['property'], 'bumpScale');
      expect(values[1]['value'], 10);

      // The GLB geometry loaded (the mesh exists) but the Phong material's
      // bumpMap slot is R1-unsupported: the standard error card carries the
      // exact capability text and no R1 frame was ever submitted.
      final errorCard = harness.renderTrees.last.toString();
      expect(errorCard, contains('three.unsupported: materialTexture'));
      expect(errorCard, contains('(MeshPhongMaterial.bumpMap)'));
      expect(errorCard, contains('native R1 does not provide this capability'));
      expect(harness.surface, isNull);
      expect((exported['renderer'] as Map<String, dynamic>)['frame'], 0);
      expect((exported['stats'] as Map<String, dynamic>)['updates'], 0);

      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );

  testWidgets('webgl_materials_texture_canvas crashes on the HTML-only drawing '
      'canvas while the R1 surface keeps drawing the untextured box', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-texture-canvas',
      instanceId: 'three-materials-texture-canvas-test',
    );
    await harness.pumpFrames(tester, 30);

    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_materials_texture_canvas');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    expect(exported['mounted'], isTrue);
    // No offline assets and no GUI in this module.
    expect(exported['assets'], isEmpty);
    expect((exported['gui'] as Map<String, dynamic>)['controllers'], 0);

    // setupCanvasDrawing() runs after init() and dies on the facade:
    // getElementById('drawing-canvas') is null because the drawing canvas
    // is declared only in the official HTML, which the facade does not
    // synthesize.
    final errorCard = harness.renderTrees.last.toString();
    expect(errorCard, contains('Widget error:'));
    expect(errorCard, contains("getContext' of null"));

    // The renderer was already mounted before the throw, so the R1
    // surface stays alive: the BoxGeometry(200,200,200) and its
    // MeshBasicMaterial upload once, the RAF loop keeps submitting
    // frames of the rotating box, and the CanvasTexture map never
    // uploads (textureUploadCount stays 0).
    final state = harness.state!;
    expect(state.geometryUploadCount, 1);
    expect(state.materials, hasLength(1));
    expect(state.textureUploadCount, 0);
    final framesAfterBoot = state.submittedFrameCount;
    expect(framesAfterBoot, greaterThan(1));
    await harness.pumpFrames(tester, 5);
    expect(state.submittedFrameCount, greaterThan(framesAfterBoot));

    final plan = const ThreeDrawPlanner().plan(state);
    expect(plan.canRender, isTrue);
    expect(plan.diagnostics.warnings, isEmpty);
    expect(plan.draws, hasLength(1));
    final draw = plan.draws.single;
    expect(draw.drawCount, 36); // 12 triangles: BoxGeometry(200,200,200)
    expect(draw.material.kind, JsThreeMaterialKind.meshBasic);
    expect(draw.material.mapTextureId, 0); // map assignment never ran

    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));

  testWidgets('webgl_materials_texture_rotation renders the rotating UV '
      'transform cube on R1 v4 (wave-3 UV-transform lane)', (tester) async {
    // The official module textures a BoxGeometry with uv_grid_opengl.jpg
    // and drives a lil-gui panel (repeat/offset/center/rotation) through
    // updateUvTransform(): texture.center.set(.5,.5),
    // texture.repeat.set(...), texture.offset.set(...),
    // texture.rotation = ... — all now ride the R1 v4 per-map UV matrix
    // (offset/repeat/rotation/center compose the three.js Matrix3
    // uvTransform into the material stream), and
    // capabilities.getMaxAnisotropy() is real (clamped to 1).
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-texture-rotation',
      instanceId: 'three-materials-texture-rotation-test',
    );
    final plan = await harness.pumpUntil(
      tester,
      (state, candidate) =>
          candidate.draws.isNotEmpty &&
          candidate.draws.first.material.mapTextureId != 0 &&
          state.submittedFrameCount >= 1,
    );
    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_materials_texture_rotation');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['mounted'], isTrue);
    final assets = exported['assets'] as Map<String, dynamic>;
    final uvGrid =
        assets['textures/uv_grid_opengl.jpg'] as Map<String, dynamic>;
    expect(uvGrid['registered'], isTrue);
    expect(uvGrid['bytes'] as int, greaterThan(100000));
    // The tree is the three canvas stacked with the native GUI overlay.
    expect(harness.surface, isNotNull);

    // The textured box draws with a non-identity map UV matrix (the GUI
    // default rotation 0.25 rad with repeat (2, 2), center (.5, .5)).
    expect(plan, isNotNull);
    expect(plan!.draws, isNotEmpty);
    final material = plan.draws.first.material;
    expect(material.mapTextureId, greaterThan(0));
    expect(material.mapUvMatrix[0], closeTo(0.1767767, 1e-4),
        reason: '0.25·cos(45°) — the official GUI-default uvTransform '
            '(repeat 0.25, rotation π/4, center 0.5)');
    expect(material.mapUvMatrix[4], closeTo(0.1767767, 1e-4));
    // The seven official GUI controllers mount.
    expect((exported['gui'] as Map<String, dynamic>)['controllers'], 7);
    // The module renders on demand (no animation loop): flipping the
    // repeat.x controller through the bounded facade re-renders with the
    // new UV matrix (2·cos(45°) after the 0.25 → 2.0 live-switch).
    final submitted = harness.state!.submittedFrameCount;
    final guiRows = ((exported['gui'] as Map<String, dynamic>)['values']
            as List)
        .cast<Map<String, dynamic>>();
    final repeatRow = guiRows.firstWhere(
      (row) => row['name'] == 'repeat.x',
    );
    await harness.backend.callEvent(
      repeatRow['action'] as String,
      {'value': 2.0},
    );
    final flipped = await harness.pumpUntil(
      tester,
      (state, candidate) =>
          candidate.draws.isNotEmpty &&
          (candidate.draws.first.material.mapUvMatrix[0] - 1.4142136).abs() <
              1e-4,
    );
    expect(flipped, isNotNull,
        reason: 'the repeat.x live-switch must reach the map UV matrix');
    expect(harness.state!.submittedFrameCount, greaterThan(submitted));
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}

/// The exported probe collector from the instrumented rotation widget, or
/// null until the first probe export has landed.
