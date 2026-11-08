import 'package:flutter_test/flutter_test.dart';

import 'support/running_widget.dart';
import 'support/three_probe_state.dart';
import 'support/three_quickjs_example_harness.dart';
import 'support/widget_logic_helper.dart';

/// webgl_batch_lod_bvh interactive-fps regression (pointermove raycast storm).
///
/// The R1 BatchedMesh adaptation lane draws retained instances through
/// InstancedMesh proxies. Those proxies kept the default Mesh/InstancedMesh
/// raycast, so every pointermove re-tested each proxy's full triangle range
/// (~2.1M triangle tests per event across the 10 proxies in QuickJS) purely
/// to re-derive hits the module's own BVH raycast already produced — an
/// in-app 125 Hz pointermove storm collapsed presentedFps 120 → 0-4. The
/// runtime now stubs `proxy.raycast` to a no-op (the official module's
/// acceleratedRaycast over the BatchedMesh BVH stays the single hit source).
///
/// These tests pin both halves: (1) every proxy the lane creates carries a
/// callable no-op raycast that is NOT the default prototype raycast, while
/// the module's own raycaster still answers; (2) a sustained synthetic
/// pointermove storm must not starve the frame lane (frames keep submitting
/// at roughly the idle rate and the storm stays inside a wall-clock bound).
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  if (!hasQuickjsNativeLib) {
    test(
      'batch lod interactive fps',
      () {},
      skip: 'QuickJS native library is not available',
    );
    return;
  }

  testWidgets(
    'BatchedMesh proxies carry the no-op raycast stub and the BVH lane still answers',
    (tester) async {
      final harness = await ThreeQuickjsExampleHarness.boot(
        tester,
        widgetId: 'three-batch-lod-bvh',
        instanceId: 'three-batch-lod-stub-test',
        sourcePrelude: _proxyProbePrelude(),
      );
      await harness.pumpUntil(
        tester,
        (state, plan) =>
            state.submittedFrameCount >= 3 && plan.draws.isNotEmpty,
      );
      // The proxy lane (re)builds proxies on the render that first sees the
      // retained instance set; give that sync a few frames to land.
      await harness.pumpFrames(tester, 12);

      final findings = probeFindings(harness);
      expect(findings, isNotNull, reason: 'probe findings never exported');
      // The official diagnostics lane must survive the exportState merge.
      expect(harness.engine.exportedState?['example'], 'webgl_batch_lod_bvh');

      expect(
        findings!['proxiesSeen'],
        greaterThanOrEqualTo(1),
        reason: 'the R1 batched lane never created InstancedMesh proxies',
      );
      expect(findings['scanErrors'], 0, reason: 'proxy probe crashed');
      // The stub itself: present, callable, not the default prototype raycast,
      // and a call is a clean no-op (the default raycast throws without a
      // raycaster, which is what makes the control meaningful).
      expect(
        findings['proxyRaycastMissing'],
        0,
        reason: 'a proxy lost its raycast override entirely',
      );
      expect(
        findings['proxyRaycastDefault'],
        0,
        reason:
            'a proxy fell back to the default InstancedMesh raycast — the '
            'pointermove storm collapses in-app fps to 0-4 again',
      );
      expect(
        findings['proxyRaycastNop'],
        findings['proxiesSeen'],
        reason: 'every proxy raycast must be a clean no-op call',
      );
      expect(findings['proxyRaycastThrow'], 0, reason: 'a proxy raycast threw');
      expect(
        findings['defaultRaycastThrows'],
        isTrue,
        reason:
            'control default InstancedMesh.raycast() no longer throws — the '
            'no-op comparison is meaningless',
      );
      // The module's own raycast path stays intact (this is why the stub is
      // safe): intersectObject still runs and still answers.
      expect(
        findings['raycastErrors'],
        0,
        reason: 'the BVH raycast lane broke',
      );
      await harness.dispose(tester);
    },
    timeout: const Timeout(Duration(seconds: 300)),
  );

  testWidgets('sustained pointermove storm keeps the frame lane flowing', (
    tester,
  ) async {
    final harness = await ThreeQuickjsExampleHarness.boot(
      tester,
      widgetId: 'three-batch-lod-bvh',
      instanceId: 'three-batch-lod-storm-test',
      sourcePrelude: _proxyProbePrelude(),
    );
    await harness.pumpUntil(
      tester,
      (state, plan) => state.submittedFrameCount >= 3 && plan.draws.isNotEmpty,
    );
    await harness.pumpFrames(tester, 10);
    final before = harness.state!.submittedFrameCount;

    // Idle reference window: same pump count without input, so the bound
    // below measures storm overhead, not harness variance.
    final idle = Stopwatch()..start();
    await harness.pumpFrames(tester, 15);
    final idleMs = idle.elapsedMilliseconds;
    final idleDelta = harness.state!.submittedFrameCount - before;

    // The in-app collapse was a ~125 Hz pointermove stream: 5 events per
    // pump frame (~200 events over the window) sweeping the whole canvas
    // so every event re-enters the official raycast() hover path.
    final storm = Stopwatch()..start();
    var events = 0;
    var submittedAtStormStart = harness.state!.submittedFrameCount;
    const stormFrames = 30;
    for (var frame = 0; frame < stormFrames; frame++) {
      final x = 50.0 + (frame % 15) * 50.0;
      for (var e = 0; e < 5; e++) {
        dispatchThreePointerEvent(
          harness.backend,
          'pointermove',
          x: x + e,
          y: 120.0 + (frame % 7) * 40.0,
        );
        events++;
      }
      await harness.pumpFrame(tester);
    }
    final stormMs = storm.elapsedMilliseconds;
    final stormDelta =
        harness.state!.submittedFrameCount - submittedAtStormStart;

    final findings = probeFindings(harness);
    expect(findings, isNotNull);
    // The module's BVH raycast lane still answers — now through the
    // dragThrottleHover prepare transform, which coalesces hover raycasts
    // (leading edge when idle, <=33ms trailing otherwise) instead of
    // raycasting per event.
    expect(
      findings!['raycastErrors'],
      0,
      reason: 'the BVH raycast lane broke under the storm',
    );
    expect(
      findings['raycastCalls'],
      greaterThanOrEqualTo(1),
      reason: 'the throttled hover lane never answered under the storm',
    );
    // Coalescing bound: each pump frame delivers one 5-move burst, which
    // produces at most one leading-edge immediate raycast plus one trailing
    // raycast — never one raycast per storm event (that per-event storm is
    // exactly the QuickJS hover cost this transform removes). The leading
    // edge fires when >=33ms of REAL time elapsed since the last raycast
    // (queueHoverRaycast reads performance.now(), which is wall time in the
    // QuickJS engine): on a loaded CI runner the harness's 20ms runAsync
    // window stretches past 33ms, so EVERY frame then yields leading +
    // trailing (2/frame), plus the initial -Infinity leading edge and one
    // timer/pump boundary stray have been observed (61 for stormFrames=30).
    // The bound keeps a small slack for those legitimate paths; the
    // regression signature it guards against is one raycast PER EVENT
    // (150 here), so any value far below `events` preserves the guard.
    expect(
      findings['raycastCalls'],
      lessThanOrEqualTo(2 * stormFrames + 4),
      reason:
          'hover raycasts are back to per-event cost: ${findings['raycastCalls']} '
          'raycasts for $events storm events — the dragThrottleHover '
          'coalescing regressed',
    );
    // Frame-flow bound: the pre-fix collapse starved the lane to ~0-4 fps
    // (frames stopped submitting); with the stub the storm window must keep
    // submitting at least as well as the idle reference window.
    expect(
      stormDelta,
      greaterThanOrEqualTo(idleDelta),
      reason:
          'storm window submitted $stormDelta frames vs $idleDelta idle — '
          'pointer input is starving the frame lane again',
    );
    // Wall-clock bound, per storm event. The official module's own BVH
    // hover raycast is intentionally still exercised (that lane is the
    // reason the proxy stub is safe) and costs ~10ms/event in QuickJS —
    // that pre-existing cost is not the regression. The pre-fix collapse
    // was the PROXY lane re-testing ~2.1M triangles per event on top of it:
    // in-app 125 Hz pointermove collapsed presentedFps 120 → 0-4, i.e. the
    // frame budget blew past 250ms/event. Bound the stubbed overhead at
    // 40ms/event: comfortably above the module lane's measured cost and
    // far below the collapse signature.
    // ignore: avoid_print
    print(
      'batch_lod storm: events=$events stormMs=$stormMs stormFrames=$stormDelta '
      'idleMs=$idleMs idleFrames=$idleDelta '
      'raycasts=${findings['raycastCalls']} hits=${findings['raycastHits']}',
    );
    final overheadPerEvent = (stormMs - (idleMs / 15) * stormFrames) / events;
    // ignore: avoid_print
    print(
      'batch_lod storm overhead: ${overheadPerEvent.toStringAsFixed(1)}ms/event',
    );
    expect(
      overheadPerEvent,
      lessThan(40),
      reason:
          'storm input overhead ${overheadPerEvent.toStringAsFixed(1)}ms/event '
          '— proxy raycast scans are back (collapse signature: >250ms/event)',
    );
    await harness.dispose(tester);
  }, timeout: const Timeout(Duration(seconds: 300)));
}

