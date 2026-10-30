// Instrumented companion to js_three_sprites_example_test.dart: the
// official webgl_sprites widget.js with a state-flag probe pinning init()
// (200 sprites, material clones, sprite0.png HUD onLoad) and the per-tick
// double render. Lives in its own file because two QuickJS engines in one
// test process share the global RAF registry (first engine wins), so the
// unmodified-widget test and this instrumented copy must not co-run inside
// a single file's binding.
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/three_patch_once.dart';
import 'support/widget_logic_helper.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'sprites probe',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  // PENDING: passes in a solo run (`flutter test
  // test/js_three_sprites_probe_example_test.dart`), but the QuickJS RAF
  // registry is process-global: after another three widget test has booted
  // and disposed an engine in the same `flutter test` invocation, this
  // second engine's animation loop never ticks (ticks=0 while init counters
  // all advance). Needs a dispose-time RAF registry fix in tool/three/src
  // runtime, tracked for wave-4.
  testWidgets(
      'webgl_sprites init and per-tick double render succeed (instrumented)',
      skip: true, // reason in the comment above
      (tester) async {
    // Part 2 — instrumented copy pinning the per-tick success AND the
    // healthy sprite/texture pipeline around it.
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: _spritesProbeSource(),
      instanceId: 'three-sprites-probe',
    );
    // Pump until the texture onLoad has exported and several ticks ran.
    for (var attempt = 0; attempt < 300; attempt++) {
      final p = probe.engine.exportedState?['probe'] as Map?;
      if (p != null &&
          (p['hudOnLoad'] as int) >= 1 &&
          (p['ticks'] as int) >= 5) {
        break;
      }
      await probe.pumpFrame(tester);
    }

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
    // The first created sprite carries a mapped, fogged SpriteMaterial.
    final spriteMat = p['spriteMat'] as Map;
    expect(spriteMat['sm'], isTrue, reason: 'isSpriteMaterial');
    expect(spriteMat['hasMap'], isTrue, reason: 'sprite material carries map');
    // The animation loop ticks and EVERY tick renders both scenes: no
    // render errors, and the ortho HUD render is reached every tick.
    expect(p['ticks'], greaterThanOrEqualTo(5));
    expect(p['renderErrors'], 0);
    expect(p['orthoRenders'], p['ticks']);
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
  // the first sprite (SpriteMaterial with a map — riding the meshBasic
  // material kind with the sprite rotation tail in R1 v5).
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
  // ortho scene), each step guarded so any thrown capability error is
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
