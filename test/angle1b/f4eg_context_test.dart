import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../support/f4eg_cinematic.dart';
import '../support/three_1b_engine.dart';
import '../support/three_1b_real_wire.dart';
import '../../tool/three/bench_1b.dart' show Shim;

// E2E-CONTEXT-CINE-1 (issue #8, F4e context row, plan 4.4 row F4e; edge E6):
// context loss while a temporal pipeline renders. The pipeline holds bloom +
// the stock TAARenderPass accumulation history when WEBGL_lose_context
// fires; after the restore the history is reset, the pipeline renders
// non-empty frames again (the batch dispatch counter grows on the restored
// context), no stale frame and no stale surface is reused (the same wire
// surface answers every dispatch), and the final-pass capture barrier works
// again.
void main() {
  final realBundle = File('assets/three/jsr_three_web.js').readAsStringSync();
  // ignore: omit_local_variable_types
  final String? missing = Shim.resolveProblem();
  // Deterministic end-of-file teardown (three_1b_real_wire.dart): drain any
  // wire run1bRealEngine created that its test did not dispose — a live
  // ANGLE display at process exit segfaults the CI Paravirtual GPU.
  tearDownAll(disposeRegisteredReal1BWires);

  final widget =
      '''
var results = { errors: [] };
try {
  var cin = jsr.three.cinematic;
  var canvas = jsr.three.createCanvas('ctxcine');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
  renderer.setSize(64, 64, false);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 3;
  scene.add(new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })));
  var pipeline = cin.createPipeline({
    renderer: renderer, scene: scene, camera: camera, effects: { bloom: true }
  });
  var taa = new cin.TAARenderPass(scene, camera);
  taa.accumulate = true;
  taa.sampleLevel = 0;
  pipeline.composer.insertPass(taa, pipeline.composer.passes.length - 1);
  pipeline.history.declare({ pass: 'taa', frames: 3 });
  // phase 1: two frames accumulate the temporal history
  var gl = renderer.getContext();
  var d1 = gl.__stats.dispatchCalls;
  pipeline.renderFrame(cin.clockState(0, 24, 0.5, 1, 0));
  pipeline.renderFrame(cin.clockState(1, 24, 0.5, 1, 0));
  results.phase1 = {
    dispatches: gl.__stats.dispatchCalls - d1,
    calls: renderer.info.render.calls,
    frames: renderer.info.render.frame,
    accumulateIndex: taa.accumulateIndex
  };
  // context loss while the temporal pipeline holds history
  var lose = gl.getExtension('WEBGL_lose_context');
  lose.loseContext();
  results.lost = gl.isContextLost();
  try {
    pipeline.renderFrame(cin.clockState(2, 24, 0.5, 1, 0));
    results.duringLoss = 'rendered';
  } catch (e) {
    results.duringLoss = 'named: ' + String((e && e.message) || e);
  }
  // restore, then the documented recovery: reset the history, restart the
  // TAA accumulation, render again
  lose.restoreContext();
  results.restored = !gl.isContextLost();
  pipeline.resetHistory(77);
  taa.accumulateIndex = -1;
  var d2 = gl.__stats.dispatchCalls;
  var callsBefore = renderer.info.render.calls;
  pipeline.renderFrame(cin.clockState(0, 24, 0.5, 1, 77));
  pipeline.renderFrame(cin.clockState(1, 24, 0.5, 1, 77));
  results.phase2Calls = renderer.info.render.calls;
  results.phase2Acc = taa.accumulateIndex;
  // capture works again (final-pass barrier host). The .then runs after the
  // microtask drain, so phase-2 batches have flushed by then — read the
  // dispatch counter there.
${f4egCaptureExportJs(clockExpr: 'cin.clockState(2, 24, 0.5, 1, 77)', capturedExpr: '{ path: r.path || null, width: r.width || null }', extraInThen: "results.phase2 = { dispatches: gl.__stats.dispatchCalls - d2, frames: renderer.info.render.frame, accumulateIndex: results.phase2Acc };")}
} catch (e) {
  results.errors.push(String((e && e.message) || e));
  jsr.exportState(results);
}
''';

  test(
    'E2E-CONTEXT-CINE-1: context loss with a live temporal pipeline, '
    'restore, history reset, clean frames and a working capture',
    () async {
      final host = F4egRecordingCaptureHost();
      final (wire, reported, state, logs) = await run1bRealEngine(
        widget,
        realBundle,
        cinematicCaptureHost: host,
      );
      addTearDown(wire.dispose);
      expect(reported?.isAngle1b, isTrue);
      expect(state?['errors'], isEmpty, reason: '${state?['errors']}');
      final phase1 = (state?['phase1'] ?? <String, dynamic>{})
          .cast<String, dynamic>();
      final phase2 = (state?['phase2'] ?? <String, dynamic>{})
          .cast<String, dynamic>();
      // History accumulated before the loss: real frame dispatches and TAA
      // accumulation advanced.
      expect(
        phase1['dispatches'],
        greaterThan(0),
        reason: 'phase 1 rendered real frames',
      );
      expect(
        phase1['accumulateIndex'],
        greaterThan(0),
        reason: 'the temporal pass held accumulation history at the loss',
      );
      // The loss was real.
      expect(state?['lost'], isTrue);
      // The restore was real.
      expect(state?['restored'], isTrue);
      // Frames render again on the restored context: the batch dispatch
      // counter grew — no stale frame is presented from before the loss.
      expect(
        phase2['dispatches'],
        greaterThan(0),
        reason: 'phase 2 dispatched real frame work on the restored context',
      );
      expect(
        (phase2['frames'] as num).toInt(),
        greaterThan((phase1['frames'] as num).toInt()),
        reason: 'renderer.info frame count advanced across the restore',
      );
      expect(
        phase2['accumulateIndex'],
        greaterThan(0),
        reason: 'the temporal accumulation restarted after the history reset',
      );
      // The same wire surface served every dispatch: no stale surface is
      // reused (the dispatch count includes both phases, and the run produced
      // no composite error).
      expect(
        wire.dispatches1B.length,
        greaterThan(
          (phase1['dispatches'] as num) + (phase2['dispatches'] as num),
        ),
      );
      expect(widgetErrorLogs(logs), isEmpty);
      // Capture works again through the final-pass barrier.
      expect(state?['captureError'], isNull);
      expect(
        (state?['captured'] ?? <String, dynamic>{})['path'],
        isNotNull,
        reason: 'the capture barrier resolved after the restore',
      );
      expect(
        host.calls,
        hasLength(1),
        reason: 'the host saw exactly the post-restore capture',
      );
      expect(
        host.calls.single['epoch'],
        77,
        reason: 'the capture carries the reset epoch',
      );
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 5)),
  );
}