/// Installs the proxy-lane probe BEFORE the widget module evaluates:
/// - counts renderer-created proxies (`userData.jsrBatchedMeshProxy`) via an
///   Object3D.add prototype wrap and classifies each proxy's raycast;
/// - counts Raycaster.intersectObject traffic so the storm test can prove
///   the module's own BVH lane answered every event;
/// - merges the probe map into every official exportState publish so the
///   harness keeps the standard diagnostics beside `probe`.
String _proxyProbePrelude() => '''
globalThis.__JSR_PROBE={proxiesSeen:0,proxyRaycastNop:0,proxyRaycastMissing:0,
proxyRaycastDefault:0,proxyRaycastThrow:0,defaultRaycastThrows:false,
raycastCalls:0,raycastHits:0,raycastErrors:0,instanceCount:0,scanErrors:0};
(function(){
try{
if(globalThis.THREE&&THREE.Object3D&&THREE.Object3D.prototype){
var P=globalThis.__JSR_PROBE;
var protoRaycast=THREE.InstancedMesh&&THREE.InstancedMesh.prototype?
THREE.InstancedMesh.prototype.raycast:null;
var origAdd=THREE.Object3D.prototype.add;
THREE.Object3D.prototype.add=function(child){
var r=origAdd.apply(this,arguments);
try{
if(child&&child.userData&&child.userData.jsrBatchedMeshProxy){
P.proxiesSeen++;
if(this.isBatchedMesh&&this.instanceCount>0)P.instanceCount=this.instanceCount;
if(typeof child.raycast!=='function'){P.proxyRaycastMissing++;}
else if(protoRaycast&&child.raycast===protoRaycast){P.proxyRaycastDefault++;}
else{try{child.raycast();P.proxyRaycastNop++;}catch(e){P.proxyRaycastThrow++;}}
}
}catch(e){P.scanErrors++;}
return r;
};
var control=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial(),1);
try{control.raycast();}catch(e){P.defaultRaycastThrows=true;}
}
if(globalThis.THREE&&THREE.Raycaster&&THREE.Raycaster.prototype){
var P2=globalThis.__JSR_PROBE;
var origIO=THREE.Raycaster.prototype.intersectObject;
THREE.Raycaster.prototype.intersectObject=function(o,r){
try{var out=origIO.apply(this,arguments);P2.raycastCalls++;
if(out&&out.length>0)P2.raycastHits++;return out;}
catch(e){P2.raycastErrors++;return[];}
};
}
if(globalThis.jsr&&typeof jsr.exportState==='function'){
var origExport=jsr.exportState;
jsr.exportState=function(obj){obj=obj||{};obj.probe=globalThis.__JSR_PROBE;
return origExport.call(jsr,obj);};
}
}catch(e){}
})();
''';
