import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/three_probe_state.dart';
import 'support/widget_logic_helper.dart';

/// webgl_geometry_shapes — DOCUMENTED FACADE GAP (not a widget bug).
///
/// The official module builds the famous 93-object Shape scene — 11
/// shapes (california, triangle, roundedRect, track, square, heart,
/// circle, fish, smiley, arc-with-hole, spline) each added as a
/// textured `ShapeGeometry` mesh, a flat colored `ShapeGeometry` mesh,
/// an `ExtrudeGeometry({depth:8, bevelEnabled:true, bevelSegments:2,
/// steps:2, bevelSize:1, bevelThickness:1})` mesh plus 2 lines + 2
/// points, then 5 extra `addLineShape` calls (arc hole + 3 smiley
/// holes) — and paints the flat shapes with a
/// `MeshPhongMaterial({side:DoubleSide, map:texture})` whose texture
/// is configured for shape UVs:
///
///     texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
///     texture.repeat.set( 0.008, 0.008 );
///
/// The shared R1 native renderer has no UV transform fields:
///
/// - tool/three/src/native_renderer.js:510 — `if (texture.channel !== 0
///   || texture.offset.x !== 0 || ... texture.repeat.x !== 1 ||
///   texture.repeat.y !== 1 || ...) unsupported('textureTransform', 'R1
///   v1 has no UV transform fields');`
///
/// `repeat 0.008 ≠ 1`, so the FIRST `renderer.render()` of the first
/// animation tick throws `ThreeCapabilityError: three.unsupported:
/// textureTransform`, the whole frame transaction rolls back and
/// nothing is ever uploaded: no surface state, zero submitted frames,
/// zero renderer frames. This is the same documented R1 gap class as
/// webgl_materials_texture_rotation (js_three_materials_examples_test)
/// — there the module additionally died earlier at
/// `capabilities.getMaxAnisotropy`, here the texture pipeline fully
/// resolves and the failure is purely the repeat-based UV transform.
///
/// Because the throw happens inside the `setAnimationLoop` callback,
/// the per-frame failure renders the standard error card.
///
/// Part 2 below pins the scene the module builds BEFORE the render
/// throws (via a state-flag probe traversing the live scene graph on
/// the first animation tick): exactly 93 objects — 33 meshes (all
/// MeshPhongMaterial, 11 of them ExtrudeGeometry, 11 textured),
/// 30 lines, 30 points, 1 PointLight — proving the gap is ONLY the UV
/// transform. If R1 ever gains UV transform support, rewrite this as a
/// normal draw-plan test (33 Phong triangle draws incl. 11 extrudes,
/// 30 line draws, 30 point draws, PointLight 0xffffff intensity 2.5 on
/// the camera, background 0xf0f0f0, group rotation lerp per tick).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'geometry shapes example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
      'webgl_geometry_shapes boots but cannot render on R1 '
      '(textureTransform UV-repeat facade gap)', (tester) async {
    // Part 1 — the unmodified widget: healthy boot, error card, zero R1
    // submits.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-geometry-shapes',
      instanceId: 'three-geometry-shapes-test',
    );
    await harness.pumpFrames(tester, 40);

    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_geometry_shapes');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    expect(exported['mounted'], isTrue);
    // The uv_grid texture asset registers on the image/jpeg lane.
    final assets = exported['assets'] as Map<String, dynamic>;
    final uvGrid =
        assets['textures/uv_grid_opengl.jpg'] as Map<String, dynamic>;
    expect(uvGrid['registered'], isTrue);
    expect(uvGrid['bytes'], 549505);
    // The module has NO lil-gui panel at all — the exported gui stays
    // empty (no hidden helper checkbox either).
    final gui = exported['gui'] as Map<String, dynamic>;
    expect(gui['roots'], 0);
    expect(gui['controllers'], 0);
    expect(gui['values'], isEmpty);
    // No R1 envelope ever reached the host: every animation tick's
    // textureTransform failure renders the standard error card.
    expect(harness.renderTrees, isNotEmpty);
    expect(harness.renderTrees.first['type'], 'three');
    expect(harness.renderTrees.first['canvasId'], 'main');
    expect(
      harness.renderTrees.last.toString(),
      contains('three.unsupported: textureTransform'),
    );
    expect(harness.surface, isNull);
    expect((exported['renderer'] as Map<String, dynamic>)['frame'], 0);
    // stats.update() sits AFTER render() in animate() — never reached.
    expect((exported['stats'] as Map<String, dynamic>)['updates'], 0);
    await harness.dispose(tester);

    // Part 2 — instrumented copy of the same widget.js proving the
    // exact scene graph the module builds on the first animation tick
    // and the exact per-frame failure. Findings are stored on
    // `globalThis.__JSR_PROBE` and re-exported through
    // `jsr.exportState({probe})` so the test never depends on
    // console-log retention (the RAF error flood caps peekLogs).
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: _shapesProbeSource(),
      instanceId: 'three-geometry-shapes-gap-probe',
    );
    Map<String, dynamic>? findings;
    for (var attempt = 0; attempt < 120; attempt++) {
      findings = probeFindings(probe);
      final ready = findings != null &&
          (findings['renderErrors'] as int? ?? 0) > 0 &&
          (findings['sceneDone'] as int? ?? 0) > 0;
      if (ready) break;
      await probe.pumpFrame(tester);
    }
    expect(findings, isNotNull, reason: 'probe findings never exported');

    // The scene the module built — pinned to the official object counts.
    // 11 shapes × (2 ShapeGeometry meshes + 1 ExtrudeGeometry mesh +
    // 2 lines + 2 points) = 22+11+22+22, plus 5 extra addLineShape
    // calls (arc hole + 3 smiley holes) × (2 lines + 2 points).
    expect(findings!['meshCount'], 33);
    expect(findings['lineCount'], 30);
    expect(findings['pointCount'], 30);
    // Every mesh paints with MeshPhongMaterial (textured, flat, and
    // extruded variants alike) — ONE material kind for all extrudes.
    expect(findings['meshPhongCount'], 33);
    expect(findings['allMeshesPhong'], isTrue);
    expect(findings['extrudeMeshCount'], 11);
    expect(findings['shapeMeshCount'], 22);
    // The flat textured meshes share the single RepeatWrapping texture
    // with repeat (0.008, 0.008) — the exact gap trigger.
    expect(findings['texturedMeshCount'], 11);
    expect(findings['textureRepeat'], '0.008,0.008');
    // Real geometry everywhere: triangle counts > 0 (earcut flat
    // shapes + beveled extrudes).
    expect(findings['meshTriangleSum'] as int, greaterThan(0));
    expect(findings['extrudeTriangleSum'] as int, greaterThan(0));
    // PointLight(0xffffff, 2.5, 0, 0) parented to the camera.
    expect(findings['pointLightCount'], 1);
    expect(findings['backgroundHex'], 'f0f0f0');

    // And every renderer.render() throws the UV-transform capability
    // gap — the pinned root cause of this documented gap.
    expect(findings['renderErrors'] as int, greaterThan(0));
    expect(findings['renderCode'], 'three.unsupported');
    expect(findings['renderFeature'], 'textureTransform');
    expect(findings['renderMsg'], contains('R1 v1 has no UV transform fields'));

    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 180)));
}


