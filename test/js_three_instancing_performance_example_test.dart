import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/js_three_protocol.dart';
import 'package:js_widget_runtime/src/renderer/nodes/three/three_draw_plan.dart';

import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// webgl_instancing_performance — DOCUMENTED FACADE GAPS with
/// probe-isolated renderer evidence (InstancedMesh DRAW_BATCH, live GUI
/// switching and the per-frame rate are proven on an instrumented copy;
/// the stock widget can never populate its scene).
///
/// The stock module dies during `init()` — pinned root cause #1: the
/// official GUI registers its dropdown with the OBJECT options map
/// `gui.add(api, 'method', Method)` (keys INSTANCED/MERGED/NAIVE), but
/// the bounded native lil-gui facade only accepts an ARRAY options list:
/// tool/three_example/lil_gui_adapter.js:428 routes
/// `options.length === 1 && Array.isArray(options[0])` to
/// OptionsController and everything else falls to
/// `unsupported('add(1 options)')` at :433 (message wrapper :17) →
/// `three.unsupported: lil-gui.add(1 options) is outside the bounded
/// native facade`. The renderer + OrbitControls + Stats keep ticking
/// into the still-mounted surface (background-only frames), but zero
/// meshes are ever built and the error card stays presented.
///
/// Even with the dropdown patched, two further gaps block the scene —
/// isolated by the part 2a probe:
/// - root cause #2 (CLOSED by the wave-3 instancing batch): the shim now
///   defines console.time/timeEnd/info/debug
///   (lib/src/runtime/js_widget_bootstrap.dart), so the build timings
///   run and the probe scene renders end to end (part 2a pins the
///   closed lane). Historically the TypeError was swallowed by the
///   loader promise chain and the build died SILENTLY.
/// - root cause #3 (provisioning): `suzanne_buffergeometry.json`
///   (24675 bytes, 505 verts / 2901 Uint16 indices = 967 triangles) is
///   not embedded in the prepared widget (`JSON.parse("[]")` asset
///   list) and the test harness configures no host asset loader.
///
/// Part 2b additionally registers the model bytes from the pinned r186
/// tree (the console polyfill is retained but redundant since the shim
/// ships time/timeEnd) and proves the R1 renderer itself handles the
/// full official scene: ONE InstancedMesh draw with instanceCount ==
/// 1000, batch flags == 1 (instance matrices only — NO per-instance
/// colors, `setColorAt` is never called), opaque MeshNormalMaterial (no
/// transparent instancing), live count/method switching via
/// backend.callEvent, and the presented-frame rate over the pump
/// window. If R1 ever accepts object-map options, the STOCK widget
/// boots and this probe retires.

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'instancing performance example',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
      'webgl_instancing_performance: stock init dies on the object-map '
      'options add; probes prove the console shim gap and the R1 '
      'instancing draw', (tester) async {
    // ---- Part 1 — the unmodified widget: error card + live empty loop.
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-instancing-performance',
      instanceId: 'three-instancing-performance-test',
    );
    await harness.pumpFrames(tester, 30);

    final exported = harness.engine.exportedState!;
    expect(exported['example'], 'webgl_instancing_performance');
    expect(exported['backend'], 'flutterGpu');
    expect(exported['canvasCount'], 1);
    // appendChild(renderer.domElement) ran before the GUI throw.
    expect(exported['mounted'], isTrue);

    // Provisioning gap: the suzanne model is not embedded and the harness
    // has no host asset loader — the asset map is empty.
    expect(exported['assets'] as Map<String, dynamic>, isEmpty);

    // The bounded lil-gui facade supports options-map add() now (the
    // dropdown lane), so init() completes: both official controllers
    // register on the stock lane.
    final gui = exported['gui'] as Map<String, dynamic>;
    expect(gui['roots'], 1);
    expect(gui['controllers'], 2);
    expect((gui['values'] as List), hasLength(2));

    // The pinned failure card replaces the overlay; the animation loop
    // itself keeps rendering the empty white scene into the still-mounted
    // surface (renderer.frame counts the RAF ticks).
    expect(harness.renderTrees.first['type'], 'three');
    expect(harness.renderTrees.first['canvasId'], 'main');
    // The options-map gap is closed, but init() still dies one step later:
    // the facade returns undefined for the next GUI chain call, so the
    // pinned failure is now 'cannot read property add of undefined'.
    const primaryCause = "cannot read property 'add' of undefined";
    final errorCards = harness.renderTrees
        .map((tree) => tree.toString())
        .where((tree) => tree.contains('Widget error'))
        .toList();
    expect(errorCards, isNotEmpty);
    expect(errorCards.first.contains(primaryCause), isTrue,
        reason: 'the next facade GUI gap must be the first failure; '
            'got ${errorCards.take(3)}');

    // The animation loop itself keeps running on the stock lane: the JS
    // renderer counts real render() ticks even though the error card owns
    // the presented widget tree (surface attach/unmount is lifecycle
    // timing dependent once the card replaces the root, so only the
    // JS-side counters are asserted here; the strict empty-scene proof
    // for the NEXT gap follows in part 2a).
    expect((exported['renderer'] as Map<String, dynamic>)['frame'],
        greaterThanOrEqualTo(2));
    expect((exported['stats'] as Map<String, dynamic>)['updates'],
        greaterThanOrEqualTo(2));
    final stockState = harness.state;
    if (stockState != null) {
      final stockPlan = const ThreeDrawPlanner().plan(stockState);
      expect(stockPlan.draws, isEmpty);
      expect(stockState.geometryUploadCount, 0);
      expect(stockState.materials, hasLength(0));
    }

    await harness.dispose(tester);

    // ---- Part 2a — assets + array-options probe, NO console polyfill:
    // the model then parses and the build STILL dies silently, isolating
    // the missing console shim as the next blocker.
    final gapProbe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: _probeSource(withConsolePolyfill: false),
      instanceId: 'three-instancing-performance-gap-probe',
    );
    final gapFindings = await _waitForProbe(
      tester,
      gapProbe,
      (probe) =>
          (probe['onLoadFired'] as int? ?? 0) >= 1 &&
          (probe['renders'] as int? ?? 0) >= 3,
    );
    expect(gapFindings['consoleTime'], 'function',
        reason: 'the bootstrap console shim ships time/timeEnd since the '
            'wave-3 instancing batch (the documented gap is CLOSED)');
    expect(gapFindings['consoleTimeEnd'], 'function');
    // The registered suzanne asset resolved: the official onLoad callback
    // ran and parsed the full 505-vertex / 2901-index geometry.
    expect(gapFindings['onLoadFired'] as int, greaterThanOrEqualTo(1));
    expect(gapFindings['positionCount'], 505);
    expect(gapFindings['indexCount'], 2901);
    // With console.time native the build no longer dies silently: the
    // INSTANCED method meshes render every tick with no renderer error.
    expect(gapFindings['renders'] as int, greaterThanOrEqualTo(3));
    expect(gapFindings['renderErrors'], 0);
    expect(gapFindings['loadError'], '',
        reason: 'the former TypeError death lane is gone; the remaining '
            'stock gap is only the object-map lil-gui add (part 1)');
    final gapGui = gapProbe.engine.exportedState!['gui'] as Map<String, dynamic>;
    expect(gapGui['controllers'], 2);
    // The surface must still be live: no async error card may have
    // replaced the three root after the suzanne onLoad callback ran.
    // Surface.state stays null when the widget errored async; surface
    // detach (root flip) keeps the probe fields but kills R1 frames.
    expect(gapProbe.surface, isNotNull,
        reason: 'R1 surface must be attached after a healthy load; '
            'findings=$gapFindings '
            'trees=${gapProbe.renderTrees.map((tree) => tree['type']).toList()} '
            'exported=${gapProbe.engine.exportedState?['error'] ?? '<none>'}');
    // Give the R1 encode stream a few pumps to deliver the first frame
    // state before reading the surface.
    await gapProbe.pumpFrames(tester, 6);
    // 2a verdict — the console shim lane, AFTER the wave-3 instancing
    // batch closed it: the bootstrap shim now defines time/timeEnd, so
    // the official build() timings run and the INSTANCED scene renders
    // end to end. The empty-scene death lane is gone; only part 1's
    // object-map lil-gui add keeps the STOCK widget from booting.
    expect(gapProbe.surface, isNotNull,
        reason: 'the widget stays healthy: the load chain completes and '
            'the canvas keeps presenting');
    expect(gapProbe.state, isNotNull,
        reason: 'the built scene submits real R1 frames');
    final gapState = gapProbe.state!;
    final gapPlan = const ThreeDrawPlanner().plan(gapState);
    // The INSTANCED method built its meshes: one instanced draw with the
    // default api.count instances and a geometry upload to match.
    expect(gapPlan.draws, isNotEmpty);
    expect(gapPlan.draws.every((draw) => draw.instanced), isTrue);
    expect(gapState.geometryUploadCount, greaterThanOrEqualTo(1));
    await gapProbe.dispose(tester);

    // ---- Part 2b — same probe + console.time/timeEnd polyfill: the full
    // official scene through R1.
    final probe = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      source: _probeSource(withConsolePolyfill: true),
      instanceId: 'three-instancing-performance-render-probe',
    );
    await probe.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount >= 1 &&
          plan.draws.length == 1 &&
          plan.draws.single.instanceCount == 10000 &&
          state.submittedFrameCount >= 1,
    );
    probe.expectHealthy('webgl_instancing_performance');
    final renderState = probe.state!;
    var renderPlan = probe.plan!;
    final renderExported = probe.engine.exportedState!;
    final findings = await _waitForProbe(
      tester,
      probe,
      (probeState) => (probeState['renders'] as int? ?? 0) >= 3,
    );
    expect(findings['consoleTime'], 'function');
    expect(findings['renders'] as int, greaterThanOrEqualTo(3));
    expect(findings['renderErrors'], 0);

    // Asset lane: exactly the registered suzanne model.
    final assets = renderExported['assets'] as Map<String, dynamic>;
    final suzanne =
        assets['models/json/suzanne_buffergeometry.json'] as Map<String, dynamic>;
    expect(suzanne['registered'], isTrue);
    expect(suzanne['bytes'], 24675);

    // GUI: the array-form dropdown + the bounded count slider both live.
    final renderGui = renderExported['gui'] as Map<String, dynamic>;
    expect(renderGui['controllers'], 2);
    final guiValues = renderGui['values'] as List<dynamic>;
    expect(guiValues[0]['property'], 'method');
    expect(guiValues[0]['kind'], 'options');
    expect(guiValues[0]['value'], 'INSTANCED');
    expect(guiValues[1]['property'], 'count');
    expect(guiValues[1]['kind'], 'number');
    expect(guiValues[1]['value'], 1000);
    // The overlay row carries the dropdown items and slider bounds.
    final overlay = probe.renderTrees.last.toString();
    expect(overlay, contains('type: dropdown'));
    expect(overlay, contains('INSTANCED'));
    expect(overlay, contains('MERGED'));
    expect(overlay, contains('NAIVE'));
    expect(overlay, contains('type: slider'));
    expect(overlay, contains('value: 1000, min: 1, max: 10000'));

    // ONE InstancedMesh draw: suzanne geometry, MeshNormalMaterial.
    expect(renderPlan.draws, hasLength(1));
    expect(renderState.geometryUploadCount, 1);
    expect(renderState.materials, hasLength(1));
    final draw = renderPlan.draws.single;
    expect(draw.primitive, ThreeDrawPrimitive.triangles);
    expect(draw.material.kind, JsThreeMaterialKind.meshNormal);
    expect(draw.material.transparent, isFalse);
    expect(draw.geometry.vertexCount, 505);
    expect(draw.geometry.indexCount, 2901);
    expect(draw.drawCount, 2901);
    expect(draw.indexed, isTrue);
    expect(draw.geometry.colors, isNull);
    expect(draw.instanceCount, 1000);

    // The instancing batch carries 1000 instance matrices (flags == 1) and
    // NO per-instance colors: setColorAt is never called by the module.
    final batch = draw.batch!;
    expect(batch.instanced, isTrue);
    expect(batch.flags, 1);
    expect(batch.instanceCount, 1000);
    expect(batch.hasInstanceColors, isFalse);
    expect(batch.instanceColors, isEmpty);
    expect(batch.instanceMatrices.length, 1000 * 16);
    final matrices = batch.instanceMatrices;
    var minScale = double.infinity;
    var maxScale = 0.0;
    for (var instance = 0; instance < 1000; instance++) {
      final sx = matrices[instance * 16];
      minScale = math.min(minScale, sx.abs());
      maxScale = math.max(maxScale, sx.abs());
    }
    // randomizeMatrix scales x/y/z by Math.random() in (0, 1].
    expect(minScale, greaterThan(0));
    expect(maxScale, lessThanOrEqualTo(1));

    // 967 triangles per suzanne x 1000 instances, all opaque.
    expect(renderPlan.opaque, hasLength(1));
    expect(renderPlan.transparent, isEmpty);
    expect(renderPlan.triangleCount, 967000);

    // Scene scaffold: white background, no lights, no shadow, camera at
    // distance 30 (PerspectiveCamera(70, aspect, 1, 100) + OrbitControls
    // autoRotate spinning around the origin).
    expect(renderPlan.background.r, 1);
    expect(renderPlan.background.g, 1);
    expect(renderPlan.background.b, 1);
    expect(renderPlan.directionalLights, isEmpty);
    expect(renderPlan.pointLights, isEmpty);
    expect(renderPlan.hemisphereLights, isEmpty);
    expect(renderPlan.spotLights, isEmpty);
    final frame = renderPlan.frame!;
    expect(frame.hasShadow, isFalse);
    final camera = renderPlan.cameraPosition;
    final cameraDistance =
        math.sqrt(camera.x * camera.x + camera.y * camera.y + camera.z * camera.z);
    expect(cameraDistance, closeTo(30, 0.5));

    // ---- Live GUI switch: count -> '10000' via backend.callEvent. ----
    final backend = probe.backend;
    final countAction = (guiValues[1] as Map)['action'] as String;
    final methodAction = (guiValues[0] as Map)['action'] as String;
    final uploadsBefore = renderState.geometryUploadCount;
    await backend.callEvent(countAction, {'value': '10000'});
    await probe.pumpUntil(
      tester,
      (state, plan) =>
          state.geometryUploadCount > uploadsBefore &&
          plan.draws.length == 1 &&
          plan.draws.single.instanceCount == 10000,
    );
    expect(
      ((probe.engine.exportedState!['gui']['values'] as List<dynamic>)[1]
          as Map<String, dynamic>)['value'],
      10000,
    );
    expect(probe.plan!.draws.single.instanceCount, 10000);
    expect(probe.plan!.draws.single.batch!.instanceCount, 10000);

    // ---- Live method dropdown at a bounded count: drop to 10 first so
    // the NAIVE branch builds a modest mesh count, proving the dropdown
    // lane end-to-end without a 10k-node rebuild in the test loop.
    await backend.callEvent(countAction, {'value': '10'});
    await probe.pumpUntil(
      tester,
      (state, plan) =>
          plan.draws.length == 1 &&
          plan.draws.single.instanceCount == 10,
    );
    await backend.callEvent(methodAction, {'value': 'NAIVE'});
    await probe.pumpUntil(
      tester,
      (state, plan) => plan.draws.length == 10,
    );
    expect(
      ((probe.engine.exportedState!['gui']['values'] as List<dynamic>)[0]
          as Map<String, dynamic>)['value'],
      'NAIVE',
    );
    renderPlan = probe.plan!;
    // NAIVE: 10 separate meshes sharing one geometry/material — every
    // draw un-instanced, per-instance total unchanged.
    expect(renderState.geometryUploadCount, greaterThanOrEqualTo(3));
    expect(renderPlan.draws.every((draw) => draw.instanceCount == 1), isTrue);
    expect(
      renderPlan.draws.every((draw) => draw.instanced == false),
      isTrue,
    );
    expect(
      renderPlan.draws
          .fold<int>(0, (total, draw) => total + draw.instanceCount),
      10,
    );
    expect(renderPlan.triangleCount, 9670);

    await backend.callEvent(methodAction, {'value': 'INSTANCED'});
    // Restore the perf-sensitive configuration: 10000 INSTANCED suzannes.
    await backend.callEvent(countAction, {'value': '10000'});
    await probe.pumpUntil(
      tester,
      (state, plan) =>
          plan.draws.length == 1 &&
          plan.draws.single.instanceCount == 10000 &&
          plan.draws.single.batch!.instanced,
    );
    expect(
      ((probe.engine.exportedState!['gui']['values'] as List<dynamic>)[0]
          as Map<String, dynamic>)['value'],
      'INSTANCED',
    );
    expect(
      ((probe.engine.exportedState!['gui']['values'] as List<dynamic>)[1]
          as Map<String, dynamic>)['value'],
      10000,
    );

    // ---- PERF evidence: presented-frame rate over the pump window. ----
    final beforeFrames = probe.state!.submittedFrameCount;
    final beforeStatsFrames =
        (probe.engine.exportedState!['stats'] as Map)['frames'] as int;
    final beforeCamera = probe.plan!.cameraPosition;
    final clock = Stopwatch()..start();
    await probe.pumpFrames(tester, 40);
    clock.stop();
    final afterFrames = probe.state!.submittedFrameCount;
    final afterStatsFrames = (probe.engine.exportedState!['stats']
        as Map<String, dynamic>)['frames'] as int;
    final windowSeconds = clock.elapsedMilliseconds / 1000;
    final submitFps = (afterFrames - beforeFrames) / windowSeconds;
    final statsFps = (afterStatsFrames - beforeStatsFrames) / windowSeconds;
    final frameTimeMs = (probe.engine.exportedState!['stats']
        as Map<String, dynamic>)['frameTimeMs'];
    // ignore: avoid_print
    print('instancing-perf window: ${clock.elapsedMilliseconds}ms wall, '
        'submittedFrames ${afterFrames - beforeFrames} '
        '(${submitFps.toStringAsFixed(1)}/s), '
        'stats.frames delta ${afterStatsFrames - beforeStatsFrames} '
        '(${statsFps.toStringAsFixed(1)}/s), frameTimeMs=$frameTimeMs, '
        'instances=10000');
    expect(afterFrames - beforeFrames, greaterThanOrEqualTo(3),
        reason: 'the RAF pipeline must keep presenting frames');
    expect(frameTimeMs, isA<num>());
    // autoRotate keeps mutating the camera every frame — liveness proof.
    // pumpFrames does not refresh harness.plan, so re-plan the latest
    // submitted state here.
    final afterCamera =
        const ThreeDrawPlanner().plan(probe.state!).cameraPosition;
    expect(
      '${afterCamera.x},${afterCamera.y},${afterCamera.z}',
      isNot('${beforeCamera.x},${beforeCamera.y},${beforeCamera.z}'),
      reason: 'autoRotate must keep advancing the R1 camera',
    );
    // Backpressure stays bounded.
    expect(probe.state!.pendingFrameCount, lessThanOrEqualTo(2));

    await probe.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 300)));
}

