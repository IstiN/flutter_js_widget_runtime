import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_gap_documentation.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';
import 'support/three_patch_once.dart';

/// webgl_sprites (three.js r186) — DOCUMENTED FACADE GAP (not a widget bug).
///
/// The official module builds TWO sprite scenes and renders both every
/// animation tick: a perspective scene with 200 `THREE.Sprite`s inside a
/// rotating group (materials cloned from `SpriteMaterial({map: sprite1.png |
/// sprite2.png})`, the sprite2 clones hue-cycled via setHSL with map
/// offset/repeat (−.5,−.5)/(2,2)) and an orthographic HUD scene with 5
/// `Sprite`s from the sprite0.png onLoad callback (`center` pinned to the
/// screen corners + center). Both scenes draw through
/// `renderer.autoClear=false; clear(); render(scene,camera); clearDepth();
/// render(sceneOrtho,cameraOrtho)`.
///
/// The shared R1 native renderer does not support sprites at all:
///
/// - tool/three/src/native_renderer.js:909 — the `_updateObject` drawable
///   branch rejects every non-mesh/line/points drawable:
///   `object.isSkinnedMesh || object.isInstancedMesh || object.isBatchedMesh
///   || object.isSprite || object.isLOD` → `unsupported('objectType',
///   object.type)` (the same guard also protects the mesh branch at :886).
///   THREE.Sprite therefore throws
///   `three.unsupported: objectType (Sprite); native R1 does not provide
///   this capability; use the 1B backend where available`.
/// - Even without :909, `SpriteMaterial` is outside `materialKind()`
///   (native_renderer.js:176 — Basic/Lambert/Standard/Line/Points/Phong/
///   Normal/Shadow only).
///
/// The throw happens inside the `setAnimationLoop` callback on the FIRST
/// tick (`renderer.render(scene, camera)` precedes the ortho render), so
/// the frame transaction rolls back (native_renderer.js:1029
/// render()/try-catch): `renderer.info.render.frame` stays 0, no surface is
/// ever created, zero geometry/texture uploads, and the per-frame failure
/// renders the standard error card (js_widget_engine_quickjs
/// _reportAsyncError). The embedded textures themselves are healthy — the
/// adapter registers sprite0/1/2.png at boot and the sprite0.png
/// `TextureLoader.load` onLoad callback fires (part 2 probe).
///
/// Part 2 is an instrumented copy of widget.js with a state-flag probe that
/// pins the exact facts: init() creates 200 sprites (near/far material-clone
/// split), the sprite0.png onLoad builds the 5 HUD sprites from a 128x128
/// image, the animation ticks, the ortho scene NEVER renders (the
/// perspective scene throws first), and every tick fails with the pinned
/// `objectType (Sprite)` capability error.
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

  testWidgets('webgl_sprites boots and registers its 3 embedded sprite '
      'textures but every R1 frame throws objectType (Sprite)', (tester) async {
    // Part 1 — the unmodified widget: healthy boot, zero R1 submits.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-sprites',
      instanceId: 'three-sprites-test',
    );
    await harness.pumpFrames(tester, 120);

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

    // The first animation tick throws before ANY frame transaction commits:
    // no surface, zero frames, zero uploads.
    expect((exported['renderer'] as Map)['frame'], 0);
    expect((exported['stats'] as Map)['updates'], 0);
    expect(harness.surface, isNull);
    expect(harness.state, isNull);
    expect(harness.renderTrees, isNotEmpty);
    expect(harness.renderTrees.first['type'], 'three');
    expect(harness.renderTrees.first['canvasId'], 'main');
    expect(
      harness.renderTrees.last.toString(),
      contains('three.unsupported: objectType (Sprite)'),
    );
    await harness.dispose(tester);

    // Part 2 — instrumented copy pinning the per-tick failure AND the
    // healthy sprite/texture pipeline around it.
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: _spritesProbeSource(),
      instanceId: 'three-sprites-gap-probe',
    );
    // Pump until the texture onLoad has exported and several ticks failed.
    for (var attempt = 0; attempt < 300; attempt++) {
      final p = probe.engine.exportedState?['probe'] as Map?;
      if (p != null &&
          (p['hudOnLoad'] as int) >= 1 &&
          (p['ticks'] as int) >= 5) {
        break;
      }
      await probe.pumpFrame(tester);
    }
    final backend = probe.backend as QuickjsWidgetEngineBackend;
    final logs = backend.peekLogs().map((entry) => entry['msg'] as String);
    final failure = expectRenderFailFeature(logs, 'objectType');
    expect(failure, contains('msg=three.unsupported: objectType (Sprite)'));

    final p = probe.engine.exportedState!['probe'] as Map;
    // init() created exactly the official 200 sprites in the perspective
    // scene; the z<0 branch clones the sprite1.png material (far) and the
    // rest clones the hue-cycled sprite2.png material (near).
    expect(p['sprites'], 200);
    expect((p['far'] as int) + (p['near'] as int), 200);
    expect(p['far'], greaterThan(0));
    expect(p['near'], greaterThan(0));
    // The sprite0.png load callback ran: it builds the 5 HUD sprites from a
    // 128x128 image (the embedded PNG's true size).
    expect(p['hudOnLoad'], greaterThanOrEqualTo(1));
    expect((p['sprite0'] as Map)['w'], 128);
    expect((p['sprite0'] as Map)['h'], 128);
    // The first created sprite carries a mapped, fogged SpriteMaterial —
    // the material kind IS constructible in JS; only the Sprite object type
    // is rejected by the R1 renderer.
    final spriteMat = p['spriteMat'] as Map;
    expect(spriteMat['sm'], isTrue, reason: 'isSpriteMaterial');
    expect(spriteMat['hasMap'], isTrue, reason: 'sprite material carries map');
    // The animation loop ticks and EVERY tick fails on the perspective
    // scene: the ortho HUD render is never reached (orthoRenders stays 0).
    expect(p['ticks'], greaterThanOrEqualTo(5));
    expect(p['renderErrors'], p['ticks']);
    expect(p['orthoRenders'], 0);
    expect(p['renderCode'], 'three.unsupported');
    expect(p['renderFeature'], 'objectType');
    expect(
      p['renderMsg'],
      contains('three.unsupported: objectType (Sprite)'),
    );
    expect(
      p['renderMsg'],
      contains('native R1 does not provide this capability'),
    );
    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}


