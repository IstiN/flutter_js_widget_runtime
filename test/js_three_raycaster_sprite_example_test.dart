import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/runtime/js_widget_engine_quickjs.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';
import 'support/three_patch_once.dart';

/// webgl_raycaster_sprite (three.js r186) — DOCUMENTED FACADE GAP with a
/// WORKING JS-side raycast pipeline (not a widget bug).
///
/// The official module adds three color-only `Sprite`s (no textures at all —
/// `SpriteMaterial({color:'#69f'})`, one with `sizeAttenuation:false`, one
/// nested inside a scaled+rotated Object3D) to a group and listens on
/// `document pointermove`: it normalizes the pointer to NDC, feeds
/// `raycaster.setFromCamera(pointer, camera)` and
/// `raycaster.intersectObject(group, true)`, and on a hit stores the sprite
/// in `selectedObject` and sets its material color to '#f00' (resetting the
/// previous selection to '#69f' on the next move).
///
/// R1 verdict — the two halves behave differently:
///
/// - RENDERING is a documented facade gap: tool/three/src/
///   native_renderer.js:909 rejects every sprite drawable with
///   `unsupported('objectType', object.type)` →
///   `three.unsupported: objectType (Sprite); native R1 does not provide
///   this capability; use the 1B backend where available` on the first
///   animation tick. The transaction rolls back (native_renderer.js:1029):
///   `renderer.info.render.frame` stays 0, no surface, zero uploads, and
///   the per-frame failure renders the standard error card.
/// - The RAYCAST pipeline itself is fully functional on the R1 runtime:
///   three.js `Sprite.raycast` is pure JS camera math. Part 2 dispatches
///   real host pointermove events over the `three.input:main` lane
///   (js_widget_bootstrap.dart:456 → jsr.three._hostEvent →
///   _dispatchEvent → _pointerEvent → canvas + runtime document, which is
///   the `document` the module subscribed to), and the probe observes the
///   raycast result reaching the module state: a sprite is selected and its
///   material color flips 69f→f00; a miss resets it to 69f. The color is
///   only observable through the probe — R1 can never paint it.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'raycaster sprite example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets('webgl_raycaster_sprite cannot render (objectType Sprite) but '
      'its pointermove raycast selects sprites through host events',
      (tester) async {
    // Part 1 — the unmodified widget: healthy boot, zero R1 submits.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-raycaster-sprite',
      instanceId: 'three-raycaster-sprite-test',
    );
    await harness.pumpFrames(tester, 120);

    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_raycaster_sprite');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    expect(exported['mounted'], isTrue);
    // The official module is texture-less: every SpriteMaterial is
    // color-only, so the prepared widget embeds no assets. The OrbitControls
    // addon IS bundled, but it renders nothing by itself.
    expect(exported['assets'] as Map, isEmpty);

    // R1 v5: sprites render natively, so the surface mounts and streams.
    expect(harness.surface, isNotNull);
    expect(harness.state, isNotNull);
    expect(harness.state!.submittedFrameCount, greaterThan(0));
    expect(harness.renderTrees, isNotEmpty);
    expect(harness.renderTrees.first['type'], 'three');
    expect(
      harness.renderTrees.last.toString(),
      isNot(contains('three.unsupported')),
      reason: 'sprites render natively on R1 v5; no capability error card',
    );
    await harness.dispose(tester);

    // Part 2 — instrumented copy: dispatch real pointermove host events and
    // watch the raycast selection flip the hovered sprite's material color.
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: _raycastProbeSource(),
      instanceId: 'three-raycaster-sprite-gap-probe',
    );
    // Wait for the first failed frame (it exports the probe with vw/vh).
    for (var attempt = 0; attempt < 300; attempt++) {
      final p = probe.engine.exportedState?['probe'] as Map?;
      if (p != null && (p['vw'] as int) > 0 && (p['ticks'] as int) >= 2) break;
      await probe.pumpFrame(tester);
    }
    final p0 = probe.engine.exportedState!['probe'] as Map;
    // R1 v5: sprites render, so there is no objectType failure to pin
    // anymore; the probe still exports the viewport for event math.
    final vw = p0['vw'] as int;
    final vh = p0['vh'] as int;
    expect(vw, greaterThan(0));
    expect(vh, greaterThan(0));

    Map<String, dynamic> probeState() =>
        (probe.engine.exportedState!['probe'] as Map).cast<String, dynamic>();

    // Sweep a coarse grid of normalized pointer positions across the
    // runtime viewport. The camera sits at (15,15,15) looking at the origin;
    // the 10x2x3 sprite (local position (0,2,5), inside the scaled+rotated
    // Object3D at (-5,0,0)) covers a large screen area, so one of the
    // samples must hit.
    Map<String, dynamic>? selected;
    var dispatched = 0;
    final backend = probe.backend as QuickjsWidgetEngineBackend;
    void move(double u, double v) {
      dispatched++;
      backend.dispatchHostEvent('three.input:main', <String, dynamic>{
        'type': 'pointermove',
        'pointerId': 7,
        'pointerType': 'mouse',
        'button': -1,
        'buttons': 0,
        'clientX': (u * vw).toDouble(),
        'clientY': (v * vh).toDouble(),
        'pageX': (u * vw).toDouble(),
        'pageY': (v * vh).toDouble(),
      });
    }

    outer:
    for (final v in const [0.1, 0.3, 0.5, 0.7, 0.9]) {
      for (final u in const [0.1, 0.3, 0.5, 0.7, 0.9]) {
        move(u, v);
        await probe.pumpFrame(tester);
        selected = probeState()['selected'] as Map<String, dynamic>?;
        if (selected != null) break outer;
      }
    }
    expect(dispatched, lessThanOrEqualTo(25));
    expect(selected, isNotNull,
        reason: 'a pointermove over the sprite field must select a sprite');

    // Every dispatched move raycast exactly once against the group.
    final p1 = probeState();
    expect(p1['moves'], dispatched);
    expect(p1['raycasts'], dispatched);
    expect(p1['hits'], greaterThanOrEqualTo(1));

    // The selection is one of the three official sprites: identify it by its
    // local position and verify its scale/center/rotation-affected color
    // facts match that exact sprite.
    const identities = <String, List<dynamic>>{
      'sprite1': [6.0, 5.0, 5.0, 2.0, 5.0, 1.0],
      'sprite2': [8.0, -2.0, 2.0, 0.1, 0.5, 0.1],
      'sprite3': [0.0, 2.0, 5.0, 10.0, 2.0, 3.0],
    };
    // JS numbers arrive as int when integral (6 → int 6), so cast to num.
    final pos = (selected!['pos'] as List).cast<num>();
    final scale = (selected['scale'] as List).cast<num>();
    String? hit;
    identities.forEach((name, facts) {
      if ((pos[0] - facts[0]).abs() < 1e-6 &&
          (pos[1] - facts[1]).abs() < 1e-6 &&
          (pos[2] - facts[2]).abs() < 1e-6) {
        hit = name;
        expect(scale[0], closeTo(facts[3], 1e-6), reason: name);
        expect(scale[1], closeTo(facts[4], 1e-6), reason: name);
        expect(scale[2], closeTo(facts[5], 1e-6), reason: name);
      }
    });
    expect(hit, isNotNull, reason: 'selected sprite must be a known sprite');

    // The module reacted to the hover: the selected material flipped to
    // #f00 (observed AFTER the module applied it — this is the raycast
    // result reaching state, which R1 can never paint).
    expect(selected['color'], 'ff0000');

    // Move to a screen corner that no sprite covers: the module resets the
    // previous selection to #69f and the raycast misses.
    move(0.01, 0.01);
    await probe.pumpFrame(tester);
    final p2 = probeState();
    // dispatched already includes the corner move; every dispatched event
    // raycast exactly once and moved the counter exactly once.
    expect(p2['moves'], dispatched);
    expect(p2['raycasts'], dispatched);
    expect(p2['resets'], greaterThanOrEqualTo(1));
    expect(p2['resetColor'], '6699ff');
    expect(p2['selected'], isNull);
    expect(p2['moves'], dispatched);
    expect(p2['raycasts'], dispatched);

    // R1 v5: the render loop renders the sprites the whole time (no
    // capability errors), so the hover feedback exists in JS state AND on
    // the GPU surface.
    expect(p2['ticks'], greaterThanOrEqualTo(3));
    expect(p2['renderErrors'], 0);
    expect(probe.surface, isNotNull);
    expect(probe.state!.submittedFrameCount, greaterThanOrEqualTo(3));
    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}


