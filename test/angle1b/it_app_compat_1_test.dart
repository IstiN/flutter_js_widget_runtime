import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

import '../support/three_1b_engine.dart';
import '../support/three_quickjs_example_harness.dart';
import '../../tool/three/bench_1b.dart' show Shim;

// IT-APP-COMPAT-1 / IT-SHADER-2 / E2E-SHADER-1 (issue #7, F2c): the REAL
// WebGL2 bundle inside the real engine stack.
//
// F2c root-cause fix: the esbuild bundle publishes THREE members as
// getter-only non-configurable properties; the old policy assigned
// `THREE[name] = blocked` in strict mode, threw "no setter for property"
// before the widget's first line, and the composite catch only called
// jsr.showError (effect-free in headless tests) — the silent failure this
// file regresses. The policy now installs the blocked constructors on a
// prototype-chain shadow and re-points the global binding, and the engine
// catch mirrors every composite error into the __jsr_log lane.
void main() {
  final realBundle = File('assets/three/jsr_three_web.js').readAsStringSync();
  final missing = Shim.resolveProblem();

  /// The application source, byte-identical across the 1A and 1B legs: the
  /// canonical `jsr.three.createCanvas` canvas, one lit-geometry-free scene
  /// and one render.
  final appWidget = onebProbeWidget(
    r'''
  var canvas = jsr.three.createCanvas('main');
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 3;
  var mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  scene.add(mesh);
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
  renderer.setSize(64, 64, false);
  renderer.render(scene, camera);
  results.rendered = true;
  results.children = scene.children.length;
  results.calls = renderer.info.render.calls;
''',
    init: 'var results = { firstLine: true };',
  );

  test('F2c regression: a composite failure is never effect-free — the '
      'named error lands in the __jsr_log lane', () async {
    final logs = <Map<String, dynamic>>[];
    final (_, _, state) = await run1bWidgetEngine(
      'throw new Error("composite-boom-probe");',
      threeSource: 'var THREE = {};',
      realFacade: true,
      consoleLogs: logs,
    );
    expect(state, isNull, reason: 'the widget never exported');
    expect(widgetErrorLogs(logs), hasLength(1));
    expect(widgetErrorLogs(logs).single, contains('composite-boom-probe'));
  });

  testWidgets('IT-APP-COMPAT-1 (r1 leg): the same application source boots '
      'on the native bundle and submits a draw plan', (tester) async {
    final harness = await ThreeQuickjsExampleHarness.bootSource(
      tester,
      instanceId: 'app-compat-r1',
      source: appWidget,
    );
    addTearDown(() => harness.dispose(tester));
    final plan = await harness.pumpUntilRendered(
      tester,
      (_, p) => p.mainDrawCallCount > 0,
    );
    final state = harness.engine.exportedState;
    expect(state?['firstLine'], isTrue);
    expect(state?['rendered'], isTrue);
    expect(state?['error'], isNull);
    expect(plan.mainDrawCallCount, 1);
    expect(plan.mainTriangleCount, greaterThan(0));
  });

  test('IT-APP-COMPAT-1 (1B leg): the real bundle boots through the engine '
      'and the application renders over ANGLE', () async {
    final (wire, reported, state, logs) =
        await run1bRealEngine(appWidget, realBundle);
    addTearDown(wire.dispose);
    expect(reported?.isAngle1b, isTrue);
    expect(wire.bootstrapEnsured, isTrue);
    expect(state?['firstLine'], isTrue,
        reason: 'the widget must execute at all (F2c silent-failure fix)');
    expect(state?['rendered'], isTrue,
        reason: 'Scene + Mesh + WebGLRenderer render over the real wire');
    expect(state?['error'], isNull);
    expect(widgetErrorLogs(logs), isEmpty,
        reason: 'no composite error may reach the __jsr_log lane');
    expect(wire.dispatches1B, isNotEmpty);
  }, skip: missing);

  test('IT-SHADER-2: built-in materials over the real bundle construct, '
      'render, and honor the host shader policy', () async {
    // (a) allowed: built-in materials construct and onBeforeCompile sets.
    final (_, reportedA, stateA) = await run1bWidgetEngine(
      r'''
var results = {};
try {
  var basic = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  results.basic = basic.isMeshBasicMaterial === true ? 'constructed' : 'wrong-identity';
  var standard = new THREE.MeshStandardMaterial({ color: 0xffffff });
  standard.onBeforeCompile = function () {};
  results.standard = standard.isMeshStandardMaterial === true ? 'constructed' : 'wrong-identity';
  results.onBeforeCompile = typeof standard.onBeforeCompile === 'function' ? 'set' : 'wrong';
} catch (e) {
  results.error = String((e && e.message) || e);
}
jsr.exportState(results);
''',
      threeSource: realBundle,
      realFacade: true,
      allowCustomShaders: true,
    );
    expect(reportedA?.isAngle1b, isTrue);
    expect(stateA?['basic'], 'constructed');
    expect(stateA?['standard'], 'constructed');
    expect(stateA?['onBeforeCompile'], 'set');
    expect(stateA?['error'], isNull);

    // (b) blocked: the policy message, before any renderer allocation, with
    // the REAL bundle behind the policy.
    final (_, reportedB, stateB, logsB) = await run1bRealEngine(
      onebProbeWidget('''
$onebShaderPolicyProbeJs
try {
  var scene = new THREE.Scene();
  results.scene = scene.children.length;
} catch (e) {
  results.sceneError = String(e.message);
}
'''),
      realBundle,
    );
    expect(reportedB?.isAngle1b, isTrue);
    const policy =
        'three.unsupported: custom shaders are disabled by host policy';
    expect(stateB?['shaderMaterial'], policy);
    expect(stateB?['rawShaderMaterial'], policy);
    expect(stateB?['onBeforeCompile'], policy);
    expect(stateB?['scene'], 0,
        reason: 'non-shader THREE API stays intact behind the policy');
    expect(widgetErrorLogs(logsB), isEmpty);
  }, skip: missing);

  test('E2E-SHADER-1: an invalid shader takes the original error path '
      'without a host crash', () async {
    final (wire, reported, state, logs) =
        await run1bRealEngine(
      onebProbeWidget(r'''
  var canvas = jsr.three.createCanvas('e2e');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
  var gl = renderer.getContext();
  var shader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(shader, 'this is not valid GLSL <<<');
  gl.compileShader(shader);
  var ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  var log = ok ? '' : String(gl.getShaderInfoLog(shader) || '');
  results.compileOk = ok === true;
  results.hasLog = log.length > 0;
  results.logHead = log.substring(0, 60);
  renderer.dispose();
'''),
      realBundle,
    );
    addTearDown(wire.dispose);
    expect(reported?.isAngle1b, isTrue);
    expect(state?['compileOk'], isFalse);
    expect(state?['hasLog'], isTrue,
        reason: 'the original GLSL error path surfaces the info log');
    expect(state?['error'], isNull);
    expect(widgetErrorLogs(logs), isEmpty);
  }, skip: missing);
}