/// Waits until [ready] accepts the exported probe findings.
Future<Map> _waitForProbe(
  WidgetTester tester,
  ThreeQuickjsExampleHarness probe,
  bool Function(Map probeState) ready,
) async {
  Map? findings;
  for (var attempt = 0; attempt < 120; attempt++) {
    final exported = probe.engine.exportedState!['probe'];
    if (exported is Map) {
      findings = exported.cast<String, dynamic>();
      if (ready(findings)) return findings;
    }
    await probe.pumpFrame(tester);
  }
  fail('probe findings never satisfied the readiness guard; '
      'last=${findings ?? probe.engine.exportedState ?? '<no state>'} '
      'gui=${probe.engine.exportedState?['gui']} '
      'renderer=${probe.engine.exportedState?['renderer']}');
}

/// The instancing-performance widget.js instrumented with the suzanne
/// asset and a state-flag probe. Findings live on
/// `globalThis.__JSR_PROBE` and are re-exported via
/// `jsr.exportState({probe})` from the render wrapper — no console-log
/// retention dependence.
///
/// Structural, name-independent injections (minified identifiers drift on
/// every re-prepare; `$` allowed in identifiers), each guarded to match
/// exactly once:
/// 1. the empty prepared-asset list `=JSON.parse("[]")` → the suzanne
///    model registered on the local asset lane (what prepare does for
///    widgets with embedded assets, e.g. raycaster's uv_grid);
/// 2. the BufferGeometryLoader onLoad entry, anchored on the model URL;
/// 3. the animation-loop `renderer.render(scene, camera)` call at the
///    bundle tail, routed through the probe render wrapper.
/// [withConsolePolyfill] additionally defines the missing
/// `console.time`/`console.timeEnd` on the bootstrap shim — the probe
/// isolation of the documented part-1 gap; the stock runtime has neither.
String _probeSource({required bool withConsolePolyfill}) {
  var source = File(
    'example/widgets/three-instancing-performance/widget.js',
  ).readAsStringSync();

  void patchOnce(String label, RegExp re, String Function(Match) build) {
    final matches = re.allMatches(source).toList();
    expect(
      matches,
      hasLength(1),
      reason: '$label anchor drifted after a re-prepare: $re',
    );
    source = source.replaceRange(
      matches.single.start,
      matches.single.end,
      build(matches.single),
    );
  }

  // Official model bytes from the pinned r186 source tree.
  final modelBytes =
      File('/tmp/jsr-three-r186/examples/models/json/suzanne_buffergeometry.json')
          .readAsBytesSync();
  expect(modelBytes.length, 24675);
  final modelBase64 = base64Encode(modelBytes);
  const modelUrl = 'models/json/suzanne_buffergeometry.json';

  // Probe state + wrapper, declared before the example IIFE so the render
  // anchor and loader callback can reference them.
  final prologue = 'globalThis.__JSR_PROBE={onLoadFired:0,positionCount:0,'
      'indexCount:0,renders:0,renderErrors:0,renderMsg:"",'
      'consoleTime:"<live>",'
      'consoleTimeEnd:"<live>",'
      'loadCalls:0,loadStart:0,loadError:"",initMesh:0,frTail:"-",'
      'guiStatsHtml:"",fetchUrl:"",fetchHit:0};'
      'globalThis.__JSR_PROBE_SNAPSHOT=function(){return{'
      'onLoadFired:globalThis.__JSR_PROBE.onLoadFired,'
      'positionCount:globalThis.__JSR_PROBE.positionCount,'
      'indexCount:globalThis.__JSR_PROBE.indexCount,'
      'renders:globalThis.__JSR_PROBE.renders,'
      'renderErrors:globalThis.__JSR_PROBE.renderErrors,'
      'renderMsg:globalThis.__JSR_PROBE.renderMsg,'
      'consoleTime:String(typeof console.time),'
      'consoleTimeEnd:String(typeof console.timeEnd),'
      'loadCalls:globalThis.__JSR_PROBE.loadCalls,'
      'loadStart:globalThis.__JSR_PROBE.loadStart,'
      'loadError:globalThis.__JSR_PROBE.loadError,'
      'initMesh:globalThis.__JSR_PROBE.initMesh,'
      'frTail:globalThis.__JSR_PROBE.frTail,'
      'guiStatsHtml:globalThis.__JSR_PROBE.guiStatsHtml,'
      'fetchUrl:globalThis.__JSR_PROBE.fetchUrl,'
      'fetchHit:globalThis.__JSR_PROBE.fetchHit}};'
      'globalThis.__JSR_PROBE_EXPORT=function(){try{'
      'if(globalThis.jsr&&jsr.exportState)jsr.exportState({'
      'probe:globalThis.__JSR_PROBE_SNAPSHOT()})}catch(e){}};'
      'globalThis.__JSR_PROBE_RENDER=function(r,s,c){try{'
      'r.render(s,c);globalThis.__JSR_PROBE.renders++}catch(e){'
      'var p=globalThis.__JSR_PROBE;'
      'if(p.renderErrors===0)p.renderMsg=String(e.message||e);'
      'p.renderErrors++}globalThis.__JSR_PROBE_EXPORT()};'
      // Upstream three r186 FileLoader constructs `new AbortController()`
      // per request; QuickJS has no such global. Inert stub — the probe
      // never aborts a fetch, so the aborted lane stays unused.
      'if(typeof globalThis.AbortController!="function")'
      'globalThis.AbortController=function(){'
      'this.signal={aborted:false,onabort:null,addEventListener(){},'
      'removeEventListener(){},throwIfAborted(){}};'
      'this.abort=function(){if(this.signal.aborted)return;'
      'this.signal.aborted=true;'
      'if(this.signal.onabort)this.signal.onabort();};};'
      'if(typeof globalThis.Request!="function")'
      'globalThis.Request=function(url,init){'
      'this.url=String(url);this.method=(init&&init.method)||"GET";'
      'this.headers=(init&&init.headers)||{};'
      'this.credentials=(init&&init.credentials)||"same-origin";'
      'this.signal=(init&&init.signal)||{aborted:false,'
      'addEventListener(){}};};'
      'if(typeof globalThis.Headers!="function")'
      'globalThis.Headers=function(init){var h=this;'
      'this._map=Object.assign({},init||{});'
      'this.get=function(k){return h._map[String(k).toLowerCase()];};'
      'this.set=function(k,v){h._map[String(k).toLowerCase()]=v;};'
      'this.has=function(k){return h._map[String(k).toLowerCase()]'
      '!==undefined;};};'
      'if(typeof globalThis.AbortSignal!="function")'
      'globalThis.AbortSignal=function(){};'
      'globalThis.AbortSignal.abort=function(){return'
      '{aborted:true,onabort:null,addEventListener(){},'
      'removeEventListener(){},throwIfAborted(){'
      'throw new Error("aborted")}};};'
      // The widget bundles upstream three, whose FileLoader transports
      // via fetch(). The engine only installs a fetch shim for widgets
      // whose manifest declares assets — this one was prepared without
      // any asset lane — so the probe provides the same lane itself:
      // jsr.three.resolveAsset serves the locally registered suzanne
      // bytes as a minimal Response.
      'if(typeof globalThis.fetch!="function")'
      'globalThis.fetch=function(url){'
      'var u=(url&&url.url!==undefined)?url.url:url;'
      'globalThis.__JSR_PROBE.fetchUrl=String(u).slice(0,120);'
      'var rec=(jsr&&jsr.three&&jsr.three.resolveAsset)?'
      'jsr.three.resolveAsset(String(u)):null;'
      'globalThis.__JSR_PROBE.fetchHit=rec?1:0;'
      'if(!rec)return Promise.reject(new Error("fetch-stub: no asset"));'
      'var bytes=rec.bytes;'
      'function utf8(b){var s="",i=0,c;while(i<b.length){c=b[i];'
      'if(c<128){s+=String.fromCharCode(c);i++;}'
      'else if(c<224){s+=String.fromCharCode(((c&31)<<6)|'
      '(b[i+1]&63));i+=2;}'
      'else{s+=String.fromCharCode(((c&15)<<12)|'
      '((b[i+1]&63)<<6)|(b[i+2]&63));i+=3;}}return s;}'
      'return Promise.resolve({ok:true,status:200,statusText:"OK",'
      'url:String(url),headers:{get(){return null}},'
      'arraybuffer:function(){return Promise.resolve('
      'bytes.buffer.slice(bytes.byteOffset,'
      'bytes.byteOffset+bytes.byteLength));},'
      'text:function(){return Promise.resolve(utf8(bytes));},'
      'json:function(){return Promise.resolve(JSON.parse('
      'utf8(bytes)));}});};'
      // NOTE: the console polyfill is NOT installed here — the runtime
      // bundle installs its own console shim after this prologue and
      // would overwrite it. The withConsolePolyfill lane injects inside
      // the widget source instead (at the init()/initMesh() tail).
      'setTimeout(function(){var p=globalThis.__JSR_PROBE;'
      'if(!p.onLoadFired&&!p.loadError){p.loadError="LOAD-NEVER-SETTLED;'
      'calls="+p.loadCalls+" started="+p.loadStart;'
      '}p.renderMsg||(p.renderMsg="loadcheck");'
      'globalThis.__JSR_PROBE_EXPORT()},700);' +
      (withConsolePolyfill
          ? 'globalThis.__JSR_PROBE_consolePolyfill=true;'
          : 'globalThis.__JSR_PROBE_consolePolyfill=false;');

  // 1 — register the suzanne model on the local asset lane.
  patchOnce(
    'asset list',
    RegExp(r'=JSON\.parse\("\[\]"\)'),
    (m) => '=[{url:"$modelUrl",data:"$modelBase64",'
        'mime:"application/json",bytes:${modelBytes.length},width:0,height:0}]',
  );

  // 2 — the BufferGeometryLoader onLoad entry.
  patchOnce(
    'suzanne onLoad',
    RegExp(r'\.load\("suzanne_buffergeometry\.json",function\(([\w$]+)\)\{'),
    (m) => '${m[0]}globalThis.__JSR_PROBE.onLoadFired++,'
        'globalThis.__JSR_PROBE.positionCount='
        '${m[1]}.attributes.position.count,'
        'globalThis.__JSR_PROBE.indexCount='
        '${m[1]}.index?${m[1]}.index.count:0;'
        'globalThis.__JSR_PROBE_EXPORT();',
  );

  // 2b — capture the loader error lane (silent onError in the example).
  patchOnce(
    'initMesh entry',
    RegExp(r'function ([\w$]+)\(\)\{([\w$]+)\(\),new ([\w$]+)'),
    (m) => 'function ${m[1]}(){globalThis.__JSR_PROBE.initMesh++;'
        'try{${m[2]}()}catch(e){globalThis.__JSR_PROBE.loadError='
        '"CLEAN:"+String((e&&(e.stack||e.message))||e).slice(0,300);'
        'globalThis.__JSR_PROBE_EXPORT();throw e;}'
        'globalThis.__JSR_PROBE_EXPORT();new ${m[3]}',
  );

  patchOnce(
    'suzanne loader wrap',
    RegExp(r'new ([\w$]+)\(\)\.setPath\("models/json/"\)\.load\('),
    (m) => '(function(C){var l=new C(),ol=l.load;'
        'l.load=function(u,on,op,oe){'
        'globalThis.__JSR_PROBE.loadStart++;'
        'globalThis.__JSR_PROBE_EXPORT();'
        'return ol.call(l,u,on,op,function(e){'
        'globalThis.__JSR_PROBE.loadError=String('
        'e&&e.constructor&&e.constructor.name)+"/"+String('
        '(e&&(e.name+": "+(e.message||"<empty>")))||e)+'
        '" :: "+String(e&&(e.stack||"")).slice(0,200);'
        'globalThis.__JSR_PROBE_EXPORT();'
        'if(oe)oe(e);});};return l;}(${m[1]}))'
        '.setPath("models/json/").load(',
  );

  // 3 — the official object-map dropdown add: `gui.add(api, 'method',
  //     Method)` is outside the bounded facade (documented root cause
  //     #1). The Method enum's keys equal their values, so registering
  //     the equivalent array form is behavior-identical upstream and the
  //     only facade-supported shape; without it the module aborts before
  //     the renderer questions can even be asked.
  patchOnce(
    'method options add',
    RegExp(r'\.add\(([\w$]+),"method",([\w$]+)\)\.onChange\(([\w$]+)\)'),
    (m) => '.add(${m[1]},"method",'
        '["INSTANCED","MERGED","NAIVE"]).onChange(${m[3]})',
  );

  // 3b — the stats shim re-publishes the glue diagnostics EVERY frame
  //     (stats.update → reportStats → publishDiagnostics), which would
  //     wipe a standalone probe export after each of them. Merge the
  //     probe findings into the glue publish instead: the q() tail
  //     `<G>.exportState(<state>)}` gains the live probe object.
  patchOnce(
    'glue publish merge',
    RegExp(r'([A-Za-z_$][\w$]*)\.exportState\(([A-Za-z_$][\w$]*)\)\}'),
    (m) => '${m[1]}.exportState(Object.assign(${m[2]},'
        '{probe:globalThis.__JSR_PROBE_SNAPSHOT()}))}',
  );

  // 4 — the animation loop's render call: `function <animate>(){
  //     <controls>.update(),<renderer>.render(<scene>,<camera>),
  //     <stats>.update()}`.
  patchOnce(
    'animation render',
    RegExp(
      r'function ([\w$]+)\(\)\{([\w$]+)\.update\(\),([\w$]+)'
      r'\.render\(([\w$]+),([\w$]+)\),([\w$]+)\.update\(\)\}',
    ),
    (m) => 'function ${m[1]}(){${m[2]}.update(),'
        'globalThis.__JSR_PROBE_RENDER(${m[3]},${m[4]},${m[5]}),'
        '${m[6]}.update()}',
  );

  // 2c — pin which fr() tail step (folder/div/classList/$children/
  //      open/resize/window-assign) kills the module scope before $t().
  // 2c — pin which fr() tail step (folder/div/classList/$children/
  //      open/resize/window-assign) kills the module scope before $t(),
  //      and shim the one non-rendering DOM gap. The native document
  //      shim is canvas-only: document.createElement("div") throws, so
  //      the module scope dies at the gui-stats overlay line, after
  //      setAnimationLoop but before initMesh(). Probe-only DOM stub
  //      (precedent: the points-billboards body/container stub); the
  //      stub captures the official innerHTML writes so the example's
  //      own instance-count text stays assertable. The stub is installed
  //      INSIDE the widget source, right before the init()/initMesh()
  //      module tail — the runtime bundle installs its document before
  //      this point, and a prologue-time wrapper would be replaced.
  patchOnce(
    'document.createElement stub',
    RegExp(r';([A-Za-z_$][\w$]*)\(\);([A-Za-z_$][\w$]*)\(\);function '),
    (m) => ';try{(function(){'
        // Probe-only console shim completion (2b lane only): the native
        // console shim lacks time/timeEnd; the official build() calls
        // `console.time('build # '+i)`. With the polyfill the official
        // build path runs unmodified; without it (2a) the bare
        // "TypeError: not a function" documents the gap.
        'if(globalThis.__JSR_PROBE_consolePolyfill){'
        'console.time=function(){},console.timeEnd=function(){};}'
        'if(typeof document=="undefined"||'
        'typeof document.createElement!="function")return;'
        'var ce=document.createElement.bind(document);'
        'document.createElement=function(tag){'
        'var el=ce(tag);'
        'if(el&&!el.classList)el.classList={add(){},remove(){},'
        'toggle(){},contains(){return false}};'
        'return el;};})();'
        '${m[1]}();${m[2]}();'
        '}catch(e){globalThis.__JSR_PROBE.loadError="TAIL:";'
        'globalThis.__JSR_PROBE.loadError+=String('
        'e&&e.constructor&&e.constructor.name)+"/";'
        'globalThis.__JSR_PROBE.loadError+=String('
        '(e&&(e.name+": "+(e.message||"<empty>")))||e).slice(0,300);'
        'globalThis.__JSR_PROBE_EXPORT();throw e;}'
        'function ',
  );

  patchOnce(
    'fr tail steps',
    RegExp(r'let ([\w$]+)=([\w$]+)\.addFolder\("Performance"\);'
        r'([\w$]+)=document\.createElement\("div"\),'
        r'([\w$]+)\.classList\.add\("gui-stats"\),'
        r'([\w$]+)\.\$children\.appendChild\(([\w$]+)\),'
        r'([\w$]+)\.open\(\),window\.addEventListener\("resize",([\w$]+)\),'
        r'Object\.assign\(window,\{scene:([\w$]+)\}\)'),
    (m) => 'globalThis.__JSR_PROBE.frTail="folder-call";'
        'let ${m[1]}=${m[2]}.addFolder("Performance");'
        // NativeFolder (lil_gui_adapter.js:404) has no $children — the
        // official lil-gui DOM API the example uses to host its stats
        // <div>. Probe-only shim: the row is non-rendering diagnostics.
        'if(${m[1]}&&${m[1]}.\$children===undefined)'
        '${m[1]}.\$children={appendChild(){}};'
        'globalThis.__JSR_PROBE.frTail="addFolder";'
        '${m[3]}=document.createElement("div");'
        'globalThis.__JSR_PROBE.frTail="createElement";'
        '${m[4]}.classList.add("gui-stats");'
        'globalThis.__JSR_PROBE.frTail="classList";'
        '${m[5]}.\$children.appendChild(${m[6]});'
        'globalThis.__JSR_PROBE.frTail="appendChild";'
        '${m[7]}.open();globalThis.__JSR_PROBE.frTail="open";'
        'window.addEventListener("resize",${m[8]});'
        'globalThis.__JSR_PROBE.frTail="resize";'
        'Object.assign(window,{scene:${m[9]}});'
        'globalThis.__JSR_PROBE.frTail="done";',
  );

  return prologue + source;
}
