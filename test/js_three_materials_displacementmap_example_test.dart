import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// webgl_materials_displacementmap — DOCUMENTED FACADE GAP (not a widget bug).
///
/// Three stacked R1 gaps; this test pins the first (exactly what the
/// unmodified widget does) and uses an instrumented copy to prove the
/// other two plus everything that DOES work:
///
/// 1. BOOT GAP (kills the unmodified widget): the module loads its
///    SwedishRoyalCastle env map with `new THREE.CubeTextureLoader()`
///    (official_module.js:135) BEFORE initGui(), the ninja textures, the
///    MeshStandardMaterial and the OBJ head. The native runtime only
///    remaps `TextureLoader`/`FileLoader` to the offline asset bridge
///    (tool/three/src/native_entry.js:12) — `CubeTextureLoader` stays
///    upstream and creates HTML `<img>` elements, and the prepared
///    facade's img path requires OffscreenCanvas, which exists only on
///    the 1B/webgl2 backend (tool/three/src/runtime.js:230,235). init()
///    dies with `Widget error: ...: local web textures require
///    OffscreenCanvas`; the already-registered RAF loop then ticks into
///    `cannot read property 'begin' of undefined` every frame because
///    animate() calls stats.begin() before the Stats object was created.
///
/// 2. ASSET GUARD GAP (probe finding): with the cube load skipped, the
///    ninja head OBJ load still fails with
///    `three.assetFailure: ...: surface was disposed during file load` —
///    the render-envelope sweep during the same synchronous init bumps
///    the canvas `_assetEpoch` (tool/three/src/runtime.js:355-359 detach
///    inside `_prepareTree`), invalidating every in-flight file-load
///    guard (tool/three/src/native_loaders.js:30-34). The probe defers
///    the OBJ load by one `setTimeout(0)` so the guard is captured after
///    the epoch stabilizes — then the head parses normally.
///
/// 3. MATERIAL GAP (the namesake): MeshStandardMaterial fills FOUR slots
///    R1 rejects — aoMap, displacementMap, envMap, normalMap.
///    `validateMaterial` lists every material texture slot except `map`
///    as `three.unsupported: materialTexture`
///    (tool/three/src/native_renderer.js:200-201) and reports the FIRST
///    set slot in check order, `aoMap`, before the namesake
///    `displacementMap`. The probe peels one slot per tick: full material
///    -> aoMap rejection -> displacementMap STILL rejected -> all cleared
///    -> the ninja head (8884 triangles) uploads and draws on R1 with
///    the module's 3 point lights and 0.2 ambient.
///
/// 4. LIL-GUI — RESOLVED, kept as a live regression probe: the official
///    `gui.add(settings,'metalness').min(0).max(1)` idiom mounts end to
///    end. The bounded native facade gained validated late-bound chained
///    .min(v)/.max(v), the bare-numeric add() dispatch (both copies) now
///    routes to a late-bound NumberController, and setValue guards both
///    clamp sides (undefined bounds skip their side; step-snap base falls
///    back to 0) so `.min()` writes the unchanged value. A dedicated
///    facade probe pins both idioms hop by hop (inline-bounds + official
///    bare-add-then-chain); with only the cube-loader gap #1 stubbed,
///    initGui() mounts all seven controllers.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test('materials displacementmap example', () {},
        skip: 'QuickJS native library is not available');
    return;
  }

  testWidgets(
    'webgl_materials_displacementmap init dies on the CubeTextureLoader '
    'OffscreenCanvas facade gap',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-materials-displacementmap',
        instanceId: 'three-materials-displacementmap-test',
      );
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            harness.renderTrees.any((tree) =>
                tree.toString().contains('OffscreenCanvas')) ||
            harness.renderTrees.length > 4,
        attempts: 120,
      );

      // Boot facts from the module: all four offline ninja assets register
      // with the embedded byte payloads.
      final exported = harness.engine.exportedState!;
      expect(exported['example'], 'webgl_materials_displacementmap');
      expect(exported['backend'], 'flutterGpu');
      expect(exported['canvasCount'], 1);
      expect(exported['mounted'], isTrue);
      final assets = exported['assets'] as Map<String, dynamic>;
      final head =
          assets['models/obj/ninja/ninjaHead_Low.obj'] as Map<String, dynamic>;
      final displacement =
          assets['models/obj/ninja/displacement.jpg'] as Map<String, dynamic>;
      final normal =
          assets['models/obj/ninja/normal.png'] as Map<String, dynamic>;
      final ao = assets['models/obj/ninja/ao.jpg'] as Map<String, dynamic>;
      expect(head['registered'], isTrue);
      expect(head['bytes'] as int, greaterThan(600));
      expect(displacement['registered'], isTrue);
      expect(displacement['bytes'] as int, greaterThan(800));
      expect(normal['registered'], isTrue);
      expect(normal['bytes'] as int, greaterThan(500));
      expect(ao['registered'], isTrue);
      expect(ao['bytes'] as int, greaterThan(700));

      // The CubeTextureLoader facade lane works now, so init() completes:
      // the GUI mounts and Stats ticks. The remaining gap moved to the
      // material texture family — every RAF render throws
      // materialTexture (MeshStandardMaterial.aoMap) after stats.begin().
      final gui = exported['gui'] as Map<String, dynamic>;
      expect(gui['controllers'], 7);
      expect(gui['values'], hasLength(7));
      final stats = exported['stats'] as Map<String, dynamic>;
      expect(stats['begins'], greaterThan(0));
      expect((exported['renderer'] as Map<String, dynamic>)['frame'], 0);

      // The mount envelope went out, then the standard capability card
      // naming the aoMap slot (no more OffscreenCanvas facade error).
      expect(harness.renderTrees.first['type'], 'three');
      expect(
        harness.renderTrees.any((tree) => tree.toString().contains(
            'materialTexture (MeshStandardMaterial.aoMap)')),
        isTrue,
      );
      expect(harness.surface, isNull);

      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );

  testWidgets(
    'displacementmap probe: cube skipped and OBJ deferred, aoMap then '
    'displacementMap rejected, full strip draws the head on R1',
    (tester) async {
      final probe = await ThreeQuickjsExampleHarness.bootSource(
        tester,
        source: _displacementProbeSource(),
        instanceId: 'three-materials-displacementmap-gap-probe',
      );
      await probe.pumpUntil(
        tester,
        (state, plan) =>
            state.geometryUploadCount > 0 &&
            plan.draws.isNotEmpty &&
            state.submittedFrameCount >= 1,
        attempts: 150,
      );

      // With the boot gap removed, init() completes AND initGui() now
      // FULLY mounts: the late-bound dispatch + guarded setValue clamp
      // landed, so the official `gui.add(settings, 'metalness')
      // .min(0).max(1)` idiom works end to end — all seven controllers
      // build with the model-derived displacementScale, and no lil-gui
      // error card (gap #1, the cube loader, is the only thing still
      // keeping the UNMODIFIED widget dead before initGui).
      final exported = probe.engine.exportedState!;
      final gui = exported['gui'] as Map<String, dynamic>;
      expect(gui['native'], isTrue);
      expect(gui['controllers'], 7);
      final values = (gui['values'] as List).cast<Map<String, dynamic>>();
      expect(values, hasLength(7));
      final displacementScale = values.firstWhere(
        (entry) => entry['property'] == 'displacementScale',
      );
      expect((displacementScale['value'] as num).toDouble(),
          closeTo(2.436143, 1e-5));
      expect(
        values.map((entry) => entry['property']),
        containsAll(<String>[
          'metalness',
          'roughness',
          'ambientIntensity',
          'normalScale',
        ]),
      );
      expect(
        probe.renderTrees.any((tree) => tree.toString().contains('lil-gui')),
        isFalse,
      );

      // The cube env map was skipped (boot gap) and the deferred OBJ load
      // resolved: the ninja head parsed — OBJLoader expands its 8884
      // triangles (736 tri + 4074 quad faces) into a non-indexed position
      // attribute.
      final logs = probe.backend.peekLogs().map((log) => log['msg'] as String);
      expect(logs.any((msg) => msg.contains('JSR_CUBE skipped')), isTrue);
      final objLog = _marker(logs, 'JSR_OBJ verts=');
      expect(objLog, isNotEmpty);
      final vertsMatch = RegExp(r'JSR_OBJ verts=(\d+)').firstMatch(objLog);
      expect(vertsMatch, isNotNull);
      expect(int.parse(vertsMatch!.group(1)!), 26652);
      expect(logs.any((msg) => msg.contains('JSR_OBJERR')), isFalse);

      // Failure ladder from the real per-frame render path: the intact
      // material is rejected on aoMap (the facade's first set slot), then
      // with ao/normal/env stripped the namesake displacementMap is STILL
      // rejected.
      final aoFail = _marker(logs, 'JSR_RENDERFAIL stage=0');
      expect(aoFail, isNotEmpty);
      expect(aoFail, contains('code=three.unsupported'));
      expect(aoFail, contains('feature=materialTexture'));
      expect(aoFail, contains('(MeshStandardMaterial.aoMap)'));

      expect(_marker(logs, 'JSR_STAGE1'), contains('displacementMap=true'));
      final displacementFail = _marker(logs, 'JSR_RENDERFAIL stage=1');
      expect(displacementFail, isNotEmpty);
      expect(displacementFail, contains('feature=materialTexture'));
      expect(
        displacementFail,
        contains('(MeshStandardMaterial.displacementMap)'),
      );
      expect(
        _marker(logs, 'JSR_STAGE2'),
        contains('scale=2.436143'), // from the original model
      );

      // With all texture slots cleared the module renders on R1: the head
      // mesh uploads once (no texture uploads remain), the
      // MeshStandardMaterial keeps the module's roughness/metalness, and
      // the draw carries the full triangle expansion (8884 * 3 verts).
      expect(_marker(logs, 'JSR_RENDER_OK'), isNotEmpty);

      final state = probe.state!;
      expect(state.geometryUploadCount, 1);
      expect(state.materials, hasLength(1));
      expect(state.textureUploadCount, 0);
      final framesAfterLadder = state.submittedFrameCount;
      expect(framesAfterLadder, greaterThan(0));

      final plan = const ThreeDrawPlanner().plan(state);
      expect(plan.canRender, isTrue);
      expect(plan.diagnostics.warnings, isEmpty);
      expect(plan.draws, hasLength(1));
      final draw = plan.draws.single;
      expect(draw.drawCount, 26652);
      expect(draw.material.kind, JsThreeMaterialKind.meshStandard);
      expect(draw.material.roughness, closeTo(0.4, 1e-5));
      expect(draw.material.metalness, closeTo(1.0, 1e-5));
      expect(draw.material.mapTextureId, 0);

      // The module's full light rig survives, including the 0xff6666
      // light parented to the orthographic camera: the orbiting red
      // PointLight(0xff0000, 1.5), the camera's PointLight(0xff6666, 3)
      // and the blue PointLight(0x0000ff, 1.5), over AmbientLight
      // (0xffffff, 0.2).
      expect(plan.pointLights, hasLength(3));
      final redLight = plan.pointLights.firstWhere(
        (light) => light.colorR > 0.9 && light.colorG < 0.1,
      );
      expect(redLight.intensity, closeTo(1.5, 1e-5));
      final cameraLight = plan.pointLights.firstWhere(
        (light) => light.intensity > 2,
      );
      expect(cameraLight.intensity, closeTo(3.0, 1e-5));
      expect(cameraLight.colorR, greaterThan(0.9)); // 0xff6666
      final blueLight = plan.pointLights.firstWhere(
        (light) => light.colorR < 0.1 && light.colorB > 0.9,
      );
      expect(blueLight.intensity, closeTo(1.5, 1e-5));
      expect(plan.ambient.r, closeTo(0.2, 1e-5));
      expect(plan.ambient.g, closeTo(0.2, 1e-5));
      expect(plan.ambient.b, closeTo(0.2, 1e-5));

      // The RAF loop keeps submitting frames of the (now untextured) head.
      await probe.pumpFrames(tester, 5);
      expect(state.submittedFrameCount, greaterThan(framesAfterLadder));

      await probe.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );

  testWidgets(
    'displacementmap facade probe: both the inline-bounds and the official '
    'bare add(number).min().max() idioms mount',
    (tester) async {
      final probe = await ThreeQuickjsExampleHarness.bootSource(
        tester,
        source: _facadeProbeSource(),
        instanceId: 'three-materials-displacementmap-gui-probe',
      );
      await probe.pumpUntil(
        tester,
        (state, plan) => plan.draws.isNotEmpty,
        attempts: 150,
      );

      final logs = probe.backend.peekLogs().map((log) => log['msg'] as String);

      // Half 1 — inline-bounds controller accepts the chained
      // .min(v)/.max(v) calls, validates them, re-snapshots and keeps the
      // property value in range.
      final inlineOk = _marker(logs, 'JSR_FACADE_INLINE_OK');
      expect(inlineOk, isNotEmpty);
      expect(inlineOk, contains('v=0.4')); // settings.roughness unchanged
      expect(logs.any((msg) => msg.contains('JSR_FACADE_INLINE_ERR')), isFalse);

      // Half 2 — the official idiom mounts end to end (regression pin):
      // bare add dispatches to a late-bound NumberController, `.min(0)`
      // writes the UNCHANGED value (guarded clamp), `.max(5)` validates
      // cleanly, and the model-derived displacementScale survives.
      final bareAddOk = _marker(logs, 'JSR_FACADE_BARE_ADD_OK');
      expect(bareAddOk, isNotEmpty); // dispatch + ctor: landed
      final bareMinOk = _marker(logs, 'JSR_FACADE_BARE_MIN_OK');
      expect(bareMinOk, isNotEmpty);
      expect(bareMinOk, contains('v=2.436143')); // getValue() unchanged
      expect(bareMinOk, contains('after=2.436143')); // settings untouched
      final bareMaxOk = _marker(logs, 'JSR_FACADE_BARE_MAX_OK');
      expect(bareMaxOk, isNotEmpty);
      expect(bareMaxOk, contains('v=2.436143'));
      expect(logs.any((msg) => msg.contains('JSR_FACADE_BARE_ERR')), isFalse);

      // Controller census: this probe's inline + bare controllers plus the
      // official seven (initGui() no longer dies on its first controller).
      final gui = probe.engine.exportedState!['gui'] as Map<String, dynamic>;
      expect(gui['native'], isTrue);
      expect(gui['controllers'], 9);

      await probe.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 180)),
  );
}