/// The raycaster-sprite widget.js instrumented with a state-flag probe.
/// Probe definitions are PREPENDED because init() runs synchronously during
/// bundle evaluation (vw/vh are captured there).
String _raycastProbeSource() {
  const id = '[A-Za-z_\$][\\w\$]*';
  var source =
      File('example/widgets/three-raycaster-sprite/widget.js').readAsStringSync();

  source = 'globalThis.__JSR_PROBE={ticks:0,moves:0,raycasts:0,hits:0,resets:0,'
          'resetColor:"unreached",selected:null,renderErrors:0,'
          'renderCode:"unreached",renderFeature:"unreached",'
          'renderMsg:"unreached",vw:0,vh:0};'
      'globalThis.__JSR_PROBE_EXPORT=function(){try{'
      'var p=globalThis.__JSR_PROBE;'
      'if(globalThis.jsr&&jsr.exportState)jsr.exportState({probe:{'
      'ticks:p.ticks,moves:p.moves,raycasts:p.raycasts,hits:p.hits,'
      'resets:p.resets,resetColor:p.resetColor,selected:p.selected,'
      'renderErrors:p.renderErrors,renderCode:p.renderCode,'
      'renderFeature:p.renderFeature,renderMsg:p.renderMsg,'
      'vw:p.vw,vh:p.vh}})}catch(e){}};'
      'globalThis.__JSR_PROBE_RENDER=function(r,s,c){'
      'try{var v=r.render(s,c);globalThis.__JSR_PROBE_EXPORT();return v}'
      'catch(e){var p=globalThis.__JSR_PROBE;'
      'if(p.renderErrors===0){p.renderCode=String(e.code||"");'
      'p.renderFeature=String(e.feature||"");'
      'p.renderMsg=String(e.message||"")}p.renderErrors++;'
      "console.error('JSR_RENDERFAIL code='+e.code+' feature='+e.feature"
      "+' msg='+e.message);globalThis.__JSR_PROBE_EXPORT();throw e}};\n"
      '$source';

  // init(): capture the runtime viewport the module normalizes pointers
  // against (camera.position.set(15,15,15) + lookAt(scene.position)).
  source = patchOnce(source, 'viewport',
      RegExp('($id)\\.position\\.set\\(15,15,15\\),\\1\\.lookAt\\(($id)\\.position\\)'),
      (m) => '${m[0]},globalThis.__JSR_PROBE.vw=window.innerWidth,'
          'globalThis.__JSR_PROBE.vh=window.innerHeight');

  // onPointerMove(): count moves (anchor on the selection-reset head).
  source = patchOnce(source, 'moveHead',
      RegExp('function ($id)\\(($id)\\)\\{($id)&&\\(\\3\\.material\\.color\\.set\\("#69f"\\),\\3=null\\),'),
      (m) => 'function ${m[1]}(${m[2]}){globalThis.__JSR_PROBE.moves++;'
          '${m[3]}&&(globalThis.__JSR_PROBE.resets++,'
          '${m[3]}.material.color.set("#69f"),'
          'globalThis.__JSR_PROBE.resetColor='
          '${m[3]}.material.color.getHexString(),${m[3]}=null,'
          'globalThis.__JSR_PROBE.selected=null,'
          'globalThis.__JSR_PROBE_EXPORT()),');

  // onPointerMove(): count raycasts + hits
  // (raycaster.intersectObject(group, true)).
  source = patchOnce(source, 'intersect',
      RegExp('let ($id)=($id)\\.intersectObject\\(($id),!0\\);'),
      (m) => 'let ${m[1]}=${m[2]}.intersectObject(${m[3]},!0);'
          'globalThis.__JSR_PROBE.raycasts++;'
          'globalThis.__JSR_PROBE.hits=${m[1]}.length;');

  // onPointerMove(): record WHICH sprite was selected and its material color
  // after the module applied '#f00'.
  source = patchOnce(source, 'select',
      RegExp('($id)=($id)\\.object,\\1\\.material\\.color\\.set\\("#f00"\\)'),
      (m) => '${m[1]}=${m[2]}.object,${m[1]}.material.color.set("#f00"),'
          '(function(s){globalThis.__JSR_PROBE.selected={'
          'pos:[s.position.x,s.position.y,s.position.z],'
          'scale:[s.scale.x,s.scale.y,s.scale.z],'
          'center:[s.center.x,s.center.y],'
          'color:s.material.color.getHexString()};'
          'globalThis.__JSR_PROBE_EXPORT()})(${m[1]})');

  // animate(): guarded renderer.render so every frame failure is recorded.
  source = patchOnce(source, 'animate',
      RegExp('function ($id)\\(\\)\\{($id)\\.render\\(($id),($id)\\)\\}'),
      (m) => 'function ${m[1]}(){globalThis.__JSR_PROBE.ticks++;'
          'return globalThis.__JSR_PROBE_RENDER(${m[2]},${m[3]},${m[4]})}');

  // The document pointermove subscription: export the probe after every
  // dispatched event so the Dart side observes selection state immediately.
  source = patchOnce(source, 'register',
      RegExp('document\\.addEventListener\\("pointermove",($id)\\)'),
      (m) => 'document.addEventListener("pointermove",'
          'function(__jsrEv){${m[1]}(__jsrEv);'
          'globalThis.__JSR_PROBE_EXPORT()})');

  return source;
}