/// The shapes widget.js instrumented with a state-flag probe. The
/// module's render function — anchored by its unique group-rotation
/// lerp in the module tail — first traverses the live scene graph
/// (recording the object/material/geometry facts above), then renders
/// through a guarded wrapper that records the first renderer.render()
/// failure and re-throws it.
///
/// All patterns start with a literal (never `[\w$]+=`) — an unanchored
/// identifier run on these single-line mega-bundles backtracks
/// catastrophically in the Dart VM regexp; minified identifiers are
/// captured, never spelled out, so a re-prepare cannot break the probe
/// silently (every anchor must match exactly once or the test fails).
String _shapesProbeSource() {
  var source = File(
    'example/widgets/three-geometry-shapes/widget.js',
  ).readAsStringSync();

  // The module render function, scoped to the module tail after the
  // uv_grid texture load. `function X(){G.rotation.y+=(T-G.rotation.y)*
  // .05,R.render(S,C)}` — groups: 1 fn, 2 group, 3 targetRotation,
  // 4 renderer, 5 scene, 6 camera.
  final moduleStart = source.lastIndexOf('uv_grid_opengl.jpg');
  final head = source.substring(0, moduleStart);
  var tail = source.substring(moduleStart);
  final renderRe = RegExp(
    r'function ([\w$]+)\(\)\{([\w$]+)\.rotation\.y\+=\('
    r'([\w$]+)-\2\.rotation\.y\)\*\.?0?05,'
    r'([\w$]+)\.render\(([\w$]+),([\w$]+)\)\}',
  );
  final matches = renderRe.allMatches(tail).toList();
  if (matches.length != 1) {
    fail('shapes render anchor matched ${matches.length} times '
        '(expected 1) — drifted after a re-prepare');
  }
  final m = matches.single;
  tail = tail.replaceRange(
    m.start,
    m.end,
    'function ${m[1]}(){'
        '${m[2]}.rotation.y+=(${m[3]}-${m[2]}.rotation.y)*.05,'
        'globalThis.__JSR_PROBE_SCENE(${m[5]},${m[6]}),'
        'globalThis.__JSR_PROBE_RENDER(${m[4]},${m[5]},${m[6]})}',
  );

  return head +
      tail +
      'globalThis.__JSR_PROBE={sceneDone:0,meshCount:0,lineCount:0,'
          'pointCount:0,meshPhongCount:0,allMeshesPhong:true,'
          'extrudeMeshCount:0,shapeMeshCount:0,texturedMeshCount:0,'
          'textureRepeat:"unreached",meshTriangleSum:0,'
          'extrudeTriangleSum:0,pointLightCount:0,backgroundHex:"unreached",'
          'renderErrors:0,renderCode:"",renderFeature:"",renderMsg:""};'
          'globalThis.__JSR_PROBE_SCENE=function(scene,camera){'
          'var p=globalThis.__JSR_PROBE;if(p.sceneDone)return;p.sceneDone=1;'
          'scene.traverse(function(o){'
          'if(o.isPointLight){p.pointLightCount++;return}'
          'var g=o.geometry;'
          'if(o.isMesh){p.meshCount++;'
          'if(o.material&&o.material.isMeshPhongMaterial)p.meshPhongCount++;'
          'else p.allMeshesPhong=false;'
          'if(o.material&&o.material.map)p.texturedMeshCount++;'
          'if(g){var t=g.index?g.index.count/3'
          ':(g.attributes.position?g.attributes.position.count/3:0);'
          'p.meshTriangleSum+=Math.round(t);'
          'if(g.type==="ExtrudeGeometry")p.extrudeMeshCount++,'
          'p.extrudeTriangleSum+=Math.round(t);'
          'else if(g.type==="ShapeGeometry")p.shapeMeshCount++}}'
          'else if(o.isLine){p.lineCount++}'
          'else if(o.isPoints){p.pointCount++}});'
          'if(scene.background&&scene.background.getHexString)'
          'p.backgroundHex=scene.background.getHexString();'
          'scene.traverse(function(o){'
          'if(o.isMesh&&o.material&&o.material.map&&o.material.map.repeat){'
          'p.textureRepeat=o.material.map.repeat.x+","+o.material.map.repeat.y}})};'
          'globalThis.__JSR_PROBE_EXPORT=function(){try{'
          'var p=globalThis.__JSR_PROBE;'
          'if(globalThis.jsr&&jsr.exportState)jsr.exportState({probe:{'
          'sceneDone:p.sceneDone,meshCount:p.meshCount,lineCount:p.lineCount,'
          'pointCount:p.pointCount,meshPhongCount:p.meshPhongCount,'
          'allMeshesPhong:p.allMeshesPhong,extrudeMeshCount:p.extrudeMeshCount,'
          'shapeMeshCount:p.shapeMeshCount,texturedMeshCount:p.texturedMeshCount,'
          'textureRepeat:p.textureRepeat,meshTriangleSum:p.meshTriangleSum,'
          'extrudeTriangleSum:p.extrudeTriangleSum,'
          'pointLightCount:p.pointLightCount,backgroundHex:p.backgroundHex,'
          'renderErrors:p.renderErrors,renderCode:p.renderCode,'
          'renderFeature:p.renderFeature,renderMsg:p.renderMsg}})'
          '}catch(e){}};'
          'globalThis.__JSR_PROBE_RENDER=function(r,s,c){try{'
          'r.render(s,c)}catch(e){var p=globalThis.__JSR_PROBE;'
          'if(p.renderErrors===0){p.renderCode=String(e.code||"");'
          'p.renderFeature=String(e.feature||"");'
          'p.renderMsg=String(e.message||"")}p.renderErrors++;'
          'globalThis.__JSR_PROBE_EXPORT();throw e}};';
}