/// The displacement widget.js with three name-independent probes injected
/// (the prepared artifact is re-minified with changing identifier names, so
/// every patch anchors on official string literals instead):
///
/// - the SwedishRoyalCastle cube env map load is replaced (removing the
///   OffscreenCanvas boot gap so the module reaches its material);
/// - the OBJ head load is deferred by one setTimeout(0) (working around the
///   in-flight asset-guard invalidation), logs its vertex count, and gains
///   an error callback that would surface any remaining load failure;
/// - renderer.render() is wrapped in a staged strip that peels one
///   unsupported texture slot per tick and logs the exact capability error.
String _displacementProbeSource() {
  var source = File(
    'example/widgets/three-materials-displacementmap/widget.js',
  ).readAsStringSync();
  source = _skipCubeEnvMap(source);
  source = _deferObjLoad(source);
  return _injectRenderLadder(source);
}

/// The displacement probe plus a facade-semantics probe: two controlled
/// `new GUI()` experiments injected at the top of the module's initGui(),
/// before the official first controller throws. Uses the SAME minified
/// GUI/settings identifiers the module itself uses (captured from the
/// `function initGui(){ let g = new GUI(); g.add(settings,"metalness")`
/// shape), so it survives re-minification.
String _facadeProbeSource() =>
    _injectFacadeProbe(_displacementProbeSource());

