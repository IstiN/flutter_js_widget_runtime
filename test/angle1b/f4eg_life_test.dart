import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../support/three_1b_engine.dart';
import '../support/three_1b_real_wire.dart';
import '../../tool/three/bench_1b.dart' show Shim;

// IT-LIFE-CINE-1 / REG-RESOURCE-BOUNDS (issue #8, F4e lifecycle, plan 4.4
// row F4e): one 1B surface and renderer carry 100 cycles of a cinematic
// pipeline with bloom, the stock TAARenderPass temporal pass and the output
// pass: create, render, resize, history reset, context loss through
// WEBGL_lose_context (and restore), destroy. The GL resource baseline is
// snapshotted after the warmup render — before the first cycle — and read
// again after the last cycle from the facade `__stats` call accounting (the
// counts the F2 lifecycle row reads: createX-minus-deleteX per kind). Every
// kind returns to the baseline: no leaked target, program or history
// resource (REG-RESOURCE-BOUNDS).
void main() {
  final realBundle = File('assets/three/jsr_three_web.js').readAsStringSync();
  // ignore: omit_local_variable_types
  final String? missing = Shim.resolveProblem();
  // Deterministic end-of-file teardown (three_1b_real_wire.dart): drain any
  // wire run1bRealEngine created that its test did not dispose — a live
  // ANGLE display at process exit segfaults the CI Paravirtual GPU.
  tearDownAll(disposeRegisteredReal1BWires);

  const kinds = [
    'Texture',
    'Framebuffer',
    'Renderbuffer',
    'Program',
    'Buffer',
    'Shader',
  ];

  final lifecycleWidget = '''
var results = { cycles: 0, errors: [], deltas: {}, contextClean: true, lastCalls: 0 };
var KINDS = ['Texture', 'Framebuffer', 'Renderbuffer', 'Program', 'Buffer', 'Shader'];
function liveDelta(stats) {
  var out = {};
  for (var k = 0; k < KINDS.length; k++) {
    var name = KINDS[k];
    out[name] = ((stats.used['create' + name] || 0) - (stats.used['delete' + name] || 0));
  }
  return out;
}
try {
  var cin = jsr.three.cinematic;
  if (!cin || typeof cin.createPipeline !== 'function') {
    throw new Error('cinematic.surfaceMissing: jsr.three.cinematic is not installed');
  }
  // One surface for the whole run: create it and render one warmup frame,
  // then snapshot the baseline (facade init resources and first-frame
  // allocations are IN the baseline, so the cycle delta is exactly the
  // resources the pipeline cycles failed to release).
  var canvas = jsr.three.createCanvas('cine');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
  renderer.setSize(64, 64, false);
  renderer.render(new THREE.Scene(), new THREE.PerspectiveCamera(50, 1, 0.1, 100));
  var gl = renderer.getContext();
  var baseline = liveDelta(gl.__stats);
  var sizes = [32, 40, 48, 56, 64];
  var lose = gl.getExtension('WEBGL_lose_context');
  for (var i = 0; i < 100; i++) {
    // create: the scene content is per-cycle, so pipeline.dispose owns and
    // releases every geometry, material and program the cycle created
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 3;
    scene.add(new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })));
    var pipeline = cin.createPipeline({
      renderer: renderer, scene: scene, camera: camera, effects: { bloom: true }
    });
    // the stock temporal pass at the pin, inserted before OutputPass
    var taa = new cin.TAARenderPass(scene, camera);
    taa.accumulate = true;
    taa.sampleLevel = 0;
    pipeline.composer.insertPass(taa, pipeline.composer.passes.length - 1);
    pipeline.history.declare({ pass: 'taa', frames: 2 });
    // render (explicit clock, samples 1)
    pipeline.renderFrame(cin.clockState(i, 24, 0.5, 1, i));
    if (renderer.info.render.calls < 1) results.errors.push('cycle ' + i + ': no draw call');
    // resize (rotating coherent size through renderer + pipeline)
    var s = sizes[i % sizes.length];
    renderer.setSize(s, s, false);
    pipeline.setSize(s, s);
    // history reset: new epoch + the stock TAA accumulation restart
    pipeline.resetHistory(i + 1);
    taa.accumulateIndex = -1;
    var rec = pipeline.history.reconstruct({ frame: i });
    if (rec.frames.length > 2) results.errors.push('cycle ' + i + ': history depth ' + rec.frames.length);
    // context loss and restore through WEBGL_lose_context
    lose.loseContext();
    var lost = gl.isContextLost();
    lose.restoreContext();
    var restored = !gl.isContextLost();
    if (!lost || !restored) {
      results.contextClean = false;
      results.errors.push('cycle ' + i + ': context lost=' + lost + ' restored=' + restored);
    }
    // destroy
    pipeline.dispose();
    taa.dispose();
    results.lastCalls = renderer.info.render.calls;
    results.cycles++;
  }
  results.deltas = liveDelta(gl.__stats);
  for (var k = 0; k < KINDS.length; k++) {
    var name = KINDS[k];
    results.deltas[name] = results.deltas[name] - baseline[name];
  }
} catch (e) {
  results.errors.push(String((e && e.message) || e));
}
jsr.exportState(results);
''';

  test(
    'IT-LIFE-CINE-1: 100 cinematic pipeline cycles with a temporal pass '
    'on one surface: create, render, resize, history reset, context loss, '
    'destroy',
    () async {
      final (wire, reported, state, logs) = await run1bRealEngine(
        lifecycleWidget,
        realBundle,
      );
      addTearDown(wire.dispose);
      expect(reported?.isAngle1b, isTrue);
      expect(
        state?['cycles'],
        100,
        reason:
            'every cycle created, rendered, resized, reset, lost context '
            'and destroyed cleanly',
      );
      expect(state?['errors'], isEmpty, reason: '${state?['errors']}');
      expect(
        state?['contextClean'],
        isTrue,
        reason: 'every WEBGL_lose_context cycle actually lost and restored',
      );
      expect(
        state?['lastCalls'],
        1,
        reason:
            'the 100th cycle still submits its draw call (info resets '
            'per frame, exactly like the F2 IT-LIFE-1 record; no stale '
            'context, no resource exhaustion)',
      );
      expect(widgetErrorLogs(logs), isEmpty);
      expect(wire.dispatches1B.length, greaterThan(100));
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 5)),
  );

  test(
    'REG-RESOURCE-BOUNDS: after 100 cycles every GL resource kind is back '
    'at the pre-cycle baseline (textures, framebuffers, renderbuffers, '
    'programs, buffers, shaders)',
    () async {
      final (wire, reported, state, _) = await run1bRealEngine(
        lifecycleWidget,
        realBundle,
      );
      addTearDown(wire.dispose);
      expect(reported?.isAngle1b, isTrue);
      expect(state?['cycles'], 100);
      final deltas = (state?['deltas'] ?? <String, dynamic>{})
          .cast<String, dynamic>();
      // Printed once per kind — the numbers the handoff and docs/angle_1b.md
      // record for the F4e lifecycle row.
      // ignore: avoid_print
      print('f4eg lifecycle resource deltas vs baseline: $deltas');
      for (final kind in kinds) {
        expect(
          deltas[kind],
          0,
          reason:
              'kind $kind drifted from the baseline across 100 cycles: '
              '${state?['errors']}',
        );
      }
    },
    skip: missing,
    timeout: const Timeout(Duration(minutes: 5)),
  );
}
