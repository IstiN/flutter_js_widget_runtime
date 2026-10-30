import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/three_patch_once.dart' as patch_support;
import 'support/widget_logic_helper.dart';

/// webgl_materials_cubemap_refraction — DOCUMENTED FACADE GAP (teapot
/// precedent, one layer deeper).
///
/// The official module loads a 6-face cube map with the upstream
/// `CubeTextureLoader` (`textures/cube/Park3Med/{px,nx,py,ny,pz,nz}.jpg`),
/// sets it as `scene.background` AND as the `envMap` of three
/// `MeshPhongMaterial`s (refractionRatio .98/.985/.98, CubeRefractionMapping
/// mapping), then refacts three Lucy100k.ply statues with them.
///
/// The native bundle only replaces TextureLoader/FileLoader
/// (tool/three/src/native_three_shim.js:4) — upstream CubeTextureLoader
/// still goes through ImageLoader, i.e. one `<img>` per face — and the
/// wrapper's img path throws
/// `three-materials-cubemap-refraction: local web textures require
/// OffscreenCanvas`
/// (tool/three_example/example_adapter.js:187-190) because the QuickJS host
/// exposes no OffscreenCanvas. init() aborts at that first
/// `new CubeTextureLoader().load(urls)` call — before the renderer, the
/// animation loop and the PLY load even exist.
///
/// Part 1 pins that boot death on the unmodified widget (error card +
/// `mounted: false` + `renderer.frame: 0`), and records the layer-2 fact:
/// unlike the teapot widget, this prepared widget embeds ONLY
/// Lucy100k.ply — none of the six Park3Med faces are registered, so an
/// OffscreenCanvas shim alone would still die on `unregistered image URL`.
///
/// Part 2 stubs ONLY the cube load (minifier-proof regex, teapot pattern):
/// the widget then boots fully (canvas mounted, animation loop ticking,
/// Lucy100k.ply decodes: 50002 verts / 100000 faces) and — with
/// `scene.background` left null — even submits frames of the empty scene.
/// The moment the three refraction meshes join the scene, every
/// renderer.render() throws `three.unsupported: materialTexture
/// (MeshPhongMaterial.envMap)` (tool/three/src/native_renderer.js:200-201
/// — envMap is in validateMaterial's rejected texture slots), rolling each
/// frame transaction back: the submitted frame count freezes at its
/// pre-PLY value. So the cube texture is rejected in BOTH slots
/// it would ever reach (background at native_renderer.js:976, envMap at
/// :200) — pinned per-frame end state: `feature=materialTexture`,
/// `MeshPhongMaterial.envMap`.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'materials cubemap refraction example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
      'webgl_materials_cubemap_refraction dies at boot on the unshimmed '
      'CubeTextureLoader img path (OffscreenCanvas facade gap)',
      (tester) async {
    // Part 1 — the unmodified widget: synchronous init() death.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-materials-cubemap-refraction',
      instanceId: 'three-materials-cubemap-refraction-test',
    );
    await harness.pumpFrames(tester, 60);

    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_materials_cubemap_refraction');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    // init() died before the renderer canvas was appended.
    expect(exported['mounted'], isFalse);
    // The PLY statue asset ships embedded — but none of the six Park3Med
    // cube faces do (layer-2 gap: an OffscreenCanvas shim alone would hit
    // `unregistered image URL textures/cube/Park3Med/px.jpg` next).
    final assets = exported['assets'] as Map<String, dynamic>;
    expect(
      (assets['models/ply/binary/Lucy100k.ply'] as Map<String, dynamic>)['registered'],
      isTrue,
    );
    for (final face in ['px', 'nx', 'py', 'ny', 'pz', 'nz']) {
      expect(
        assets.containsKey('textures/cube/Park3Med/$face.jpg'),
        isFalse,
        reason: 'textures/cube/Park3Med/$face.jpg must not be embedded',
      );
    }
    // The exact boot-death string from the facade img shim — NOT a
    // three.unsupported capability error.
    expect(
      harness.renderTrees.last.toString(),
      contains('Widget error: three-materials-cubemap-refraction: local web '
          'textures require OffscreenCanvas'),
    );
    final allTrees = harness.renderTrees.map((tree) => tree.toString());
    expect(allTrees.join('\n'), isNot(contains('three.unsupported')));
    expect(harness.surface, isNull);
    expect((exported['renderer'] as Map<String, dynamic>)['frame'], 0);
    expect((exported['stats'] as Map<String, dynamic>)['updates'], 0);
    await harness.dispose(tester);

    // Part 2 — instrumented copy: stub only the cube load statement and
    // surface the per-frame failure. This pins the layered reality: the
    // widget boots and renders the (background-less) empty scene, the PLY
    // statues decode, and then every frame dies on the envMap slot.
    var source = File(
      'example/widgets/three-materials-cubemap-refraction/widget.js',
    ).readAsStringSync();
    // Shared structural patch anchor (test/support/three_patch_once.dart).
    String patchOnce(String label, RegExp re, String Function(Match) build) =>
        patch_support.patchOnce(source, label, re, build);

    // Cube load stub: keep a truthy envMap placeholder, leave the scene
    // background unset (null is R1-legal), and raise the state flag.
    source = patchOnce(
      'cubeLoad',
      RegExp(r'([A-Za-z_$][\w$]*)=new ([A-Za-z_$][\w$]*)\(\)\.load\('
          r'([A-Za-z_$][\w$]*)\);\1\.mapping=([A-Za-z_$][\w$]*),'
          r'([A-Za-z_$][\w$]*)=new ([A-Za-z_$][\w$]*),\5\.background=\1;'),
      (m) => '${m[1]}={isCubeTexture:!0,images:[]};${m[5]}=new ${m[6]},'
          'globalThis.__JSR_PROBE=Object.assign(globalThis.__JSR_PROBE||{},'
          '{cubeStubed:!0});',
    );
    // createScene(): PLY decode facts as state flags.
    source = patchOnce(
      'ply',
      RegExp(r'function ([A-Za-z_$][\w$]*)\(([A-Za-z_$][\w$]*),'
          r'([A-Za-z_$][\w$]*),([A-Za-z_$][\w$]*),([A-Za-z_$][\w$]*)\)\{'
          r'\2\.computeVertexNormals\(\);'),
      (m) => 'function ${m[1]}(${m[2]},${m[3]},${m[4]},${m[5]}){'
          'globalThis.__JSR_PROBE=Object.assign(globalThis.__JSR_PROBE||{},'
          '{plyVerts:${m[2]}.attributes.position.count,'
          'plyFaces:${m[2]}.index?${m[2]}.index.count/3:-1});'
          '${m[2]}.computeVertexNormals();',
    );
    // Tail render(): capability-failure marker. The call sits at the very
    // end of the bundle: `…render(scene,camera)}})();`.
    source = patchOnce(
      'render',
      RegExp(r'([A-Za-z_$][\w$]*)\.render\(([A-Za-z_$][\w$]*),'
          r'([A-Za-z_$][\w$]*)\)\}\}\)\(\);'),
      (m) => '(function(){try{return ${m[1]}.render(${m[2]},${m[3]})}catch(e)'
          '{console.error("JSR_RENDERFAIL code="+e.code+" feature="+e.feature'
          '+" msg="+e.message)}})()}})();',
    );
    // State-flag export: merge globalThis.__JSR_PROBE into every facade
    // exportState call (the log ring buffer caps, so durable facts ride
    // the exported state instead).
    source = patchOnce(
      'probeExport',
      RegExp(r'\.exportState\(([A-Za-z_$][\w$]*)\)'),
      (m) => '.exportState(Object.assign({},${m[1]},'
          '{probe:globalThis.__JSR_PROBE}))',
    );
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: source,
      instanceId: 'three-materials-cubemap-refraction-gap-probe',
    );
    // The stubbed widget submits real frames while its scene is still
    // empty (background null is R1-legal).
    await probe.pumpUntil(
      tester,
      (state, plan) => state.submittedFrameCount >= 1,
    );
    // Patient pumping: the 1.9 MB Lucy100k.ply decodes asynchronously
    // inside QuickJS before the three refraction meshes join the scene.
    for (var attempt = 0; attempt < 240; attempt++) {
      final logs = (probe.backend as QuickjsWidgetEngineBackend)
          .peekLogs()
          .map((entry) => entry['msg'] as String);
      if (logs.any((msg) => msg.contains('JSR_RENDERFAIL'))) break;
      await probe.pumpFrame(tester);
    }
    final backend = probe.backend as QuickjsWidgetEngineBackend;
    final logs = backend.peekLogs().map((entry) => entry['msg'] as String);

    // The cube load was stubbed, and the module booted past it; Lucy100k.ply
    // decodes with its official vertex/face counts (state flags ride the
    // exported state — the log ring caps under the per-frame error spam).
    final probeExported = probe.engine.exportedState!;
    final probeFacts = probeExported['probe'] as Map<String, dynamic>;
    expect(probeFacts['cubeStubed'], isTrue);
    expect(probeFacts['plyVerts'], 50002);
    expect(probeFacts['plyFaces'], 100000);
    // The pinned end-state per-frame failure: the wave-3 envMap lane
    // accepts a single equirect 2D texture, but this module's six-jpg
    // CubeTexture never resolves to a facade THREE.Texture at all (the
    // Park3Med jpgs are not registered assets), so the material map slot
    // rejects the raw cube object — the module stays web-lane.
    final failure = logs.firstWhere(
      (msg) => msg.contains('JSR_RENDERFAIL'),
      orElse: () => '',
    );
    expect(failure, isNotEmpty);
    expect(failure, contains('code=three.unsupported'));
    expect(failure, contains('feature=texture'));
    expect(
      failure,
      contains('msg=three.unsupported: texture '
          '(material map is not a THREE.Texture)'),
    );
    expect(failure, contains('native R1 does not provide this capability'));
    // Frame submission evidence: while the scene was still empty
    // (background null is R1-legal) real three trees were submitted; once
    // the refraction meshes joined, every RAF tick throws and rolls its
    // frame transaction back — so the submitted frame count freezes at the
    // pre-PLY value and never advances again.
    expect(probeExported['mounted'], isTrue);
    expect(
      probe.renderTrees.map((tree) => tree['type']),
      contains('three'),
    );
    final frozenAt = probe.state?.submittedFrameCount ?? 0;
    await probe.pumpFrames(tester, 8);
    expect(probe.state?.submittedFrameCount ?? 0, frozenAt);
    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 300)));
}