/// Injects the chained-min/max vs bare-add experiments into initGui(),
/// right after `let gui = new GUI();` and BEFORE the official first
/// controller (which throws on its bare numeric add).
String _injectFacadeProbe(String source) {
  final initGui = RegExp(
    r'function [A-Za-z0-9_$]+\(\)\{let [A-Za-z0-9_$]+=new '
    r'([A-Za-z0-9_$]+);(?=[A-Za-z0-9_$]+\.add\(([A-Za-z0-9_$]+),'
    r'"metalness"\))',
  ).firstMatch(source);
  if (initGui == null) {
    throw StateError('facade probe: initGui head is missing');
  }
  final guiClass = initGui.group(1)!;
  final settings = initGui.group(2)!;
  final injectStart = initGui.start + initGui.group(0)!.length;
  final probe = 'try{var __c=new $guiClass().add($settings,"roughness",0,1)'
      '.min(.25).max(1);console.log("JSR_FACADE_INLINE_OK v="+__c.getValue())}'
      'catch(e){console.log("JSR_FACADE_INLINE_ERR "+e.message)}'
      'try{var __d=new $guiClass().add($settings,"displacementScale");'
      'console.log("JSR_FACADE_BARE_ADD_OK");'
      '__d.min(0);'
      'console.log("JSR_FACADE_BARE_MIN_OK v="+__d.getValue()'
      '+" after="+$settings.displacementScale);'
      '__d.max(5);console.log("JSR_FACADE_BARE_MAX_OK v="+__d.getValue())}'
      'catch(e){console.log("JSR_FACADE_BARE_ERR "+e.message)}';
  return source.replaceRange(injectStart, injectStart, probe);
}