/// The sprites widget.js instrumented with a state-flag probe. Findings are
/// stored on `globalThis.__JSR_PROBE` and re-exported through
/// `jsr.exportState` so the test never depends on console-log retention.
///
/// The probe definitions are PREPENDED (not appended) because init() runs
/// synchronously during bundle evaluation and the sprite-creation counter
/// must already exist.
String _spritesProbeSource() {
  const id = '[A-Za-z_\$][\\w\$]*';
  var source = File('example/widgets/three-sprites/widget.js').readAsStringSync();

  // Probe state + guarded step wrapper (records the first render failure,
  // counts every one, re-throws so the engine still surfaces the error card
  // and the JSR_RENDERFAIL console marker stays in the ring buffer).
  source = 'globalThis.__JSR_PROBE={ticks:0,sprites:0,far:0,near:0,'
          'hudOnLoad:0,sprite0:null,orthoRenders:0,renderErrors:0,'
          'spriteMat:null,'
          'renderCode:"unreached",renderFeature:"unreached",'
          'renderMsg:"unreached"};'
      'globalThis.__JSR_PROBE_EXPORT=function(){try{'
      'var p=globalThis.__JSR_PROBE;'
      'if(globalThis.jsr&&jsr.exportState)jsr.exportState({probe:{'
      'ticks:p.ticks,sprites:p.sprites,far:p.far,near:p.near,'
      'hudOnLoad:p.hudOnLoad,sprite0:p.sprite0,orthoRenders:p.orthoRenders,'
      'spriteMat:p.spriteMat,'
      'renderErrors:p.renderErrors,renderCode:p.renderCode,'
      'renderFeature:p.renderFeature,renderMsg:p.renderMsg}})}catch(e){}};'
      'globalThis.__JSR_PROBE_STEP=function(fn){try{return fn()}catch(e){'
      'var p=globalThis.__JSR_PROBE;'
      'if(p.renderErrors===0){p.renderCode=String(e.code||"");'
      'p.renderFeature=String(e.feature||"");'
      'p.renderMsg=String(e.message||"")}p.renderErrors++;'
      "console.error('JSR_RENDERFAIL code='+e.code+' feature='+e.feature"
      "+' msg='+e.message);globalThis.__JSR_PROBE_EXPORT();throw e}};\n"
      '$source';

  // init(): count the 200 sprite creations and pin the material facts of
  // the first sprite (SpriteMaterial with a map — the JS-side analogue of
  // the spriteTexture material kind; R1 never classifies it because the
  // Sprite object type is rejected before the draw plan).
  source = patchOnce(source, 'spriteCreate',
      RegExp('($id)=new ($id)\\(($id)\\);\\1\\.position\\.set\\(($id),($id),($id)\\),'
          '\\1\\.position\\.normalize\\(\\),\\1\\.position\\.multiplyScalar\\(($id)\\),'
          '($id)\\.add\\(\\1\\)'),
      (m) => '${m[0]},globalThis.__JSR_PROBE.sprites++,'
          'globalThis.__JSR_PROBE.spriteMat={sm:!!${m[3]}.isSpriteMaterial,'
          'hasMap:!!${m[3]}.map,fog:${m[3]}.fog===true}');

  // init(): count the material-clone branches (z<0 → sprite1 material, else
  // hue-cycled sprite2 material). The pattern consumes the else branch's own
  // opening paren so the inserted counters stay balanced.
  source = patchOnce(source, 'cloneBranch',
      RegExp('($id)<0\\?($id)=($id)\\.clone\\(\\):\\('),
      (m) => '${m[1]}<0?(globalThis.__JSR_PROBE.far++,${m[2]}=${m[3]}.clone()):'
          '(globalThis.__JSR_PROBE.near++,${m[2]}=${m[3]}.clone(),');

  // sprite0.png onLoad (createHUDSprites): count invocations and record the
  // decoded image size.
  source = patchOnce(source, 'hudOnLoad',
      RegExp('function ($id)\\(($id)\\)\\{\\2\\.colorSpace=($id);'),
      (m) => 'function ${m[1]}(${m[2]}){globalThis.__JSR_PROBE.hudOnLoad++,'
          '${m[2]}.colorSpace=${m[3]};');
  source = patchOnce(source, 'hudImageSize',
      RegExp('($id)=($id)\\.map\\.image\\.width,($id)=\\2\\.map\\.image\\.height;'),
      (m) => '${m[1]}=${m[2]}.map.image.width,${m[3]}=${m[2]}.map.image.height;'
          // standalone statement: a member assignment is not a valid extra
          // `let` declarator.
          'globalThis.__JSR_PROBE.sprite0={w:${m[1]},h:${m[3]}};'
          'globalThis.__JSR_PROBE_EXPORT();');

  // animate(): tick counter.
  source = patchOnce(source, 'animateTick',
      RegExp('function ($id)\\(\\)\\{let ($id)=Date\\.now\\(\\)/1e3;for\\(let ($id)=0,'),
      (m) => 'function ${m[1]}(){globalThis.__JSR_PROBE.ticks++;'
          'let ${m[2]}=Date.now()/1e3;for(let ${m[3]}=0,');

  // The official double render (clear + perspective scene + clearDepth +
  // ortho scene), each step guarded so the first thrown capability error is
  // recorded and every ortho render is counted.
  source = patchOnce(source, 'doubleRender',
      RegExp('($id)\\.clear\\(\\),\\1\\.render\\(($id),($id)\\),\\1\\.clearDepth\\(\\),'
          '\\1\\.render\\(($id),($id)\\)\\}\\}\\)\\(\\);'),
      (m) => 'globalThis.__JSR_PROBE_STEP(function(){${m[1]}.clear()}),'
          'globalThis.__JSR_PROBE_STEP(function(){${m[1]}.render(${m[2]},${m[3]})}),'
          'globalThis.__JSR_PROBE_STEP(function(){${m[1]}.clearDepth()}),'
          'globalThis.__JSR_PROBE_STEP(function(){${m[1]}.render(${m[4]},${m[5]}),'
          'globalThis.__JSR_PROBE.orthoRenders++})}})();');

  return source;
}
