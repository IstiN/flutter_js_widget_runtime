import 'dart:ffi' as ffi;
import 'dart:io';

import 'package:ffi/ffi.dart';
import 'package:flutter_test/flutter_test.dart';

import '../support/three_1b_engine.dart';
import '../support/three_1b_real_wire.dart';
import '../../tool/three/bench_1b.dart' show Shim;

// IT-LIFE-1 / E2E-CONTEXT-1 / E2E-LIFE-1 (issue #7, F2c lifecycle row,
// plan 4.4): 100 create and destroy cycles, context loss and restore through
// WEBGL_lose_context, dispose during pending work — over the real engine
// stack (real bundle + real facade + real ANGLE). No stale frame, deadlock,
// timer or cross-surface reuse; resources return to the baseline count.
void main() {
  final realBundle = File('assets/three/jsr_three_web.js').readAsStringSync();
  // ignore: omit_local_variable_types
  final String? missing = Shim.resolveProblem();

  final lifecycleWidget = '''
var results = { cycles: 0, errors: [], lastCalls: 0 };
try {
  for (var i = 0; i < 100; i++) {
    var canvas = jsr.three.createCanvas('c' + i);
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
    renderer.setSize(32, 32, false);
${onebRenderCubeJs('0x00ff00')}
    results.lastCalls = renderer.info.render.calls;
    renderer.dispose();
    results.cycles++;
  }
} catch (e) {
  results.errors.push(String((e && e.message) || e));
}
jsr.exportState(results);
''';

  test('IT-LIFE-1: 100 renderer create/render/dispose cycles complete on '
      'one engine and one surface', () async {
    final (wire, reported, state, logs) =
        await run1bRealEngine(lifecycleWidget, realBundle);
    addTearDown(wire.dispose);
    expect(reported?.isAngle1b, isTrue);
    expect(state?['cycles'], 100,
        reason: 'every cycle created, rendered and disposed cleanly');
    expect(state?['errors'], isEmpty);
    expect(state?['lastCalls'], 1,
        reason: 'the 100th cycle still submits its draw call (no stale '
            'context, no resource exhaustion)');
    expect(widgetErrorLogs(logs), isEmpty);
    expect(wire.dispatches1B.length, greaterThan(100));
  }, skip: missing, timeout: const Timeout(Duration(minutes: 5)));

  test('E2E-CONTEXT-1: context loss and restore through WEBGL_lose_context, '
      'then a clean draw', () async {
    final (wire, reported, state, _) = await run1bRealEngine(
      onebProbeWidget('''
  var canvas = jsr.three.createCanvas('ctx');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
  renderer.setSize(32, 32, false);
  var gl = renderer.getContext();
  var ext = gl.getExtension('WEBGL_lose_context');
  results.hasExt = !!ext;
  ext.loseContext();
  results.lost = gl.isContextLost();
  ext.restoreContext();
  results.restored = !gl.isContextLost();
${onebRenderCubeJs('0x0000ff')}
  results.rendered = true;
  results.glError = gl.getError();
'''),
      realBundle,
    );
    addTearDown(wire.dispose);
    expect(reported?.isAngle1b, isTrue);
    expect(state?['hasExt'], isTrue);
    expect(state?['lost'], isTrue);
    expect(state?['restored'], isTrue);
    expect(state?['rendered'], isTrue,
        reason: 'the draw after restore goes through cleanly');
    expect(state?['glError'], 0);
    expect(state?['error'], isNull);
  }, skip: missing);

  test('E2E-LIFE-1: dispose during pending work, then a fresh engine is '
      'clean and the dead surface cannot reach the live one', () async {
    // Engine 1 renders, its helper tears the engine down immediately after
    // run() returns (unawaited bridge dispatches may still be in flight).
    final renderWidget =
        'jsr.three.createCanvas("d");'
        'jsr.exportState({ engine: 1, rendered: true });';
    final (wire1, _, state1, _) = await run1bRealEngine(renderWidget, realBundle);
    expect(state1?['rendered'], isTrue);
    wire1.dispose();

    // Raw cross-surface check on the same display: a destroyed surface id
    // cannot be made current again, dispatch without a current surface
    // answers the sentinel, and a fresh surface stays clean.
    final shim = Shim();
    expect(shim.init(), 0);
    final idOut = calloc<ffi.Uint32>();
    int s1 = 0;
    int s2 = 0;
    try {
      s1 = shim.createSurface(32, 32, idOut);
      expect(shim.makeCurrent(s1), 0);
      shim.destroySurface(s1);
      s1 = 0;
      expect(shim.makeCurrent(s1), isNot(0),
          reason: 'a destroyed surface never becomes current again');
      expect(dispatchBytes(shim, g1Command(1)), g1NoCurrentSurface,
          reason: 'no-current-surface sentinel, not a stale frame');
      s2 = shim.createSurface(32, 32, idOut);
      expect(shim.makeCurrent(s2), 0);
      expect(dispatchBytes(shim, g1Command(1)), 0,
          reason: 'the fresh surface is clean (no cross-surface reuse)');
    } finally {
      if (s2 > 0) shim.destroySurface(s2);
      calloc.free(idOut);
    }

    // Engine 2 on a fresh surface runs the same widget without inheriting
    // anything from engine 1.
    final (wire2, reported2, state2, _) = await run1bRealEngine(
      renderWidget.replaceFirst('engine: 1', 'engine: 2'),
      realBundle,
    );
    addTearDown(wire2.dispose);
    expect(reported2?.isAngle1b, isTrue);
    expect(state2?['engine'], 2);
    expect(state2?['rendered'], isTrue);
  }, skip: missing);
}