/// Replaces `c = new CubeTextureLoader().load(a)` with a logged null.
String _skipCubeEnvMap(String source) {
  final cubeIndex = source.indexOf('"textures/cube/SwedishRoyalCastle/"');
  if (cubeIndex < 0) {
    throw StateError('displacementmap probe: cube path literal is missing');
  }
  final call = RegExp(
    r'new [A-Za-z_$][A-Za-z0-9_$]*\(\)\.load\([A-Za-z_$][A-Za-z0-9_$]*\)',
  ).firstMatch(source.substring(cubeIndex, cubeIndex + 600));
  if (call == null) {
    throw StateError('displacementmap probe: cube load call is missing');
  }
  return source.replaceRange(
    cubeIndex + call.start,
    cubeIndex + call.end,
    '(console.log("JSR_CUBE skipped (OffscreenCanvas img path)"),null)',
  );
}

/// Wraps the OBJ head load in setTimeout(0), logs the parsed vertex count,
/// raises `__jsrMesh` for the render ladder, and adds an onError callback.
String _deferObjLoad(String source) {
  final objIndex = source.lastIndexOf('"models/obj/ninja/ninjaHead_Low.obj"');
  if (objIndex < 0) {
    throw StateError('displacementmap probe: OBJ literal is missing');
  }
  final callback = RegExp(
    r'function\(([A-Za-z_$][A-Za-z0-9_$]*)\)\{'
    r'let ([A-Za-z_$][A-Za-z0-9_$]*)=\1\.children\[0\]\.geometry;'
    r'\2\.center\(\),',
  ).firstMatch(source.substring(objIndex, objIndex + 400));
  if (callback == null) {
    throw StateError('displacementmap probe: OBJ onLoad is missing');
  }
  final geometry = callback.group(2)!;
  final callbackStart = objIndex + callback.start;

  // ... }) end of `.scale.multiplyScalar(25), mesh.add(meshVar)})`.
  final scaleIndex = source.indexOf('.scale.multiplyScalar(25)', callbackStart);
  final callEnd = RegExp(
    r'[A-Za-z_$][A-Za-z0-9_$]*\.add\([A-Za-z_$][A-Za-z0-9_$]*\)\}\)',
  ).firstMatch(source.substring(scaleIndex, scaleIndex + 200));
  if (callEnd == null) {
    throw StateError('displacementmap probe: OBJ call end is missing');
  }
  final loadClose = scaleIndex + callEnd.end - 1;
  final loaderCall = source.lastIndexOf('.load("models/obj/ninja/');
  final loaderStart = source.lastIndexOf('new ', loaderCall);

  // Insert right-to-left so earlier indices stay valid.
  source = source.replaceRange(
    loadClose + 1,
    loadClose + 1,
    '},0)',
  );
  source = source.replaceRange(
    loadClose,
    loadClose,
    ',undefined,function(e){console.error("JSR_OBJERR "+e.message)}',
  );
  source = source.replaceRange(
    callbackStart + callback.group(0)!.length,
    callbackStart + callback.group(0)!.length,
    'console.log("JSR_OBJ verts="+' 
    '($geometry.attributes.position'
    '?$geometry.attributes.position.count:-1)),'
    'globalThis.__jsrMesh=1,',
  );
  return source.replaceRange(
    loaderStart,
    loaderStart,
    'setTimeout(function(){return ',
  );
}

/// Wraps `r += 0.01, renderer.render(scene, camera)` in the staged strip.
String _injectRenderLadder(String source) {
  final orbitIndex = source.lastIndexOf('+=.01,');
  final orbitWindow = source.substring(
    orbitIndex - 40 < 0 ? 0 : orbitIndex - 40,
    orbitIndex + 200 > source.length ? source.length : orbitIndex + 200,
  );
  final render = RegExp(
    r'[A-Za-z_$][A-Za-z0-9_$]*\+=\.01,'
    r'([A-Za-z_$][A-Za-z0-9_$]*)\.render\('
    r'([A-Za-z_$][A-Za-z0-9_$]*),([A-Za-z_$][A-Za-z0-9_$]*)\)',
  ).firstMatch(orbitWindow);
  if (render == null) {
    throw StateError('displacementmap probe: render call is missing');
  }
  final colorIndex = source.indexOf('12698049');
  final materialMatch = RegExp(
    r'([A-Za-z_$][A-Za-z0-9_$]*)=new [A-Za-z_$][A-Za-z0-9_$]*'
    r'\(\{color:12698049',
  ).firstMatch(source.substring(
    colorIndex - 200 < 0 ? 0 : colorIndex - 200,
    colorIndex + 50,
  ));
  if (materialMatch == null) {
    throw StateError('displacementmap probe: material ctor is missing');
  }
  final mat = materialMatch.group(1)!;
  final renderer = render.group(1)!;
  final scene = render.group(2)!;
  final camera = render.group(3)!;
  final ladder = '(function(){if(!globalThis.__jsrMesh)return;'
      'var pre=globalThis.__jsrStage||0;'
      'if(pre===1){$mat.aoMap=null;$mat.normalMap=null;$mat.envMap=null,'
      'console.log("JSR_STAGE1 stripped ao/normal/env '
      'displacementMap="+!!$mat.displacementMap)}'
      'else if(pre===2){$mat.displacementMap=null,'
      'console.log("JSR_STAGE2 stripped displacementMap '
      'scale="+$mat.displacementScale)}'
      'try{if($renderer.render($scene,$camera),pre>=2)'
      'console.log("JSR_RENDER_OK stage="+pre)}'
      'catch(e){console.error("JSR_RENDERFAIL stage="+pre'
      '+" code="+e.code+" feature="+e.feature+" msg="+e.message)}'
      'globalThis.__jsrStage=pre+1;})()'
      .replaceAll('\n', '');
  final windowStart = orbitIndex - 40 < 0 ? 0 : orbitIndex - 40;
  final renderStart = windowStart + render.start;
  // Keep only the orbit increment (`r += 0.01`); the ladder performs the
  // render inside its own try/catch so the staged failure is observable
  // instead of aborting the RAF callback on the first throw.
  final orbitPrefix =
      source.substring(renderStart, renderStart + render.group(0)!.length);
  final prefixEnd = orbitPrefix.indexOf('+=.01,') + '+=.01,'.length;
  return source.replaceRange(
    renderStart,
    renderStart + render.group(0)!.length,
    '${orbitPrefix.substring(0, prefixEnd)}$ladder',
  );
}

/// First log entry containing [marker], or '' when absent.
String _marker(Iterable<String> logs, String marker) {
  for (final log in logs) {
    if (log.contains(marker)) return log;
  }
  return '';
}
